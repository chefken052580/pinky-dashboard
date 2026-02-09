/**
 * Export Handler - Download data in various formats
 * PinkyBot.io - Dashboard Component
 */

async function exportData(type, format) {
    try {
        let data, filename, blob;

        switch (type) {
            case 'tasks':
                // Fetch task history from API
                const tasksRes = await fetch('/api/tasks');
                data = await tasksRes.json();
                filename = `pinkybot-tasks-${new Date().toISOString().split('T')[0]}.json`;
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                downloadBlob(blob, filename);
                break;

            case 'activity':
                // Fetch activity logs and convert to CSV
                const activityRes = await fetch('/api/activity');
                const activityData = await activityRes.json();
                const csv = convertToCSV(activityData.heartbeats || activityData.activities || []);
                filename = `pinkybot-activity-${new Date().toISOString().split('T')[0]}.csv`;
                blob = new Blob([csv], { type: 'text/csv' });
                downloadBlob(blob, filename);
                break;

            case 'usage':
                // Fetch token usage data
                const usageRes = await fetch('/api/usage');
                data = await usageRes.json();
                filename = `pinkybot-usage-${new Date().toISOString().split('T')[0]}.json`;
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                downloadBlob(blob, filename);
                break;

            case 'screenshot':
                // Take screenshot of dashboard (placeholder - would need html2canvas library)
                alert('📸 Screenshot export requires html2canvas library. Opening print dialog instead...');
                window.print();
                break;

            case 'memory':
                // Placeholder for memory files ZIP download
                alert('🧠 Memory export: Download MEMORY.md + memory/*.md files via API endpoint /api/export/memory (requires backend implementation)');
                break;

            case 'all':
                // Placeholder for full backup ZIP
                alert('📦 Full backup: Download all-data.zip via API endpoint /api/export/full (requires backend implementation)');
                break;

            default:
                alert('Unknown export type: ' + type);
        }
    } catch (error) {
        console.error('[Export] Error:', error);
        alert('❌ Export failed: ' + error.message);
    }
}

/**
 * Convert array of objects to CSV string
 */
function convertToCSV(data) {
    if (!data || data.length === 0) {
        return 'No data available';
    }

    // Extract headers from first object
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const val = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(val).replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
        });
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
}

/**
 * Trigger browser download of a blob
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`[Export] Downloaded ${filename}`);
}
