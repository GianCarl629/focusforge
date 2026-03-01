// ============================================================
// FocusForge | app.js
// Core app logic - navigation, storage, dashboard
// ============================================================

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================

const Storage = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

// ============================================================
// TAB NAVIGATION
// ============================================================

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Remove active from all nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  document.getElementById('tab-' + tabName).classList.add('active');

  // Activate nav button
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Refresh dashboard if switching to it
  if (tabName === 'dashboard') {
    updateDashboard();
  }
}

// Nav button click handlers
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});

// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {
  updateDashboardStats();
  updateDashboardTaskPreview();
  updateDashboardHabitPreview();
}

function updateDashboardStats() {
  const tasks = Storage.get('ff_tasks') || [];
  const habits = Storage.get('ff_habits') || [];
  const today = getTodayKey();

  // Tasks done today
  const tasksDone = tasks.filter(t => t.completed && t.completedOn === today).length;
  document.getElementById('stat-tasks').textContent = tasksDone;

  // Habits completed today
  const habitsDone = habits.filter(h => h.completedDates?.includes(today)).length;
  document.getElementById('stat-habits').textContent = habitsDone;

  // Focus time today (in minutes)
  const sessions = Storage.get('ff_sessions') || [];
  const todaySessions = sessions.filter(s => s.date === today);
  const focusMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  document.getElementById('stat-focus').textContent = focusMinutes + 'm';

  // Streak
  const streak = calculateStreak();
  document.getElementById('stat-streak').textContent = streak;
}

function updateDashboardTaskPreview() {
  const tasks = Storage.get('ff_tasks') || [];
  const container = document.getElementById('dashboard-tasks');
  const pending = tasks.filter(t => !t.completed).slice(0, 4);

  if (pending.length === 0) {
    container.innerHTML = '<p class="empty-state">All caught up! 🎉</p>';
    return;
  }

  container.innerHTML = pending.map(task => `
    <div class="task-item">
      <div class="task-checkbox ${task.completed ? 'checked' : ''}"
        onclick="toggleTaskFromDashboard('${task.id}')"></div>
      <span class="task-text ${task.completed ? 'done' : ''}">${task.text}</span>
      <span class="priority-badge ${task.priority}">${task.priority}</span>
    </div>
  `).join('');
}

function updateDashboardHabitPreview() {
  const habits = Storage.get('ff_habits') || [];
  const container = document.getElementById('dashboard-habits');
  const today = getTodayKey();

  if (habits.length === 0) {
    container.innerHTML = '<p class="empty-state">No habits yet!</p>';
    return;
  }

  container.innerHTML = habits.slice(0, 4).map(habit => {
    const done = habit.completedDates?.includes(today);
    return `
      <div class="task-item">
        <div class="task-checkbox ${done ? 'checked' : ''}"
          onclick="toggleHabitFromDashboard('${habit.id}')"></div>
        <span class="task-text">${habit.icon} ${habit.name}</span>
        <span class="habit-streak">🔥 ${habit.streak || 0}</span>
      </div>
    `;
  }).join('');
}

function toggleTaskFromDashboard(id) {
  const tasks = Storage.get('ff_tasks') || [];
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    task.completedOn = task.completed ? getTodayKey() : null;
    Storage.set('ff_tasks', tasks);
    updateDashboard();
    renderTasks();
  }
}

function toggleHabitFromDashboard(id) {
  toggleHabit(id);
  updateDashboard();
}

// ============================================================
// STREAK CALCULATION
// ============================================================

function calculateStreak() {
  const sessions = Storage.get('ff_sessions') || [];
  const tasks = Storage.get('ff_tasks') || [];
  const habits = Storage.get('ff_habits') || [];

  // A day counts if user did at least one task OR one session OR one habit
  const activeDays = new Set();

  sessions.forEach(s => activeDays.add(s.date));
  tasks.filter(t => t.completedOn).forEach(t => activeDays.add(t.completedOn));
  habits.forEach(h => {
    (h.completedDates || []).forEach(d => activeDays.add(d));
  });

  let streak = 0;
  let date = new Date();

  while (true) {
    const key = dateToKey(date);
    if (activeDays.has(key)) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ============================================================
// DATE HELPERS
// ============================================================

function getTodayKey() {
  return dateToKey(new Date());
}

function dateToKey(date) {
  return date.toISOString().split('T')[0];
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================================
// GREETING
// ============================================================

function setGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good day!';
  if (hour < 12) greeting = 'Good morning!';
  else if (hour < 17) greeting = 'Good afternoon!';
  else greeting = 'Good evening!';

  const h1 = document.querySelector('#tab-dashboard .page-header h1');
  if (h1) h1.textContent = greeting + ' 👋';
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  setGreeting();
  updateDashboard();
  renderTasks();
  renderHabits();
  initTimer();
});