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
            redeemedRewards: s.redeemedRewards || [],
            assessment: s.assessment || null
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

  const tournamentRef = db.ref(`artifacts/${appId}/public/data/tournament/current`);
  tournamentRef.on('value', (snapshot) => {
    const val = snapshot.val();
    if (val) {
      if (val.isMultiSlot && val.slots) {
        state.savedTournaments = {
          slot_1: val.slots.slot_1 || null,
          slot_2: val.slots.slot_2 || null,
          slot_3: val.slots.slot_3 || null
        };
        if (!state.activeTournamentSlot || !['slot_1', 'slot_2', 'slot_3'].includes(state.activeTournamentSlot)) {
          state.activeTournamentSlot = val.activeSlot || 'slot_1';
        }
      } else if (Array.isArray(val.rounds)) {
        state.savedTournaments = {
          slot_1: val,
          slot_2: state.savedTournaments?.slot_2 || null,
          slot_3: state.savedTournaments?.slot_3 || null
        };
      }
      state.savedTournament = state.savedTournaments[state.activeTournamentSlot] || null;
      try {
        localStorage.setItem('tt_saved_tournament', JSON.stringify({
          isMultiSlot: true,
          activeSlot: state.activeTournamentSlot,
          slots: state.savedTournaments
        }));
      } catch (e) {}
    } else {
      state.savedTournaments = { slot_1: null, slot_2: null, slot_3: null };
      state.savedTournament = null;
      try {
        localStorage.removeItem('tt_saved_tournament');
      } catch (e) {}
    }
    if (typeof renderTournamentActiveBanner === 'function') renderTournamentActiveBanner();
    if (typeof refreshTournamentModalIfOpen === 'function') refreshTournamentModalIfOpen();
  });

  const assessConfigRef = db.ref(`artifacts/${appId}/public/data/assessment_config`);
  assessConfigRef.on('value', (snapshot) => {
    const val = snapshot.val();
    if (val && typeof val === 'object') {
      state.assessmentConfig = {
        cutoffs: { ...DEFAULT_ASSESSMENT_CONFIG.cutoffs, ...(val.cutoffs || {}) },
        scores: { ...DEFAULT_ASSESSMENT_CONFIG.scores, ...(val.scores || {}) },
        grade3: {
          serve: { ...DEFAULT_ASSESSMENT_CONFIG.grade3.serve, ...(val.grade3?.serve || {}), thresholds: { ...DEFAULT_ASSESSMENT_CONFIG.grade3.serve.thresholds, ...(val.grade3?.serve?.thresholds || {}) } },
          rally: { ...DEFAULT_ASSESSMENT_CONFIG.grade3.rally, ...(val.grade3?.rally || {}), thresholds: { ...DEFAULT_ASSESSMENT_CONFIG.grade3.rally.thresholds, ...(val.grade3?.rally?.thresholds || {}) } }
        },
        grade2: {
          serve: { ...DEFAULT_ASSESSMENT_CONFIG.grade2.serve, ...(val.grade2?.serve || {}), thresholds: { ...DEFAULT_ASSESSMENT_CONFIG.grade2.serve.thresholds, ...(val.grade2?.serve?.thresholds || {}) } },
          rally: { ...DEFAULT_ASSESSMENT_CONFIG.grade2.rally, ...(val.grade2?.rally || {}), thresholds: { ...DEFAULT_ASSESSMENT_CONFIG.grade2.rally.thresholds, ...(val.grade2?.rally?.thresholds || {}) } }
        },
        badminton: {
          grade3: {
            serve: { ...DEFAULT_ASSESSMENT_CONFIG.badminton.grade3.serve, ...(val.badminton?.grade3?.serve || val.badminton?.serve || {}), thresholds: { ...DEFAULT_ASSESSMENT_CONFIG.badminton.grade3.serve.thresholds, ...(val.badminton?.grade3?.serve?.thresholds || val.badminton?.serve?.thresholds || {}) } },
            clear: { ...DEFAULT_ASSESSMENT_CONFIG.badminton.grade3.clear, ...(val.badminton?.grade3?.clear || val.badminton?.clear || {}), thresholds: { ...DEFAULT_ASSESSMENT_CONFIG.badminton.grade3.clear.thresholds, ...(val.badminton?.grade3?.clear?.thresholds || val.badminton?.clear?.thresholds || {}) } }
          },
          grade2: {
            serve: { ...DEFAULT_ASSESSMENT_CONFIG.badminton.grade2.serve, ...(val.badminton?.grade2?.serve || {}), thresholds: { ...DEFAULT_ASSESSMENT_CONFIG.badminton.grade2.serve.thresholds, ...(val.badminton?.grade2?.serve?.thresholds || {}) } },
            clear: { ...DEFAULT_ASSESSMENT_CONFIG.badminton.grade2.clear, ...(val.badminton?.grade2?.clear || {}), thresholds: { ...DEFAULT_ASSESSMENT_CONFIG.badminton.grade2.clear.thresholds, ...(val.badminton?.grade2?.clear?.thresholds || {}) } }
          }
        }
      };
      try {
        localStorage.setItem('tt_assessment_config', JSON.stringify(state.assessmentConfig));
      } catch(e) {}
      if (typeof refreshAssessmentConfigUI === 'function') {
        refreshAssessmentConfigUI();
      }
    }
  });
}

function saveGroupAssignmentToRTDB(data) {
  if (!db) return;
  db.ref(`artifacts/${appId}/public/data/group_assignment/current`).set(data).catch(e => {
    console.error("Firebase save group_assignment error:", e);
  });
}

function saveTournamentToRTDB(data, targetSlotKey = null) {
  const slotKey = targetSlotKey || state.activeTournamentSlot || 'slot_1';
  if (!state.savedTournaments) {
    state.savedTournaments = { slot_1: null, slot_2: null, slot_3: null };
  }
  state.savedTournaments[slotKey] = data ? JSON.parse(JSON.stringify(data)) : null;
  if (slotKey === state.activeTournamentSlot) {
    state.savedTournament = state.savedTournaments[slotKey];
  }

  const hasAny = !!(state.savedTournaments.slot_1 || state.savedTournaments.slot_2 || state.savedTournaments.slot_3);
  const payload = hasAny ? {
    isMultiSlot: true,
    activeSlot: state.activeTournamentSlot || 'slot_1',
    slots: state.savedTournaments
  } : null;

  try {
    if (payload) {
      localStorage.setItem('tt_saved_tournament', JSON.stringify(payload));
    } else {
      localStorage.removeItem('tt_saved_tournament');
    }
  } catch (e) {}

  if (!db) return;
  db.ref(`artifacts/${appId}/public/data/tournament/current`).set(payload ? JSON.parse(JSON.stringify(payload)) : null).catch(e => {
    console.error("Firebase save tournament error:", e);
  });
}

function saveAssessmentConfigToRTDB(config) {
  if (!db) return;
  db.ref(`artifacts/${appId}/public/data/assessment_config`).set(JSON.parse(JSON.stringify(config))).catch(e => {
    console.error("Firebase save assessment_config error:", e);
  });
}

