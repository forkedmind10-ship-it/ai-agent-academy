#!/usr/bin/env python3
"""
Personal Task Manager Agent

A sophisticated AI agent that manages daily tasks, sets priorities,
handles scheduling conflicts, and provides intelligent recommendations.

Features:
- Natural language task input
- Priority-based scheduling
- Deadline management
- Context-aware reminders
- Learning from user patterns

Author: AI Agent Academy
License: MIT
"""

import json
import sqlite3
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import re

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress" 
    COMPLETED = "completed"
    CANCELLED = "cancelled"

@dataclass
class Task:
    """Represents a task with all its properties"""
    id: Optional[int] = None
    title: str = ""
    description: str = ""
    priority: Priority = Priority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    deadline: Optional[datetime] = None
    estimated_duration: int = 60  # minutes
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    tags: List[str] = None
    context: str = ""  # work, personal, etc.

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.created_at is None:
            self.created_at = datetime.now()

class TaskDatabase:
    """Handles persistence of tasks using SQLite"""
    
    def __init__(self, db_path: str = "tasks.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    priority INTEGER,
                    status TEXT,
                    deadline TEXT,
                    estimated_duration INTEGER,
                    created_at TEXT,
                    completed_at TEXT,
                    tags TEXT,
                    context TEXT
                )
            """)
            conn.commit()
    
    def save_task(self, task: Task) -> int:
        """Save a task to database and return its ID"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            if task.id is None:
                # Insert new task
                cursor.execute("""
                    INSERT INTO tasks 
                    (title, description, priority, status, deadline, estimated_duration,
                     created_at, completed_at, tags, context)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    task.title, task.description, task.priority.value, task.status.value,
                    task.deadline.isoformat() if task.deadline else None,
                    task.estimated_duration,
                    task.created_at.isoformat() if task.created_at else None,
                    task.completed_at.isoformat() if task.completed_at else None,
                    json.dumps(task.tags), task.context
                ))
                task.id = cursor.lastrowid
            else:
                # Update existing task
                cursor.execute("""
                    UPDATE tasks SET title=?, description=?, priority=?, status=?,
                    deadline=?, estimated_duration=?, completed_at=?, tags=?, context=?
                    WHERE id=?
                """, (
                    task.title, task.description, task.priority.value, task.status.value,
                    task.deadline.isoformat() if task.deadline else None,
                    task.estimated_duration,
                    task.completed_at.isoformat() if task.completed_at else None,
                    json.dumps(task.tags), task.context, task.id
                ))
            conn.commit()
            return task.id
    
    def get_task(self, task_id: int) -> Optional[Task]:
        """Get a task by ID"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tasks WHERE id=?", (task_id,))
            row = cursor.fetchone()
            if row:
                return self._row_to_task(row)
        return None
    
    def get_all_tasks(self) -> List[Task]:
        """Get all tasks"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
            return [self._row_to_task(row) for row in cursor.fetchall()]
    
    def get_tasks_by_status(self, status: TaskStatus) -> List[Task]:
        """Get tasks by status"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tasks WHERE status=?", (status.value,))
            return [self._row_to_task(row) for row in cursor.fetchall()]
    
    def _row_to_task(self, row) -> Task:
        """Convert database row to Task object"""
        return Task(
            id=row[0],
            title=row[1],
            description=row[2],
            priority=Priority(row[3]),
            status=TaskStatus(row[4]),
            deadline=datetime.fromisoformat(row[5]) if row[5] else None,
            estimated_duration=row[6],
            created_at=datetime.fromisoformat(row[7]) if row[7] else None,
            completed_at=datetime.fromisoformat(row[8]) if row[8] else None,
            tags=json.loads(row[9]) if row[9] else [],
            context=row[10] or ""
        )

