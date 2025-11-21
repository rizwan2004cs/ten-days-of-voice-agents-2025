# Troubleshooting: Media Device Access Error

## Error: "Accessing media devices is available only in secure contexts"

This error occurs when the browser doesn't recognize the page as being in a secure context (HTTPS or localhost).

### ✅ Solution Steps:

1. **Access via `localhost` (NOT `127.0.0.1` or IP address)**
   - ✅ Correct: `http://localhost:3000`
   - ❌ Wrong: `http://127.0.0.1:3000`
   - ❌ Wrong: `http://192.168.x.x:3000`

2. **Restart the frontend dev server:**
   ```bash
   cd frontend
   pnpm dev
   ```
   
   The dev server should show:
   ```
   ▲ Next.js 15.5.2
   - Local:        http://localhost:3000
   ```

3. **Clear browser cache and hard refresh:**
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache completely

4. **Check browser permissions:**
   - When you visit `http://localhost:3000`, the browser should prompt for microphone access
   - Click "Allow" when prompted
   - If blocked, check browser settings:
     - Chrome: `chrome://settings/content/microphone`
     - Firefox: `about:preferences#privacy` → Permissions → Microphone
     - Edge: `edge://settings/content/microphone`

5. **Verify all services are running:**
   ```bash
   # Check LiveKit server
   curl http://localhost:7880
   
   # Check frontend
   curl http://localhost:3000
   ```

6. **If still not working, try a different browser:**
   - Sometimes browser extensions or settings can interfere
   - Try Chrome, Firefox, or Edge in incognito/private mode

### Common Issues:

**Issue:** Still getting the error even on localhost:3000
- **Fix:** Make sure you're not accessing via a file:// URL
- **Fix:** Check that the Next.js dev server is actually running (check terminal output)
- **Fix:** Try restarting the dev server completely

**Issue:** Browser doesn't prompt for microphone permission
- **Fix:** Check browser settings (see step 4 above)
- **Fix:** Make sure you're using a modern browser (Chrome 60+, Firefox 55+, Edge 79+)

**Issue:** Error appears immediately on page load
- **Fix:** This might be a timing issue - wait a few seconds after page loads
- **Fix:** Check browser console for other errors that might be causing this

### Verification:

After following these steps, you should:
1. See the voice agent interface without errors
2. Be able to click "Start call" button
3. Get a browser prompt asking for microphone permission
4. See "Agent is listening" message after starting

If you still have issues, check:
- Browser console for additional errors
- Terminal where `pnpm dev` is running for server errors
- That all three services (LiveKit, backend, frontend) are running

