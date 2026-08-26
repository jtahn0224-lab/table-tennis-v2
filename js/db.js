import { db, appId, firebaseUser, ref, set, onValue, remove } from './firebase.js';
import { state, calculateLevelTitle, getInitialMissionsForNewStudent } from './state.js';

export async function saveStudentToRTDB(student) {
  if (!firebaseUser || !student || !student.id) return;
  try {
    const studentRef = ref(db, `artifacts/${appId}/public/data/students/${student.id}`);
    await set(studentRef, JSON.parse(JSON.stringify(student)));
  } catch (err) {
    console.error("Failed to save student to RTDB:", err);
  }
}

export async function deleteStudentFromRTDB(studentId) {
  if (!firebaseUser || !studentId) return;
  try {
    const studentRef = ref(db, `artifacts/${appId}/public/data/students/${studentId}`);
    await remove(studentRef);
  } catch (err) {
    console.error("Failed to delete student from RTDB:", err);
  }
}

export async function saveMatchToRTDB(match) {
  if (!firebaseUser || !match || !match.id) return;
  try {
    const matchRef = ref(db, `artifacts/${appId}/public/data/matches/${match.id}`);
    await set(matchRef, JSON.parse(JSON.stringify(match)));
  } catch (err) {
    console.error("Failed to save match to RTDB:", err);
  }
}

export async function deleteMatchFromRTDB(matchId) {
  if (!firebaseUser || !matchId) return;
  try {
    const matchRef = ref(db, `artifacts/${appId}/public/data/matches/${matchId}`);
    await remove(matchRef);
  } catch (err) {
    console.error("Failed to delete match from RTDB:", err);
  }
}

export async function saveRewardsToRTDB(rewards) {
  if (!firebaseUser || !rewards) return;
  try {
    const rewardsRef = ref(db, `artifacts/${appId}/public/data/rewards`);
    await set(rewardsRef, JSON.parse(JSON.stringify(rewards)));
  } catch (err) {
    console.error("Failed to save rewards to RTDB:", err);
  }
}

export async function saveSettingsToRTDB(settings) {
  if (!firebaseUser || !settings) return;
  try {
    const settingsRef = ref(db, `artifacts/${appId}/public/data/settings`);
    await set(settingsRef, JSON.parse(JSON.stringify(settings)));
  } catch (err) {
    console.error("Failed to save settings to RTDB:", err);
  }
}

export function setupRealtimeListeners(renderCallbacks = {}) {
  const { onStudentsUpdate, onMatchesUpdate, onRewardsUpdate, onSettingsUpdate } = renderCallbacks;

  const studentsRef = ref(db, `artifacts/${appId}/public/data/students`);
  onValue(studentsRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      const loaded = Object.values(val);
      if (loaded.length > 0) {
        state.students = loaded.map(s => ({
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
        }));
        if (typeof onStudentsUpdate === 'function') onStudentsUpdate();
      }
    }
  });

  const matchesRef = ref(db, `artifacts/${appId}/public/data/matches`);
  onValue(matchesRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      state.matchHistory = Object.values(val).sort((a, b) => b.id.localeCompare(a.id));
    } else {
      state.matchHistory = [];
    }
    if (typeof onMatchesUpdate === 'function') onMatchesUpdate();
  });

  const rewardsRef = ref(db, `artifacts/${appId}/public/data/rewards`);
  onValue(rewardsRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      state.rewards = Object.values(val);
      if (typeof onRewardsUpdate === 'function') onRewardsUpdate();
    }
  });

  const settingsRef = ref(db, `artifacts/${appId}/public/data/settings`);
  onValue(settingsRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      if (val.passcode) state.passcode = val.passcode;
      if (typeof val.teacherMode === 'boolean') {
        state.teacherMode = val.teacherMode;
        const toggle = document.getElementById('teacherModeToggle');
        if (toggle) toggle.checked = state.teacherMode;
      }
      if (typeof onSettingsUpdate === 'function') onSettingsUpdate();
    }
  });
}
