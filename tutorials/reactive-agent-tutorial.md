# Tutorial: Building Your First Reactive Agent

## Overview

In this hands-on tutorial, you'll build your first AI agent - a simple reactive agent that can respond to environmental stimuli. We'll create a weather monitoring agent that reacts to weather conditions and provides appropriate recommendations.

**Duration**: 45 minutes  
**Difficulty**: Beginner  
**Prerequisites**: Basic Python knowledge

## What You'll Build

By the end of this tutorial, you'll have created:
- A reactive agent that monitors weather conditions
- A simple rule-based decision system
- Integration with a weather API
- A basic agent execution loop

## Setup

### 1. Create Project Structure

```bash
mkdir weather-agent
cd weather-agent
mkdir src tests
touch src/agent.py src/environment.py src/main.py
touch requirements.txt README.md
```

### 2. Install Dependencies

Create `requirements.txt`:
```
requests>=2.28.0
python-dotenv>=0.19.0
```

Install packages:
```bash
pip install -r requirements.txt
```

### 3. Get Weather API Key

Sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/api):
1. Create account
2. Navigate to API Keys
3. Copy your API key
4. Create `.env` file:

```
WEATHER_API_KEY=your_api_key_here
```

## Step 1: Define the Environment

The environment represents the world our agent operates in. For our weather agent, this means weather data and conditions.

Create `src/environment.py`:

```python
import requests
import os
from typing import Dict, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class WeatherCondition:
    """Represents current weather conditions"""
    temperature: float
    humidity: float
    wind_speed: float
    weather_main: str  # e.g., "Rain", "Clear", "Clouds"
    description: str   # e.g., "light rain", "clear sky"
    timestamp: datetime

class WeatherEnvironment:
    """Environment that provides weather data"""
    
    def __init__(self, api_key: str, city: str = "London"):
        self.api_key = api_key
        self.city = city
        self.base_url = "http://api.openweathermap.org/data/2.5/weather"
        
    def get_current_conditions(self) -> WeatherCondition:
        """Fetch current weather conditions from API"""
        try:
            params = {
                'q': self.city,
                'appid': self.api_key,
                'units': 'metric'  # Celsius
            }
            
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            return WeatherCondition(
                temperature=data['main']['temp'],
                humidity=data['main']['humidity'],
                wind_speed=data['wind']['speed'],
                weather_main=data['weather'][0]['main'],
                description=data['weather'][0]['description'],
                timestamp=datetime.now()
            )
            
        except requests.RequestException as e:
            print(f"Error fetching weather data: {e}")
            # Return default/fallback conditions
            return WeatherCondition(
                temperature=20.0,
                humidity=50,
                wind_speed=5.0,
                weather_main="Clear",
                description="clear sky",
                timestamp=datetime.now()
            )
    
    def is_extreme_weather(self, conditions: WeatherCondition) -> bool:
        """Check if weather conditions are extreme"""
        return (
            conditions.temperature < 0 or conditions.temperature > 35 or
            conditions.wind_speed > 15 or
            conditions.weather_main in ['Thunderstorm', 'Tornado']
        )
```

## Step 2: Create the Reactive Agent

Now we'll build our reactive agent with condition-action rules.

Create `src/agent.py`:

