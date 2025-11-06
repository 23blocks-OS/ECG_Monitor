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
            {
                border: 'rgb(168, 85, 247)',    // Purple
                gradient: ['rgba(168, 85, 247, 0.4)', 'rgba(168, 85, 247, 0.01)']
            },
            {
                border: 'rgb(6, 182, 212)',      // Cyan
                gradient: ['rgba(6, 182, 212, 0.4)', 'rgba(6, 182, 212, 0.01)']
            },
            {
                border: 'rgb(236, 72, 153)',     // Pink
                gradient: ['rgba(236, 72, 153, 0.4)', 'rgba(236, 72, 153, 0.01)']
            }
        ];

        channels.forEach((channel, index) => {
            const canvas = document.getElementById(`ecg-chart-${channel}`);
            const ctx = canvas.getContext('2d');

            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, colors[index].gradient[0]);
            gradient.addColorStop(1, colors[index].gradient[1]);

            this.charts[`channel_${channel}`] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 100}, (_, i) => i),
                    datasets: [{
                        label: `Lead ${['I', 'II', 'III'][index]}`,
                        data: Array(100).fill(0),
                        borderColor: colors[index].border,
                        backgroundColor: gradient,
                        borderWidth: 2.5,
                        tension: 0.3,
                        pointRadius: 0,
                        fill: true,
                        cubicInterpolationMode: 'monotone'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 0 // Disable animation for real-time feel
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    scales: {
                        x: {
                            display: false,
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            display: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.06)',
                                drawBorder: false,
                                lineWidth: 1
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.4)',
                                font: {
                                    size: 10
                                },
                                maxTicksLimit: 5
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
