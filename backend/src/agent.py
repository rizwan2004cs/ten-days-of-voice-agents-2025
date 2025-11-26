import logging
from dataclasses import dataclass
from typing import Optional

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    RunContext,
    ToolError,
    WorkerOptions,
    cli,
    function_tool,
    metrics,
    tokenize,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

try:
    from .fraud_state import FraudCase, FraudDatabase
except ImportError:  # pragma: no cover - fallback for non-package execution
    from fraud_state import FraudCase, FraudDatabase

logger = logging.getLogger("agent")

load_dotenv(".env.local")


@dataclass
class Userdata:
    """Runtime state for the fraud alert session."""

    fraud_db: FraudDatabase
    current_case: Optional[FraudCase] = None
    customer_verified: bool = False


class FraudAgent(Agent):
    """Day 6 – Bank fraud alert voice agent."""

    def __init__(self) -> None:
        instructions = """
You are a professional fraud detection representative for a fictional bank called NovaTrust Bank.
The user is interacting with you via voice, even if you perceive the conversation as text.
Your job is to walk the customer through a single suspicious card transaction from the fraud database,
verify their identity in a safe way, and then mark the case as confirmed_safe, confirmed_fraud,
or verification_failed in the database.

CRITICAL SAFETY RULES:
- Do NOT ask for full card numbers, PINs, passwords, CVV, one-time-passcodes, or any sensitive secrets.
- You may only verify identity using non-sensitive information from the database, such as a security question.
- If verification fails, you MUST politely end the call and set the case status to verification_failed.

CALL FLOW (FOLLOW THIS ORDER CAREFULLY):
1. As soon as you detect the user, clearly introduce yourself:
   - Example: "Hello, this is the fraud monitoring team from NovaTrust Bank. I’m a virtual assistant calling about a recent card transaction."
2. Ask for their first name so you know who you are speaking with.
   - After they answer, call the tool load_case_for_user to load the fraud case by username.
3. If no case is found for that name:
   - Apologize briefly and say there are no active fraud alerts for them, then end the call normally.
4. If a case is found:
   - Explain that you will first perform a basic verification using a non-sensitive security question.
   - Read the security question from the case and ask the user to answer it.
   - You MUST ask the question using the exact text stored in the case's security_question field
     (for example: "What is the name of your first pet?"). Do not paraphrase it or invent a different question.
   - When the user answers, call verify_security_answer to check it.
5. If verification FAILED:
   - Calmly explain that you cannot continue without verification.
   - Call finalize_case_without_confirmation so the status becomes verification_failed.
   - Politely end the call.
6. If verification PASSED:
   - Clearly describe the suspicious transaction using the database fields:
     - merchant, amount, masked card (last 4 digits), approximate time and location.
   - Ask very clearly: "Did you make this transaction?" and wait for a yes/no style answer.
   - When they answer, call handle_transaction_confirmation to update the case as confirmed_safe or confirmed_fraud.
7. Always end with a short summary of what action was taken (safe vs fraud, card blocked, mock follow-up, etc.).

TOOL USAGE (VERY IMPORTANT):
- ALWAYS use these tools to interact with the fraud database instead of inventing data:
  - load_case_for_user(username: str)
  - verify_security_answer(answer: str)
  - handle_transaction_confirmation(user_answer: str)
  - finalize_case_without_confirmation(reason: str)
- Never fabricate status changes; rely on the tools to update the case.
- Keep your responses concise, calm, and professional, with no emojis or special symbols.
"""
        super().__init__(instructions=instructions)

    @function_tool
    async def load_case_for_user(
        self,
        ctx: RunContext[Userdata],
        username: str,
    ) -> str:
        """Load the active fraud case for a given username.

        Use this after the customer tells you their first name.
        The username should match the 'username' field in the fraud database.
        """
        case = ctx.userdata.fraud_db.get_case_for_username(username)
        ctx.userdata.current_case = case
        ctx.userdata.customer_verified = False

        if case is None:
            return (
                "I could not find any active fraud alerts for that customer name. "
                "You should politely explain this to the customer and end the call."
            )

        logger.info(
            "Loaded fraud case for user '%s' at merchant '%s' amount '%s'",
            case.username,
            case.transaction_merchant,
            case.amount,
        )

        return (
            f"Loaded fraud case for username {case.username}. "
            f"The suspicious transaction is {case.amount} at {case.transaction_merchant} "
            f"on card ending {case.card_last_4}, in {case.location} at {case.timestamp}. "
            "Now explain that you will ask a basic security question for verification. "
            f"You MUST then ask the customer this question exactly as written, without changing any words: "
            f'\"{case.security_question}\".'
        )

    @function_tool
    async def verify_security_answer(
        self,
        ctx: RunContext[Userdata],
        answer: str,
    ) -> str:
        """Verify the customer's security answer against the current fraud case.

        The answer is compared in a case-insensitive way after trimming whitespace.
        """
        case = ctx.userdata.current_case
        if case is None:
            raise ToolError(
                "No fraud case is loaded. You must call load_case_for_user first "
                "after the customer tells you their name."
            )

        expected = case.security_answer.strip().lower()
        received = answer.strip().lower()

        if expected and expected == received:
            ctx.userdata.customer_verified = True
            logger.info(
                "Security verification PASSED for user '%s'",
                case.username,
            )
            return (
                "Verification passed. Tell the customer that they successfully cleared the basic security check "
                "and proceed to clearly read the suspicious transaction details from the case."
            )

        ctx.userdata.customer_verified = False
        logger.warning(
            "Security verification FAILED for user '%s'",
            case.username,
        )
        return (
            "Verification failed. You must politely explain that you cannot proceed without successful verification "
            "and then call finalize_case_without_confirmation to mark the case as verification_failed."
        )

    @function_tool
    async def handle_transaction_confirmation(
        self,
        ctx: RunContext[Userdata],
        user_answer: str,
    ) -> str:
        """Update the fraud case based on whether the user says the transaction is legitimate.

        user_answer should be the customer's yes/no style response.
        """
        case = ctx.userdata.current_case
        if case is None:
            raise ToolError(
                "No fraud case is loaded. You must call load_case_for_user first "
                "and complete verification before confirming the transaction."
            )

        if not ctx.userdata.customer_verified:
            # If verification did not pass, we treat this as a verification failure path.
            updated = ctx.userdata.fraud_db.update_case_status(
                case,
                status="verification_failed",
                outcome_note=(
                    "Customer could not successfully answer the verification question. "
                    "No confirmation about the transaction was recorded."
                ),
            )
            ctx.userdata.current_case = updated
            logger.warning(
                "Attempted confirmation without verification for user '%s'",
                case.username,
            )
            return (
                "Verification did not pass, so you must NOT rely on the user's answer. "
                "Explain that you cannot proceed without verification, briefly reassure them, "
                "and end the call after confirming the bank will monitor the account."
            )

        text = user_answer.strip().lower()
        positive = {"yes", "y", "yeah", "yep", "i did", "that was me", "sure"}
        negative = {"no", "n", "nope", "i did not", "that was not me", "not me"}

        status: str
        note: str

        if any(p in text for p in positive) and not any(n in text for n in negative):
            status = "confirmed_safe"
            note = "Customer verbally confirmed the transaction as legitimate."
        elif any(n in text for n in negative) and not any(p in text for p in positive):
            status = "confirmed_fraud"
            note = (
                "Customer verbally denied making the transaction. "
                "Card should be considered blocked and a dispute workflow started."
            )
        else:
            # Ambiguous answer – keep as pending_review.
            status = "pending_review"
            note = (
                "Customer gave an ambiguous answer about the transaction. "
                "Case left in pending_review for manual follow-up."
            )

        updated = ctx.userdata.fraud_db.update_case_status(
            case,
            status=status,
            outcome_note=note,
        )
        ctx.userdata.current_case = updated

        logger.info(
            "Updated fraud case for user '%s' to status '%s'",
            updated.username,
            updated.status,
        )

        if status == "confirmed_safe":
            return (
                "Tell the customer that you have marked the transaction as safe and no further action is needed. "
                "Reassure them that NovaTrust Bank will continue to monitor their account for unusual activity, then end the call."
            )

        if status == "confirmed_fraud":
            return (
                "Tell the customer you have treated this as fraud. "
                "Explain that the card is being blocked and that the bank will open a dispute for this transaction and work to reverse any unauthorized charges. "
                "Give a brief, confident summary of the next steps, then end the call."
            )

        return (
            "Explain that you could not clearly determine whether the transaction was safe or fraud based "
            "on the answer. Let the customer know that a human specialist will review the case, then end the call."
        )

    @function_tool
    async def finalize_case_without_confirmation(
        self,
        ctx: RunContext[Userdata],
        reason: str,
    ) -> str:
        """Mark the case as verification_failed when you cannot safely continue the call.

        Use this when the customer cannot pass the basic security check or abandons the call.
        """
        case = ctx.userdata.current_case
        if case is None:
            # Nothing to persist; just instruct the agent how to respond.
            return (
                "There is no active fraud case loaded. Politely say that you do not have an open fraud alert "
                "for them and end the call."
            )

        note_reason = reason.strip() or "Verification did not succeed."
        updated = ctx.userdata.fraud_db.update_case_status(
            case,
            status="verification_failed",
            outcome_note=note_reason,
        )
        ctx.userdata.current_case = updated

        logger.info(
            "Marked fraud case for user '%s' as verification_failed",
            updated.username,
        )

        return (
            "Calmly explain that, since the security check could not be completed safely, "
            "you are ending the call and that the bank will continue to monitor the account. "
            "Keep the tone reassuring and brief."
        )


def prewarm(proc: JobProcess) -> None:
    """Prewarm models and fraud database for the Day 6 fraud agent."""
    proc.userdata["vad"] = silero.VAD.load()
    proc.userdata["fraud_db"] = FraudDatabase()


async def entrypoint(ctx: JobContext) -> None:
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Initialize userdata with the JSON-backed fraud database
    fraud_db: FraudDatabase = ctx.proc.userdata["fraud_db"]
    userdata = Userdata(fraud_db=fraud_db)

    # Set up a voice AI pipeline using Deepgram STT, Gemini LLM, Murf Falcon TTS,
    # and the LiveKit multilingual turn detector.
    session = AgentSession[Userdata](
        userdata=userdata,
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=murf.TTS(
            voice="en-US-matthew",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # Metrics collection, to measure pipeline performance
    # For more information, see https://docs.livekit.io/agents/build/metrics/
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent) -> None:
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage() -> None:
        summary = usage_collector.get_summary()
        logger.info("Usage: %s", summary)

    ctx.add_shutdown_callback(log_usage)

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=FraudAgent(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            # For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
