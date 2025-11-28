from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from difflib import get_close_matches
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, TypedDict

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CATALOG_PATH = DATA_DIR / "catalog_instamart.json"
ORDERS_PATH = DATA_DIR / "orders_instamart.json"
FREE_DELIVERY_THRESHOLD = 199

STATUS_SEQUENCE: List[tuple[str, timedelta]] = [
    ("received", timedelta(seconds=0)),
    ("being_packed", timedelta(minutes=2)),
    ("out_for_delivery", timedelta(minutes=6)),
    ("delivered", timedelta(minutes=15)),
]

STATUS_MESSAGES = {
    "received": "Order received! Your order is being packed.",
    "being_packed": "Your order is being packed.",
    "out_for_delivery": "Valet is on the way! Reaching in roughly 4 minutes.",
    "delivered": "Delivered! Enjoy your Instamart goodies.",
}

SPECIAL_SUBSTITUTIONS = {
    "red lays": {
        "item_id": "inst_02",
        "message": "We're out of Red Lays, but I can get you the Magic Masala Blue pack. It's a crowd favourite.",
    }
}

COMBO_SUGGESTIONS = {
    "inst_09": {
        "message": "Biryani rice pairs perfectly with chilled curd or a Thums Up. Should I add either?",
        "item_ids": ["inst_10", "inst_12"],
    }
}


@dataclass(frozen=True)
class CatalogItem:
    id: str
    name: str
    price: float
    currency: str
    category: str
    tags: List[str]
    unit: Optional[str] = None
    brand: Optional[str] = None


@dataclass
class CartLine:
    item: CatalogItem
    quantity: int
    notes: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.item.id,
            "name": self.item.name,
            "quantity": self.quantity,
            "unit_price": self.item.price,
            "line_total": round(self.item.price * self.quantity, 2),
            "currency": self.item.currency,
            "notes": self.notes,
            "category": self.item.category,
            "tags": self.item.tags,
        }


class CatalogMatch(TypedDict):
    item: CatalogItem
    status: str
    message: Optional[str]


class CatalogIndex:
    def __init__(self, items: Sequence[CatalogItem]) -> None:
        self._items = list(items)
        self._by_id = {item.id.lower(): item for item in items}
        self._by_name = {item.name.lower(): item for item in items}
        self._aliases: Dict[str, str] = {}
        for item in items:
            self._aliases[item.id.lower()] = item.id
            name_key = item.name.lower()
            self._aliases[name_key] = item.id
            for tag in item.tags:
                key = f"{tag}-{item.category}".lower()
                self._aliases.setdefault(key, item.id)

    @classmethod
    def from_file(cls, path: Path) -> "CatalogIndex":
        with path.open("r", encoding="utf-8") as fp:
            raw_items = json.load(fp)
        items = [CatalogItem(**item) for item in raw_items]
        return cls(items)

    def list_items(self) -> List[CatalogItem]:
        return self._items

    def get(self, item_id: str) -> Optional[CatalogItem]:
        return self._by_id.get(item_id.lower())

    def find(self, query: str) -> Optional[CatalogMatch]:
        q = query.strip().lower()
        if not q:
            return None

        direct = self._by_id.get(q) or self._by_name.get(q)
        if direct:
            return {"item": direct, "status": "exact", "message": None}

        if q in self._aliases:
            item = self._by_id.get(self._aliases[q].lower())
            if item:
                return {"item": item, "status": "alias", "message": None}

        for key, config in SPECIAL_SUBSTITUTIONS.items():
            if key in q:
                item = self.get(config["item_id"])
                if item:
                    return {
                        "item": item,
                        "status": "substitution",
                        "message": config["message"],
                    }

        names = list(self._by_name.keys())
        matches = get_close_matches(q, names, n=1, cutoff=0.6)
        if matches:
            item = self._by_name[matches[0]]
            return {
                "item": item,
                "status": "fuzzy",
                "message": f"I matched that with {item.name}.",
            }
        return None


CATALOG = CatalogIndex.from_file(CATALOG_PATH)


class Cart:
    def __init__(self, catalog: CatalogIndex) -> None:
        self._catalog = catalog
        self._lines: Dict[str, CartLine] = {}

    def add(self, item: CatalogItem, quantity: int, notes: Optional[str]) -> CartLine:
        if quantity <= 0:
            raise ValueError("Quantity must be positive.")
        existing = self._lines.get(item.id)
        if existing:
            existing.quantity += quantity
            if notes:
                existing.notes = notes
            return existing
        line = CartLine(item=item, quantity=quantity, notes=notes)
        self._lines[item.id] = line
        return line

    def remove(self, query: str) -> Optional[CartLine]:
        match = self._catalog.find(query)
        if not match:
            return None
        return self._lines.pop(match["item"].id, None)

    def update_quantity(self, query: str, quantity: int) -> Optional[CartLine]:
        if quantity <= 0:
            raise ValueError("Quantity must be positive.")
        match = self._catalog.find(query)
        if not match:
            return None
        line = self._lines.get(match["item"].id)
        if line:
            line.quantity = quantity
        return line

    def clear(self) -> None:
        self._lines.clear()

    def is_empty(self) -> bool:
        return not self._lines

    def subtotal(self) -> float:
        return round(sum(line.item.price * line.quantity for line in self._lines.values()), 2)

    def as_list(self) -> List[Dict[str, Any]]:
        return [line.to_dict() for line in self._lines.values()]

    def item_count(self) -> int:
        return sum(line.quantity for line in self._lines.values())

    def to_order_items(self) -> List[Dict[str, Any]]:
        return self.as_list()


class Recipe(TypedDict):
    name: str
    keywords: List[str]
    items: List[Dict[str, Any]]