```python
from typing import List, Callable, Dict, Any
from dataclasses import dataclass
from src.environment import WeatherEnvironment, WeatherCondition

@dataclass
class Rule:
    """Represents a condition-action rule"""
    name: str
    condition: Callable[[WeatherCondition], bool]
    action: Callable[[WeatherCondition], str]
    priority: int = 0  # Higher priority rules checked first

class ReactiveWeatherAgent:
    """A reactive agent that responds to weather conditions"""
    
    def __init__(self, environment: WeatherEnvironment):
        self.environment = environment
        self.rules: List[Rule] = []
        self.memory: List[str] = []  # Store recent actions
        self.active = False
        
        # Initialize default rules
        self._setup_default_rules()
    
    def _setup_default_rules(self):
        """Set up the default rule set"""
        
        # High priority - Safety rules
        self.add_rule(
            "extreme_weather_alert",
            lambda c: self.environment.is_extreme_weather(c),
            lambda c: f"⚠️ EXTREME WEATHER ALERT: {c.description.title()}! "
                     f"Temperature: {c.temperature}°C, Wind: {c.wind_speed} m/s. "
                     f"Stay indoors and stay safe!",
            priority=100
        )
        
        # Medium priority - Weather-specific recommendations
        self.add_rule(
            "rain_advice",
            lambda c: c.weather_main == "Rain",
            lambda c: f"🌧️ It's raining ({c.description}). "
                     f"Remember to take an umbrella! Temperature: {c.temperature}°C",
            priority=50
        )
        
        self.add_rule(
            "hot_weather",
            lambda c: c.temperature > 25,
            lambda c: f"☀️ Hot weather detected! {c.temperature}°C. "
                     f"Stay hydrated and wear sunscreen.",
            priority=40
        )
        
        self.add_rule(
            "cold_weather",
            lambda c: c.temperature < 10,
            lambda c: f"🥶 Cold weather: {c.temperature}°C. "
                     f"Dress warmly and consider staying indoors.",
            priority=40
        )
        
        self.add_rule(
            "windy_conditions",
            lambda c: c.wind_speed > 10,
            lambda c: f"💨 Windy conditions: {c.wind_speed} m/s. "
                     f"Secure loose items and be careful outdoors.",
            priority=30
        )
        
        self.add_rule(
            "high_humidity",
            lambda c: c.humidity > 80,
            lambda c: f"💧 High humidity: {c.humidity}%. "
                     f"It might feel uncomfortable - stay cool!",
            priority=20
        )
        
        # Low priority - Default pleasant weather
        self.add_rule(
            "pleasant_weather",
            lambda c: True,  # Always matches (fallback)
            lambda c: f"😊 Pleasant weather! {c.temperature}°C, {c.description}. "
                     f"Great day to be outside!",
            priority=1
        )
    
    def add_rule(self, name: str, condition: Callable, action: Callable, priority: int = 0):
        """Add a new rule to the agent"""
        rule = Rule(name, condition, action, priority)
        self.rules.append(rule)
        # Keep rules sorted by priority (highest first)
        self.rules.sort(key=lambda r: r.priority, reverse=True)
    
    def perceive(self) -> WeatherCondition:
        """Perceive the current environment state"""
        return self.environment.get_current_conditions()
    
    def decide(self, conditions: WeatherCondition) -> str:
        """Decide what action to take based on conditions"""
        
        # Check rules in priority order
        for rule in self.rules:
            if rule.condition(conditions):
                action_message = rule.action(conditions)
                print(f"🤖 Agent triggered rule: {rule.name}")
                return action_message
        
        # Fallback (should never reach here due to default rule)
        return "No applicable rule found."
    
    def act(self, action_message: str):
        """Execute the decided action"""
        print(f"📢 {action_message}")
        
        # Store in memory
        self.memory.append(action_message)
        
        # Keep only last 10 actions in memory
        if len(self.memory) > 10:
            self.memory = self.memory[-10:]
    
    def run_cycle(self):
        """Execute one perception-action cycle"""
        print("\n" + "="*50)
        print("🔄 Running agent cycle...")
        
        # Perceive
        conditions = self.perceive()
        print(f"👁️ Perceived conditions: {conditions.weather_main} - {conditions.description}")
        print(f"📊 Temperature: {conditions.temperature}°C, Humidity: {conditions.humidity}%, Wind: {conditions.wind_speed} m/s")
        
        # Decide
        action_message = self.decide(conditions)
        
        # Act
        self.act(action_message)
        
        return conditions, action_message
    
    def start(self):
        """Start the agent"""
        self.active = True
        print("🚀 Weather Agent started!")
    
    def stop(self):
        """Stop the agent"""
        self.active = False
        print("🛑 Weather Agent stopped.")
    
    def get_recent_memory(self) -> List[str]:
        """Get recent actions from memory"""
        return self.memory.copy()
    
    def display_rules(self):
        """Display all current rules"""
        print("\n📋 Current Rules (by priority):")
        for i, rule in enumerate(self.rules, 1):
            print(f"{i}. {rule.name} (priority: {rule.priority})")
```

## Step 3: Create the Main Application

Create `src/main.py`:

