import { state, session, getInitialMissionsForNewStudent } from './state.js';
import { openModal, closeModal, showToast, showCustomConfirm, escapeHtml, formatClassBadge } from './utils.js';
import { saveStudentToRTDB } from './db.js';
import { renderUI } from './render.js';
import { toggleMissionCompletion } from './missions.js';

export function showLoginGate() {
  renderQuickRosterChips();
  openModal('loginGateScreen');
}

export function renderQuickRosterChips() {
  const container = document.getElementById('loginQuickRosterChips');
  if (!container) return;

  container.innerHTML = state.students.map(s => `
    <button onclick="quickLoginStudent('${s.id}')" class="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 font-bold px-2.5 py-1 rounded-xl transition-all">
      ${s.avatar || '🏓'} ${s.className ? `[${s.className}] ` : ''}${escapeHtml(s.name)}
    </button>
  `).join('');
}

export function quickLoginStudent(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (student) {
    session.loggedInStudentId = student.id;
    state.activeStudentId = student.id;
    state.role = 'student';
    closeModal('loginGateScreen');
    renderUI();
    showToast(`${student.name} 부원으로 로그인되었습니다!`, '🎉');
  }
}

export function toggleRoleModalFromLogin() {
  closeModal('loginGateScreen');
  openModal('roleAuthModal');
}

export function handleStudentLogin(e) {
  if (e) e.preventDefault();
  const gradeInput = document.getElementById('loginGradeInput');
  const classInput = document.getElementById('loginClassInput');
  const numberInput = document.getElementById('loginNumberInput');
  const nameInput = document.getElementById('loginNameInput');

  const grade = gradeInput ? gradeInput.value.trim() : '';
  const classNum = classInput ? classInput.value.trim() : '';
  const number = numberInput ? numberInput.value.trim() : '';
  const rawName = nameInput ? nameInput.value.trim() : '';
  const name = rawName.replaceAll(' ', '');

  if (!rawName) {
    showToast('학생 이름을 입력해 주세요!', '⚠️');
    return;
  }

  let existing = state.students.find(s => {
    const sName = (s.name || '').replaceAll(' ', '');
    const sameGrade = String(s.grade) === String(grade);
    const sameClass = String(s.classNum) === String(classNum);
    const sameNumber = String(s.number) === String(number);
    return sameGrade && sameClass && sameNumber && sName === name;
  });

  if (!existing) {
    const sameNameStudent = state.students.find(s => (s.name || '').replaceAll(' ', '') === name);
    if (sameNameStudent) {
      showToast(`학번을 확인하세요! 등록된 학번: [${formatClassBadge(sameNameStudent)}]`, '⚠️');
      return;
    }
  }

  if (existing) {
    session.loggedInStudentId = existing.id;
    state.activeStudentId = existing.id;
    state.role = 'student';
    closeModal('loginGateScreen');
    renderUI();
    showToast(`${existing.name} 부원으로 접속했습니다!`, '✨');
  } else {
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
      session.loggedInStudentId = newId;
      state.activeStudentId = newId;
      state.role = 'student';
      saveStudentToRTDB(newStudent);
      closeModal('loginGateScreen');
      renderUI();
      showToast('새 부원이 등록되어 로그인되었습니다!', '🎉');
    });
  }
}

export function handleLogout() {
  session.loggedInStudentId = null;
  state.role = 'student';
  showLoginGate();
  showToast('로그아웃 되었습니다.', '👋');
}

export function switchToSelfAccount() {
  if (session.loggedInStudentId) {
    state.activeStudentId = session.loggedInStudentId;
    renderUI();
    showToast('내 계정으로 돌아왔습니다.', '👤');
  }
}

export function switchActiveStudent(studentId) {
  state.activeStudentId = studentId;
  renderUI();
}

export function toggleRoleModal() {
  if (state.role === 'admin') {
    state.role = 'student';
    renderUI();
    showToast('부원 모드로 전환되었습니다.');
  } else {
    openModal('roleAuthModal');
  }
}

export function verifyAndSwitchToAdmin() {
  const input = document.getElementById('adminRolePasscodeInput');
  if (input && input.value === state.passcode) {
    state.role = 'admin';
    closeModal('roleAuthModal');
    closeModal('loginGateScreen');
    renderUI();
    showToast('선생님 관리자 모드로 접속되었습니다.', '🎓');
  } else {
    const errorEl = document.getElementById('roleAuthErrorMsg');
    if (errorEl) errorEl.classList.remove('hidden');
  }
}

export function confirmTeacherPasscode() {
  const input = document.getElementById('passcodeInput')?.value;
  if (input === state.passcode) {
    closeModal('verifyModal');
    if (session.pendingMissionContext) {
      const student = state.students.find(s => s.id === session.pendingMissionContext.studentId);
      if (student) {
        const mission = student.missions.find(m => m.id === session.pendingMissionContext.missionId);
        if (mission && !mission.completed) {
          toggleMissionCompletion(student, mission);
        }
      }
      session.pendingMissionContext = null;
    }
  } else {
    const errorEl = document.getElementById('verifyErrorMsg');
    if (errorEl) errorEl.classList.remove('hidden');
  }
}
