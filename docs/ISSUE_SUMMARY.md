# Quick Issue Summary

## Problem
Pydantic validation error when LLM calls `browse_products` with partial parameters. Error occurs **before** function execution in LiveKit's validation layer.

## Error
```
ValidationError: 3 validation errors for BrowseProductsArgs
  category: Field required
  min_price: Field required  
  sort_by: Field required
```

## Root Cause
`@function_tool` decorator generates Pydantic model that incorrectly treats optional parameters (with defaults) as required.

## Current Code
```python
@function_tool(description="...")
async def browse_products(
    self,
    context: RunContext,
    search_term: str = "",      # Has default
    category: str = "",          # Has default
    max_price: int = 0,          # Has default
    min_price: int = 0,          # Has default
    sort_by: str = "",           # Has default
) -> str:
```

## What We Tried
1. ✅ `Optional[str] = None` - Failed
2. ✅ `str = ""` with normalization - Failed
3. ✅ Removed `llm.TypeInfo` - Fixed AttributeError but validation still fails

## System
- LiveKit Agents v1.3.2
- Pydantic v2.12+
- Python 3.12.12
- Google Gemini 2.5 Flash

## Key Question
Why does `function_tool` generate a Pydantic model that requires fields with default values?

See `PYDANTIC_VALIDATION_ISSUE_REPORT.md` for full details.