class NaturalLanguageProcessor:
    """Processes natural language input to extract task information"""
    
    PRIORITY_KEYWORDS = {
        Priority.URGENT: ['urgent', 'asap', 'immediately', 'critical', 'emergency'],
        Priority.HIGH: ['important', 'high', 'priority', 'soon', 'quickly'],
        Priority.MEDIUM: ['normal', 'medium', 'regular'],
        Priority.LOW: ['low', 'later', 'eventually', 'sometime']
    }
    
    TIME_PATTERNS = {
        'today': lambda: datetime.now().replace(hour=23, minute=59, second=59),
        'tomorrow': lambda: datetime.now() + timedelta(days=1),
        'this week': lambda: datetime.now() + timedelta(days=7),
        'next week': lambda: datetime.now() + timedelta(days=14),
        'this month': lambda: datetime.now() + timedelta(days=30),
    }
    
    def parse_task_input(self, input_text: str) -> Task:
        """Parse natural language input into a Task object"""
        task = Task()
        text_lower = input_text.lower()
        
        # Extract priority
        task.priority = self._extract_priority(text_lower)
        
        # Extract deadline
        task.deadline = self._extract_deadline(text_lower)
        
        # Extract duration estimate
        task.estimated_duration = self._extract_duration(text_lower)
        
        # Extract context/tags
        task.tags = self._extract_tags(text_lower)
        task.context = self._extract_context(text_lower)
        
        # Clean title (remove extracted keywords)
        task.title = self._clean_title(input_text)
        task.description = input_text
        
        return task
    
    def _extract_priority(self, text: str) -> Priority:
        """Extract priority from text"""
        for priority, keywords in self.PRIORITY_KEYWORDS.items():
            if any(keyword in text for keyword in keywords):
                return priority
        return Priority.MEDIUM
    
    def _extract_deadline(self, text: str) -> Optional[datetime]:
        """Extract deadline from text"""
        for pattern, date_func in self.TIME_PATTERNS.items():
            if pattern in text:
                return date_func()
        
        # Check for specific date patterns (e.g., "by 3pm", "at 2:30")
        time_match = re.search(r'(?:by|at|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', text)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2) or 0)
            period = time_match.group(3)
            
            if period == 'pm' and hour != 12:
                hour += 12
            elif period == 'am' and hour == 12:
                hour = 0
                
            deadline = datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0)
            if deadline < datetime.now():
                deadline += timedelta(days=1)
            return deadline
        
        return None
    
    def _extract_duration(self, text: str) -> int:
        """Extract estimated duration in minutes"""
        # Look for patterns like "takes 30 minutes", "2 hours", etc.
        duration_match = re.search(r'(?:takes?|about|roughly)\s*(\d+)\s*(minutes?|mins?|hours?|hrs?)', text)
        if duration_match:
            value = int(duration_match.group(1))
            unit = duration_match.group(2).lower()
            if 'hour' in unit or 'hr' in unit:
                return value * 60
            return value
        
        return 60  # Default 1 hour
    
    def _extract_tags(self, text: str) -> List[str]:
        """Extract tags from text"""
        tags = []
        
        # Look for hashtags
        hashtags = re.findall(r'#(\w+)', text)
        tags.extend(hashtags)
        
        # Look for common categories
        categories = ['work', 'personal', 'health', 'family', 'learning', 'shopping']
        for category in categories:
            if category in text:
                tags.append(category)
        
        return list(set(tags))  # Remove duplicates
    
    def _extract_context(self, text: str) -> str:
        """Extract context from text"""
        contexts = ['work', 'personal', 'home', 'office']
        for context in contexts:
            if context in text:
                return context
        return 'personal'
    
    def _clean_title(self, text: str) -> str:
        """Clean the title by removing temporal and priority keywords"""
        # Remove common prefixes and suffixes
        text = re.sub(r'\b(?:urgent|important|high|low|priority|asap|immediately|today|tomorrow|this week|next week|by \d+(?::\d+)?\s*(?:am|pm)?|takes?\s*\d+\s*(?:minutes?|mins?|hours?|hrs?))\b', '', text, flags=re.IGNORECASE)
        
        # Remove hashtags for cleaner title
        text = re.sub(r'#\w+', '', text)
        
        # Clean up extra spaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text[:100]  # Limit title length

