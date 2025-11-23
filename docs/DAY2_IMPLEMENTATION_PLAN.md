# Day 2 Implementation Plan - Coffee Shop Barista Agent

## Requirements Summary

1. **Persona**: Friendly barista for a coffee brand
2. **Order State**: Track `drinkType`, `size`, `milk`, `extras[]`, `name`
3. **Behavior**: Ask questions until all fields filled, then save to JSON
4. **Output**: JSON file with order summary

## Implementation Steps

### Step 1: Update Agent Instructions
- Change from generic assistant to friendly barista
- Add instructions about taking coffee orders
- Guide the agent to ask for missing information

### Step 2: Add Order State Management
- Create an order state dictionary
- Store it in the agent instance or session
- Track which fields are filled

### Step 3: Add Function Tools
- `update_order_field()` - Update specific order fields
- `check_order_complete()` - Check if all fields are filled
- `save_order()` - Save completed order to JSON file

### Step 4: Update Agent Class
- Initialize order state in `__init__`
- Add methods to manage order state
- Update instructions for barista persona

### Step 5: Test the Implementation
- Test taking a complete order
- Verify JSON file is created
- Ensure all fields are captured

## File Structure

```
backend/
  src/
    agent.py          # Main agent file (needs updates)
  orders/             # Directory for saved orders (create)
    order_*.json      # Saved order files
```

## Key Changes Needed

1. **Import function_tool and RunContext**
2. **Add order state to Agent class**
3. **Create function tools for order management**
4. **Update agent instructions**
5. **Add JSON file saving logic**

## Example Order State

```python
{
    "drinkType": "latte",
    "size": "large",
    "milk": "oat milk",
    "extras": ["whipped cream", "vanilla syrup"],
    "name": "John"
}
```

## Next Steps

Ready to implement? I can:
1. Update the agent.py file with barista persona
2. Add function tools for order management
3. Implement JSON file saving
4. Test the implementation

Let me know if you want me to proceed with the implementation!

