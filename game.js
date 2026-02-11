// AI Agent Academy Game Logic
class AIAgentAcademy {
    constructor() {
        this.gameState = {
            computeCredits: 1000,
            agentsBuilt: 0,
            level: 1,
            builtAgents: [],
            currentAgent: {
                components: [],
                compiled: false,
                trained: false
            }
        };
        
        this.placedComponents = [];
        this.isTraining = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
        this.setupDragAndDrop();
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const section = e.target.onclick.toString().match(/showSection\('(.+?)'\)/)?.[1];
                if (section) this.showSection(section);
            });
        });
        
        // Training controls
        const learningRateSlider = document.getElementById('learning-rate');
        const batchSizeSlider = document.getElementById('batch-size');
        
        if (learningRateSlider) {
            learningRateSlider.addEventListener('input', (e) => {
                document.getElementById('lr-value').textContent = e.target.value;
            });
        }
        
        if (batchSizeSlider) {
            batchSizeSlider.addEventListener('input', (e) => {
                document.getElementById('batch-value').textContent = e.target.value;
            });
        }
    }
    
    setupDragAndDrop() {
        const components = document.querySelectorAll('.component');
        const canvas = document.getElementById('agent-canvas');
        
        if (!canvas) return;
        
        components.forEach(component => {
            component.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', component.dataset.type);
                e.dataTransfer.setData('text/html', component.innerHTML);
            });
        });
        
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvas.style.backgroundColor = '#f0f8ff';
        });
        
        canvas.addEventListener('dragleave', () => {
            canvas.style.backgroundColor = 'white';
        });
        
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.style.backgroundColor = 'white';
            
            const componentType = e.dataTransfer.getData('text/plain');
            const componentHTML = e.dataTransfer.getData('text/html');
            
            if (componentType) {
                this.addComponentToCanvas(componentType, componentHTML, e.offsetX, e.offsetY);
            }
        });
    }
    
    addComponentToCanvas(type, html, x, y) {
        const canvas = document.getElementById('agent-canvas');
        const component = document.createElement('div');
        component.className = 'placed-component';
        component.innerHTML = html.replace('<br><small>', '<br><small>');
        component.style.left = Math.max(0, Math.min(x - 50, canvas.offsetWidth - 120)) + 'px';
        component.style.top = Math.max(30, Math.min(y - 20, canvas.offsetHeight - 60)) + 'px';
        component.dataset.type = type;
        
        // Add remove functionality
        component.addEventListener('dblclick', () => {
            component.remove();
            this.updateCurrentAgent();
        });
        
        canvas.appendChild(component);
        
        this.updateCurrentAgent();
        this.logMessage(`Added ${type} layer to your agent`);
    }
    
    updateCurrentAgent() {
        const placedComponents = document.querySelectorAll('.placed-component');
        this.gameState.currentAgent.components = Array.from(placedComponents).map(comp => ({
            type: comp.dataset.type,
            x: parseInt(comp.style.left),
            y: parseInt(comp.style.top)
        }));
        
        this.gameState.currentAgent.compiled = false;
        this.gameState.currentAgent.trained = false;
        
        // Hide summary if components changed
        const summary = document.getElementById('agent-summary');
        if (summary) summary.style.display = 'none';
    }
    
    showSection(sectionId) {
        // Update nav buttons
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }
    
    compileAgent() {
        const components = this.gameState.currentAgent.components;
        
        if (components.length === 0) {
            alert('Please add some components to your agent first!');
            return;
        }
        
        // Check for required components
        const hasInput = components.some(c => c.type === 'input');
        const hasOutput = components.some(c => c.type === 'output');
        
        if (!hasInput || !hasOutput) {
            alert('Your agent needs at least an Input Layer and an Output Layer!');
            return;
        }
        
        // Compile successful
        this.gameState.currentAgent.compiled = true;
        
        // Show summary
        this.showAgentSummary();
        this.logMessage('✅ Agent compiled successfully!');
        
        // Award credits for compilation
        this.addCredits(50);
        this.logMessage('+50 credits for compiling an agent!');
    }
    
    showAgentSummary() {
        const summary = document.getElementById('agent-summary');
        const content = document.getElementById('summary-content');
        
        if (!summary || !content) return;
        
        const components = this.gameState.currentAgent.components;
        let summaryHTML = '<ul>';
        
        components.forEach((comp, index) => {
            const names = {
                input: '📥 Input Layer',
                dense: '🧠 Dense Layer',
                conv: '🔍 Convolutional Layer',
                dropout: '🎯 Dropout Layer',
                output: '📤 Output Layer'
            };
            summaryHTML += `<li>${names[comp.type] || comp.type}</li>`;
        });
        
        summaryHTML += '</ul>';
        summaryHTML += `<p><strong>Total Parameters:</strong> ~${this.calculateParameters(components).toLocaleString()}</p>`;
        summaryHTML += `<p><strong>Estimated Training Cost:</strong> ${this.calculateTrainingCost(components)} credits</p>`;
        
        content.innerHTML = summaryHTML;
        summary.style.display = 'block';
    }
    
    calculateParameters(components) {
        // Simplified parameter calculation
        let params = 0;
        components.forEach(comp => {
            switch(comp.type) {
                case 'input': params += 784; break; // 28x28 input
                case 'dense': params += 128 * 64; break; // example dense layer
                case 'conv': params += 32 * 3 * 3; break; // example conv layer
                case 'output': params += 64 * 10; break; // 10 output classes
            }
        });
        return Math.max(1000, params);
    }
    
    calculateTrainingCost(components) {
        return Math.max(100, components.length * 50);
    }
    
    clearCanvas() {
        const canvas = document.getElementById('agent-canvas');
        if (!canvas) return;
        
        // Remove all placed components
        canvas.querySelectorAll('.placed-component').forEach(comp => comp.remove());
        
        // Reset current agent
        this.gameState.currentAgent = {
            components: [],
            compiled: false,
            trained: false
        };
        
        // Hide summary
        const summary = document.getElementById('agent-summary');
        if (summary) summary.style.display = 'none';
        
        // Restore placeholder text
        const placeholder = document.createElement('div');
        placeholder.style.textAlign = 'center';
        placeholder.style.marginTop = '50%';
        placeholder.style.color = '#999';
        placeholder.textContent = 'Drag components here to build your agent';
        canvas.appendChild(placeholder);
        
        this.logMessage('Canvas cleared');
    }
    
    async startTraining() {
        if (!this.gameState.currentAgent.compiled) {
            alert('Please compile your agent first!');
            return;
        }
        
        if (this.isTraining) {
            alert('Training is already in progress!');
            return;
        }
        
        const cost = this.calculateTrainingCost(this.gameState.currentAgent.components);
        
        if (this.gameState.computeCredits < cost) {
            alert(`Not enough compute credits! You need ${cost} credits but only have ${this.gameState.computeCredits}.`);
            return;
        }
        
        // Deduct credits
        this.gameState.computeCredits -= cost;
        this.updateUI();
        
        this.isTraining = true;
        const trainBtn = document.getElementById('train-btn');
        if (trainBtn) {
            trainBtn.textContent = '⏳ Training...';
            trainBtn.disabled = true;
        }
        
        // Simulate training process
        await this.simulateTraining();
        
        // Training complete
        this.isTraining = false;
        if (trainBtn) {
            trainBtn.textContent = '🎯 Start Training';
            trainBtn.disabled = false;
        }
        
        this.gameState.currentAgent.trained = true;
        this.saveAgent();
    }
    
    async simulateTraining() {
        const progressBar = document.getElementById('progress-bar');
        const accuracyBar = document.getElementById('accuracy-bar');
        const progressText = document.getElementById('progress');
        const accuracyText = document.getElementById('accuracy');
        
        let progress = 0;
        let accuracy = 0;
        
        const epochs = 10;
        const dataset = document.getElementById('dataset-select')?.value || 'images';
        
        this.logMessage(`Starting training on ${dataset} dataset...`);
        this.logMessage(`Learning rate: ${document.getElementById('learning-rate')?.value || 0.01}`);
        this.logMessage(`Batch size: ${document.getElementById('batch-size')?.value || 32}`);
        this.logMessage('');
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            await this.sleep(500); // Simulate training time
            
            progress = ((epoch + 1) / epochs) * 100;
            accuracy = Math.min(95, 20 + (epoch * 8) + Math.random() * 10);
            
            if (progressBar) progressBar.style.width = progress + '%';
            if (accuracyBar) accuracyBar.style.width = accuracy + '%';
            if (progressText) progressText.textContent = Math.round(progress) + '%';
            if (accuracyText) accuracyText.textContent = Math.round(accuracy) + '%';
            
            this.logMessage(`Epoch ${epoch + 1}/${epochs} - Accuracy: ${Math.round(accuracy)}% - Loss: ${(2 - accuracy/50).toFixed(4)}`);
        }
        
        this.logMessage('');
        this.logMessage('✅ Training completed successfully!');
        
        // Award bonus credits for high accuracy
        if (accuracy > 80) {
            const bonus = Math.round((accuracy - 80) * 10);
            this.addCredits(bonus);
            this.logMessage(`🎉 High accuracy bonus: +${bonus} credits!`);
        }
    }
    
    saveAgent() {
        const agent = {
            id: Date.now(),
            name: `Agent ${this.gameState.agentsBuilt + 1}`,
            components: [...this.gameState.currentAgent.components],
            accuracy: parseFloat(document.getElementById('accuracy')?.textContent || '0'),
            trainedOn: document.getElementById('dataset-select')?.value || 'unknown',
            createdAt: new Date().toLocaleDateString()
        };
        
        this.gameState.builtAgents.push(agent);
        this.gameState.agentsBuilt++;
        
        // Level up every 3 agents
        if (this.gameState.agentsBuilt % 3 === 0) {
            this.gameState.level++;
            this.logMessage(`🎉 Level up! You are now level ${this.gameState.level}!`);
            this.addCredits(200); // Level up bonus
        }
        
        this.updateUI();
        this.updateAgentGallery();
        this.logMessage(`Agent saved as "${agent.name}"`);
    }
    
    updateAgentGallery() {
        const gallery = document.getElementById('agent-list');
        if (!gallery) return;
        
        gallery.innerHTML = '';
        
        if (this.gameState.builtAgents.length === 0) {
            gallery.innerHTML = `
                <div class="challenge-card" style="text-align: center; color: #999;">
                    <h3>No agents built yet!</h3>
                    <p>Build and train your first agent to see it appear here.</p>
                    <button class="btn" onclick="game.showSection('builder')">Build Your First Agent</button>
                </div>
            `;
            return;
        }
        
        this.gameState.builtAgents.forEach(agent => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            card.innerHTML = `
                <h3>🤖 ${agent.name}</h3>
                <p><strong>Accuracy:</strong> ${Math.round(agent.accuracy)}%</p>
                <p><strong>Dataset:</strong> ${agent.trainedOn}</p>
                <p><strong>Components:</strong> ${agent.components.length}</p>
                <p><strong>Created:</strong> ${agent.createdAt}</p>
                <div style="margin-top: 1rem;">
                    ${agent.accuracy > 90 ? '<span style="color: gold;">🏆 Expert</span>' : 
                      agent.accuracy > 80 ? '<span style="color: silver;">🥈 Advanced</span>' : 
                      '<span style="color: #cd7f32;">🥉 Beginner</span>'}
                </div>
            `;
            gallery.appendChild(card);
        });
    }
    
    startChallenge(challengeType) {
        const challenges = {
            reviews: {
                name: 'App Review Classifier',
                description: 'Classify app reviews as positive or negative',
                reward: 100,
                requiredAccuracy: 75
            },
            images: {
                name: 'Image Recognition System',
                description: 'Identify objects in photos',
                reward: 250,
                requiredAccuracy: 80
            },
            music: {
                name: 'Music Recommendation Engine',
                description: 'Recommend music based on preferences',
                reward: 500,
                requiredAccuracy: 85
            },
            chatbot: {
                name: 'Chatbot Assistant',
                description: 'Create an intelligent conversational agent',
                reward: 750,
                requiredAccuracy: 90
            }
        };
        
        const challenge = challenges[challengeType];
        if (!challenge) return;
        
        if (!this.gameState.currentAgent.trained) {
            alert('You need a trained agent to attempt challenges! Build and train an agent first.');
            return;
        }
        
        const agentAccuracy = parseFloat(document.getElementById('accuracy')?.textContent || '0');
        
        if (agentAccuracy >= challenge.requiredAccuracy) {
            this.addCredits(challenge.reward);
            alert(`🎉 Challenge completed! Your agent achieved ${Math.round(agentAccuracy)}% accuracy. Earned ${challenge.reward} credits!`);
            this.logMessage(`✅ ${challenge.name} completed! +${challenge.reward} credits`);
        } else {
            alert(`Challenge failed! Your agent needs ${challenge.requiredAccuracy}% accuracy but only achieved ${Math.round(agentAccuracy)}%. Train a better agent and try again!`);
            this.logMessage(`❌ ${challenge.name} failed. Need ${challenge.requiredAccuracy}% accuracy, got ${Math.round(agentAccuracy)}%`);
        }
    }
    
    addCredits(amount) {
        this.gameState.computeCredits += amount;
        this.updateUI();
    }
    
    updateUI() {
        const creditsEl = document.getElementById('compute-credits');
        const agentsEl = document.getElementById('agents-built');
        const levelEl = document.getElementById('level');
        const costEl = document.getElementById('training-cost');
        
        if (creditsEl) creditsEl.textContent = this.gameState.computeCredits.toLocaleString();
        if (agentsEl) agentsEl.textContent = this.gameState.agentsBuilt;
        if (levelEl) levelEl.textContent = this.gameState.level;
        
        if (costEl && this.gameState.currentAgent.components.length > 0) {
            costEl.textContent = this.calculateTrainingCost(this.gameState.currentAgent.components);
        }
    }
    
    logMessage(message) {
        const log = document.getElementById('training-log');
        if (!log) return;
        
        log.innerHTML += '> ' + message + '<br>';
        log.scrollTop = log.scrollHeight;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for HTML event handlers
let game;

function showSection(sectionId) {
    if (game) game.showSection(sectionId);
}

function compileAgent() {
    if (game) game.compileAgent();
}

function clearCanvas() {
    if (game) game.clearCanvas();
}

function startTraining() {
    if (game) game.startTraining();
}

function startChallenge(type) {
    if (game) game.startChallenge(type);
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    game = new AIAgentAcademy();
    
    // Initial welcome message
    setTimeout(() => {
        game.logMessage('🤖 Welcome to AI Agent Academy!');
        game.logMessage('Build your first neural network to get started.');
        game.logMessage('');
    }, 500);
});