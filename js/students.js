import { state, session, getCurrentStudent, checkReadOnlyGuard, getInitialMissionsForNewStudent } from './state.js';
import { openModal, closeModal, showToast, showCustomConfirm, playSuccessSound, escapeHtml, formatClassBadge } from './utils.js';
import { saveStudentToRTDB, deleteStudentFromRTDB, saveSettingsToRTDB } from './db.js';
import { renderUI } from './render.js';

export function saveSkillEvaluation() {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  student.skills = {
    forehand: parseInt(document.getElementById('skillForehandRange')?.value || 3),
    backhand: parseInt(document.getElementById('skillBackhandRange')?.value || 3),
    serve: parseInt(document.getElementById('skillServeRange')?.value || 3),
    manner: parseInt(document.getElementById('skillMannerRange')?.value || 5)
  };

  saveStudentToRTDB(student);
  showToast('기술 자평 점수가 저장되었습니다!', '✨');
}

export function openAddStudentModal() {
  openModal('addStudentModal');
}

export function saveNewStudent() {
  const name = document.getElementById('addStudentNameInput')?.value.trim();
  const grade = document.getElementById('addStudentGradeInput')?.value || '';
  const classNum = document.getElementById('addStudentClassInput')?.value || '';
  const number = document.getElementById('addStudentNumberInput')?.value || '';

  if (!name) {
    showToast('학생 이름을 입력하세요!', '⚠️');
    return;
  }

  const newId = 'std_' + Date.now();
  const newStudent = {
    id: newId,
    name: name,
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
  state.activeStudentId = newId;
  saveStudentToRTDB(newStudent);
  showToast('새 부원이 등록되었습니다!', '✨');

  renderUI();
  closeModal('addStudentModal');
}

export function deleteStudent(studentId) {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 부원을 삭제할 수 있습니다.', '🔒');
    return;
  }

  if (state.students.length <= 1) {
    showToast('최소 1명의 부원 정보는 유지되어야 합니다.', '⚠️');
    return;
  }

  showCustomConfirm('부원 삭제', '해당 부원 데이터를 삭제하시겠습니까?', () => {
    state.students = state.students.filter(s => s.id !== studentId);
    if (state.activeStudentId === studentId) {
      state.activeStudentId = state.students[0].id;
    }
    deleteStudentFromRTDB(studentId);
    renderUI();
    showToast('부원 정보가 삭제되었습니다.', '🗑️');
  });
}

export function applyPointAdjustment() {
  const val = parseInt(document.getElementById('adjustPointInput')?.value);
  if (!isNaN(val)) {
    const student = getCurrentStudent();
    if (!student) return;

    student.totalPoints = Math.max(0, (student.totalPoints || 0) + val);
    
    const reason = document.getElementById('adjustPointReasonInput')?.value.trim() || '';
    if (!student.history) student.history = [];
    student.history.unshift({
      title: reason ? `[선생님 직권] ${reason}` : (val > 0 ? '[선생님 칭찬 포인트]' : '[선생님 포인트 차감]'),
      points: val,
      date: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    });

    saveStudentToRTDB(student);
    renderUI();
    showToast(`${val} P가 반영되었습니다.`, '⭐');
  }
}

export function openSettingsModal() {
  openModal('settingsModal');
}

export function toggleTeacherMode(val) {
  state.teacherMode = val;
  saveSettingsToRTDB({ passcode: state.passcode, teacherMode: state.teacherMode });
  renderUI();
}

export function updatePasscode() {
  const input = document.getElementById('newPasscodeInput');
  const val = input ? input.value.trim() : '';
  if (val.length >= 4) {
    state.passcode = val;
    saveSettingsToRTDB({ passcode: state.passcode, teacherMode: state.teacherMode });
    if (input) input.value = '';
    showToast('선생님 비밀번호가 변경되어 실시간 저장되었습니다.', '🔒');
  } else {
    showToast('비밀번호는 4자리 이상 입력해 주세요.', '⚠️');
  }
}

export function openGroupGeneratorModal() {
  const scopeSelect = document.getElementById('groupScopeSelect');
  if (scopeSelect) {
    const classes = new Set();
    state.students.forEach(s => {
      if (s.grade && s.classNum) {
        classes.add(`${s.grade}학년 ${s.classNum}반`);
      }
    });
    let opts = `<option value="all">전체 부원 (${state.students.length}명)</option>`;
    Array.from(classes).sort().forEach(c => {
      opts += `<option value="${c}">🏫 ${c}</option>`;
    });
    scopeSelect.innerHTML = opts;
  }
  openModal('groupGeneratorModal');
}

export function generateRandomGroups() {
  const scope = document.getElementById('groupScopeSelect')?.value;
  const groupSize = parseInt(document.getElementById('groupSizeSelect')?.value) || 4;

  let targetStudents = [];
  if (scope === 'all') {
    targetStudents = [...state.students];
  } else {
    targetStudents = state.students.filter(s => {
      if (s.grade && s.classNum) {
        return `${s.grade}학년 ${s.classNum}반` === scope;
      }
      return false;
    });
  }

  if (targetStudents.length === 0) {
    showToast('해당 조건의 부원이 없습니다.', '⚠️');
    return;
  }

  const shuffled = [...targetStudents];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const numGroups = Math.ceil(shuffled.length / groupSize);
  const groups = Array.from({ length: numGroups }, () => []);

  shuffled.forEach((student, idx) => {
    groups[idx % numGroups].push(student);
  });

  const container = document.getElementById('groupResultsContainer');
  const copyBtn = document.getElementById('copyGroupsBtn');
  if (!container) return;

  let html = '';
  let textCopy = `[🏓 탁구 조 편성 결과 - ${scope === 'all' ? '전체' : scope}]\n`;

  groups.forEach((group, gIdx) => {
    textCopy += `\n📌 ${gIdx + 1}조 (${group.length}명):\n`;
    html += `
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-2xs">
        <h5 class="text-xs font-black text-indigo-900 mb-2 flex justify-between items-center pb-1 border-b border-slate-200">
          <span>📌 ${gIdx + 1}조</span>
          <span class="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">${group.length}명</span>
        </h5>
        <div class="grid grid-cols-2 gap-1.5 text-xs">
          ${group.map(s => {
            textCopy += ` - ${s.number ? `${s.number}번 ` : ''}${s.name}\n`;
            return `
              <div class="bg-white p-2 rounded-xl border border-slate-100 flex items-center space-x-1.5 truncate">
                <span class="text-sm shrink-0">${s.avatar || '🏓'}</span>
                <span class="font-bold text-slate-800 truncate ${s.equippedNameSkin || 'name-skin-none'}">${s.number ? `${s.number}번 ` : ''}${escapeHtml(s.name)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  session.lastGeneratedGroupsText = textCopy;

  if (copyBtn) copyBtn.classList.remove('hidden');
  playSuccessSound();
  showToast(`${groups.length}개 조가 생성되었습니다!`, '🎲');
}

export function copyGroupResults() {
  if (!session.lastGeneratedGroupsText) return;
  const textArea = document.createElement('textarea');
  textArea.value = session.lastGeneratedGroupsText;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('조 편성 결과가 클립보드에 복사되었습니다!', '📋');
  } catch (err) {
    showToast('복사에 실패했습니다.', '⚠️');
  }
  document.body.removeChild(textArea);
}
