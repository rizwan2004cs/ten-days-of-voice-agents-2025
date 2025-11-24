"""Main agent entry point - routes to appropriate day agent based on AGENT_DAY environment variable."""

import logging
import os

from dotenv import load_dotenv
from livekit.agents import JobContext, JobProcess, WorkerOptions, cli

# IMPORTANT: Import plugins here at module level to register them on the main thread
# before any worker threads are created. This prevents "Plugins must be registered on the main thread" errors.
from livekit.plugins import silero, murf, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

# Configure logger to ensure it's visible
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)-8s %(name)-15s %(message)s',
    datefmt='%H:%M:%S'
)

load_dotenv(".env.local")

# Get which day agent to use (default to Day 2 for backward compatibility)
AGENT_DAY = os.getenv("AGENT_DAY", "2")

# Use both logger and print to ensure visibility
log_msg = f"AGENT_DAY environment variable: {AGENT_DAY}"
logger.info(log_msg)
print(f"🔵 {log_msg}")  # Also print to ensure visibility


def prewarm(proc: JobProcess):
    """Route prewarm to appropriate day agent."""
    # Plugins are already imported at module level, so they're registered on main thread
    # Now we can safely import and call day-specific prewarm functions
    if AGENT_DAY == "1":
        log_msg = "Loading Day 1 Agent..."
        logger.info(log_msg)
        print(f"🔵 {log_msg}")
        try:
            from .agent_day1 import prewarm as day1_prewarm
        except ImportError:
            from agent_day1 import prewarm as day1_prewarm
        day1_prewarm(proc, silero)
    elif AGENT_DAY == "2":
        log_msg = "Loading Day 2 Agent..."
        logger.info(log_msg)
        print(f"🔵 {log_msg}")
        try:
            from .agent_day2 import prewarm as day2_prewarm
        except ImportError:
            from agent_day2 import prewarm as day2_prewarm
        day2_prewarm(proc, silero)
    elif AGENT_DAY == "3":
        log_msg = "Loading Day 3 Agent..."
        logger.info(log_msg)
        print(f"🔵 {log_msg}")
        try:
            from .agent_day3 import prewarm as day3_prewarm
        except ImportError:
            from agent_day3 import prewarm as day3_prewarm
        day3_prewarm(proc, silero)
    elif AGENT_DAY == "4":
        log_msg = "Loading Day 4 Agent..."
        logger.info(log_msg)
        print(f"🔵 {log_msg}")
        try:
            from .agent_day4 import prewarm as day4_prewarm
        except ImportError:
            from agent_day4 import prewarm as day4_prewarm
        day4_prewarm(proc, silero)
    else:
        logger.warning(f"Unknown AGENT_DAY={AGENT_DAY}, defaulting to Day 2")
        try:
            from .agent_day2 import prewarm as day2_prewarm
        except ImportError:
            from agent_day2 import prewarm as day2_prewarm
        day2_prewarm(proc, silero)


async def entrypoint(ctx: JobContext):
    """Route entrypoint to appropriate day agent."""
    if AGENT_DAY == "1":
        log_msg = "Starting Day 1 Agent..."
        logger.info(log_msg)
        print(f"🔵 {log_msg}")
        try:
            from .agent_day1 import entrypoint as day1_entrypoint
        except ImportError:
            from agent_day1 import entrypoint as day1_entrypoint
        await day1_entrypoint(ctx)
    elif AGENT_DAY == "2":
        log_msg = "Starting Day 2 Agent..."
        logger.info(log_msg)
        print(f"🔵 {log_msg}")
        try:
            from .agent_day2 import entrypoint as day2_entrypoint
        except ImportError:
            from agent_day2 import entrypoint as day2_entrypoint
        await day2_entrypoint(ctx)
    elif AGENT_DAY == "3":
        log_msg = "Starting Day 3 Agent..."
        logger.info(log_msg)
        print(f"🔵 {log_msg}")
        try:
            from .agent_day3 import entrypoint as day3_entrypoint
        except ImportError:
            from agent_day3 import entrypoint as day3_entrypoint
        await day3_entrypoint(ctx)
    elif AGENT_DAY == "4":
        log_msg = "Starting Day 4 Agent..."
        logger.info(log_msg)
        print(f"🔵 {log_msg}")
        try:
            from .agent_day4 import entrypoint as day4_entrypoint
        except ImportError:
            from agent_day4 import entrypoint as day4_entrypoint
        await day4_entrypoint(ctx)
    else:
        logger.warning(f"Unknown AGENT_DAY={AGENT_DAY}, defaulting to Day 2")
        try:
            from .agent_day2 import entrypoint as day2_entrypoint
        except ImportError:
            from agent_day2 import entrypoint as day2_entrypoint
        await day2_entrypoint(ctx)


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
