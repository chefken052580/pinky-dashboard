/**
 * PINKY BOT DASHBOARD - Main Process
 * 
 * Electron desktop app for managing all 5 bots
 * Windows/Mac/Linux compatible
 */

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const express = require('express');
const BotOrchestrator = require('./src/orchestrator');
const APIManager = require('./src/api-manager');
const Database = require('./src/database');

// Initialize components
let mainWindow;
let apiServer;
let orchestrator;
let database;
let apiManager;

/**
 * Create main window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#1a1a2e',
    title: 'Pinky Bot Dashboard - World Domination Control Center'
  });

  // Load dashboard
  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize backend services
 */
async function initializeServices() {
  console.log('[Dashboard] Initializing services...');

  // Initialize database
  database = new Database(path.join(app.getPath('userData'), 'pinky.db'));
  await database.init();

  // Initialize bot orchestrator
  orchestrator = new BotOrchestrator(database);

  // Initialize API manager
  apiManager = new APIManager(database);

  // Start API server for external integrations
  apiServer = express();
  apiServer.use(express.json());

  // API routes
  apiServer.get('/status', (req, res) => {
    res.json({
      status: 'operational',
      bots: orchestrator.getBotStatus(),
      uptime: process.uptime()
    });
  });

  apiServer.post('/execute', async (req, res) => {
    const { bot, command, params } = req.body;
    try {
      const result = await orchestrator.execute(bot, command, params);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  apiServer.listen(18790, () => {
    console.log('[Dashboard] API server running on port 18790');
  });

  console.log('[Dashboard] All services initialized');
}

/**
 * IPC handlers for renderer process
 */
function setupIPCHandlers() {
  // Execute bot command
  ipcMain.handle('execute-bot', async (event, bot, command, params) => {
    return await orchestrator.execute(bot, command, params);
  });

  // Get bot status
  ipcMain.handle('get-status', async () => {
    return orchestrator.getBotStatus();
  });

  // Get task history
  ipcMain.handle('get-history', async (limit = 50) => {
    return await database.getHistory(limit);
  });

  // Get analytics
  ipcMain.handle('get-analytics', async () => {
    return await database.getAnalytics();
  });

  // Connect social media
  ipcMain.handle('connect-social', async (event, platform, credentials) => {
    return await apiManager.connect(platform, credentials);
  });

  // Post to social media
  ipcMain.handle('post-social', async (event, platform, content) => {
    return await apiManager.post(platform, content);
  });

  // Schedule task
  ipcMain.handle('schedule-task', async (event, task) => {
    return await orchestrator.schedule(task);
  });

  // Get scheduled tasks
  ipcMain.handle('get-scheduled', async () => {
    return await orchestrator.getScheduled();
  });

  // Save settings
  ipcMain.handle('save-settings', async (event, settings) => {
    return await database.saveSettings(settings);
  });

  // Load settings
  ipcMain.handle('load-settings', async () => {
    return await database.loadSettings();
  });
}

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Refresh Dashboard',
          accelerator: 'F5',
          click: () => {
            if (mainWindow) mainWindow.reload();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Bots',
      submenu: [
        { label: 'DocsBot', click: () => selectBot('docs') },
        { label: 'ResearchBot', click: () => selectBot('research') },
        { label: 'CodeBot', click: () => selectBot('code') },
        { label: 'SocialBot', click: () => selectBot('social') },
        { label: 'BusinessBot', click: () => selectBot('business') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Dashboard', click: () => showView('dashboard') },
        { label: 'Task Queue', click: () => showView('queue') },
        { label: 'Analytics', click: () => showView('analytics') },
        { label: 'Settings', click: () => showView('settings') },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            require('electron').shell.openExternal('https://github.com/chefken052580/pinky-workspace');
          }
        },
        {
          label: 'About',
          click: () => showAbout()
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function selectBot(bot) {
  if (mainWindow) {
    mainWindow.webContents.send('select-bot', bot);
  }
}

function showView(view) {
  if (mainWindow) {
    mainWindow.webContents.send('show-view', view);
  }
}

function showAbout() {
  if (mainWindow) {
    mainWindow.webContents.send('show-about');
  }
}

/**
 * App lifecycle
 */
app.whenReady().then(async () => {
  await initializeServices();
  setupIPCHandlers();
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  console.log('[Dashboard] Shutting down services...');
  if (orchestrator) await orchestrator.shutdown();
  if (database) await database.close();
  if (apiServer) apiServer.close();
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Dashboard] Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[Dashboard] Unhandled rejection:', error);
});
