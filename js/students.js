/* STUDENT ROSTER, SETTINGS, SKILL EVALUATION & RANDOM GROUP GENERATOR */

function saveSkillEvaluation() {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  student.skills = {
    forehand: parseInt(document.getElementById('skillForehandRange').value),
    backhand: parseInt(document.getElementById('skillBackhandRange').value),
    serve: parseInt(document.getElementById('skillServeRange').value),
    manner: parseInt(document.getElementById('skillMannerRange').value)
  };

  saveStudentToRTDB(student);
  showToast('기술 자평 점수가 저장되었습니다!', '✨');
}

function openAddStudentModal() {
  openModal('addStudentModal');
}

function saveNewStudent() {
  const name = document.getElementById('addStudentNameInput').value.trim();
  const grade = document.getElementById('addStudentGradeInput').value || '';
  const classNum = document.getElementById('addStudentClassInput').value || '';
  const number = document.getElementById('addStudentNumberInput').value || '';

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

function deleteStudent(studentId) {
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

function applyPointAdjustment() {
  const val = parseInt(document.getElementById('adjustPointInput').value);
  if (!isNaN(val)) {
    const student = getCurrentStudent();
    student.totalPoints = Math.max(0, (student.totalPoints || 0) + val);
    
    const reason = document.getElementById('adjustPointReasonInput')?.value.trim() || '';
    if (!student.history) student.history = [];
    const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    student.history.unshift({
      title: reason ? `[선생님 직권] ${reason}` : (val > 0 ? '[선생님 칭찬 포인트]' : '[선생님 포인트 차감]'),
      points: val,
      date: dateStr
    });

    saveStudentToRTDB(student);
    renderUI();
    showToast(`${val} P가 반영되었습니다.`, '⭐');
  }
}

function openSettingsModal() {
  openModal('settingsModal');
}

function toggleTeacherMode(val) {
  state.teacherMode = val;
  saveSettingsToRTDB({ passcode: state.passcode, teacherMode: state.teacherMode });
  renderUI();
}

function updatePasscode() {
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

function renderGroupButtons() {
  const isAdmin = state.role === 'admin';
  const teacherBtn = document.getElementById('groupGeneratorTeacherBtn');
  const studentBtn = document.getElementById('groupResultsStudentBtn');
  const missionTeacherBtn = document.getElementById('missionTabGroupTeacherBtn');
  const missionStudentBtn = document.getElementById('missionTabGroupStudentBtn');

  const hasGroups = !!(state.savedGroupAssignment && state.savedGroupAssignment.groups && state.savedGroupAssignment.groups.length > 0);

  if (teacherBtn) {
    if (isAdmin) teacherBtn.classList.remove('hidden');
    else teacherBtn.classList.add('hidden');
  }

  if (studentBtn) {
    if (!isAdmin && hasGroups) studentBtn.classList.remove('hidden');
    else studentBtn.classList.add('hidden');
  }

  if (missionTeacherBtn) {
    if (isAdmin) missionTeacherBtn.classList.remove('hidden');
    else missionTeacherBtn.classList.add('hidden');
  }

  if (missionStudentBtn) {
    if (!isAdmin && hasGroups) missionStudentBtn.classList.remove('hidden');
    else missionStudentBtn.classList.add('hidden');
  }
}

function openGroupGeneratorModal() {
  const isAdmin = state.role === 'admin';
  const modalTitle = document.getElementById('groupGeneratorModalTitle');
  const teacherControls = document.getElementById('groupGeneratorTeacherControls');
  const studentNotice = document.getElementById('groupGeneratorStudentNotice');
  const noticeDate = document.getElementById('groupGeneratorNoticeDate');
  const container = document.getElementById('groupResultsContainer');
  const copyBtn = document.getElementById('copyGroupsBtn');
  const resetBtn = document.getElementById('resetGroupsBtn');

  if (isAdmin) {
    if (modalTitle) modalTitle.innerHTML = '<span>🎲 랜덤 조 편성기</span>';
    if (teacherControls) teacherControls.classList.remove('hidden');
    if (studentNotice) studentNotice.classList.add('hidden');

    const scopeSelect = document.getElementById('groupScopeSelect');
    if (scopeSelect) {
      const classCountMap = {};
      state.students.forEach(s => {
        const key = getStudentExactClassKey(s);
        classCountMap[key] = (classCountMap[key] || 0) + 1;
      });

      let opts = `<option value="all">전체 부원 (총 ${state.students.length}명)</option>`;
      const exactKeys = Object.keys(classCountMap).sort(compareExactClassKeys);
      exactKeys.forEach(c => {
        opts += `<option value="${c}">🏫 ${c} (${classCountMap[c]}명)</option>`;
      });
      scopeSelect.innerHTML = opts;
    }

    if (state.savedGroupAssignment && state.savedGroupAssignment.groups && state.savedGroupAssignment.groups.length > 0) {
      renderGroupResultsDisplay(state.savedGroupAssignment);
      if (resetBtn) resetBtn.classList.remove('hidden');
    } else {
      if (resetBtn) resetBtn.classList.add('hidden');
      if (copyBtn) copyBtn.classList.add('hidden');
      if (container) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">인원 수 및 학급을 선택 후 조 편성을 실행해 주세요.</p>`;
      }
    }
  } else {
    // 🏓 학생 모드: 결과 확인 전용
    if (modalTitle) modalTitle.innerHTML = '<span>📋 탁구 경기 조 편성 결과</span>';
    if (teacherControls) teacherControls.classList.add('hidden');
    if (studentNotice) studentNotice.classList.remove('hidden');
    if (resetBtn) resetBtn.classList.add('hidden');

    if (state.savedGroupAssignment && state.savedGroupAssignment.groups && state.savedGroupAssignment.groups.length > 0) {
      if (noticeDate && state.savedGroupAssignment.createdAt) {
        noticeDate.innerText = `편성 일시: ${state.savedGroupAssignment.createdAt} (대상: ${state.savedGroupAssignment.scopeTitle || '전체'})`;
      }
      renderGroupResultsDisplay(state.savedGroupAssignment);
    } else {
      if (container) {
        container.innerHTML = `
          <div class="flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span class="text-3xl mb-2">⏳</span>
            <p class="text-xs font-bold text-slate-700">선생님이 아직 조 편성을 진행하지 않았습니다.</p>
            <p class="text-[11px] text-slate-400 mt-0.5">선생님이 조 편성을 완료하면 이곳에 자동으로 표시됩니다.</p>
          </div>
        `;
      }
      if (copyBtn) copyBtn.classList.add('hidden');
    }
  }

  openModal('groupGeneratorModal');
}

function generateRandomGroups() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 조 편성을 진행할 수 있습니다.', '🔒');
    return;
  }

  const scope = document.getElementById('groupScopeSelect')?.value || 'all';
  const groupSize = parseInt(document.getElementById('groupSizeSelect')?.value) || 4;

  let targetStudents = [];
  let scopeTitle = '전체 부원';

  if (scope === 'all') {
    targetStudents = [...state.students];
    scopeTitle = '전체 부원';
  } else {
    targetStudents = state.students.filter(s => getStudentExactClassKey(s) === scope);
    scopeTitle = scope;
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
    groups[idx % numGroups].push({
      id: student.id,
      name: student.name,
      number: student.number || '',
      className: student.className || '',
      avatar: student.avatar || '🏓',
      equippedNameSkin: student.equippedNameSkin || 'name-skin-none'
    });
  });

  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  let textCopy = `[🏓 탁구 조 편성 결과 - ${scopeTitle} (${dateStr})]\n`;
  groups.forEach((group, gIdx) => {
    textCopy += `\n📌 ${gIdx + 1}조 (${group.length}명):\n`;
    group.forEach(s => {
      textCopy += ` - ${s.number ? `${s.number}번 ` : ''}${s.name}\n`;
    });
  });

  const assignmentData = {
    scope: scope,
    scopeTitle: scopeTitle,
    groupSize: groupSize,
    groups: groups,
    createdAt: dateStr,
    textCopy: textCopy
  };

  state.savedGroupAssignment = assignmentData;
  if (typeof saveGroupAssignmentToRTDB === 'function') {
    saveGroupAssignmentToRTDB(assignmentData);
  }

  renderGroupResultsDisplay(assignmentData);
  renderGroupButtons();
  playSuccessSound();
  showToast(`${groups.length}개 조가 생성 및 실시간 저장되었습니다! 💾`, '🎲');
}

