// ============================================================
// FocusForge | tasks.js
// Task management system
// ============================================================

let currentFilter = 'all';

// ============================================================
// ADD TASK
// ============================================================

function addTask() {
  const input = document.getElementById('task-input');
  const priority = document.getElementById('task-priority').value;
  const text = input.value.trim();

  if (!text) {
    input.focus();
    input.style.borderColor = 'var(--red)';
    setTimeout(() => input.style.borderColor = '', 1000);
    return;
  }

  const tasks = Storage.get('ff_tasks') || [];

  const newTask = {
    id: generateId(),
    text: text,
    priority: priority,
    completed: false,
    completedOn: null,
    createdAt: getTodayKey(),
  };

  tasks.unshift(newTask);
  Storage.set('ff_tasks', tasks);

  input.value = '';
  renderTasks();
  updateDashboard();
}

// Allow pressing Enter to add task
document.getElementById('task-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

// ============================================================
// TOGGLE TASK COMPLETE
// ============================================================

function toggleTask(id) {
  const tasks = Storage.get('ff_tasks') || [];
  const task = tasks.find(t => t.id === id);

  if (task) {
    task.completed = !task.completed;
    task.completedOn = task.completed ? getTodayKey() : null;
    Storage.set('ff_tasks', tasks);
    renderTasks();
    updateDashboard();
  }
}

// ============================================================
// DELETE TASK
// ============================================================

function deleteTask(id) {
  let tasks = Storage.get('ff_tasks') || [];
  tasks = tasks.filter(t => t.id !== id);
  Storage.set('ff_tasks', tasks);
  renderTasks();
  updateDashboard();
}

// ============================================================
// CLEAR COMPLETED
// ============================================================

function clearCompletedTasks() {
  let tasks = Storage.get('ff_tasks') || [];
  tasks = tasks.filter(t => !t.completed);
  Storage.set('ff_tasks', tasks);
  renderTasks();
  updateDashboard();
}

// ============================================================
// FILTER TASKS
// ============================================================

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ============================================================
// RENDER TASKS
// ============================================================

function renderTasks() {
  const tasks = Storage.get('ff_tasks') || [];
  const container = document.getElementById('task-list');

  // Apply filter
  let filtered = tasks;
  if (currentFilter === 'active') {
    filtered = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = tasks.filter(t => t.completed);
  }

  // Sort: high priority first, then incomplete first
  filtered.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No tasks here!</p>';
  } else {
    container.innerHTML = filtered.map(task => `
      <div class="task-item" id="task-${task.id}">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}"
          onclick="toggleTask('${task.id}')"></div>
        <span class="task-text ${task.completed ? 'done' : ''}">
          ${escapeHtml(task.text)}
        </span>
        <span class="priority-badge ${task.priority}">${task.priority}</span>
        <button class="task-delete" onclick="deleteTask('${task.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join('');
  }

  // Update count
  const remaining = tasks.filter(t => !t.completed).length;
  document.getElementById('task-count').textContent =
    remaining + (remaining === 1 ? ' task remaining' : ' tasks remaining');
}

// ============================================================
// HELPER: Escape HTML to prevent XSS
// ============================================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}