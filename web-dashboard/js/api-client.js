/**
 * API Client for ECG Monitor
 *
 * Handles communication with backend API Gateway
 */

class APIClient {
    constructor(baseUrl) {
        // Get base URL from environment or use default
        this.baseUrl = baseUrl || this.getAPIBaseURL();
        console.log(`API Client initialized with base URL: ${this.baseUrl}`);
    }

    getAPIBaseURL() {
        // Try to get from window config (set during deployment)
        if (window.ECG_API_URL) {
            return window.ECG_API_URL;
        }

        // For local development, use mock data
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.warn('Running in local mode - will use mock data');
            return null;
        }

        // Try to get from data attribute
        const apiUrl = document.body.getAttribute('data-api-url');
        if (apiUrl) {
            return apiUrl;
        }

        console.warn('API URL not configured - will use mock data');
        return null;
    }

    async fetchLiveData(deviceId = 'ecg-device-001') {
        try {
            if (!this.baseUrl) {
                return this.getMockLiveData();
            }

            const response = await fetch(`${this.baseUrl}/api/live?device_id=${deviceId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error fetching live data:', error);
            return this.getMockLiveData();
        }
    }

    async fetchAlerts(deviceId = 'ecg-device-001', hours = 24) {
        try {
            if (!this.baseUrl) {
                return this.getMockAlerts();
            }

            const response = await fetch(`${this.baseUrl}/api/alerts?device_id=${deviceId}&hours=${hours}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error fetching alerts:', error);
            return this.getMockAlerts();
        }
    }

    async fetchHistory(deviceId = 'ecg-device-001', startTime, endTime) {
        try {
            if (!this.baseUrl) {
                return this.getMockHistory();
            }

            let url = `${this.baseUrl}/api/history?device_id=${deviceId}`;
            if (startTime) url += `&start=${startTime}`;
            if (endTime) url += `&end=${endTime}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error fetching history:', error);
            return this.getMockHistory();
        }
    }

    // Mock data for development/testing
    getMockLiveData() {
        return {
            device_id: 'ecg-device-001',
            timestamp: Date.now(),
            status: 'active',
            metrics: {
                heart_rate_bpm: 72 + Math.floor(Math.random() * 10 - 5),
                hrv_rmssd: 42.5 + Math.random() * 10 - 5,
                signal_quality: 0.85 + Math.random() * 0.15
            },
            waveform: this.generateMockWaveform()
        };
    }

    getMockAlerts() {
        return {
            device_id: 'ecg-device-001',
            alerts: [
                {
                    alert_id: '1',
                    timestamp: Date.now() - 3600000,
                    severity: 'medium',
                    summary: 'Occasional premature ventricular contractions detected during rest period.'
                },
                {
                    alert_id: '2',
                    timestamp: Date.now() - 7200000,
                    severity: 'low',
                    summary: 'Heart rate slightly elevated, possibly due to physical activity.'
                }
            ],
            count: 2
        };
    }

    getMockHistory() {
        const history = [];
        const now = Date.now();
        for (let i = 0; i < 60; i++) {
            history.push({
                timestamp: now - (60 - i) * 60000,
                heart_rate_bpm: 70 + Math.floor(Math.random() * 20 - 10),
                hrv_rmssd: 40 + Math.random() * 20 - 10,
                signal_quality: 0.8 + Math.random() * 0.2,
                severity: 'low'
            });
        }
        return {
            device_id: 'ecg-device-001',
            history,
            count: history.length
        };
    }

    generateMockWaveform() {
        const points = 100;
        const waveform = {
            channel_1: [],
            channel_2: [],
            channel_3: []
        };

        for (let i = 0; i < points; i++) {
            const t = i / points;
            // Simulate ECG waveform
            const val1 = Math.sin(t * 12 * Math.PI) * 100 + Math.sin(t * 120 * Math.PI) * 20;
            const val2 = Math.sin(t * 12 * Math.PI + 0.5) * 90 + Math.sin(t * 120 * Math.PI) * 15;
            const val3 = Math.sin(t * 12 * Math.PI + 1.0) * 95 + Math.sin(t * 120 * Math.PI) * 18;

            waveform.channel_1.push(Math.round(val1));
            waveform.channel_2.push(Math.round(val2));
            waveform.channel_3.push(Math.round(val3));
        }

        return waveform;
    }
}
