"""Fraud case state management for the Day 6 bank fraud alert agent.

This module uses a JSON file as a simple demo "database" for fraud cases.
It is intentionally small and easy to inspect on disk so you can show
before/after states in your Day 6 demo video.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional, List, Dict, Any


@dataclass
class FraudCase:
    """Represents a single fraud case for a customer."""

    username: str
    security_identifier: str
    card_last_4: str
    transaction_merchant: str
    amount: str
    location: str
    timestamp: str
    security_question: str
    security_answer: str
    status: str = "pending_review"
    outcome_note: str | None = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert the fraud case to a dictionary for JSON serialization."""
        return asdict(self)


class FraudDatabase:
    """Simple JSON-backed fraud case database for demo purposes."""

    def __init__(self, db_file: str = "fraud_cases_day6.json") -> None:
        """Initialize the fraud database.

        Args:
            db_file: Path to JSON file (relative to backend directory).
        """
        backend_dir = Path(__file__).parent.parent
        self.db_path = backend_dir / db_file
        self._ensure_sample_data()

    def _ensure_sample_data(self) -> None:
        """Create a few sample fraud cases if the JSON file does not exist.

        This keeps the Day 6 setup self-contained so you can run it
        without doing any manual DB seeding.
        """
        if self.db_path.exists():
            return

        sample_cases: List[FraudCase] = [
            FraudCase(
                username="John",
                security_identifier="12345",
                card_last_4="4242",
                transaction_merchant="ABC Electronics",
                amount="$999.00",
                location="New York, NY",
                timestamp="2025-11-26 14:32",
                security_question="What is the name of your first pet?",
                security_answer="Fluffy",
                status="pending_review",
                outcome_note=None,
            ),
            FraudCase(
                username="Sara",
                security_identifier="98765",
                card_last_4="7788",
                transaction_merchant="Global Travel Co",
                amount="$1,250.49",
                location="Paris, France",
                timestamp="2025-11-25 09:10",
                security_question="What city were you born in?",
                security_answer="Cairo",
                status="pending_review",
                outcome_note=None,
            ),
        ]

        self.save_all(sample_cases)

    def load_all(self) -> List[FraudCase]:
        """Load all fraud cases from the JSON file."""
        if not self.db_path.exists():
            return []

        try:
            with self.db_path.open("r", encoding="utf-8") as f:
                raw = json.load(f)
        except (json.JSONDecodeError, OSError):
            # If the file is corrupted, return an empty list rather than crashing.
            return []

        cases: List[FraudCase] = []
        if isinstance(raw, list):
            for item in raw:
                if not isinstance(item, dict):
                    continue
                try:
                    cases.append(
                        FraudCase(
                            username=item.get("username", ""),
                            security_identifier=item.get("security_identifier", ""),
                            card_last_4=item.get("card_last_4", ""),
                            transaction_merchant=item.get("transaction_merchant", ""),
                            amount=item.get("amount", ""),
                            location=item.get("location", ""),
                            timestamp=item.get("timestamp", ""),
                            security_question=item.get("security_question", ""),
                            security_answer=item.get("security_answer", ""),
                            status=item.get("status", "pending_review"),
                            outcome_note=item.get("outcome_note"),
                        )
                    )
                except TypeError:
                    # Skip malformed entries
                    continue

        return cases

    def save_all(self, cases: List[FraudCase]) -> None:
        """Write all fraud cases to the JSON file."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self.db_path.open("w", encoding="utf-8") as f:
            json.dump([c.to_dict() for c in cases], f, indent=2, ensure_ascii=False)

    def get_case_for_username(self, username: str) -> Optional[FraudCase]:
        """Get the most relevant fraud case for a given username.

        For this demo, we simply return the first case that matches the
        username and is still in a review status.
        """
        username_lower = username.strip().lower()
        for case in self.load_all():
            if case.username.strip().lower() == username_lower and case.status in {
                "pending_review",
                "verification_failed",
            }:
                return case
        return None

    def update_case_status(
        self,
        case: FraudCase,
        *,
        status: str,
        outcome_note: str,
    ) -> FraudCase:
        """Update the status and outcome note for a case and persist it."""
        cases = self.load_all()
        updated: List[FraudCase] = []
        for existing in cases:
            if (
                existing.username == case.username
                and existing.security_identifier == case.security_identifier
                and existing.card_last_4 == case.card_last_4
            ):
                existing.status = status
                existing.outcome_note = outcome_note
                updated.append(existing)
                case = existing
            else:
                updated.append(existing)

        self.save_all(updated)
        return case


