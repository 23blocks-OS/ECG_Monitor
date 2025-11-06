/**
 * Alerts Manager
 *
 * Manages display of ECG alerts
 */

class AlertsManager {
    constructor(containerId = 'alerts-container') {
        this.container = document.getElementById(containerId);
    }

    updateAlerts(alertsData) {
        if (!alertsData || !alertsData.alerts || alertsData.alerts.length === 0) {
            this.container.innerHTML = '<p class="no-data">No alerts</p>';
            return;
        }

        this.container.innerHTML = '';

        alertsData.alerts.forEach(alert => {
            const alertElement = this.createAlertElement(alert);
            this.container.appendChild(alertElement);
        });
    }

    createAlertElement(alert) {
        const div = document.createElement('div');
        div.className = `alert-item severity-${alert.severity}`;

        const header = document.createElement('div');
        header.className = 'alert-header';

        const severity = document.createElement('span');
        severity.className = 'alert-severity';
        severity.style.color = this.getSeverityColor(alert.severity);
        severity.textContent = alert.severity.toUpperCase();

        const time = document.createElement('span');
        time.className = 'alert-time';
        time.textContent = this.formatTimestamp(alert.timestamp);

        header.appendChild(severity);
        header.appendChild(time);

        const summary = document.createElement('div');
        summary.className = 'alert-summary';
        summary.textContent = alert.summary || 'No summary available';

        div.appendChild(header);
        div.appendChild(summary);

        return div;
    }

    getSeverityColor(severity) {
        const colors = {
            'low': '#10b981',
            'medium': '#fbbf24',
            'high': '#f97316',
            'critical': '#ef4444'
        };
        return colors[severity] || '#6b7280';
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    }
}