```python
import os
import time
from dotenv import load_dotenv
from src.environment import WeatherEnvironment
from src.agent import ReactiveWeatherAgent

def main():
    """Main application entry point"""
    
    # Load environment variables
    load_dotenv()
    api_key = os.getenv('WEATHER_API_KEY')
    
    if not api_key:
        print("❌ Error: WEATHER_API_KEY not found in environment variables")
        print("Please add your OpenWeatherMap API key to the .env file")
        return
    
    # Get city from user
    city = input("Enter city name (default: London): ").strip()
    if not city:
        city = "London"
    
    print(f"\n🌍 Setting up weather monitoring for {city}...")
    
    # Create environment and agent
    environment = WeatherEnvironment(api_key, city)
    agent = ReactiveWeatherAgent(environment)
    
    # Display agent configuration
    agent.display_rules()
    
    # Start the agent
    agent.start()
    
    try:
        print(f"\n🎯 Monitoring weather in {city}...")
        print("Press Ctrl+C to stop the agent\n")
        
        cycle_count = 0
        
        while agent.active:
            cycle_count += 1
            print(f"\n📈 Cycle #{cycle_count}")
            
            # Run one agent cycle
            conditions, action = agent.run_cycle()
            
            # Wait before next cycle
            print("\n⏱️ Waiting 30 seconds before next check...")
            time.sleep(30)
            
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down agent...")
        agent.stop()
        
        # Display memory
        print("\n💭 Recent agent memory:")
        for i, memory in enumerate(agent.get_recent_memory(), 1):
            print(f"{i}. {memory}")
        
        print(f"\n✅ Agent completed {cycle_count} cycles. Goodbye!")

if __name__ == "__main__":
    main()
```

## Step 4: Create Tests

Create `tests/test_agent.py`:

```python
import unittest
from datetime import datetime
from src.environment import WeatherCondition
from src.agent import ReactiveWeatherAgent, Rule

class MockEnvironment:
    """Mock environment for testing"""
    def __init__(self, conditions):
        self.conditions = conditions
    
    def get_current_conditions(self):
        return self.conditions
    
    def is_extreme_weather(self, conditions):
        return conditions.temperature < 0 or conditions.temperature > 35

class TestReactiveAgent(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures"""
        self.normal_conditions = WeatherCondition(
            temperature=20.0,
            humidity=60,
            wind_speed=5.0,
            weather_main="Clear",
            description="clear sky",
            timestamp=datetime.now()
        )
        
        self.environment = MockEnvironment(self.normal_conditions)
        self.agent = ReactiveWeatherAgent(self.environment)
    
    def test_agent_initialization(self):
        """Test that agent initializes correctly"""
        self.assertIsNotNone(self.agent)
        self.assertTrue(len(self.agent.rules) > 0)
        self.assertFalse(self.agent.active)
    
    def test_pleasant_weather_rule(self):
        """Test response to pleasant weather"""
        action = self.agent.decide(self.normal_conditions)
        self.assertIn("Pleasant weather", action)
    
    def test_rain_rule(self):
        """Test response to rain"""
        rainy_conditions = WeatherCondition(
            temperature=15.0, humidity=85, wind_speed=3.0,
            weather_main="Rain", description="light rain",
            timestamp=datetime.now()
        )
        
        action = self.agent.decide(rainy_conditions)
        self.assertIn("umbrella", action.lower())
    
    def test_extreme_weather_rule(self):
        """Test response to extreme weather"""
        extreme_conditions = WeatherCondition(
            temperature=40.0, humidity=30, wind_speed=20.0,
            weather_main="Clear", description="extreme heat",
            timestamp=datetime.now()
        )
        
        self.environment.conditions = extreme_conditions
        action = self.agent.decide(extreme_conditions)
        self.assertIn("EXTREME WEATHER", action)
    
    def test_add_custom_rule(self):
        """Test adding custom rules"""
        initial_rule_count = len(self.agent.rules)
        
        self.agent.add_rule(
            "test_rule",
            lambda c: c.temperature == 25,
            lambda c: "Test action",
            priority=99
        )
        
        self.assertEqual(len(self.agent.rules), initial_rule_count + 1)
        
        # Test rule is added with correct priority
        self.assertEqual(self.agent.rules[1].name, "test_rule")  # Should be second highest priority
    
    def test_memory_functionality(self):
        """Test agent memory"""
        self.agent.act("Test message 1")
        self.agent.act("Test message 2")
        
        memory = self.agent.get_recent_memory()
        self.assertEqual(len(memory), 2)
        self.assertIn("Test message 1", memory)
        self.assertIn("Test message 2", memory)

if __name__ == '__main__':
    unittest.main()
```

## Step 5: Run Your Agent

### Basic Execution

```bash
python src/main.py
```

### Run Tests

