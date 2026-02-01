#!/usr/bin/env node
/**
 * Pinky Activity Logger
 * Logs heartbeat activity to pinky-activity.json for dashboard display
 */

const fs = require('fs');
const path = require('path');

const ACTIVITY_FILES = [
    '/mnt/d/pinky-activity.json',
    '/mnt/d/pinky-workspace/dashboard/pinky-activity.json'
];

// Parse command line args
const args = process.argv.slice(2);
const type = args[0]; // 'heartbeat', 'thinking', 'usage'
const data = JSON.parse(args[1] || '{}');

// Load existing data
let activityData = {
    heartbeats: [],
    thinking: [],
    usage: {
        tokens: 0,
        exec: 0,
        files: 0,
        responses: []
    }
};

// Load from first available file
for (const file of ACTIVITY_FILES) {
    if (fs.existsSync(file)) {
        try {
            activityData = JSON.parse(fs.readFileSync(file, 'utf8'));
            break;
        } catch (err) {
            console.error('Error reading activity file:', file, err);
        }
    }
}

// Add new entry
if (type === 'heartbeat') {
    activityData.heartbeats.push({
        timestamp: Date.now(),
        activity: data.activity || 'Heartbeat check',
        lagMs: data.lagMs || 0,
        tokens: data.tokens || 0,
        exec: data.exec || 0
    });
    
    // Keep only last 100 heartbeats
    if (activityData.heartbeats.length > 100) {
        activityData.heartbeats = activityData.heartbeats.slice(-100);
    }
    
} else if (type === 'thinking') {
    activityData.thinking.push({
        timestamp: Date.now(),
        task: data.task || 'Unknown',
        duration: data.duration || 0
    });
    
    // Keep only last 200 thinking sessions
    if (activityData.thinking.length > 200) {
        activityData.thinking = activityData.thinking.slice(-200);
    }
    
} else if (type === 'usage') {
    activityData.usage.tokens += data.tokens || 0;
    activityData.usage.exec += data.exec || 0;
    activityData.usage.files += data.files || 0;
    
    if (data.responseTime) {
        activityData.usage.responses.push(data.responseTime);
        // Keep only last 100 response times
        if (activityData.usage.responses.length > 100) {
            activityData.usage.responses = activityData.usage.responses.slice(-100);
        }
    }
}

// Save updated data to all locations
let savedCount = 0;
for (const file of ACTIVITY_FILES) {
    try {
        // Create directory if it doesn't exist
        const dir = path.dirname(file);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(file, JSON.stringify(activityData, null, 2));
        savedCount++;
    } catch (err) {
        console.error('Error writing activity file:', file, err);
    }
}
console.log(`Logged ${type} activity to ${savedCount} file(s)`);
