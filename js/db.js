/* REALTIME DATABASE & FIREBASE DATA LAYER */

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'pingpong_challenge_default';
const appId = rawAppId.replace(/[.#$\[\]]/g, '_');

let firebaseUser = null;
let db = null;
let auth = null;

function initFirebaseApp() {
  const firebaseConfig = {
    apiKey: "AIzaSyDL8FfQqIsBbjRoERiKncCWYvu70q_gSLc",
    authDomain: "tabletennis-1e702.firebaseapp.com",
    databaseURL: "https://tabletennis-1e702-default-rtdb.firebaseio.com",
    projectId: "tabletennis-1e702",
    storageBucket: "tabletennis-1e702.firebasestorage.app",
    messagingSenderId: "970232813868",
    appId: "1:970232813868:web:5c0be16f8b396a5d70f489",
    measurementId: "G-D7RD6QR52T"
  };

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
    auth = firebase.auth();

    auth.signInAnonymously().then((cred) => {
      firebaseUser = cred.user;
      console.log("Firebase Anonymous Auth Success:", firebaseUser.uid);
      const statusEl = document.getElementById('rtDbStatusText');
      if (statusEl) statusEl.innerText = "리얼타임 DB 연결 완료 🔥";
      setupRealtimeListeners();
    }).catch((err) => {
      console.error("Firebase Auth Error:", err);
      const statusEl = document.getElementById('rtDbStatusText');
      if (statusEl) statusEl.innerText = "DB 연결 오류 발생 ⚠️";
    });
  } catch (e) {
    console.error("Firebase Init Error:", e);
  }
}

async function saveStudentToRTDB(student) {
  if (!db || !student || !student.id) return;
  try {
    const studentRef = db.ref(`artifacts/${appId}/public/data/students/${student.id}`);
    await studentRef.set(JSON.parse(JSON.stringify(student)));
  } catch (err) {
    console.error("Failed to save student to RTDB:", err);
  }
}

async function deleteStudentFromRTDB(studentId) {
  if (!db || !studentId) return;
  try {
    const studentRef = db.ref(`artifacts/${appId}/public/data/students/${studentId}`);
    await studentRef.remove();
  } catch (err) {
    console.error("Failed to delete student from RTDB:", err);
  }
}

async function saveMatchToRTDB(match) {
  if (!db || !match || !match.id) return;
  try {
    const matchRef = db.ref(`artifacts/${appId}/public/data/matches/${match.id}`);
    await matchRef.set(JSON.parse(JSON.stringify(match)));
  } catch (err) {
    console.error("Failed to save match to RTDB:", err);
  }
}

async function deleteMatchFromRTDB(matchId) {
  if (!db || !matchId) return;
  try {
    const matchRef = db.ref(`artifacts/${appId}/public/data/matches/${matchId}`);
    await matchRef.remove();
  } catch (err) {
    console.error("Failed to delete match from RTDB:", err);
  }
}

async function saveRewardsToRTDB(rewards) {
  if (!db || !rewards) return;
  try {
    const rewardsRef = db.ref(`artifacts/${appId}/public/data/rewards`);
    await rewardsRef.set(JSON.parse(JSON.stringify(rewards)));
  } catch (err) {
    console.error("Failed to save rewards to RTDB:", err);
  }
}

async function saveSettingsToRTDB(settings) {
  if (!db || !settings) return;
  try {
    const settingsRef = db.ref(`artifacts/${appId}/public/data/settings`);
    await settingsRef.set(JSON.parse(JSON.stringify(settings)));
  } catch (err) {
    console.error("Failed to save settings to RTDB:", err);
  }
}

function setupRealtimeListeners() {
  if (!db) return;

  const studentsRef = db.ref(`artifacts/${appId}/public/data/students`);
  studentsRef.on('value', (snapshot) => {
    const val = snapshot.val();
    if (val) {
      const loaded = Object.values(val);
      if (loaded.length > 0) {
        state.students = loaded.map(rawS => {
          const s = typeof normalizeStudentGradeClass === 'function' ? normalizeStudentGradeClass(rawS) : rawS;
          return {
            ...s,
            skills: s.skills || { forehand: 3, backhand: 3, serve: 3, manner: 5 },
            missions: s.missions || getInitialMissionsForNewStudent(),
            unlockedAvatars: s.unlockedAvatars || ['🏓', '🥇', '🏆', '⚡', '🔥', s.avatar],
            equippedFrame: s.equippedFrame || 'frame-none',
            unlockedFrames: s.unlockedFrames || ['frame-none'],
            equippedTitle: s.equippedTitle || calculateLevelTitle(s.totalPoints || 0),
            unlockedTitles: s.unlockedTitles || [calculateLevelTitle(s.totalPoints || 0)],
            equippedAura: s.equippedAura || 'aura-none',
            unlockedAuras: s.unlockedAuras || ['aura-none'],
            equippedNameSkin: s.equippedNameSkin || 'name-skin-none',
            unlockedNameSkins: s.unlockedNameSkins || ['name-skin-none'],
            equippedCardSkin: s.equippedCardSkin || 'card-skin-none',
            unlockedCardSkins: s.unlockedCardSkins || ['card-skin-none'],
            equippedCeremony: s.equippedCeremony || 'ceremony-default',
            unlockedCeremonies: s.unlockedCeremonies || ['ceremony-default'],
            history: s.history || [],
            redeemedRewards: s.redeemedRewards || []
          };
        });
        if (typeof renderUI === 'function') renderUI();
        if (typeof renderQuickRosterChips === 'function') renderQuickRosterChips();
      }
    }
  });

  const matchesRef = db.ref(`artifacts/${appId}/public/data/matches`);
  matchesRef.on('value', (snapshot) => {
    const val = snapshot.val();
    if (val) {
      state.matchHistory = Object.values(val).sort((a, b) => b.id.localeCompare(a.id));
      if (typeof renderMatchesView === 'function') renderMatchesView();
    } else {
      state.matchHistory = [];
      if (typeof renderMatchesView === 'function') renderMatchesView();
    }
  });

  const rewardsRef = db.ref(`artifacts/${appId}/public/data/rewards`);
  rewardsRef.on('value', (snapshot) => {
    const val = snapshot.val();
    if (val) {
      state.rewards = Object.values(val);
      if (typeof renderRewardsList === 'function') renderRewardsList();
    }
  });

  const settingsRef = db.ref(`artifacts/${appId}/public/data/settings`);
  settingsRef.on('value', (snapshot) => {
    const val = snapshot.val();
    if (val) {
      if (val.passcode) state.passcode = val.passcode;
      if (typeof val.teacherMode === 'boolean') {
        state.teacherMode = val.teacherMode;
        const toggle = document.getElementById('teacherModeToggle');
        if (toggle) toggle.checked = state.teacherMode;
      }
    }
  });

  const groupRef = db.ref(`artifacts/${appId}/public/data/group_assignment/current`);
  groupRef.on('value', (snapshot) => {
    const val = snapshot.val();
    state.savedGroupAssignment = val || null;
    if (typeof renderGroupButtons === 'function') renderGroupButtons();
  });
}

function saveGroupAssignmentToRTDB(data) {
  if (!db) return;
  db.ref(`artifacts/${appId}/public/data/group_assignment/current`).set(data).catch(e => {
    console.error("Firebase save group_assignment error:", e);
  });
}