function renderGroupResultsDisplay(assignmentData) {
  const container = document.getElementById('groupResultsContainer');
  const copyBtn = document.getElementById('copyGroupsBtn');
  const resetBtn = document.getElementById('resetGroupsBtn');
  if (!container || !assignmentData || !assignmentData.groups) return;

  let html = '';
  assignmentData.groups.forEach((group, gIdx) => {
    html += `
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-2xs">
        <h5 class="text-xs font-black text-indigo-900 mb-2 flex justify-between items-center pb-1 border-b border-slate-200">
          <span>📌 ${gIdx + 1}조</span>
          <span class="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">${group.length}명</span>
        </h5>
        <div class="grid grid-cols-2 gap-1.5 text-xs">
          ${group.map(s => `
            <div class="bg-white p-2 rounded-xl border border-slate-100 flex items-center space-x-1.5 truncate">
              <span class="text-sm shrink-0">${s.avatar || '🏓'}</span>
              <span class="font-bold text-slate-800 truncate ${s.equippedNameSkin || 'name-skin-none'}">${s.number ? `${s.number}번 ` : ''}${escapeHtml(s.name)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  lastGeneratedGroupsText = assignmentData.textCopy || '';
  if (copyBtn) copyBtn.classList.remove('hidden');
  if (resetBtn && state.role === 'admin') resetBtn.classList.remove('hidden');
}

function resetGroupAssignment() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 리셋할 수 있습니다.', '🔒');
    return;
  }

  showCustomConfirm('조 편성 초기화 (리셋)', '저장된 조 편성 결과를 삭제하고 초기화하시겠습니까? 학생들의 화면에서도 편성 결과가 사라집니다.', () => {
    state.savedGroupAssignment = null;
    lastGeneratedGroupsText = '';

    if (typeof saveGroupAssignmentToRTDB === 'function') {
      saveGroupAssignmentToRTDB(null);
    }

    const container = document.getElementById('groupResultsContainer');
    const copyBtn = document.getElementById('copyGroupsBtn');
    const resetBtn = document.getElementById('resetGroupsBtn');

    if (container) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <span class="text-3xl mb-2">🎲</span>
          <p class="text-xs font-bold text-slate-700">조 편성 결과가 초기화되었습니다.</p>
          <p class="text-[11px] text-slate-400 mt-0.5">상단의 학급 및 인원수를 선택하고 다시 편성을 실행할 수 있습니다.</p>
        </div>
      `;
    }

    if (copyBtn) copyBtn.classList.add('hidden');
    if (resetBtn) resetBtn.classList.add('hidden');

    renderGroupButtons();
    showToast('조 편성 결과가 성공적으로 리셋되었습니다.', '🔄');
  });
}

function copyGroupResults() {
  if (!lastGeneratedGroupsText) return;
  const textArea = document.createElement('textarea');
  textArea.value = lastGeneratedGroupsText;
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