class TaskManagerAgent:
    """Main agent that manages tasks and provides intelligent recommendations"""
    
    def __init__(self):
        self.db = TaskDatabase()
        self.nlp = NaturalLanguageProcessor()
        self.session_stats = {
            'tasks_created': 0,
            'tasks_completed': 0,
            'recommendations_given': 0
        }
        
    def add_task(self, input_text: str) -> Task:
        """Add a new task from natural language input"""
        task = self.nlp.parse_task_input(input_text)
        task_id = self.db.save_task(task)
        task.id = task_id
        
        self.session_stats['tasks_created'] += 1
        
        logger.info(f"Created task: {task.title} (ID: {task_id})")
        return task
    
    def complete_task(self, task_id: int) -> bool:
        """Mark a task as completed"""
        task = self.db.get_task(task_id)
        if task:
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now()
            self.db.save_task(task)
            
            self.session_stats['tasks_completed'] += 1
            logger.info(f"Completed task: {task.title}")
            return True
        return False
    
    def get_priority_tasks(self) -> List[Task]:
        """Get tasks sorted by priority and deadline"""
        pending_tasks = self.db.get_tasks_by_status(TaskStatus.PENDING)
        
        # Sort by priority (urgent first) and then by deadline
        return sorted(pending_tasks, key=lambda t: (
            -t.priority.value,
            t.deadline if t.deadline else datetime.max,
            t.created_at
        ))
    
    def get_overdue_tasks(self) -> List[Task]:
        """Get overdue tasks"""
        now = datetime.now()
        return [task for task in self.get_priority_tasks() 
                if task.deadline and task.deadline < now]
    
    def get_today_tasks(self) -> List[Task]:
        """Get tasks due today"""
        today = datetime.now().date()
        return [task for task in self.get_priority_tasks()
                if task.deadline and task.deadline.date() == today]
    
    def suggest_next_task(self) -> Optional[Task]:
        """Suggest the next task to work on"""
        priority_tasks = self.get_priority_tasks()
        
        if not priority_tasks:
            return None
        
        # Prioritize overdue urgent tasks
        overdue = self.get_overdue_tasks()
        if overdue:
            urgent_overdue = [t for t in overdue if t.priority == Priority.URGENT]
            if urgent_overdue:
                return urgent_overdue[0]
            return overdue[0]
        
        # Then today's tasks
        today_tasks = self.get_today_tasks()
        if today_tasks:
            return today_tasks[0]
        
        # Otherwise, highest priority task
        return priority_tasks[0]
    
    def get_daily_summary(self) -> Dict:
        """Get summary of daily tasks and progress"""
        all_tasks = self.db.get_all_tasks()
        today = datetime.now().date()
        
        today_created = len([t for t in all_tasks if t.created_at.date() == today])
        today_completed = len([t for t in all_tasks 
                              if t.completed_at and t.completed_at.date() == today])
        
        pending_tasks = self.db.get_tasks_by_status(TaskStatus.PENDING)
        overdue_count = len(self.get_overdue_tasks())
        
        return {
            'today_created': today_created,
            'today_completed': today_completed,
            'total_pending': len(pending_tasks),
            'overdue_count': overdue_count,
            'completion_rate': (today_completed / max(today_created, 1)) * 100
        }
    
    def provide_recommendations(self) -> List[str]:
        """Provide intelligent recommendations based on current state"""
        recommendations = []
        overdue = self.get_overdue_tasks()
        today_tasks = self.get_today_tasks()
        next_task = self.suggest_next_task()
        
        # Overdue task warnings
        if overdue:
            if len(overdue) == 1:
                recommendations.append(f"⚠️ You have 1 overdue task: '{overdue[0].title}'")
            else:
                recommendations.append(f"⚠️ You have {len(overdue)} overdue tasks!")
        
        # Today's focus
        if today_tasks:
            recommendations.append(f"📅 You have {len(today_tasks)} tasks due today")
        
        # Next task suggestion
        if next_task:
            urgency = "🚨 Urgent" if next_task.priority == Priority.URGENT else "⭐"
            recommendations.append(f"{urgency} Next recommended task: '{next_task.title}'")
        
        # Productivity insights
        summary = self.get_daily_summary()
        if summary['completion_rate'] >= 80:
            recommendations.append("🎉 Great job! You're having a productive day!")
        elif summary['completion_rate'] < 30:
            recommendations.append("💪 Consider breaking large tasks into smaller ones")
        
        # Time management
        now = datetime.now()
        if 9 <= now.hour <= 11:
            recommendations.append("🌅 Morning is great for high-priority tasks!")
        elif 14 <= now.hour <= 16:
            recommendations.append("☀️ Afternoon energy - tackle important tasks now")
        
        self.session_stats['recommendations_given'] += len(recommendations)
        return recommendations
    
    def search_tasks(self, query: str) -> List[Task]:
        """Search tasks by title, description, or tags"""
        all_tasks = self.db.get_all_tasks()
        query_lower = query.lower()
        
        matching_tasks = []
        for task in all_tasks:
            if (query_lower in task.title.lower() or 
                query_lower in task.description.lower() or
                any(query_lower in tag.lower() for tag in task.tags)):
                matching_tasks.append(task)
        
        return matching_tasks
    
    def get_session_stats(self) -> Dict:
        """Get current session statistics"""
        return self.session_stats.copy()

