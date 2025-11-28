from datetime import datetime, timedelta, timezone
from pathlib import Path

import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from instamart import (
    CATALOG,
    Cart,
    OrderStore,
    resolve_recipe,
)


def test_catalog_handles_red_lays_substitution():
    match = CATALOG.find("Need Red Lays please")
    assert match is not None
    assert match["item"].id == "inst_02"
    assert match["status"] == "substitution"
    assert "Magic Masala" in (match["message"] or "")


def test_recipe_party_bundle_adds_expected_items():
    recipe = resolve_recipe("ingredients for a house party")
    assert recipe is not None
    assert recipe["name"] == "party-starter"

    cart = Cart(CATALOG)
    for ingredient in recipe["items"]:
        item = CATALOG.get(ingredient["item_id"])
        assert item is not None
        cart.add(item, ingredient["quantity"], notes=None)

    snapshot = cart.as_list()
    assert any(line["name"].startswith("Lay") for line in snapshot)
    total_quantity = sum(line["quantity"] for line in snapshot)
    assert total_quantity == sum(entry["quantity"] for entry in recipe["items"])


def test_order_status_progression(tmp_path: Path):
    orders_file = tmp_path / "orders.json"
    store = OrderStore(orders_file)
    order = store.create_order(
        items=[
            {
                "id": "inst_02",
                "name": "Lay's India's Magic Masala (Blue)",
                "quantity": 2,
                "unit_price": 30,
                "line_total": 60,
                "currency": "INR",
                "notes": None,
                "category": "Munchies",
                "tags": ["chips"],
            }
        ],
        subtotal=60,
        customer_name="Test User",
        delivery_note=None,
    )

    # Rewind time so the status should advance to delivered.
    data = store._load()  # type: ignore[attr-defined]
    data[0]["placed_at"] = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
    data[0]["status"] = "received"
    data[0]["status_history"] = [
        {
            "status": "received",
            "message": "Order received! Your order is being packed.",
            "updated_at": data[0]["placed_at"],
        }
    ]
    store._save(data)  # type: ignore[attr-defined]

    store.refresh_statuses()
    updated = store.get(order["order_id"])
    assert updated is not None
    assert updated["status"] == "delivered"
    assert any(entry["status"] == "delivered" for entry in updated["status_history"])
