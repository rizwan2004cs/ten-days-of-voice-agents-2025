"""
Game Master World State Management
Tracks characters, locations, events, quests, and player stats in JSON format.
"""
import json
import random
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class PlayerCharacter:
    """Player character with stats and inventory."""
    name: str = "Adventurer"
    class_type: str = "Warrior"
    hp: int = 100
    max_hp: int = 100
    mana: int = 50
    max_mana: int = 50
    strength: int = 10
    intelligence: int = 10
    luck: int = 10
    inventory: List[str] = field(default_factory=list)
    status: str = "Healthy"  # Healthy, Injured, Critical


@dataclass
class NPC:
    """Non-player character."""
    name: str
    role: str
    attitude: str = "neutral"  # friendly, neutral, hostile
    location: Optional[str] = None
    alive: bool = True


@dataclass
class Location:
    """Game location."""
    name: str
    description: str
    paths: List[str] = field(default_factory=list)


@dataclass
class Quest:
    """Quest or objective."""
    id: str
    title: str
    description: str
    status: str = "active"  # active, completed, failed
    objectives: List[str] = field(default_factory=list)


@dataclass
class WorldState:
    """Complete world state for the game."""
    player: PlayerCharacter = field(default_factory=PlayerCharacter)
    npcs: List[NPC] = field(default_factory=list)
    locations: List[Location] = field(default_factory=list)
    current_location: Optional[str] = None
    events: List[Dict[str, Any]] = field(default_factory=list)
    quests: List[Quest] = field(default_factory=list)
    turn_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "player": {
                "name": self.player.name,
                "class": self.player.class_type,
                "hp": self.player.hp,
                "max_hp": self.player.max_hp,
                "mana": self.player.mana,
                "max_mana": self.player.max_mana,
                "strength": self.player.strength,
                "intelligence": self.player.intelligence,
                "luck": self.player.luck,
                "inventory": self.player.inventory,
                "status": self.player.status,
            },
            "npcs": [
                {
                    "name": npc.name,
                    "role": npc.role,
                    "attitude": npc.attitude,
                    "location": npc.location,
                    "alive": npc.alive,
                }
                for npc in self.npcs
            ],
            "locations": [
                {
                    "name": loc.name,
                    "description": loc.description,
                    "paths": loc.paths,
                }
                for loc in self.locations
            ],
            "current_location": self.current_location,
            "events": self.events,
            "quests": [
                {
                    "id": quest.id,
                    "title": quest.title,
                    "description": quest.description,
                    "status": quest.status,
                    "objectives": quest.objectives,
                }
                for quest in self.quests
            ],
            "turn_count": self.turn_count,
        }

    def add_event(self, event_type: str, description: str, **kwargs):
        """Add an event to the history."""
        self.events.append(
            {
                "type": event_type,
                "description": description,
                "turn": self.turn_count,
                **kwargs,
            }
        )

    def roll_dice(self, sides: int = 20, modifier: int = 0) -> int:
        """Roll a dice with optional modifier."""
        return random.randint(1, sides) + modifier

    def check_success(self, difficulty: int, attribute: str = "strength") -> Dict[str, Any]:
        """Perform a skill check."""
        modifier = getattr(self.player, attribute, 0)
        roll = self.roll_dice(20, modifier)
        success = roll >= difficulty
        
        return {
            "roll": roll,
            "difficulty": difficulty,
            "modifier": modifier,
            "success": success,
            "tier": "full_success" if roll >= difficulty + 5 else "partial_success" if success else "fail",
        }

