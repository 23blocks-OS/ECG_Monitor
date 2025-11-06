/**
 * ECG Chart Manager
 *
 * Manages Chart.js charts for ECG waveforms
 */

class ECGChartManager {
    constructor() {
        this.charts = {};
        this.initializeCharts();
    }

    initializeCharts() {
        const channels = ['1', '2', '3'];
        const colors = [
            'rgb(239, 68, 68)',   // Red
            'rgb(59, 130, 246)',  // Blue
            'rgb(34, 197, 94)'    // Green
        ];

        channels.forEach((channel, index) => {
            const ctx = document.getElementById(`ecg-chart-${channel}`).getContext('2d');

            this.charts[`channel_${channel}`] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 100}, (_, i) => i),
                    datasets: [{
                        label: `Lead ${['I', 'II', 'III'][index]}`,
                        data: Array(100).fill(0),
                        borderColor: colors[index],
                        backgroundColor: colors[index].replace('rgb', 'rgba').replace(')', ', 0.1)'),
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 0 // Disable animation for real-time feel
                    },
                    scales: {
                        x: {
                            display: false
                        },
                        y: {
                            display: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        }
                    }
                }
            });
        });

        console.log('ECG charts initialized');
    }

    updateCharts(waveformData) {
        if (!waveformData) return;

        Object.keys(waveformData).forEach(channel => {
            const chart = this.charts[channel];
            if (chart && waveformData[channel]) {
                chart.data.datasets[0].data = waveformData[channel];
                chart.update('none'); // Update without animation
            }
        });
    }

    destroy() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
    }
}