class TaskManagerCLI:
    """Command-line interface for the Task Manager Agent"""
    
    def __init__(self):
        self.agent = TaskManagerAgent()
        self.running = True
    
    def run(self):
        """Start the CLI interface"""
        print("🤖 Personal Task Manager Agent")
        print("=" * 40)
        print("I'm here to help you manage your tasks efficiently!")
        print("Type 'help' for available commands or just describe a task to add it.\n")
        
        while self.running:
            try:
                user_input = input("You: ").strip()
                if not user_input:
                    continue
                
                self.process_command(user_input)
                
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye! Stay productive!")
                break
            except Exception as e:
                logger.error(f"Error: {e}")
                print(f"❌ Sorry, I encountered an error: {e}")
    
    def process_command(self, command: str) -> None:
        """Process user commands"""
        cmd_lower = command.lower().strip()
        
        # Command routing
        if cmd_lower in ['help', 'h']:
            self.show_help()
        elif cmd_lower in ['quit', 'exit', 'q']:
            self.running = False
        elif cmd_lower.startswith('complete '):
            self.complete_task_cmd(command)
        elif cmd_lower in ['list', 'ls', 'show']:
            self.list_tasks()
        elif cmd_lower in ['today', 'td']:
            self.show_today_tasks()
        elif cmd_lower in ['overdue', 'late']:
            self.show_overdue_tasks()
        elif cmd_lower in ['summary', 'stats']:
            self.show_summary()
        elif cmd_lower in ['recommend', 'suggest', 'next']:
            self.show_recommendations()
        elif cmd_lower.startswith('search '):
            self.search_tasks_cmd(command)
        else:
            # Treat as new task
            self.add_task_cmd(command)
    
    def add_task_cmd(self, input_text: str):
        """Add a new task"""
        task = self.agent.add_task(input_text)
        
        print(f"✅ Created task: '{task.title}'")
        if task.priority != Priority.MEDIUM:
            print(f"   Priority: {task.priority.name}")
        if task.deadline:
            print(f"   Deadline: {task.deadline.strftime('%Y-%m-%d %H:%M')}")
        if task.tags:
            print(f"   Tags: {', '.join(task.tags)}")
        
        # Show recommendations after adding task
        recommendations = self.agent.provide_recommendations()
        if recommendations:
            print("\n💡 Recommendations:")
            for rec in recommendations[:2]:  # Show top 2
                print(f"   {rec}")
    
    def complete_task_cmd(self, command: str):
        """Complete a task by ID"""
        try:
            task_id = int(command.split(' ', 1)[1])
            if self.agent.complete_task(task_id):
                print(f"🎉 Task {task_id} completed!")
            else:
                print(f"❌ Task {task_id} not found")
        except (ValueError, IndexError):
            print("❌ Please provide a valid task ID (e.g., 'complete 1')")
    
    def list_tasks(self):
        """List all pending tasks"""
        tasks = self.agent.get_priority_tasks()
        
        if not tasks:
            print("📭 No pending tasks! Great job!")
            return
        
        print(f"\n📋 Your Tasks ({len(tasks)} pending):")
        print("-" * 50)
        
        for task in tasks[:10]:  # Show top 10
            status_icon = "🚨" if task.priority == Priority.URGENT else "⭐" if task.priority == Priority.HIGH else "📌"
            deadline_str = f" (due {task.deadline.strftime('%m/%d %H:%M')})" if task.deadline else ""
            print(f"{status_icon} [{task.id}] {task.title}{deadline_str}")
        
        if len(tasks) > 10:
            print(f"... and {len(tasks) - 10} more tasks")
    
    def show_today_tasks(self):
        """Show tasks due today"""
        tasks = self.agent.get_today_tasks()
        
        if not tasks:
            print("📅 No tasks due today!")
            return
        
        print(f"\n📅 Today's Tasks ({len(tasks)}):")
        print("-" * 30)
        
        for task in tasks:
            urgency = "🚨" if task.priority == Priority.URGENT else "⭐"
            time_str = task.deadline.strftime('%H:%M') if task.deadline else 'No time set'
            print(f"{urgency} [{task.id}] {task.title} - {time_str}")
    
    def show_overdue_tasks(self):
        """Show overdue tasks"""
        tasks = self.agent.get_overdue_tasks()
        
        if not tasks:
            print("✅ No overdue tasks!")
            return
        
        print(f"\n⚠️ Overdue Tasks ({len(tasks)}):")
        print("-" * 30)
        
        for task in tasks:
            days_overdue = (datetime.now() - task.deadline).days
            print(f"🚨 [{task.id}] {task.title} - {days_overdue} days overdue")
    
    def show_summary(self):
        """Show daily summary and stats"""
        summary = self.agent.get_daily_summary()
        session_stats = self.agent.get_session_stats()
        
        print("\n📊 Daily Summary:")
        print(f"   Tasks created today: {summary['today_created']}")
        print(f"   Tasks completed today: {summary['today_completed']}")
        print(f"   Total pending: {summary['total_pending']}")
        print(f"   Overdue tasks: {summary['overdue_count']}")
        print(f"   Completion rate: {summary['completion_rate']:.1f}%")
        
        print("\n📈 Session Stats:")
        print(f"   Tasks created: {session_stats['tasks_created']}")
        print(f"   Tasks completed: {session_stats['tasks_completed']}")
        print(f"   Recommendations given: {session_stats['recommendations_given']}")
    
    def show_recommendations(self):
        """Show AI recommendations"""
        recommendations = self.agent.provide_recommendations()
        
        if not recommendations:
            print("🎯 You're all caught up! No specific recommendations right now.")
            return
        
        print("\n💡 AI Recommendations:")
        for i, rec in enumerate(recommendations, 1):
            print(f"   {i}. {rec}")
    
    def search_tasks_cmd(self, command: str):
        """Search for tasks"""
        query = command[7:].strip()  # Remove 'search '
        if not query:
            print("❌ Please provide a search term")
            return
        
        tasks = self.agent.search_tasks(query)
        
        if not tasks:
            print(f"🔍 No tasks found matching '{query}'")
            return
        
        print(f"\n🔍 Found {len(tasks)} tasks matching '{query}':")
        print("-" * 40)
        
        for task in tasks[:5]:  # Show top 5
            status = task.status.value.title()
            print(f"[{task.id}] {task.title} - {status}")
    
    def show_help(self):
        """Show help information"""
        help_text = """
🤖 Task Manager Agent - Available Commands:

📝 Adding Tasks:
   Just type what you want to do! Examples:
   • "Buy groceries today by 6pm"
   • "Important meeting with client tomorrow"
   • "Call mom this evening #family"

📋 Managing Tasks:
   • list, ls, show - Show all pending tasks
   • today, td - Show tasks due today  
   • overdue, late - Show overdue tasks
   • complete <id> - Mark task as completed
   • search <term> - Search tasks

📊 Insights:
   • summary, stats - Show daily summary
   • recommend, suggest, next - Get AI recommendations

🔧 Other:
   • help, h - Show this help
   • quit, exit, q - Exit the application

💡 Tips:
   • Use priority words: urgent, important, low priority
   • Mention time: today, tomorrow, by 3pm, this week
   • Add tags with #: #work #personal #health
   • Estimate duration: "takes 30 minutes", "2 hours"
        """
        print(help_text)

def main():
    """Main entry point"""
    try:
        cli = TaskManagerCLI()
        cli.run()
    except Exception as e:
        logger.error(f"Application error: {e}")
        print(f"💥 Application encountered an error: {e}")

if __name__ == "__main__":
    main()