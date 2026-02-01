# 🐭 Pinky Bot Dashboard

**Interactive Windows Desktop Application for Bot Army Control**

Complete control center for managing all 5 bots, scheduling tasks, connecting social media accounts, and analyzing performance.

---

## ✨ Features

### 🤖 Bot Management
- **5 Bots Integrated:**
  - 📝 DocsBot - Documentation generation
  - 🔍 ResearchBot - Market research
  - 💻 CodeBot - Code generation
  - 📱 SocialBot - Social media content
  - 💼 BusinessBot - Business analysis

### 📊 Dashboard
- Real-time bot status
- Task completion metrics
- Cost savings tracking
- Success rate monitoring
- Recent activity feed

### ⚡ Quick Actions
- One-click common tasks
- Batch task execution
- Keyboard shortcuts
- Custom workflows

### 🌐 Social Media Integration (PLANNED)
- **Facebook:** Post, schedule, analyze
- **Instagram:** Create posts, stories
- **Twitter/X:** Tweet, threads, engagement
- **LinkedIn:** Professional content, networking

### 📅 Task Scheduling
- Cron-based recurring tasks
- One-time scheduled tasks
- Task queue management
- Priority handling

### 📈 Analytics
- Performance metrics
- Cost analysis
- Bot usage statistics
- Task history

### ⚙️ Settings
- API credentials management
- Bot configuration
- Preferences
- Export/import settings

---

## 🚀 Installation

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **Windows 10+** / Mac / Linux

### Quick Start

```bash
# 1. Navigate to dashboard directory
cd dashboard

# 2. Install dependencies
npm install

# 3. Start development
npm start

# 4. Build for production
npm run build:win     # Windows installer
npm run build:mac     # Mac DMG
npm run build:linux   # Linux AppImage
```

### Production Build

```bash
# Windows
npm run build:win
# Output: dist/Pinky Bot Dashboard Setup.exe

# Mac
npm run build:mac
# Output: dist/Pinky Bot Dashboard.dmg

# Linux
npm run build:linux
# Output: dist/Pinky Bot Dashboard.AppImage
```

---

## 📱 Usage

### Starting the Dashboard

**Development Mode:**
```bash
npm start
```

**Production:**
- Double-click the installed application icon
- Or run the executable from dist/

### Quick Actions

**Generate Daily Log:**
1. Click "Generate Daily Log" on dashboard
2. Review events automatically captured
3. Edit if needed
4. Save to memory/

**Create Social Post:**
1. Click "Create Social Post"
2. Select platform (Facebook, Instagram, etc.)
3. Enter topic and tone
4. Generate content
5. Post immediately or schedule

**Run Market Research:**
1. Click "Market Research"
2. Enter topic
3. Select research type
4. Generate report
5. View results in dashboard

**Batch Tasks:**
1. Click "Run Batch Tasks"
2. Select multiple tasks
3. Execute in parallel
4. Monitor progress
5. Review results

---

## 🔌 API Integration

### Social Media Setup

#### Facebook
1. Go to Settings → Social Media
2. Click "Connect Facebook"
3. Enter App ID and App Secret
4. Grant permissions
5. Test connection

#### Instagram
1. Go to Settings → Social Media
2. Click "Connect Instagram"
3. Enter credentials (via Facebook)
4. Authorize access
5. Test post creation

#### Twitter/X
1. Go to Settings → Social Media
2. Click "Connect Twitter"
3. Enter API credentials
4. Authorize OAuth
5. Test tweet

#### LinkedIn
1. Go to Settings → Social Media
2. Click "Connect LinkedIn"
3. Enter Client ID/Secret
4. Authorize access
5. Test post

### API Server

The dashboard runs a local API server on port 18790 for external integrations:

```bash
# Get status
curl http://localhost:18790/status

# Execute bot command
curl -X POST http://localhost:18790/execute \
  -H "Content-Type: application/json" \
  -d '{
    "bot": "social",
    "command": "generate",
    "params": {
      "platform": "instagram",
      "spec": {
        "topic": "AI automation",
        "tone": "exciting"
      }
    }
  }'
```

---

## 🎨 Interface Guide

