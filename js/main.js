// AI Agent Academy - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupHeroAnimations();
    setupCourseTabs();
    setupPlayground();
    setupExampleFilters();
    setupScrollAnimations();
    setupAgentDiagram();
    setupProgressBars();
}

// Navigation
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Close mobile menu if open
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Change navbar background on scroll
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    });
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const offsetTop = element.offsetTop - 70; // Account for fixed navbar
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Hero Section Animations
function setupHeroAnimations() {
    const heroContent = document.querySelector('.hero-content');
    const heroVisual = document.querySelector('.hero-visual');
    
    // Animate hero content on load
    setTimeout(() => {
        if (heroContent) {
            heroContent.style.animation = 'fadeInLeft 1s ease forwards';
        }
        if (heroVisual) {
            heroVisual.style.animation = 'fadeInUp 1s ease 0.3s forwards';
        }
    }, 500);

    // Animate statistics counter
    animateCounters();
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/[^0-9]/g, ''));
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.textContent = counter.textContent.replace(/\d+/, target.toLocaleString());
                clearInterval(timer);
            } else {
                counter.textContent = counter.textContent.replace(/\d+/, Math.floor(current).toLocaleString());
            }
        }, 50);
    });
}

// Course Tabs
function setupCourseTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Animate course cards
            animateCourseCards(targetTab);
        });
    });
}

function animateCourseCards(tabId) {
    const activeTab = document.getElementById(tabId);
    const courseCards = activeTab.querySelectorAll('.course-card');
    
    courseCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function startCourse(courseId) {
    showNotification(`Starting course: ${courseId}`, 'success');
    
    // Simulate course start
    setTimeout(() => {
        showNotification('Course environment ready!', 'info');
        // Here you would redirect to the actual course page
    }, 2000);
}

// Interactive Playground
function setupPlayground() {
    const agentTypeSelect = document.getElementById('agent-type');
    const environmentSelect = document.getElementById('environment');
    const userInput = document.getElementById('user-input');
    const logOutput = document.getElementById('log-output');
    
    // Initialize playground state
    let currentAgent = 'reactive';
    let currentEnvironment = 'gridworld';
    let isRunning = false;
    let messageCounter = 0;

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUserInput(e);
            }
        });
    }
}

function updateAgentConfig() {
    const agentType = document.getElementById('agent-type').value;
    const thoughtBubble = document.getElementById('agent-thoughts');
    
    const agentThoughts = {
        'reactive': 'I respond directly to stimuli in my environment...',
        'deliberative': 'Let me plan my actions carefully...',
        'hybrid': 'I combine reactive and deliberative approaches...',
        'multi-agent': 'We coordinate as a team to solve problems...'
    };
    
    if (thoughtBubble) {
        thoughtBubble.textContent = agentThoughts[agentType];
    }
    
    // Animate agent avatar
    const agentAvatar = document.querySelector('.agent-avatar');
    if (agentAvatar) {
        agentAvatar.style.transform = 'scale(1.1)';
        setTimeout(() => {
            agentAvatar.style.transform = 'scale(1)';
        }, 300);
    }
}

function updateEnvironment() {
    const environment = document.getElementById('environment').value;
    addLogEntry('system', `Environment changed to: ${environment}`);
}

function runAgent() {
    const agentType = document.getElementById('agent-type').value;
    const environment = document.getElementById('environment').value;
    
    addLogEntry('system', `Starting ${agentType} agent in ${environment} environment...`);
    
    // Simulate agent initialization
    setTimeout(() => {
        addLogEntry('agent', 'Agent initialized successfully');
        addLogEntry('agent', 'Ready for instructions');
        
        // Update agent thoughts
        const thoughtBubble = document.getElementById('agent-thoughts');
        if (thoughtBubble) {
            thoughtBubble.textContent = 'I am ready to help! Give me a task to work on.';
        }
        
        showNotification('Agent is now running!', 'success');
    }, 1500);
}

function resetPlayground() {
    const logOutput = document.getElementById('log-output');
    const thoughtBubble = document.getElementById('agent-thoughts');
    const userInput = document.getElementById('user-input');
    
    if (logOutput) {
        logOutput.innerHTML = `
            <div class="log-entry system">
                <span class="timestamp">[00:00:00]</span>
                <span class="message">System: Agent initialized and ready</span>
            </div>
        `;
    }
    
    if (thoughtBubble) {
        thoughtBubble.textContent = 'Agent is ready to start...';
    }
    
    if (userInput) {
        userInput.value = '';
    }
    
    showNotification('Playground reset', 'info');
}