```bash
python -m pytest tests/ -v
```

### Example Output

```
🌍 Setting up weather monitoring for London...

📋 Current Rules (by priority):
1. extreme_weather_alert (priority: 100)
2. rain_advice (priority: 50)
3. hot_weather (priority: 40)
4. cold_weather (priority: 40)
5. windy_conditions (priority: 30)
6. high_humidity (priority: 20)
7. pleasant_weather (priority: 1)

🚀 Weather Agent started!

🎯 Monitoring weather in London...
Press Ctrl+C to stop the agent

==================================================
🔄 Running agent cycle...
👁️ Perceived conditions: Rain - light rain
📊 Temperature: 12°C, Humidity: 89%, Wind: 4.2 m/s
🤖 Agent triggered rule: rain_advice
📢 🌧️ It's raining (light rain). Remember to take an umbrella! Temperature: 12°C
```

## Step 6: Extend Your Agent

### Add More Rules

```python
# Add seasonal rules
agent.add_rule(
    "winter_advisory",
    lambda c: c.temperature < 5,
    lambda c: f"❄️ Winter conditions: {c.temperature}°C. Watch for ice!",
    priority=45
)

# Add time-based rules
from datetime import datetime

def is_evening():
    return datetime.now().hour >= 18

agent.add_rule(
    "evening_weather",
    lambda c: is_evening(),
    lambda c: f"🌆 Evening weather update: {c.temperature}°C, {c.description}",
    priority=15
)
```

### Add Persistence

```python
import json
from datetime import datetime

def save_weather_log(conditions, action):
    """Save weather conditions and actions to file"""
    log_entry = {
        'timestamp': conditions.timestamp.isoformat(),
        'temperature': conditions.temperature,
        'weather': conditions.weather_main,
        'action': action
    }
    
    with open('weather_log.json', 'a') as f:
        json.dump(log_entry, f)
        f.write('\n')
```

## Key Concepts Learned

### 1. Reactive Agent Architecture
- **Perception**: Getting data from environment (weather API)
- **Decision**: Applying condition-action rules
- **Action**: Executing responses based on rules

### 2. Rule-Based Systems
- **Condition-Action Rules**: IF condition THEN action
- **Priority Handling**: Higher priority rules checked first
- **Rule Extensibility**: Easy to add new behaviors

### 3. Environment Interaction
- **API Integration**: Connecting to external data sources
- **Error Handling**: Graceful degradation when APIs fail
- **Data Modeling**: Structured representation of environment state

### 4. Agent Memory
- **Short-term Memory**: Storing recent actions
- **Behavior History**: Tracking what the agent has done

## Next Steps

Now that you've built your first reactive agent, try these extensions:

1. **Add More Rules**: Create rules for different weather patterns
2. **Multiple Cities**: Monitor weather in multiple locations
3. **User Interface**: Build a web interface for your agent
4. **Notifications**: Send alerts via email or messaging
5. **Learning**: Make the agent learn from user preferences

### Advanced Tutorials
- **Building Deliberative Agents**: Add goal-based planning
- **Multi-Agent Communication**: Create agents that work together
- **Tool Integration**: Connect agents to external services
- **Production Deployment**: Deploy your agent to the cloud

## Troubleshooting

### Common Issues

**API Key Error**
```
❌ Error: WEATHER_API_KEY not found
```
Solution: Ensure `.env` file exists with valid API key

**Network Errors**
```
Error fetching weather data: Connection timeout
```
Solution: Check internet connection and API limits

**Import Errors**
```
ModuleNotFoundError: No module named 'src'
```
Solution: Run from project root directory: `python src/main.py`

## Summary

Congratulations! 🎉 You've successfully built your first reactive AI agent. This agent demonstrates the core concepts of reactive agent architecture:

- **Environment Perception**: Reading weather data
- **Rule-Based Decision Making**: Responding with appropriate actions  
- **Action Execution**: Providing recommendations and alerts
- **Memory Management**: Tracking recent activities

Your agent can now:
✅ Monitor real-time weather conditions  
✅ Apply priority-based rules for decision making  
✅ Provide contextual recommendations  
✅ Handle extreme weather alerts  
✅ Maintain memory of recent actions  

This foundation prepares you for more advanced agent architectures including goal-based planning, learning systems, and multi-agent coordination.

Ready for the next challenge? Try the **Adding Memory to Your Agent** tutorial! 🚀