RECIPE_BOOK: List[Recipe] = [
    {
        "name": "party-starter",
        "keywords": ["party", "late night", "hangout"],
        "items": [
            {"item_id": "inst_02", "quantity": 2},
            {"item_id": "inst_03", "quantity": 2},
            {"item_id": "inst_11", "quantity": 1},
        ],
    },
    {
        "name": "peanut-butter-sandwich",
        "keywords": ["peanut butter sandwich"],
        "items": [
            {"item_id": "inst_07", "quantity": 1},
            {"item_id": "inst_20", "quantity": 1},
        ],
    },
    {
        "name": "breakfast-essentials",
        "keywords": ["breakfast", "morning basics"],
        "items": [
            {"item_id": "inst_01", "quantity": 1},
            {"item_id": "inst_07", "quantity": 1},
            {"item_id": "inst_08", "quantity": 1},
            {"item_id": "inst_06", "quantity": 1},
        ],
    },
    {
        "name": "pasta-night",
        "keywords": ["pasta", "italian dinner"],
        "items": [
            {"item_id": "inst_15", "quantity": 1},
            {"item_id": "inst_04", "quantity": 1},
            {"item_id": "inst_10", "quantity": 1},
        ],
    },
]


def resolve_recipe(query: str) -> Optional[Recipe]:
    lowered = query.lower()
    for recipe in RECIPE_BOOK:
        if any(keyword in lowered for keyword in recipe["keywords"]):
            return recipe
    return None


class OrderStore:
    def __init__(self, path: Path) -> None:
        self._path = path
        self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            self._path.write_text("[]", encoding="utf-8")

    def _load(self) -> List[Dict[str, Any]]:
        with self._path.open("r", encoding="utf-8") as fp:
            return json.load(fp)

    def _save(self, data: List[Dict[str, Any]]) -> None:
        with self._path.open("w", encoding="utf-8") as fp:
            json.dump(data, fp, indent=2)

    def create_order(
        self,
        *,
        items: List[Dict[str, Any]],
        subtotal: float,
        customer_name: str,
        delivery_note: Optional[str],
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        order_id = f"INST-{now.strftime('%Y%m%d-%H%M%S')}"
        delivery_fee = 0 if subtotal >= FREE_DELIVERY_THRESHOLD else 25
        total = round(subtotal + delivery_fee, 2)
        order = {
            "order_id": order_id,
            "placed_at": now.isoformat(),
            "status": "received",
            "status_history": [
                {"status": "received", "message": STATUS_MESSAGES["received"], "updated_at": now.isoformat()}
            ],
            "items": items,
            "subtotal": subtotal,
            "delivery_fee": delivery_fee,
            "total": total,
            "currency": "INR",
            "customer_name": customer_name,
            "delivery_note": delivery_note,
            "free_delivery_applied": subtotal >= FREE_DELIVERY_THRESHOLD,
        }
        orders = self._load()
        orders.append(order)
        self._save(orders)
        return order

    def _status_for_elapsed(self, elapsed: timedelta) -> str:
        for status, threshold in reversed(STATUS_SEQUENCE):
            if elapsed >= threshold:
                return status
        return "received"

    def refresh_statuses(self) -> None:
        orders = self._load()
        updated = False
        for order in orders:
            placed_at = datetime.fromisoformat(order["placed_at"])
            elapsed = datetime.now(timezone.utc) - placed_at
            new_status = self._status_for_elapsed(elapsed)
            if new_status != order["status"]:
                order["status"] = new_status
                order["status_history"].append(
                    {
                        "status": new_status,
                        "message": STATUS_MESSAGES[new_status],
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
                updated = True
        if updated:
            self._save(orders)

    def _sorted_orders(self) -> List[Dict[str, Any]]:
        orders = self._load()
        return sorted(orders, key=lambda o: o["placed_at"], reverse=True)

    def latest(self) -> Optional[Dict[str, Any]]:
        orders = self._sorted_orders()
        return orders[0] if orders else None

    def get(self, order_id: str) -> Optional[Dict[str, Any]]:
        for order in self._load():
            if order["order_id"] == order_id:
                return order
        return None

    def list_recent(self, limit: int = 5) -> List[Dict[str, Any]]:
        return self._sorted_orders()[:limit]


CATALOG: CatalogIndex = CatalogIndex.from_file(CATALOG_PATH)
ORDER_STORE = OrderStore(ORDERS_PATH)


def combo_suggestion(item_id: str) -> Optional[Dict[str, Any]]:
    config = COMBO_SUGGESTIONS.get(item_id)
    if not config:
        return None
    suggestion_items = []
    for candidate_id in config["item_ids"]:
        item = CATALOG.get(candidate_id)
        if item:
            suggestion_items.append({"item_id": item.id, "name": item.name, "price": item.price})
    if not suggestion_items:
        return None
    return {"message": config["message"], "items": suggestion_items}


def cart_snapshot(cart: Cart) -> Dict[str, Any]:
    subtotal = cart.subtotal()
    return {
        "items": cart.as_list(),
        "subtotal": subtotal,
        "item_count": cart.item_count(),
        "currency": "INR",
        "free_delivery_threshold": FREE_DELIVERY_THRESHOLD,
        "free_delivery_eligible": subtotal >= FREE_DELIVERY_THRESHOLD,
    }


__all__ = [
    "CATALOG",
    "CATALOG_PATH",
    "Cart",
    "CartLine",
    "CatalogIndex",
    "CatalogItem",
    "OrderStore",
    "ORDER_STORE",
    "FREE_DELIVERY_THRESHOLD",
    "STATUS_MESSAGES",
    "resolve_recipe",
    "combo_suggestion",
    "cart_snapshot",
    "COMBO_SUGGESTIONS",
    "SPECIAL_SUBSTITUTIONS",
]

