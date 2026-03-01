// ============================================================
// FocusForge | habits.js
// Habit tracking system with streaks
// ============================================================

// ============================================================
// ADD HABIT
// ============================================================

function addHabit() {
  const input = document.getElementById('habit-input');
  const icon = document.getElementById('habit-icon').value;
  const name = input.value.trim();

  if (!name) {
    input.focus();
    input.style.borderColor = 'var(--red)';
    setTimeout(() => input.style.borderColor = '', 1000);
    return;
  }

  const habits = Storage.get('ff_habits') || [];

  const newHabit = {
    id: generateId(),
    name: name,
    icon: icon,
    streak: 0,
    bestStreak: 0,
    completedDates: [],
    createdAt: getTodayKey(),
  };

  habits.push(newHabit);
  Storage.set('ff_habits', habits);

  input.value = '';
  renderHabits();
  updateDashboard();
}

// Allow Enter key to add habit
document.getElementById('habit-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addHabit();
});

// ============================================================
// TOGGLE HABIT COMPLETE
// ============================================================

function toggleHabit(id) {
  const habits = Storage.get('ff_habits') || [];
  const habit = habits.find(h => h.id === id);
  const today = getTodayKey();

  if (!habit) return;

  const alreadyDone = habit.completedDates.includes(today);

  if (alreadyDone) {
    // Uncheck today
    habit.completedDates = habit.completedDates.filter(d => d !== today);
  } else {
    // Check today
    habit.completedDates.push(today);
  }

  // Recalculate streak
  habit.streak = calculateHabitStreak(habit.completedDates);
  habit.bestStreak = Math.max(habit.bestStreak || 0, habit.streak);

  Storage.set('ff_habits', habits);
  renderHabits();
  updateDashboard();
}

// ============================================================
// DELETE HABIT
// ============================================================

function deleteHabit(id) {
  let habits = Storage.get('ff_habits') || [];
  habits = habits.filter(h => h.id !== id);
  Storage.set('ff_habits', habits);
  renderHabits();
  updateDashboard();
}

// ============================================================
// STREAK CALCULATOR
// ============================================================

function calculateHabitStreak(completedDates) {
  if (!completedDates || completedDates.length === 0) return 0;

  // Sort dates descending
  const sorted = [...completedDates].sort((a, b) => b.localeCompare(a));
  const today = getTodayKey();
  const yesterday = dateToKey(new Date(Date.now() - 86400000));

  // Streak must start from today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev - curr) / 86400000;

    if (Math.round(diff) === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ============================================================
// RENDER HABITS
// ============================================================

function renderHabits() {
  const habits = Storage.get('ff_habits') || [];
  const container = document.getElementById('habit-list');
  const today = getTodayKey();

  if (habits.length === 0) {
    container.innerHTML = '<p class="empty-state">No habits yet. Add one above!</p>';
    return;
  }

  container.innerHTML = habits.map(habit => {
    const done = habit.completedDates?.includes(today);
    const streak = habit.streak || 0;
    const bestStreak = habit.bestStreak || 0;

    return `
      <div class="habit-card ${done ? 'completed' : ''}"
        onclick="toggleHabit('${habit.id}')">
        
        <button class="habit-delete"
          onclick="event.stopPropagation(); deleteHabit('${habit.id}')">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="habit-check">
          ${done ? '✓' : ''}
        </div>

        <span class="habit-emoji">${habit.icon}</span>
        <div class="habit-name">${escapeHtml(habit.name)}</div>

        <div class="habit-streak">
          🔥 ${streak} day streak
        </div>

        <div style="font-size:11px;color:var(--text2);margin-top:4px;">
          Best: ${bestStreak} days
        </div>

      </div>
    `;
  }).join('');
}