# 🚀 How to Open the Dashboard

## Quick Start (Windows)

### Option 1: Double-Click (Easiest!)
1. Open File Explorer
2. Navigate to: `D:\pinky-workspace\dashboard\`
3. Double-click `index.html`
4. Dashboard opens in your default browser!

### Option 2: Direct Browser Path
1. Open Chrome/Edge/Firefox
2. Type in address bar: `file:///D:/pinky-workspace/dashboard/index.html`
3. Press Enter

---

## Troubleshooting

### Tabs on Left Side Not Working?
**This is normal for `file://` protocol!**

Browser security blocks some JavaScript features when opening local HTML files.

**SOLUTION: Run a local web server**

```bash
# Option A: Using Python (if installed)
cd /mnt/d/pinky-workspace/dashboard
python -m http.server 8080

# Then open: http://localhost:8080

# Option B: Using Node.js (if installed)
cd /mnt/d/pinky-workspace/dashboard
npx http-server -p 8080

# Then open: http://localhost:8080
```

### Activity Data Not Showing?
Make sure the activity logger is running:
```bash
node /mnt/d/log-activity.js heartbeat '{"activity":"test","lagMs":100,"tokens":0}'
```

Check if file exists:
```bash
ls -la /mnt/d/pinky-workspace/dashboard/pinky-activity.json
```

---

## Best Way to Use

### For Full Functionality:
1. **Start a local server** (see above)
2. **Open in browser:** http://localhost:8080
3. **Pin the tab** so it stays open
4. **Auto-refresh** happens every 5 seconds!

### Why Local Server?
- Fixes tab navigation
- Enables AJAX data loading
- No browser security warnings
- All features work properly

---

## Desktop App (Future Enhancement)

Want a dedicated desktop app? We can build one with Electron!

```bash
cd /mnt/d/pinky-workspace/dashboard
npm install
npm start
```

This creates a standalone Windows app (no browser needed!)

---

## Current Features Status

When opened via **file://** protocol:
- ✅ Beautiful UI loads
- ✅ Styling works
- ⚠️ Tab navigation limited
- ⚠️ Data loading limited

When opened via **http://localhost**:
- ✅ Beautiful UI loads
- ✅ Styling works
- ✅ **Tab navigation works!**
- ✅ **Data loading works!**
- ✅ **Auto-refresh works!**
- ✅ **All features enabled!**

---

## Recommended Setup

### One-Time Setup:
```bash
# Install http-server globally (once)
npm install -g http-server
```

### Every Time You Want to Use Dashboard:
```bash
# Start server
cd /mnt/d/pinky-workspace/dashboard
http-server -p 8080

# Open browser to: http://localhost:8080
```

### Auto-Start (Optional):
Create a batch file: `start-dashboard.bat`
```batch
@echo off
cd /mnt/d/pinky-workspace/dashboard
start http-server -p 8080
timeout /t 2
start http://localhost:8080
```

Double-click this file to auto-start everything!

---

**NARF!** Dashboard ready for world domination monitoring! 🐭📊
