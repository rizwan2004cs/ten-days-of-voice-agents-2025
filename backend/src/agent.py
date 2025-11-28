import logging
import json
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
    metrics,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from game_master import WorldState, PlayerCharacter, NPC, Location, Quest

logger = logging.getLogger("agent")

load_dotenv(".env.local")

SESSION_STATE_KEY = "game_master_session"


def _ensure_state(context: RunContext) -> Dict[str, Any]:
    """Ensure world state exists in session."""
    state = context.session_state.setdefault(SESSION_STATE_KEY, {})
    if "world_state" not in state:
        world_state = WorldState()
        # Initialize with a starting location
        world_state.locations.append(
            Location(
                name="The Dark Cavern",
                description="A mysterious cavern with glowing crystals. Two paths lead deeper into the darkness.",
                paths=["north", "east"]
            )
        )
        world_state.current_location = "The Dark Cavern"
        state["world_state"] = world_state
    return state


@function_tool
async def get_world_state(context: RunContext) -> Dict[str, Any]:
    """Get the current world state including player stats, inventory, location, and quests."""
    state = _ensure_state(context)
    world_state: WorldState = state["world_state"]
    world_state.turn_count += 1
    return world_state.to_dict()


@function_tool
async def update_player_stats(
    context: RunContext,
    hp_change: Optional[int] = None,
    mana_change: Optional[int] = None,
    status: Optional[str] = None,
) -> Dict[str, Any]:
    """Update player health, mana, or status. Use negative values to decrease."""
    state = _ensure_state(context)
    world_state: WorldState = state["world_state"]
    
    if hp_change is not None:
        world_state.player.hp = max(0, min(world_state.player.max_hp, world_state.player.hp + hp_change))
        if world_state.player.hp <= 0:
            world_state.player.status = "Critical"
        elif world_state.player.hp < world_state.player.max_hp * 0.3:
            world_state.player.status = "Critical"
        elif world_state.player.hp < world_state.player.max_hp * 0.6:
            world_state.player.status = "Injured"
        else:
            world_state.player.status = "Healthy"
    
    if mana_change is not None:
        world_state.player.mana = max(0, min(world_state.player.max_mana, world_state.player.mana + mana_change))
    
    if status:
        world_state.player.status = status
    
    return {"status": "updated", "player": world_state.to_dict()["player"]}


@function_tool
async def update_inventory(
    context: RunContext,
    action: str,  # "add" or "remove"
    item: str,
) -> Dict[str, Any]:
    """Add or remove an item from player inventory."""
    state = _ensure_state(context)
    world_state: WorldState = state["world_state"]
    
    if action == "add":
        if item not in world_state.player.inventory:
            world_state.player.inventory.append(item)
            world_state.add_event("inventory", f"Picked up {item}")
        return {"status": "added", "item": item, "inventory": world_state.player.inventory}
    elif action == "remove":
        if item in world_state.player.inventory:
            world_state.player.inventory.remove(item)
            world_state.add_event("inventory", f"Lost {item}")
            return {"status": "removed", "item": item, "inventory": world_state.player.inventory}
        return {"status": "not_found", "message": f"{item} not in inventory"}
    return {"status": "error", "message": "Action must be 'add' or 'remove'"}


@function_tool
async def add_npc(
    context: RunContext,
    name: str,
    role: str,
    attitude: str = "neutral",
    location: Optional[str] = None,
) -> Dict[str, Any]:
    """Add or update an NPC in the world."""
    state = _ensure_state(context)
    world_state: WorldState = state["world_state"]
    
    # Check if NPC already exists
    existing = next((npc for npc in world_state.npcs if npc.name == name), None)
    if existing:
        existing.role = role
        existing.attitude = attitude
        if location:
            existing.location = location
    else:
        world_state.npcs.append(NPC(name=name, role=role, attitude=attitude, location=location))
    
    world_state.add_event("npc", f"Encountered {name} ({role})")
    return {"status": "added", "npc": {"name": name, "role": role, "attitude": attitude}}


@function_tool
async def update_location(
    context: RunContext,
    name: str,
    description: Optional[str] = None,
    paths: Optional[list] = None,
) -> Dict[str, Any]:
    """Update or add a location. If location exists, update it. Otherwise create new."""
    state = _ensure_state(context)
    world_state: WorldState = state["world_state"]
    
    existing = next((loc for loc in world_state.locations if loc.name == name), None)
    if existing:
        if description:
            existing.description = description
        if paths:
            existing.paths = paths
    else:
        world_state.locations.append(
            Location(name=name, description=description or "", paths=paths or [])
        )
    
    return {"status": "updated", "location": {"name": name, "description": description, "paths": paths}}