### Main Dashboard
- **Status Indicators:** System health, bot count, tasks completed
- **Stats Grid:** Key metrics (tasks, cost saved, speed, success)
- **Quick Actions:** One-click common operations
- **Activity Feed:** Real-time task updates

### Bot Views
Each bot has a dedicated interface:
- **DocsBot:** Generate logs, update memory, create notes
- **ResearchBot:** Market research, competitor analysis
- **CodeBot:** Generate code, debug, optimize
- **SocialBot:** Create posts, calendars, hashtags
- **BusinessBot:** Analyze opportunities, financials

### Task Queue
- View pending tasks
- Reorder priorities
- Cancel/edit tasks
- Monitor progress

### Analytics
- Charts and graphs
- Performance trends
- Cost analysis
- Usage patterns

### Settings
- Bot configuration
- API credentials
- Scheduling rules
- Preferences

---

## ⌨️ Keyboard Shortcuts

- `F5` - Refresh dashboard
- `Ctrl+1` - DocsBot
- `Ctrl+2` - ResearchBot
- `Ctrl+3` - CodeBot
- `Ctrl+4` - SocialBot
- `Ctrl+5` - BusinessBot
- `Ctrl+Q` - Task Queue
- `Ctrl+A` - Analytics
- `Ctrl+S` - Settings
- `Alt+F4` - Exit

---

## 🔧 Configuration

### settings.json
```json
{
  "bots": {
    "docs": {
      "enabled": true,
      "autoDaily": true
    },
    "social": {
      "enabled": true,
      "platforms": {
        "facebook": {
          "connected": false,
          "appId": "",
          "appSecret": ""
        },
        "instagram": {
          "connected": false
        }
      }
    }
  },
  "scheduling": {
    "timezone": "America/New_York",
    "autoStart": true
  },
  "notifications": {
    "enabled": true,
    "sound": true
  }
}
```

---

## 📂 Project Structure

```
dashboard/
├── main.js              # Electron main process
├── index.html           # Dashboard UI
├── renderer.js          # Frontend logic
├── styles.css           # Styling
├── package.json         # Dependencies
├── src/
│   ├── orchestrator.js  # Bot management
│   ├── api-manager.js   # Social media APIs
│   ├── database.js      # SQLite storage
│   └── utils.js         # Helper functions
├── assets/
│   ├── icon.png         # App icon
│   └── screenshots/     # UI screenshots
└── dist/                # Build output
```

---

## 🐛 Troubleshooting

### Dashboard won't start
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm start
```

### Bots not responding
- Check bot files in ../bots/ directory
- Verify Node.js version (18+)
- Review logs in console

### Social media connection fails
- Verify API credentials
- Check network connectivity
- Review platform API status
- Try reconnecting

### Database errors
- Delete pinky.db and restart
- Check file permissions
- Verify SQLite installation

---

## 🎯 Roadmap

### v1.0 (Current)
- [x] Dashboard UI
- [x] Bot integration
- [x] Task execution
- [ ] Social media APIs (IN PROGRESS)
- [ ] Task scheduling
- [ ] Analytics

### v1.1 (Next)
- [ ] Voice control
- [ ] Mobile companion app
- [ ] Cloud sync
- [ ] Multi-user support

### v2.0 (Future)
- [ ] Plugin system
- [ ] Custom bot creation
- [ ] AI training interface
- [ ] Enterprise features

---

## 💡 Tips & Tricks

1. **Quick Daily Log:** Press F5 to auto-generate today's log
2. **Batch Mode:** Select multiple tasks and run in parallel
3. **Keyboard Nav:** Use Ctrl+1-5 to switch bots instantly
4. **Scheduling:** Set up recurring tasks for daily operations
5. **Analytics:** Review weekly to optimize bot usage

---

## 📝 License

MIT License - Free to use, modify, and distribute!

---

## 🆘 Support

- **GitHub:** [Issues](https://github.com/chefken052580/pinky-workspace/issues)
- **Documentation:** [Wiki](https://github.com/chefken052580/pinky-workspace/wiki)
- **Discord:** *(Coming soon)*

---

**Built with 🐭 by Pinky & The Brain**  
*"Are you pondering what I'm pondering?"*

NARF! 🚀🌍