function handleUserInput(event) {
    if (event && event.key !== 'Enter') return;
    
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (!message) return;
    
    addLogEntry('user', message);
    userInput.value = '';
    
    // Simulate agent processing
    setTimeout(() => {
        addLogEntry('agent', 'Processing your request...');
        
        setTimeout(() => {
            const responses = [
                'I understand your request. Let me work on that.',
                'I\'ll analyze the available options and provide recommendations.',
                'Processing complete. Here are my findings...',
                'Task completed successfully!',
                'I need more information to proceed. Could you clarify?'
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            addLogEntry('agent', response);
            
            // Update thought bubble
            const thoughtBubble = document.getElementById('agent-thoughts');
            if (thoughtBubble) {
                thoughtBubble.textContent = 'Thinking about your request...';
            }
        }, 2000);
    }, 500);
}

function sendMessage() {
    handleUserInput();
}

function addLogEntry(type, message) {
    const logOutput = document.getElementById('log-output');
    if (!logOutput) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        <span class="message">${type.charAt(0).toUpperCase() + type.slice(1)}: ${message}</span>
    `;
    
    logOutput.appendChild(entry);
    logOutput.scrollTop = logOutput.scrollHeight;
}

// Agent Diagram Animation
function setupAgentDiagram() {
    const agentNodes = document.querySelectorAll('.agent-node');
    let currentNode = 0;
    
    if (agentNodes.length === 0) return;
    
    function animateAgentCycle() {
        // Remove active class from all nodes
        agentNodes.forEach(node => node.classList.remove('active'));
        
        // Add active class to current node
        agentNodes[currentNode].classList.add('active');
        
        // Move to next node
        currentNode = (currentNode + 1) % agentNodes.length;
    }
    
    // Start animation
    setInterval(animateAgentCycle, 2000);
}

// Example Filters
function setupExampleFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const exampleCards = document.querySelectorAll('.example-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Update active filter button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter examples
            exampleCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.5s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

function viewExample(exampleId) {
    showNotification(`Loading example: ${exampleId}`, 'info');
    
    // Simulate loading example code
    setTimeout(() => {
        showNotification('Example code loaded!', 'success');
        // Here you would open a modal or redirect to example page
    }, 1500);
}

function runExample(exampleId) {
    showNotification(`Running example: ${exampleId}`, 'info');
    
    // Simulate running example
    setTimeout(() => {
        showNotification('Example is now running in sandbox!', 'success');
        // Here you would open the live example
    }, 2000);
}

// Tutorial Functions
function openTutorial(tutorialId) {
    showNotification(`Opening tutorial: ${tutorialId}`, 'info');
    
    // Simulate tutorial loading
    setTimeout(() => {
        showNotification('Tutorial environment ready!', 'success');
        // Here you would redirect to tutorial page
    }, 1500);
}

// Progress Bar Animations
function setupProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const width = progressBar.style.width || '0%';
                progressBar.style.width = '0%';
                
                setTimeout(() => {
                    progressBar.style.transition = 'width 2s ease';
                    progressBar.style.width = width;
                }, 200);
            }
        });
    });
    
    progressBars.forEach(bar => observer.observe(bar));
}

// Scroll Animations
function setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('.feature-card, .course-card, .example-card, .tutorial-item, .community-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-on-scroll');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 90px;
                right: 20px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                padding: 15px 20px;
                color: #fff;
                z-index: 10000;
                min-width: 300px;
                animation: slideInRight 0.3s ease;
            }
            
            .notification.success {
                border-color: rgba(0, 212, 255, 0.5);
                background: rgba(0, 212, 255, 0.1);
            }
            
            .notification.error {
                border-color: rgba(255, 107, 157, 0.5);
                background: rgba(255, 107, 157, 0.1);
            }
            
            .notification.info {
                border-color: rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.1);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .notification-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Utility Functions
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

function throttle(func, delay) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, delay);
        }
    };
}

// Performance optimizations
const debouncedResize = debounce(() => {
    // Handle resize events
    setupAgentDiagram();
}, 250);

window.addEventListener('resize', debouncedResize);

// Smooth scrolling for all internal links
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        scrollToSection(targetId);
    }
});

// Add loading states to buttons
document.addEventListener('click', (e) => {
    if (e.target.matches('.btn-primary, .btn-secondary, .btn-course')) {
        const originalText = e.target.textContent;
        e.target.innerHTML = '<div class="loading-spinner"></div>';
        e.target.disabled = true;
        
        setTimeout(() => {
            e.target.textContent = originalText;
            e.target.disabled = false;
        }, 2000);
    }
});

// Enhanced interaction feedback
document.addEventListener('mouseenter', (e) => {
    if (e.target.matches('.course-card, .example-card, .feature-card, .community-card')) {
        e.target.style.transform = 'translateY(-5px) scale(1.02)';
    }
}, true);

document.addEventListener('mouseleave', (e) => {
    if (e.target.matches('.course-card, .example-card, .feature-card, .community-card')) {
        e.target.style.transform = '';
    }
}, true);

// Add click ripple effect
function createRipple(e) {
    const button = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${e.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');
    
    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
        ripple.remove();
    }
    
    button.appendChild(circle);
}

// Add ripple effect styles
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 600ms linear;
        background-color: rgba(255, 255, 255, 0.7);
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Add ripple to all buttons
document.addEventListener('click', (e) => {
    if (e.target.matches('.btn')) {
        createRipple(e);
    }
});

console.log('🤖 AI Agent Academy loaded successfully!');