@function_tool
async def move_to_location(context: RunContext, location_name: str) -> Dict[str, Any]:
    """Move the player to a new location."""
    state = _ensure_state(context)
    world_state: WorldState = state["world_state"]
    
    # Check if location exists
    location = next((loc for loc in world_state.locations if loc.name == location_name), None)
    if not location:
        return {"status": "not_found", "message": f"Location {location_name} does not exist"}
    
    old_location = world_state.current_location
    world_state.current_location = location_name
    world_state.add_event("movement", f"Moved from {old_location} to {location_name}")
    
    return {
        "status": "moved",
        "old_location": old_location,
        "new_location": location_name,
        "location_info": {
            "name": location.name,
            "description": location.description,
            "paths": location.paths,
        },
    }


@function_tool
async def add_quest(
    context: RunContext,
    quest_id: str,
    title: str,
    description: str,
    objectives: Optional[list] = None,
) -> Dict[str, Any]:
    """Add a new quest to the game."""
    state = _ensure_state(context)
    world_state: WorldState = state["world_state"]
    
    existing = next((q for q in world_state.quests if q.id == quest_id), None)
    if existing:
        existing.title = title
        existing.description = description
        if objectives:
            existing.objectives = objectives
    else:
        world_state.quests.append(
            Quest(id=quest_id, title=title, description=description, objectives=objectives or [])
        )
    
    world_state.add_event("quest", f"Quest added: {title}")
    return {"status": "added", "quest": {"id": quest_id, "title": title, "description": description}}


@function_tool
async def complete_quest(context: RunContext, quest_id: str) -> Dict[str, Any]:
    """Mark a quest as completed."""
    state = _ensure_state(context)
    world_state: WorldState = state["world_state"]
    
    quest = next((q for q in world_state.quests if q.id == quest_id), None)
    if not quest:
        return {"status": "not_found", "message": f"Quest {quest_id} not found"}
    
    quest.status = "completed"
    world_state.add_event("quest", f"Completed quest: {quest.title}")
    return {"status": "completed", "quest": {"id": quest_id, "title": quest.title}}


@function_tool
async def roll_dice_check(
    context: RunContext,
    difficulty: int,
    attribute: str = "strength",
) -> Dict[str, Any]:
    """Perform a dice roll check. Returns roll result, success status, and outcome tier."""
    state = _ensure_state(context)
    world_state: WorldState = state["world_state"]
    
    result = world_state.check_success(difficulty, attribute)
    world_state.add_event(
        "dice_roll",
        f"Rolled {result['roll']} (d20 + {result['modifier']}) vs difficulty {difficulty}: {'Success' if result['success'] else 'Failure'}",
    )
    
    return result


GAME_MASTER_INSTRUCTIONS = """
You are a Game Master (GM) running a cyberpunk-themed D&D-style adventure in a retro-futuristic terminal world.

UNIVERSE & TONE:
- Setting: A dark, neon-lit cyberpunk world where technology and magic blend. Think "Blade Runner meets D&D."
- Tone: Dramatic, atmospheric, with moments of tension and discovery. Use vivid descriptions of neon signs, holographic displays, and the constant hum of the city.
- Style: Write like you're describing scenes in a classic text adventure game, but with a cyberpunk aesthetic.

YOUR ROLE AS GM:
1. **Scene Description**: Start each turn by vividly describing the current scene, location, and what the player sees/hears/senses.
2. **Player Agency**: Always end your descriptions with a clear prompt asking "What do you do?" or "How do you proceed?"
3. **Continuity**: Remember all past decisions, NPCs encountered, items found, and locations visited. Reference them naturally.
4. **Story Progression**: Guide the player through a short adventure (8-15 exchanges) that reaches a meaningful conclusion or mini-arc.

GAME MECHANICS:
- Use the tools to track the world state, player stats, inventory, and quests.
- When the player attempts something risky, use `roll_dice_check` to determine outcomes.
- Update player HP/mana when they take damage or use abilities.
- Add items to inventory when found, remove when used/lost.
- Create NPCs when encountered, update their attitude based on player actions.
- Track locations and allow movement between them.
- Create quests for objectives and mark them complete when achieved.

WORLD STATE UPDATES:
- At the START of the adventure, use `get_world_state` to initialize, then call `update_player_stats`, `update_inventory`, `add_npc`, `update_location`, and `add_quest` as needed.
- After each significant event, update the world state using the appropriate tools.
- When you update world state, include a `<world_update>` XML block in your response with the current state so the UI can display it.

STORY STRUCTURE:
- Start with an engaging opening scene that sets the mood.
- Introduce a clear objective or mystery to solve.
- Include 2-3 decision points that affect the story.
- Build toward a climax (escape, discovery, confrontation, etc.).
- End with a satisfying conclusion or cliffhanger.

IMPORTANT RULES:
- Always check the world state before responding to understand current situation.
- Update the world state after significant events using the tools.
- Use dice rolls for uncertain actions (combat, skill checks, etc.).
- Keep descriptions vivid but concise (2-3 sentences per scene).
- Always end with a question prompting player action.
- Never break character or reference "the game" - stay in-world.

Begin the adventure now. Start with a dramatic opening scene in the cyberpunk world. Initialize the player character and world state at the beginning.
"""


class GameMaster(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=GAME_MASTER_INSTRUCTIONS)


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    session = AgentSession(
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

    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    await session.start(
        agent=GameMaster(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
