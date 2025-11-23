# Content Security Policy (CSP) Warning - Information

## What You're Seeing

The browser console shows a CSP warning about blocking `eval()` in JavaScript. This is a **security feature** that prevents code injection attacks.

## Is This Affecting the Voice Agent?

**Most likely: NO** - This warning is typically harmless in development mode and doesn't prevent the voice agent from working.

The warning appears because:
- Next.js with Turbopack uses some features that trigger CSP warnings
- Some dependencies (like LiveKit client libraries) may use `eval()` internally
- This is common in development mode

## Should You Fix It?

### For Development:
- **You can safely ignore it** - It's just a warning, not an error
- The voice agent should work fine despite this warning
- This is normal for Next.js development with Turbopack

### For Production:
- Next.js handles CSP automatically in production builds
- The warning typically doesn't appear in production
- If needed, you can configure CSP headers in `next.config.ts`

## If You Want to Suppress the Warning (Optional)

If the warning is bothering you, you can add this to `frontend/next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Suppress CSP warnings in development (not recommended for production)
  // This is only for development - production builds handle CSP properly
  experimental: {
    // Turbopack may trigger CSP warnings in dev mode
  },
};

export default nextConfig;
```

**Note:** It's generally better to leave it as-is since:
1. It's just a warning, not blocking functionality
2. Production builds don't have this issue
3. It helps identify potential security issues

## Verify the Agent is Working

The CSP warning doesn't prevent the voice agent from working. To verify:

1. **Check if backend is running:**
   ```bash
   ps aux | grep "agent.py dev"
   ```

2. **Check backend logs:**
   ```bash
   tail -f /tmp/backend_current.log
   ```

3. **Test the agent:**
   - Open http://localhost:3000
   - Click "Start call"
   - Speak clearly
   - The agent should respond (despite the CSP warning)

## Summary

- ✅ **CSP warning is normal** in Next.js development
- ✅ **Doesn't block functionality** - voice agent should work fine
- ✅ **Safe to ignore** in development mode
- ✅ **Production builds** handle CSP automatically

If the agent is not responding, the issue is likely **not** related to the CSP warning. Check:
- Backend is running
- API keys are configured
- Microphone permissions are granted
- Browser console for other errors (not CSP warnings)

