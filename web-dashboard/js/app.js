/**
 * Main Application
 *
 * Coordinates all dashboard components
 */

class ECGDashboardApp {
    constructor() {
        this.apiClient = new APIClient();
        this.chartManager = new ECGChartManager();
        this.alertsManager = new AlertsManager();

        this.updateInterval = 5000; // 5 seconds
        this.isRunning = false;
    }

    async start() {
        console.log('Starting ECG Dashboard...');
        this.isRunning = true;

        // Initial update
        await this.updateDashboard();

        // Periodic updates
        this.intervalId = setInterval(() => {
            if (this.isRunning) {
                this.updateDashboard();
            }
        }, this.updateInterval);

        console.log('Dashboard started');
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        console.log('Dashboard stopped');
    }

    async updateDashboard() {
        try {
            // Fetch live data
            const liveData = await this.apiClient.fetchLiveData();
            this.updateMetrics(liveData);
            this.updateCharts(liveData);
            this.updateConnectionStatus(true);

            // Fetch alerts (less frequently)
            if (!this.lastAlertUpdate || Date.now() - this.lastAlertUpdate > 60000) {
                const alertsData = await this.apiClient.fetchAlerts();
                this.alertsManager.updateAlerts(alertsData);
                this.lastAlertUpdate = Date.now();
            }

            // Update timestamp
            this.updateTimestamp();

        } catch (error) {
            console.error('Error updating dashboard:', error);
            this.updateConnectionStatus(false);
        }
    }

    updateMetrics(data) {
        if (!data || !data.metrics) return;

        const metrics = data.metrics;

        // Heart Rate
        const hrElement = document.getElementById('heart-rate');
        hrElement.textContent = metrics.heart_rate_bpm || '--';
        this.animateValue(hrElement);

        // HRV
        const hrvElement = document.getElementById('hrv-rmssd');
        hrvElement.textContent = metrics.hrv_rmssd ? metrics.hrv_rmssd.toFixed(1) : '--';

        // Signal Quality
        const qualityElement = document.getElementById('signal-quality');
        const qualityPercent = metrics.signal_quality ? Math.round(metrics.signal_quality * 100) : 0;
        qualityElement.textContent = qualityPercent;

        // Device Status
        const statusElement = document.getElementById('device-status');
        statusElement.textContent = data.status || 'Unknown';
        statusElement.className = 'metric-value status-text';
        if (data.status === 'active') {
            statusElement.style.color = '#10b981';
        }
    }

    updateCharts(data) {
        if (!data || !data.waveform) return;
        this.chartManager.updateCharts(data.waveform);
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connection-status');
        const text = document.getElementById('connection-text');

        if (connected) {
            text.textContent = 'Connected';
            text.classList.add('text-green-400');
            text.classList.remove('text-red-400');
        } else {
            text.textContent = 'Disconnected';
            text.classList.add('text-red-400');
            text.classList.remove('text-green-400');
        }

        // Trigger animation if available
        if (window.animationController) {
            window.animationController.pulseStatusIndicator(connected);
        }
    }

    updateTimestamp() {
        const element = document.getElementById('last-updated');
        const now = new Date();
        element.textContent = now.toLocaleTimeString();
    }

    animateValue(element) {
        // GSAP handles this now via mutation observer in animations.js
        // Keeping this method for backward compatibility
        if (typeof gsap !== 'undefined') {
            // Animation handled by AnimationController
            return;
        }

        // Fallback animation if GSAP not loaded
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
        element.style.transition = 'transform 0.2s';
    }
}

// Initialize and start the app
let app;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard...');
    app = new ECGDashboardApp();
    app.start();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden, pausing updates');
        if (app) app.stop();
    } else {
        console.log('Page visible, resuming updates');
        if (app) app.start();
    }
});
