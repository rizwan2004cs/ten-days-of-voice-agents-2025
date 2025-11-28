# Day 8 Game Master - Quick Test Checklist

## 🚀 Quick Start

```bash
# Terminal 1
livekit-server --dev

# Terminal 2
cd backend && uv run python src/agent.py dev

# Terminal 3
cd frontend && pnpm dev
```

Open: http://localhost:3000

---

## ✅ Primary Goal Checklist

### 1. GM Persona (Required)
- [ ] Startup sequence appears
- [ ] First message is cyberpunk-themed
- [ ] Tone is dramatic/atmospheric
- [ ] Uses cyberpunk terminology

### 2. Interactive Story (Required)
- [ ] GM describes scenes
- [ ] GM responds to player actions
- [ ] Story progresses based on decisions
- [ ] Each message ends with action prompt

### 3. Continuity (Required)
- [ ] GM remembers past decisions
- [ ] Items are remembered
- [ ] Locations are remembered
- [ ] NPCs are remembered

### 4. Session Length (Required)
- [ ] At least 8 exchanges
- [ ] Story reaches conclusion/mini-arc
- [ ] Adventure feels complete

### 5. Basic UI (Required)
- [ ] Three panels visible
- [ ] Messages display correctly
- [ ] No XML tags visible
- [ ] Control bar works

---

## 🎮 Advanced Features Checklist

### 6. World State Tracking
- [ ] System Status panel shows data
- [ ] HP/Mana bars update
- [ ] Character info appears
- [ ] Inventory updates
- [ ] Location updates

### 7. Character Sheet
- [ ] Name displays
- [ ] Class displays
- [ ] HP bar works
- [ ] Mana bar works
- [ ] Attributes show

### 8. Inventory
- [ ] Items appear when found
- [ ] Items persist
- [ ] Format is correct

### 9. Dice Rolls
- [ ] Rolls occur for risky actions
- [ ] Outcomes vary
- [ ] Attributes affect results

### 10. NPCs & Quests
- [ ] NPCs appear in System Status
- [ ] Quests appear when created
- [ ] Information persists

---

## 🎨 UI/UX Checklist

### 11. Cyberpunk Theme
- [ ] Black background with grid
- [ ] Neon green text (#00ff41)
- [ ] Amber accents (#ffb300)
- [ ] Monospace font
- [ ] Scanlines effect
- [ ] Glow on GM text

### 12. Real-time Streaming
- [ ] Messages appear as typed
- [ ] Streaming indicator shows
- [ ] Auto-scroll works

### 13. Scrolling
- [ ] Content scrolls
- [ ] No visible scrollbars
- [ ] Smooth scrolling

### 14. Panel Sizes
- [ ] Left: 300px fixed
- [ ] Right: 300px fixed
- [ ] Middle: Flexible
- [ ] Proper spacing

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Messages not appearing | Check LiveKit Server is running |
| World state not updating | Check agent is sending XML tags |
| UI not loading | Run `pnpm install` in frontend |
| Audio not working | Check microphone permissions |
| Duplicate messages | Already fixed in code |
| XML tags visible | Already fixed in code |

---

## 📹 Video Recording Checklist

For LinkedIn post, record:
- [ ] Startup sequence (10s)
- [ ] Voice interaction (30-60s)
- [ ] System Status panel (10s)
- [ ] Story progression (30s)
- [ ] Conclusion (10s)

**Total: 1-2 minutes**

---

## 🎯 Success Criteria

**Primary Goal Complete When:**
- ✅ GM persona works
- ✅ 8+ exchanges completed
- ✅ Continuity maintained
- ✅ UI displays correctly

**Advanced Features Complete When:**
- ✅ World state tracking works
- ✅ Character sheet displays
- ✅ Inventory management works
- ✅ All UI sections show data

---

## 📝 Test Scenarios

### Scenario 1: Basic Adventure
1. Start session
2. Listen to opening
3. Say "I look around"
4. Say "I pick up the data-pad"
5. Say "I read the message"
6. Continue for 5+ more exchanges
7. Verify all features work

### Scenario 2: World State Updates
1. Start session
2. Wait for character initialization
3. Check System Status shows data
4. Find an item
5. Verify inventory updates
6. Move to new location
7. Verify location updates

### Scenario 3: Long Session
1. Start session
2. Play for 15+ exchanges
3. Verify no performance issues
4. Verify world state persists
5. Verify UI remains responsive

---

## 🔍 Debug Commands

```bash
# Check backend logs
cd backend
uv run python src/agent.py dev

# Check frontend logs
cd frontend
pnpm dev

# Check LiveKit Server
livekit-server --dev

# Test agent in console
cd backend
uv run python src/agent.py console
```

---

## 📊 Expected Results

### System Status Panel Should Show:
- ✅ PLAYER STATS (HP: 100/100, Mana: 50/50)
- ✅ CHARACTER (Name, Class)
- ✅ ATTRIBUTES (STR, INT, LUCK)
- ✅ INVENTORY (Items when found)
- ✅ LOCATION (Current location)
- ✅ ACTIVE QUESTS (When created)
- ✅ KNOWN NPCS (When encountered)
- ✅ RECENT EVENTS (Last 3 events)
- ✅ SESSION INFO (Turn count)

### Mainframe Log Should Show:
- ✅ `> USER (YOU):` for player (amber)
- ✅ `> SYSTEM (GM):` for GM (green with glow)
- ✅ No XML tags
- ✅ Real-time streaming
- ✅ Auto-scroll

### Neuro-Link Should Show:
- ✅ Voice visualizer bars
- ✅ Activity when speaking
- ✅ Green bars on black background

---

**Good luck testing! 🎮**

