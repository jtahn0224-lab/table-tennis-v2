/* AUTHENTICATION & ROLE SWITCHING (STUDENT & TEACHER MODES) */

function showLoginGate() {
  renderQuickRosterChips();
  openModal('loginGateScreen');
}

function renderQuickRosterChips() {
  const container = document.getElementById('loginQuickRosterChips');
  if (!container) return;

  container.innerHTML = state.students.map(s => `
    <button onclick="quickLoginStudent('${s.id}')" class="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 font-bold px-2.5 py-1 rounded-xl transition-all">
      ${s.avatar || '🏓'} ${s.className ? `[${s.className}] ` : ''}${escapeHtml(s.name)}
    </button>
  `).join('');
}

function quickLoginStudent(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (student) {
    loggedInStudentId = student.id;
    state.activeStudentId = student.id;
    state.role = 'student';
    closeModal('loginGateScreen');
    renderUI();
    showToast(`${student.name} 부원으로 로그인되었습니다!`, '🎉');
  }
}

function toggleRoleModalFromLogin() {
  closeModal('loginGateScreen');
  openModal('roleAuthModal');
}

function isStudentMatch(s, grade, classNum, number, cleanName) {
  const norm = typeof normalizeStudentGradeClass === 'function' ? normalizeStudentGradeClass(s) : s;
  const sName = (norm.name || '').replaceAll(' ', '').trim();
  if (sName !== cleanName) return false;

  const gA = parseInt(norm.grade) || 0;
  const gB = parseInt(grade) || 0;
  const cA = parseInt(norm.classNum) || 0;
  const cB = parseInt(classNum) || 0;
  const nA = parseInt(norm.number) || 0;
  const nB = parseInt(number) || 0;

  const gradeMatch = !grade || gA === gB;
  const classMatch = !classNum || cA === cB;
  const numberMatch = !number || nA === nB;

  return gradeMatch && classMatch && numberMatch;
}

