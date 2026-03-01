// ============================================================
// FocusForge | timer.js
// Pomodoro focus timer system
// ============================================================

// ============================================================
// TIMER STATE
// ============================================================

const TimerState = {
  mode: 'pomodoro',
  isRunning: false,
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  sessionCount: 1,
  completedSessions: 0,
  interval: null,

  // Durations in minutes
  durations: {
    pomodoro: 25,
    short: 5,
    long: 15,
  },
};

// ============================================================
// INIT TIMER
// ============================================================

function initTimer() {
  updateTimerDisplay();
  updateSessionDots();
  renderSessionLog();

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchMode(btn.dataset.mode);
    });
  });
}

// ============================================================
// SWITCH MODE
// ============================================================

function switchMode(mode) {
  if (TimerState.isRunning) return;

  TimerState.mode = mode;
  TimerState.timeLeft = TimerState.durations[mode] * 60;
  TimerState.totalTime = TimerState.durations[mode] * 60;

  // Update mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // Update ring color based on mode
  const ring = document.getElementById('ring-progress');
  if (mode === 'pomodoro') ring.style.stroke = 'var(--primary)';
  else if (mode === 'short') ring.style.stroke = 'var(--green)';
  else ring.style.stroke = 'var(--blue)';

  updateTimerDisplay();
  updateRing(1);
}

// ============================================================
// TOGGLE TIMER (Play/Pause)
// ============================================================

function toggleTimer() {
  if (TimerState.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  TimerState.isRunning = true;

  // Update button icon
  document.getElementById('timer-icon').className = 'fa-solid fa-pause';

  TimerState.interval = setInterval(() => {
    TimerState.timeLeft--;

    updateTimerDisplay();
    updateRing(TimerState.timeLeft / TimerState.totalTime);

    if (TimerState.timeLeft <= 0) {
      completeSession();
    }
  }, 1000);
}

function pauseTimer() {
  TimerState.isRunning = false;
  clearInterval(TimerState.interval);
  document.getElementById('timer-icon').className = 'fa-solid fa-play';
}

// ============================================================
// RESET TIMER
// ============================================================

function resetTimer() {
  pauseTimer();
  TimerState.timeLeft = TimerState.durations[TimerState.mode] * 60;
  TimerState.totalTime = TimerState.durations[TimerState.mode] * 60;
  updateTimerDisplay();
  updateRing(1);
}

// ============================================================
// SKIP TIMER
// ============================================================

function skipTimer() {
  pauseTimer();
  completeSession();
}

// ============================================================
// COMPLETE SESSION
// ============================================================

function completeSession() {
  pauseTimer();

  // Only log actual pomodoro sessions
  if (TimerState.mode === 'pomodoro') {
    TimerState.completedSessions++;

    // Log session
    const sessions = Storage.get('ff_sessions') || [];
    sessions.push({
      id: generateId(),
      date: getTodayKey(),
      duration: TimerState.durations.pomodoro,
      completedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    Storage.set('ff_sessions', sessions);

    // Update session counter
    if (TimerState.sessionCount >= 4) {
      TimerState.sessionCount = 1;
    } else {
      TimerState.sessionCount++;
    }

    updateSessionDots();
    renderSessionLog();
    updateDashboard();

    // Auto switch to break
    if (TimerState.completedSessions % 4 === 0) {
      switchMode('long');
      showNotification('🎉 Great work! Time for a long break!');
    } else {
      switchMode('short');
      showNotification('✅ Session done! Take a short break.');
    }
  } else {
    // Break finished — go back to pomodoro
    switchMode('pomodoro');
    showNotification('⚡ Break over! Time to focus!');
  }
}

// ============================================================
// UPDATE DISPLAY
// ============================================================

function updateTimerDisplay() {
  const mins = Math.floor(TimerState.timeLeft / 60);
  const secs = TimerState.timeLeft % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  document.getElementById('timer-display').textContent = display;

  // Update page title so they can see it in other tabs
  document.title = TimerState.isRunning
    ? `${display} - FocusForge`
    : 'FocusForge';
}

// ============================================================
// UPDATE RING PROGRESS
// ============================================================

function updateRing(progress) {
  const ring = document.getElementById('ring-progress');
  const circumference = 565;
  const offset = circumference * (1 - progress);
  ring.style.strokeDashoffset = offset;
}

// ============================================================
// SESSION DOTS
// ============================================================

function updateSessionDots() {
  const dots = document.querySelectorAll('.dot');
  const current = TimerState.sessionCount;

  dots.forEach((dot, index) => {
    dot.classList.remove('active', 'done');
    if (index + 1 < current) {
      dot.classList.add('done');
    } else if (index + 1 === current) {
      dot.classList.add('active');
    }
  });

  document.getElementById('session-count').textContent = current;
}

// ============================================================
// SESSION LOG
// ============================================================

function renderSessionLog() {
  const sessions = Storage.get('ff_sessions') || [];
  const today = getTodayKey();
  const todaySessions = sessions
    .filter(s => s.date === today)
    .reverse();

  const container = document.getElementById('session-log');

  if (todaySessions.length === 0) {
    container.innerHTML = '<p class="empty-state">No sessions yet!</p>';
    return;
  }

  container.innerHTML = todaySessions.map((s, i) => `
    <div class="session-log-item">
      <span>🍅 Session ${todaySessions.length - i}</span>
      <span>${s.duration} mins</span>
      <span>${s.completedAt}</span>
    </div>
  `).join('');
}

// ============================================================
// APPLY SETTINGS
// ============================================================

function applySettings() {
  const pomodoro = parseInt(document.getElementById('set-pomodoro').value) || 25;
  const shortBreak = parseInt(document.getElementById('set-short').value) || 5;
  const longBreak = parseInt(document.getElementById('set-long').value) || 15;

  TimerState.durations.pomodoro = pomodoro;
  TimerState.durations.short = shortBreak;
  TimerState.durations.long = longBreak;

  // Reset current timer with new duration
  resetTimer();

  showNotification('⚙️ Settings applied!');
}

// ============================================================
// NOTIFICATION
// ============================================================

function showNotification(message) {
  // Browser notification if permitted
  if (Notification.permission === 'granted') {
    new Notification('FocusForge', {
      body: message,
      icon: '⚡',
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  // In-app toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--bg2);
    border: 1px solid var(--primary);
    border-radius: 12px;
    padding: 14px 20px;
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}