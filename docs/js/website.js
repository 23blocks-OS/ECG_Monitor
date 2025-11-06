/**
 * ECG Monitor Website - Interactive Features
 * Features: ECG animation, tab switching, copy buttons, scroll effects
 */

// ============================================
// ECG Waveform Animation
// ============================================

class ECGSimulator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.data = [];
        this.maxDataPoints = 400;
        this.animationId = null;

        // ECG parameters
        this.heartRate = 72;
        this.sampleRate = 250;
        this.time = 0;

        this.init();
    }

    init() {
        // Set canvas size
        this.canvas.style.width = '100%';
        this.canvas.style.height = 'auto';

        // Start animation
        this.animate();

        // Update heart rate randomly
        setInterval(() => {
            this.heartRate = 70 + Math.random() * 10;
            this.updateHRDisplay();
        }, 5000);
    }

    generateECGPoint(t) {
        // Generate realistic ECG waveform (PQRST complex)
        const cycleLength = 60 / this.heartRate; // seconds per beat
        const phase = (t % cycleLength) / cycleLength;

        let value = 0;

        // P wave (0.0 - 0.1)
        if (phase >= 0.0 && phase < 0.1) {
            value = 0.2 * Math.sin((phase - 0.0) / 0.1 * Math.PI);
        }

        // QRS complex (0.15 - 0.25)
        if (phase >= 0.15 && phase < 0.25) {
            const qrsPhase = (phase - 0.15) / 0.1;
            if (qrsPhase < 0.3) {
                // Q wave (small negative)
                value = -0.1 * Math.sin(qrsPhase / 0.3 * Math.PI);
            } else if (qrsPhase >= 0.3 && qrsPhase < 0.6) {
                // R wave (large positive)
                value = 1.0 * Math.sin((qrsPhase - 0.3) / 0.3 * Math.PI);
            } else {
                // S wave (negative)
                value = -0.2 * Math.sin((qrsPhase - 0.6) / 0.4 * Math.PI);
            }
        }

        // T wave (0.35 - 0.55)
        if (phase >= 0.35 && phase < 0.55) {
            value = 0.3 * Math.sin((phase - 0.35) / 0.2 * Math.PI);
        }

        // Add small noise
        value += (Math.random() - 0.5) * 0.02;

        return value;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#f9fafb';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        this.drawGrid();

        // Draw ECG waveform
        this.ctx.strokeStyle = '#6366f1';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const centerY = this.height / 2;
        const scale = this.height / 3;

        for (let i = 0; i < this.data.length; i++) {
            const x = (i / this.maxDataPoints) * this.width;
            const y = centerY - this.data[i] * scale;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#e5e7eb';
        this.ctx.lineWidth = 0.5;

        // Horizontal lines
        for (let y = 0; y < this.height; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Vertical lines
        for (let x = 0; x < this.width; x += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
    }

    animate() {
        // Generate new data point
        const newPoint = this.generateECGPoint(this.time);
        this.data.push(newPoint);

        // Remove old data points
        if (this.data.length > this.maxDataPoints) {
            this.data.shift();
        }

        // Increment time
        this.time += 1 / this.sampleRate;

        // Draw
        this.draw();

        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateHRDisplay() {
        const hrElement = document.getElementById('heroHR');
        if (hrElement) {
            hrElement.textContent = Math.round(this.heartRate);
        }

        // Update HRV randomly
        const hrvElement = document.getElementById('heroHRV');
        if (hrvElement) {
            const hrv = 40 + Math.random() * 15;
            hrvElement.textContent = Math.round(hrv);
        }
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// ============================================
// Navigation Scroll Effect
// ============================================

function initNavbar() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

// ============================================
// Tab Switching
// ============================================

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// ============================================
// Copy to Clipboard
// ============================================

function initCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const textToCopy = button.getAttribute('data-copy');

            try {
                await navigator.clipboard.writeText(textToCopy);

                // Visual feedback
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.classList.add('copied');

                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                button.textContent = 'Failed';

                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            }
        });
    });
}

// ============================================
// Smooth Scroll
// ============================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Don't prevent default for links that are just "#"
            if (href === '#' || !href) return;

            e.preventDefault();

            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar

                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// Intersection Observer for Animations
// ============================================

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards
    document.querySelectorAll('.feature-card, .doc-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(card);
    });
}

// ============================================
// Mobile Menu
// ============================================

function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');

    if (!menuBtn || !navLinks) return;

    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuBtn.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuBtn.classList.remove('active');
        });
    });
}

// ============================================
// Stats Counter Animation
// ============================================

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function initStatsAnimation() {
    const stats = document.querySelectorAll('.stat-value');
    let animated = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                stats.forEach(stat => {
                    const text = stat.textContent;
                    const match = text.match(/\d+/);
                    if (match) {
                        const endValue = parseInt(match[0]);
                        stat.textContent = '0';
                        setTimeout(() => {
                            animateValue(stat, 0, endValue, 1000);
                        }, 500);
                    }
                });
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observer.observe(heroStats);
    }
}

// ============================================
// Link Validation (for external links)
// ============================================

function initExternalLinks() {
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
}

// ============================================
// Keyboard Navigation
// ============================================

function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
        // ESC to close mobile menu
        if (e.key === 'Escape') {
            const navLinks = document.querySelector('.nav-links');
            const menuBtn = document.getElementById('mobileMenuBtn');
            if (navLinks && menuBtn) {
                navLinks.classList.remove('active');
                menuBtn.classList.remove('active');
            }
        }
    });
}

// ============================================
// Performance Monitoring
// ============================================

function logPerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`Page load time: ${pageLoadTime}ms`);
        });
    }
}

// ============================================
// Initialize Everything
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('ECG Monitor Website - Initializing...');

    // Initialize components
    initNavbar();
    initTabs();
    initCopyButtons();
    initSmoothScroll();
    initScrollAnimations();
    initMobileMenu();
    initStatsAnimation();
    initExternalLinks();
    initKeyboardNav();

    // Initialize ECG animation
    const ecgSimulator = new ECGSimulator('heroECG');

    // Performance logging (development only)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        logPerformance();
    }

    // Pause ECG animation when page is not visible (performance optimization)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && ecgSimulator) {
            ecgSimulator.stop();
        } else if (ecgSimulator) {
            ecgSimulator.animate();
        }
    });

    console.log('ECG Monitor Website - Ready!');
});

// ============================================
// Service Worker Registration (for PWA support)
// ============================================

if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}

// ============================================
// Analytics Placeholder
// ============================================

function trackEvent(category, action, label) {
    // Placeholder for analytics tracking
    // You can integrate Google Analytics, Plausible, or other analytics here
    console.log('Event:', category, action, label);
}

// Track button clicks
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-primary')) {
        trackEvent('Button', 'Click', 'Primary CTA');
    }
    if (e.target.classList.contains('github-link')) {
        trackEvent('Link', 'Click', 'GitHub');
    }
});

// ============================================
// Utility Functions
// ============================================

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Get scroll percentage
function getScrollPercentage() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return (scrollTop / (documentHeight - windowHeight)) * 100;
}