async function handleStudentLogin(e) {
  if (e) e.preventDefault();
  const grade = document.getElementById('loginGradeInput').value.trim();
  const classNum = document.getElementById('loginClassInput').value.trim();
  const number = document.getElementById('loginNumberInput').value.trim();
  const rawName = document.getElementById('loginNameInput').value.trim();
  const cleanName = rawName.replaceAll(' ', '');

  if (!rawName) {
    showToast('학생 이름을 입력해 주세요!', '⚠️');
    return;
  }

  // 1차: 로컬 state.students 에서 매칭 시도
  let existing = state.students.find(s => isStudentMatch(s, grade, classNum, number, cleanName));

  // 2차: 못 찾았거나 데이터가 비어있는 경우 RTDB에서 최신 학생 데이터 즉시 동기화 후 재시도
  if (!existing && db) {
    try {
      const snap = await db.ref(`artifacts/${appId}/public/data/students`).once('value');
      const val = snap.val();
      if (val) {
        const loaded = Object.values(val);
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
        existing = state.students.find(s => isStudentMatch(s, grade, classNum, number, cleanName));
      }
    } catch (err) {
      console.warn("RTDB sync during login failed:", err);
    }
  }

  // 3차: 정확한 학번 일치는 없지만 동명이인이 없는 경우(이름만 일치하는 1명의 학생이 있는 경우)
  if (!existing) {
    const sameNameCandidates = state.students.filter(s => (s.name || '').replaceAll(' ', '').trim() === cleanName);
    if (sameNameCandidates.length === 1) {
      const candidate = sameNameCandidates[0];
      const normCand = typeof normalizeStudentGradeClass === 'function' ? normalizeStudentGradeClass(candidate) : candidate;
      const candGradeClass = formatClassBadge(normCand);

      showCustomConfirm(
        '기존 부원 계정 확인', 
        `'${rawName}' 부원의 등록된 기존 학번은 [${candGradeClass}]입니다.\n기존 계정으로 로그인할까요?`, 
        () => {
          loggedInStudentId = candidate.id;
          state.activeStudentId = candidate.id;
          state.role = 'student';
          closeModal('loginGateScreen');
          renderUI();
          showToast(`${candidate.name} 부원으로 접속했습니다!`, '✨');
        }
      );
      return;
    } else if (sameNameCandidates.length > 1) {
      showToast(`동명이인이 존재합니다. 정확한 학년, 반, 번호를 입력해 주세요!`, '⚠️');
      return;
    }
  }

  // 매칭 성공 시 로그인 처리
  if (existing) {
    loggedInStudentId = existing.id;
    state.activeStudentId = existing.id;
    state.role = 'student';
    closeModal('loginGateScreen');
    renderUI();
    showToast(`${existing.name} 부원으로 접속했습니다!`, '✨');
  } else {
    // 정말로 신규 부원인 경우에만 생성 확인
    showCustomConfirm('신규 부원 등록 안내', `'${rawName}' 학생 정보가 목록에 없습니다. 정식으로 새 부원에 추가 등록할까요?`, () => {
      const newId = 'std_' + Date.now();
      const newStudent = {
        id: newId,
        name: rawName,
        grade: grade,
        classNum: classNum,
        number: number,
        className: formatClassBadge({ grade, classNum, number }),
        avatar: '🏓',
        unlockedAvatars: ['🏓', '🥇', '🏆', '⚡', '🔥'],
        equippedFrame: 'frame-none',
        unlockedFrames: ['frame-none'],
        equippedTitle: '🌱 탁구 입문자',
        unlockedTitles: ['🌱 탁구 입문자'],
        equippedAura: 'aura-none',
        unlockedAuras: ['aura-none'],
        equippedNameSkin: 'name-skin-none',
        unlockedNameSkins: ['name-skin-none'],
        equippedCardSkin: 'card-skin-none',
        unlockedCardSkins: ['card-skin-none'],
        equippedCeremony: 'ceremony-default',
        unlockedCeremonies: ['ceremony-default'],
        missions: getInitialMissionsForNewStudent(),
        skills: { forehand: 3, backhand: 3, serve: 3, manner: 5 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        history: [],
        redeemedRewards: []
      };
      state.students.push(newStudent);
      loggedInStudentId = newId;
      state.activeStudentId = newId;
      state.role = 'student';
      saveStudentToRTDB(newStudent);
      closeModal('loginGateScreen');
      renderUI();
      showToast('새 부원이 등록되어 로그인되었습니다!', '🎉');
    });
  }
}

function handleLogout() {
  loggedInStudentId = null;
  state.role = 'student';
  showLoginGate();
  showToast('로그아웃 되었습니다.', '👋');
}

function switchToSelfAccount() {
  if (loggedInStudentId) {
    state.activeStudentId = loggedInStudentId;
    renderUI();
    showToast('내 계정으로 돌아왔습니다.', '👤');
  }
}

function switchActiveStudent(studentId) {
  state.activeStudentId = studentId;
  renderUI();
}

function toggleRoleModal() {
  if (state.role === 'admin') {
    state.role = 'student';
    renderUI();
    showToast('부원 모드로 전환되었습니다.');
  } else {
    const errorMsg = document.getElementById('roleAuthErrorMsg');
    if (errorMsg) errorMsg.classList.add('hidden');
    const input = document.getElementById('adminRolePasscodeInput');
    if (input) input.value = '';
    openModal('roleAuthModal');
  }
}

function verifyAndSwitchToAdmin() {
  const input = document.getElementById('adminRolePasscodeInput');
  if (input && input.value === state.passcode) {
    state.role = 'admin';
    closeModal('roleAuthModal');
    closeModal('loginGateScreen');
    renderUI();
    showToast('선생님 관리자 모드로 접속되었습니다.', '🎓');
  } else {
    const errorMsg = document.getElementById('roleAuthErrorMsg');
    if (errorMsg) errorMsg.classList.remove('hidden');
  }
}

function confirmTeacherPasscode() {
  const input = document.getElementById('passcodeInput');
  if (input && input.value === state.passcode) {
    closeModal('verifyModal');
    if (pendingMissionContext) {
      const student = state.students.find(s => s.id === pendingMissionContext.studentId);
      if (student) {
        const mission = student.missions.find(m => m.id === pendingMissionContext.missionId);
        if (mission && !mission.completed) {
          toggleMissionCompletion(student, mission);
        }
      }
      pendingMissionContext = null;
    }
  } else {
    const errorMsg = document.getElementById('verifyErrorMsg');
    if (errorMsg) errorMsg.classList.remove('hidden');
  }
}
