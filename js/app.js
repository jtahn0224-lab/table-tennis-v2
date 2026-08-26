/* APP ENTRYPOINT & STARTUP INITIALIZATION */

// Initialize Firebase Realtime DB & Auth
if (typeof initFirebaseApp === 'function') {
  initFirebaseApp();
}

// App Startup on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  if (typeof switchMainTab === 'function') {
    switchMainTab('missions');
  }
  if (typeof renderUI === 'function') {
    renderUI();
  }
  if (typeof showLoginGate === 'function') {
    showLoginGate();
  }
});
