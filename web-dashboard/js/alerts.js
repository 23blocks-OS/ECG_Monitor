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
            this.container.innerHTML = '<p class="text-center text-gray-500 py-12">No alerts</p>';
            return;
        }

        this.container.innerHTML = '';

        alertsData.alerts.forEach((alert, index) => {
            const alertElement = this.createAlertElement(alert);
            this.container.appendChild(alertElement);

            // Animate alert appearance with delay
            if (window.animationController) {
                setTimeout(() => {
                    window.animationController.animateAlert(alertElement);
                }, index * 100);
            }
        });
    }

    createAlertElement(alert) {
        const div = document.createElement('div');

        // Tailwind classes with glassmorphism effect
        const severityClasses = this.getSeverityClasses(alert.severity);
        div.className = `alert-item severity-${alert.severity} bg-white/5 backdrop-blur-md rounded-2xl p-5 border-l-4 ${severityClasses.border} hover:bg-white/10 transition-all duration-300 cursor-pointer`;

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-3';

        const severityBadge = document.createElement('div');
        severityBadge.className = `flex items-center gap-2`;

        const severityIcon = document.createElement('div');
        severityIcon.className = `w-8 h-8 rounded-lg ${severityClasses.bg} flex items-center justify-center`;
        severityIcon.innerHTML = this.getSeverityIcon(alert.severity);

        const severity = document.createElement('span');
        severity.className = `font-bold text-sm ${severityClasses.text} uppercase tracking-wider`;
        severity.textContent = alert.severity;

        severityBadge.appendChild(severityIcon);
        severityBadge.appendChild(severity);

        const time = document.createElement('span');
        time.className = 'text-xs text-gray-400 font-medium';
        time.textContent = this.formatTimestamp(alert.timestamp);

        header.appendChild(severityBadge);
        header.appendChild(time);

        const summary = document.createElement('div');
        summary.className = 'text-gray-200 leading-relaxed text-sm';
        summary.textContent = alert.summary || 'No summary available';

        div.appendChild(header);
        div.appendChild(summary);

        // Add click ripple effect
        div.addEventListener('click', (e) => {
            if (window.animationController) {
                window.animationController.createRipple(e, div);
            }
        });

        return div;
    }

    getSeverityClasses(severity) {
        const classes = {
            'low': {
                border: 'border-green-500',
                bg: 'bg-gradient-to-br from-green-500 to-emerald-500',
                text: 'text-green-400'
            },
            'medium': {
                border: 'border-yellow-500',
                bg: 'bg-gradient-to-br from-yellow-500 to-amber-500',
                text: 'text-yellow-400'
            },
            'high': {
                border: 'border-orange-500',
                bg: 'bg-gradient-to-br from-orange-500 to-red-500',
                text: 'text-orange-400'
            },
            'critical': {
                border: 'border-red-500',
                bg: 'bg-gradient-to-br from-red-500 to-pink-500',
                text: 'text-red-400'
            }
        };
        return classes[severity] || {
            border: 'border-gray-500',
            bg: 'bg-gray-500',
            text: 'text-gray-400'
        };
    }

    getSeverityIcon(severity) {
        const icons = {
            'low': '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'medium': '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
            'high': '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'critical': '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
        };
        return icons[severity] || icons['low'];
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
