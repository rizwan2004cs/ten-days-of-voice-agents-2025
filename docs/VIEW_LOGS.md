# 📋 Where to Find Running Logs

## Current Log Files

### Backend Logs
Located in `/tmp/` directory:

- **Most Recent**: `/tmp/backend_sarah.log` (29KB) - Current backend session
- **Previous**: `/tmp/backend_new.log` (343KB) - Previous session
- **Other**: `/tmp/backend.log`, `/tmp/backend_restart.log`

### LiveKit Server Logs
- **Location**: `/tmp/livekit.log` (11MB) - LiveKit server output

### Frontend Logs
- **Location**: Terminal output (no separate log file)
- Check the terminal where `start_app.sh` is running

### Project Directory Logs
- `./backend_live.log` (15KB)
- `./backend_restart.log` (197KB)

---

## How to View Logs

### 1. View Backend Logs (Real-time)
```bash
# Most recent backend log
tail -f /tmp/backend_sarah.log

# Or view last 50 lines
tail -50 /tmp/backend_sarah.log
```

### 2. View LiveKit Server Logs
```bash
# Real-time
tail -f /tmp/livekit.log

# Last 50 lines
tail -50 /tmp/livekit.log
```

### 3. View All Logs in Terminal
Since `start_app.sh` runs services in the background, their output goes to the **terminal where you ran `./start_app.sh`**.

To see all logs:
- Check the terminal window where you executed `./start_app.sh`
- All three services (LiveKit, Backend, Frontend) output there

### 4. View Specific Service Logs

**Backend only:**
```bash
tail -f /tmp/backend_sarah.log
```

**LiveKit only:**
```bash
tail -f /tmp/livekit.log
```

**Frontend:**
- Check the terminal where `start_app.sh` is running
- Or look for Next.js output in that terminal

---

## Quick Commands

### View Latest Backend Activity
```bash
tail -30 /tmp/backend_sarah.log
```

### Search for Errors
```bash
# Backend errors
grep -i error /tmp/backend_sarah.log | tail -20

# LiveKit errors
grep -i error /tmp/livekit.log | tail -20
```

### Monitor All Services
```bash
# Watch backend logs
tail -f /tmp/backend_sarah.log

# In another terminal, watch LiveKit
tail -f /tmp/livekit.log
```

---

## Log File Locations Summary

| Service | Log File Location | Size |
|---------|------------------|------|
| **Backend** | `/tmp/backend_sarah.log` | 29KB (current) |
| **LiveKit** | `/tmp/livekit.log` | 11MB |
| **Frontend** | Terminal output | N/A |

---

## Note

When you run `./start_app.sh`, the services run in the background and output to:
1. **Terminal stdout** (where you ran the script)
2. **Log files** (for backend/LiveKit when redirected)

To see real-time logs, either:
- Check the terminal where `start_app.sh` is running
- Use `tail -f` on the log files listed above

