/**
 * GSAP Animations & Effects
 *
 * Handles all sophisticated animations, particle effects, and micro-interactions
 */

class AnimationController {
    constructor() {
        this.particles = [];
        this.particleCount = 50;
        this.animationTimeline = null;
    }

    /**
     * Initialize all animations on page load
     */
    init() {
        // Wait for DOM and GSAP to be ready
        if (typeof gsap === 'undefined') {
            console.warn('GSAP not loaded yet, retrying...');
            setTimeout(() => this.init(), 100);
            return;
        }

        console.log('Initializing animations...');

        // Register GSAP plugins
        gsap.registerPlugin(ScrollTrigger);

        // Initialize effects
        this.createParticles();
        this.animatePageLoad();
        this.setupMetricAnimations();
        this.setupHoverEffects();
        this.animateBackground();

        console.log('Animations initialized');
    }

    /**
     * Create animated particle background
     */
    createParticles() {
        const container = document.getElementById('particles-container');
        if (!container) return;

        for (let i = 0; i < this.particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Random size between 2-6px
            const size = Math.random() * 4 + 2;

            // Random position
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;

            // Random color (purple, cyan, or pink)
            const colors = ['#8b5cf6', '#06b6d4', '#ec4899'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                left: ${x}px;
                top: ${y}px;
                opacity: ${Math.random() * 0.5 + 0.2};
                pointer-events: none;
            `;

            container.appendChild(particle);
            this.particles.push(particle);

            // Animate each particle
            gsap.to(particle, {
                x: `+=${Math.random() * 200 - 100}`,
                y: `+=${Math.random() * 200 - 100}`,
                opacity: Math.random() * 0.8,
                duration: Math.random() * 10 + 5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }
    }

    /**
     * Animate elements on page load
     */
    animatePageLoad() {
        // Create master timeline
        const tl = gsap.timeline({
            defaults: { ease: 'power3.out' }
        });

        // Animate header
        tl.to('#header', {
            opacity: 1,
            y: 0,
            duration: 0.8,
        });

        // Animate metric cards in sequence
        const metricCards = document.querySelectorAll('.metric-card');
        tl.to(metricCards, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
        }, '-=0.4');

        // Animate charts section
        tl.to('#charts-section', {
            opacity: 1,
            y: 0,
            duration: 0.8,
        }, '-=0.3');

        // Animate alerts section
        tl.to('#alerts-section', {
            opacity: 1,
            y: 0,
            duration: 0.8,
        }, '-=0.5');

        // Animate footer
        tl.to('#footer', {
            opacity: 1,
            y: 0,
            duration: 0.6,
        }, '-=0.4');
    }

    /**
     * Setup metric value update animations
     */
    setupMetricAnimations() {
        // Store original animateValue method
        const heartRateElement = document.getElementById('heart-rate');
        const hrvElement = document.getElementById('hrv-rmssd');
        const qualityElement = document.getElementById('signal-quality');

        // Create observer for value changes
        const observeElement = (element, callback) => {
            if (!element) return;

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'characterData' || mutation.type === 'childList') {
                        callback();
                    }
                });
            });

            observer.observe(element, {
                characterData: true,
                childList: true,
                subtree: true
            });
        };

        // Animate on value change
        const animateValueChange = (element) => {
            gsap.fromTo(element,
                {
                    scale: 1.2,
                    opacity: 0.6,
                },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.5,
                    ease: 'back.out(1.7)',
                }
            );

            // Add glow effect
            gsap.to(element.parentElement, {
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
                duration: 0.3,
                yoyo: true,
                repeat: 1,
            });
        };

        observeElement(heartRateElement, () => animateValueChange(heartRateElement));
        observeElement(hrvElement, () => animateValueChange(hrvElement));
        observeElement(qualityElement, () => animateValueChange(qualityElement));
    }

    /**
     * Setup hover effects for interactive elements
     */
    setupHoverEffects() {
        // Metric cards hover
        const metricCards = document.querySelectorAll('.metric-card');
        metricCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    y: -10,
                    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
                    duration: 0.3,
                    ease: 'power2.out',
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    y: 0,
                    boxShadow: '0 0 0 rgba(139, 92, 246, 0)',
                    duration: 0.3,
                    ease: 'power2.out',
                });
            });
        });

        // Chart containers hover
        const chartContainers = document.querySelectorAll('.ecg-chart-container');
        chartContainers.forEach(container => {
            container.addEventListener('mouseenter', () => {
                gsap.to(container, {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    duration: 0.3,
                });
            });

            container.addEventListener('mouseleave', () => {
                gsap.to(container, {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    duration: 0.3,
                });
            });
        });

        // Button hover effects
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    scale: 1.05,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    duration: 0.2,
                });
            });

            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    scale: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    duration: 0.2,
                });
            });
        });
    }

    /**
     * Animate the gradient background
     */
    animateBackground() {
        const body = document.body;

        gsap.to(body, {
            backgroundPosition: '200% 200%',
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });
    }

    /**
     * Pulse animation for status indicators
     */
    pulseStatusIndicator(isConnected) {
        const statusElement = document.querySelector('#connection-status');
        if (!statusElement) return;

        if (isConnected) {
            // Green pulse for connected
            const pingElement = statusElement.querySelector('.animate-ping');
            const dotElement = statusElement.querySelector('.bg-red-500, .bg-green-500');

            if (pingElement) {
                pingElement.classList.remove('bg-red-400');
                pingElement.classList.add('bg-green-400');
            }

            if (dotElement) {
                dotElement.classList.remove('bg-red-500');
                dotElement.classList.add('bg-green-500');
            }

            // Celebration animation
            gsap.to(statusElement, {
                scale: 1.2,
                duration: 0.3,
                yoyo: true,
                repeat: 1,
                ease: 'back.out(2)',
            });
        } else {
            // Red pulse for disconnected
            const pingElement = statusElement.querySelector('.animate-ping');
            const dotElement = statusElement.querySelector('.bg-red-500, .bg-green-500');

            if (pingElement) {
                pingElement.classList.remove('bg-green-400');
                pingElement.classList.add('bg-red-400');
            }

            if (dotElement) {
                dotElement.classList.remove('bg-green-500');
                dotElement.classList.add('bg-red-500');
            }
        }
    }

    /**
     * Animate alert appearance
     */
    animateAlert(alertElement) {
        gsap.fromTo(alertElement,
            {
                x: -100,
                opacity: 0,
            },
            {
                x: 0,
                opacity: 1,
                duration: 0.6,
                ease: 'back.out(1.5)',
            }
        );

        // Add attention-grabbing effect for high severity alerts
        if (alertElement.classList.contains('severity-critical') ||
            alertElement.classList.contains('severity-high')) {
            gsap.to(alertElement, {
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                duration: 0.5,
                yoyo: true,
                repeat: 3,
            });
        }
    }

    /**
     * Create ripple effect on click
     */
    createRipple(event, element) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();

        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            transform: scale(0);
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        gsap.to(ripple, {
            scale: 2,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => ripple.remove(),
        });
    }

    /**
     * Number counter animation
     */
    animateNumber(element, start, end, duration = 1) {
        const obj = { value: start };

        gsap.to(obj, {
            value: end,
            duration: duration,
            ease: 'power2.out',
            onUpdate: () => {
                const value = Math.round(obj.value);
                element.textContent = value;
            },
        });
    }

    /**
     * Cleanup animations
     */
    destroy() {
        if (this.animationTimeline) {
            this.animationTimeline.kill();
        }

        // Remove particles
        this.particles.forEach(particle => particle.remove());
        this.particles = [];

        // Kill all GSAP animations
        gsap.killTweensOf('*');

        console.log('Animations destroyed');
    }
}

// Create global animation controller instance
const animationController = new AnimationController();

// Initialize animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        animationController.init();
    });
} else {
    animationController.init();
}

// Make available globally for other scripts
window.animationController = animationController;
