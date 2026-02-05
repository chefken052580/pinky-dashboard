/**
 * METRICS PERSISTENCE LAYER
 * Tracks API health metrics over time with localStorage persistence
 * Provides trend analysis, averages, and performance alerts
 * 
 * HB#111 Self-Improvement Feature
 */

class MetricsPersistence {
  constructor() {
    this.storageKey = 'pinky_api_metrics_v1';
    this.maxDataPoints = 1440; // ~24 hours at 60s intervals
    this.alertThresholds = {
      responseTime: 1000, // ms
      errorRate: 0.1, // 10%
      uptime: 0.99 // 99%
    };
    this.data = this.loadFromStorage();
  }

  /**
   * Record a new API response metric
   */
  recordMetric(endpoint, responseTime, status = 'success', timestamp = Date.now()) {
    const entry = {
      timestamp,
      endpoint,
      responseTime,
      status,
      dateEST: new Date(timestamp).toLocaleString('en-US', { timeZone: 'America/New_York' })
    };

    if (!this.data.metrics) {
      this.data.metrics = [];
    }

    this.data.metrics.push(entry);

    // Keep only recent data (24 hours)
    if (this.data.metrics.length > this.maxDataPoints) {
      this.data.metrics = this.data.metrics.slice(-this.maxDataPoints);
    }

    // Update aggregates
    this.updateAggregates();
    this.saveToStorage();

    // Check for alerts
    return this.checkAlerts(entry);
  }

  /**
   * Get metrics for a specific time window
   */
  getMetricsForWindow(windowMs = 3600000) { // default 1 hour
    const cutoff = Date.now() - windowMs;
    if (!this.data.metrics) return [];
    return this.data.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Calculate average response time
   */
  getAverageResponseTime(windowMs = 3600000) {
    const metrics = this.getMetricsForWindow(windowMs);
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + (m.responseTime || 0), 0);
    return Math.round(sum / metrics.length);
  }

  /**
   * Get percentile response time (p95, p99, etc)
   */
  getPercentileResponseTime(percentile = 95, windowMs = 3600000) {
    const metrics = this.getMetricsForWindow(windowMs);
    if (metrics.length === 0) return 0;
    const sorted = metrics
      .map(m => m.responseTime)
      .sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Get success rate
   */
  getSuccessRate(windowMs = 3600000) {
    const metrics = this.getMetricsForWindow(windowMs);
    if (metrics.length === 0) return 1;
    const successful = metrics.filter(m => m.status === 'success').length;
    return (successful / metrics.length).toFixed(3);
  }

  /**
   * Get peak response time in window
   */
  getPeakResponseTime(windowMs = 3600000) {
    const metrics = this.getMetricsForWindow(windowMs);
    if (metrics.length === 0) return 0;
    return Math.max(...metrics.map(m => m.responseTime));
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit = 5, windowMs = 3600000) {
    const metrics = this.getMetricsForWindow(windowMs);
    const byEndpoint = {};

    metrics.forEach(m => {
      if (!byEndpoint[m.endpoint]) {
        byEndpoint[m.endpoint] = [];
      }
      byEndpoint[m.endpoint].push(m.responseTime);
    });

    const endpoints = Object.entries(byEndpoint).map(([name, times]) => ({
      name,
      avgTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      maxTime: Math.max(...times),
      callCount: times.length
    }));

    return endpoints
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }

  /**
   * Update aggregate statistics
   */
  updateAggregates() {
    const oneHour = this.getMetricsForWindow(3600000);
    const oneDay = this.getMetricsForWindow(86400000);

    this.data.aggregates = {
      lastUpdated: Date.now(),
      oneHour: {
        avgResponse: this.getAverageResponseTime(3600000),
        p95Response: this.getPercentileResponseTime(95, 3600000),
        successRate: this.getSuccessRate(3600000),
        callCount: oneHour.length
      },
      oneDay: {
        avgResponse: this.getAverageResponseTime(86400000),
        p95Response: this.getPercentileResponseTime(95, 86400000),
        successRate: this.getSuccessRate(86400000),
        callCount: oneDay.length
      }
    };
  }

  /**
   * Check for performance alerts
   */
  checkAlerts(entry) {
    const alerts = [];

    if (entry.status !== 'success') {
      alerts.push({
        type: 'error',
        message: `API error on ${entry.endpoint}`,
        severity: 'high'
      });
    }

    if (entry.responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'slow',
        message: `Slow response on ${entry.endpoint}: ${entry.responseTime}ms`,
        severity: 'medium'
      });
    }

    // Check success rate
    const oneHourMetrics = this.getMetricsForWindow(3600000);
    if (oneHourMetrics.length > 10) {
      const failureRate = 1 - parseFloat(this.getSuccessRate(3600000));
      if (failureRate > this.alertThresholds.errorRate) {
        alerts.push({
          type: 'error_rate',
          message: `High error rate: ${(failureRate * 100).toFixed(1)}%`,
          severity: 'critical'
        });
      }
    }

    return alerts;
  }

  /**
   * Generate trend report
   */
  getTrendReport() {
    const oneHour = this.data.aggregates?.oneHour || {};
    const oneDay = this.data.aggregates?.oneDay || {};

    const hourTrend = oneHour.avgResponse > oneDay.avgResponse ? 'degrading' : 'improving';
    const hourVsDay = ((oneHour.avgResponse - oneDay.avgResponse) / oneDay.avgResponse * 100).toFixed(1);

    return {
      trend: hourTrend,
      hourVsDay: hourVsDay,
      currentAvg: oneHour.avgResponse,
      dailyAvg: oneDay.avgResponse,
      p95: oneHour.p95Response,
      successRate: (parseFloat(oneHour.successRate) * 100).toFixed(1),
      callsPerHour: oneHour.callCount
    };
  }

  /**
   * Load metrics from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('[MetricsPersistence] Load error:', err);
    }
    return { metrics: [], aggregates: {} };
  }

  /**
   * Save metrics to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (err) {
      console.error('[MetricsPersistence] Save error:', err);
      // If storage quota exceeded, remove oldest data
      if (this.data.metrics && this.data.metrics.length > 0) {
        this.data.metrics = this.data.metrics.slice(-Math.floor(this.maxDataPoints / 2));
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (err2) {
          console.error('[MetricsPersistence] Storage full, data lost');
        }
      }
    }
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics() {
    this.data = { metrics: [], aggregates: {} };
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Export metrics as CSV
   */
  exportAsCSV() {
    if (!this.data.metrics || this.data.metrics.length === 0) {
      return 'No metrics to export';
    }

    const headers = ['Timestamp', 'Endpoint', 'Response Time (ms)', 'Status', 'Date EST'];
    const rows = this.data.metrics.map(m => [
      m.timestamp,
      m.endpoint,
      m.responseTime,
      m.status,
      m.dateEST
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Get storage usage summary
   */
  getStorageSummary() {
    return {
      dataPoints: this.data.metrics ? this.data.metrics.length : 0,
      estimatedKB: (JSON.stringify(this.data).length / 1024).toFixed(2),
      oldestEntry: this.data.metrics && this.data.metrics.length > 0 
        ? new Date(this.data.metrics[0].timestamp).toLocaleString('en-US', { timeZone: 'America/New_York' })
        : 'N/A',
      newestEntry: this.data.metrics && this.data.metrics.length > 0
        ? new Date(this.data.metrics[this.data.metrics.length - 1].timestamp).toLocaleString('en-US', { timeZone: 'America/New_York' })
        : 'N/A'
    };
  }
}

// Global instance
window.metricsPersistence = new MetricsPersistence();
