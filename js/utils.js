/* UI UTILITIES AND SOUND/CONFETTI HELPERS */

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatClassBadge(student) {
  if (!student) return '';
  if (student.grade || student.classNum || student.number) {
    const g = student.grade ? `${student.grade}학년 ` : '';
    const c = student.classNum ? `${student.classNum}반 ` : '';
    const n = student.number ? `${student.number}번` : '';
    return `${g}${c}${n}`.trim();
  }
  return student.className || '';
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

function toggleMobileRosterDrawer() {
  const drawer = document.getElementById('studentDirectoryPanel');
  if (drawer) {
    drawer.classList.toggle('-translate-x-full');
  }
}

function showToast(message, icon = '✨') {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  const msgEl = document.getElementById('toastMessage');
  const iconEl = document.getElementById('toastIcon');
  if (msgEl) msgEl.innerText = message;
  if (iconEl) iconEl.innerText = icon;
  toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
  toast.classList.add('opacity-100', 'translate-y-0');
  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
  }, 2500);
}

function showCustomConfirm(title, message, callback) {
  const titleEl = document.getElementById('confirmModalTitle');
  const msgEl = document.getElementById('confirmModalMsg');
  if (titleEl) titleEl.innerText = title;
  if (msgEl) msgEl.innerText = message;
  confirmActionCallback = callback;
  const okBtn = document.getElementById('confirmModalOkBtn');
  if (okBtn) {
    okBtn.onclick = function() {
      closeModal('confirmModal');
      if (confirmActionCallback) confirmActionCallback();
    };
  }
  openModal('confirmModal');
}

function playSuccessSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  } catch (e) {}
}

function triggerConfetti(ceremonyType = 'ceremony-default') {
  if (typeof confetti !== 'function') return;

  if (ceremonyType === 'ceremony-crowns') {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff'],
      scalar: 1.3
    });
  } else if (ceremonyType === 'ceremony-rockets') {
    confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0.1, y: 0.8 } });
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 0.9, y: 0.8 } });
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 100, origin: { x: 0.5, y: 0.5 } });
    }, 300);
  } else if (ceremonyType === 'ceremony-pingpong') {
    confetti({
      particleCount: 90,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#ffffff', '#f97316', '#38bdf8', '#10b981'],
      scalar: 1.4
    });
  } else if (ceremonyType === 'ceremony-sakura') {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.4 },
      colors: ['#f472b6', '#fbcfe8', '#fda4af', '#ffffff', '#fecdd3'],
      ticks: 300,
      gravity: 0.6,
      scalar: 1.1,
      drift: 0.5
    });
  } else if (ceremonyType === 'ceremony-stars') {
    confetti({
      particleCount: 100,
      angle: 90,
      spread: 120,
      origin: { x: 0.5, y: 0 },
      colors: ['#fbbf24', '#fef08a', '#ffffff', '#60a5fa'],
      gravity: 1.2,
      ticks: 250,
      scalar: 1.2
    });
  } else if (ceremonyType === 'ceremony-fireworks') {
    const end = Date.now() + 1000;
    const interval = setInterval(() => {
      if (Date.now() > end) return clearInterval(interval);
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() * 0.5 }
      });
    }, 200);
  } else if (ceremonyType === 'ceremony-hearts') {
    confetti({
      particleCount: 85,
      spread: 80,
      origin: { y: 0.65 },
      colors: ['#ec4899', '#f43f5e', '#fb7185', '#fda4af', '#ffffff'],
      scalar: 1.3
    });
  } else if (ceremonyType === 'ceremony-rainbow') {
    const rainbowColors = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'];
    confetti({ particleCount: 60, angle: 60, spread: 45, origin: { x: 0, y: 0.8 }, colors: rainbowColors });
    confetti({ particleCount: 60, angle: 120, spread: 45, origin: { x: 1, y: 0.8 }, colors: rainbowColors });
  } else if (ceremonyType === 'ceremony-gold-coins') {
    confetti({
      particleCount: 110,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#d97706', '#f59e0b', '#fbbf24', '#fef08a'],
      gravity: 1.5,
      scalar: 1.5,
      startVelocity: 45
    });
  } else if (ceremonyType === 'ceremony-flame-burst') {
    confetti({
      particleCount: 95,
      spread: 100,
      origin: { y: 0.65 },
      colors: ['#dc2626', '#ea580c', '#f97316', '#fbbf24'],
      scalar: 1.3,
      startVelocity: 40
    });
  } else if (ceremonyType === 'ceremony-laser-snow') {
    confetti({
      particleCount: 90,
      spread: 120,
      origin: { x: 0.5, y: 0.1 },
      colors: ['#38bdf8', '#7dd3fc', '#e0f2fe', '#ffffff'],
      ticks: 280,
      gravity: 0.5,
      scalar: 1.0,
      drift: -0.2
    });
  } else if (ceremonyType === 'ceremony-confetti-canon') {
    confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0.1, y: 0.9 }, scalar: 1.2 });
    confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 0.9, y: 0.9 }, scalar: 1.2 });
    confetti({ particleCount: 90, spread: 100, origin: { x: 0.5, y: 0.6 }, scalar: 1.4 });
  } else if (ceremonyType === 'ceremony-lightning-storm') {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#38bdf8', '#a855f7', '#facc15', '#ffffff'],
      startVelocity: 50,
      ticks: 80,
      scalar: 1.2
    });
  } else {
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
  }
}
