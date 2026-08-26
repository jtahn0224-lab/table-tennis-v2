/* MISSIONS & STAMP APPROVAL LOGIC */

let currentDetailMissionId = null;

function toggleMissionCompletion(student, mission) {
  mission.completed = !mission.completed;
  mission.pending = false;

  if (!student.history) student.history = [];

  const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  if (mission.completed) {
    student.totalPoints = (student.totalPoints || 0) + mission.points;
    student.history.unshift({
      title: `[미션 달성] [${mission.week || 1}주차] ${mission.title}`,
      points: mission.points,
      date: dateStr
    });
    playSuccessSound();
    triggerConfetti(student.equippedCeremony);
    showToast(`'${mission.title}' 승인 완료! (+${mission.points}P)`, '💮');
  } else {
    student.totalPoints = Math.max(0, (student.totalPoints || 0) - mission.points);
    showToast('미션 완료 상태가 취소되었습니다.', '↩️');
  }

  saveStudentToRTDB(student);
  renderUI();
}

function handleMissionCheck(id) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  const mission = student.missions.find(m => m.id === id);
  if (!mission) return;

  if (state.role === 'admin') {
    toggleMissionCompletion(student, mission);
  } else {
    if (mission.completed) {
      showToast('이미 완료된 미션입니다! (선생님 모드에서 변경 가능)', '🔒');
      return;
    }

    if (state.teacherMode) {
      if (!mission.pending) {
        mission.pending = true;
        saveStudentToRTDB(student);
        renderUI();
        showToast('선생님에게 승인 요청이 전송되었습니다!', '🚀');
      } else {
        pendingMissionContext = { studentId: student.id, missionId: id };
        document.getElementById('passcodeInput').value = '';
        document.getElementById('verifyErrorMsg').classList.add('hidden');
        openModal('verifyModal');
      }
    } else {
      toggleMissionCompletion(student, mission);
    }
  }
}

function approvePendingMission(studentId, missionId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;
  const mission = student.missions.find(m => m.id === missionId);
  if (mission) {
    toggleMissionCompletion(student, mission);
  }
}

function rejectPendingMission(studentId, missionId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;
  const mission = student.missions.find(m => m.id === missionId);
  if (mission) {
    mission.pending = false;
    saveStudentToRTDB(student);
    renderUI();
    showToast('승인 요청이 반려되었습니다.', '✋');
  }
}

function approveAllPendingMissions() {
  let approvedCount = 0;
  state.students.forEach(student => {
    if (student.missions && Array.isArray(student.missions)) {
      let updated = false;
      student.missions.forEach(m => {
        if (m.pending && !m.completed) {
          m.pending = false;
          m.completed = true;
          student.totalPoints = (student.totalPoints || 0) + m.points;
          if (!student.history) student.history = [];
          student.history.unshift({
            title: `[미션 달성] [${m.week || 1}주차] ${m.title}`,
            points: m.points,
            date: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          });
          approvedCount++;
          updated = true;
        }
      });
      if (updated) saveStudentToRTDB(student);
    }
  });

  if (approvedCount > 0) {
    renderUI();
    playSuccessSound();
    const activeStudent = getCurrentStudent();
    triggerConfetti(activeStudent?.equippedCeremony);
    showToast(`모든 대기 미션(${approvedCount}건)이 승인되었습니다!`, '🎉');
  } else {
    showToast('승인 대기 중인 미션이 없습니다.', 'ℹ️');
  }
}

function openMissionDetailModal(missionId) {
  currentDetailMissionId = missionId;
  const student = getCurrentStudent();
  const mission = student ? student.missions.find(m => m.id === missionId) : null;
  if (!mission) return;

  const isAdmin = state.role === 'admin';

  // 1. 헤더 배지 & 타이틀
  const weekBadge = document.getElementById('detailMissionWeekBadge');
  const catBadge = document.getElementById('detailMissionCategoryBadge');
  const diffBadge = document.getElementById('detailMissionDifficultyBadge');
  const ptsBadge = document.getElementById('detailMissionPointsBadge');
  const titleEl = document.getElementById('detailMissionTitle');

  if (weekBadge) weekBadge.innerText = `${mission.week || 1}주차`;
  if (catBadge) {
    catBadge.innerText = mission.category === 'team' ? '팀 챌린지' : '개인 챌린지';
    catBadge.className = mission.category === 'team' 
      ? 'bg-teal-100 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded-lg' 
      : 'bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-lg';
  }
  if (diffBadge) diffBadge.innerText = mission.difficulty || '보통';
  if (ptsBadge) ptsBadge.innerText = `+${mission.points || 20} P`;
  if (titleEl) titleEl.innerText = mission.title;

  // 2. 상태 배너
  const statusBanner = document.getElementById('detailMissionStatusBanner');
  const statusText = document.getElementById('detailMissionStatusText');
  const statusIcon = document.getElementById('detailMissionStatusIcon');

  if (statusBanner && statusText && statusIcon) {
    if (mission.completed) {
      statusBanner.className = 'p-2.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-900 text-xs font-black flex items-center justify-between shadow-2xs';
      statusText.innerText = '선생님 승인 완료 (도장 획득 💮)';
      statusIcon.innerText = '💮';
    } else if (mission.pending) {
      statusBanner.className = 'p-2.5 rounded-2xl border-2 border-amber-400 bg-amber-50 text-amber-900 text-xs font-black flex items-center justify-between shadow-2xs animate-pulse';
      statusText.innerText = '선생님 승인 대기 중 (확인 대기 ⏳)';
      statusIcon.innerText = '⏳';
    } else {
      statusBanner.className = 'p-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-between';
      statusText.innerText = '미완료 (도전 진행 중 🏓)';
      statusIcon.innerText = '🏓';
    }
  }

  // 3. 설명 (Description) 뷰 & 수정 버튼
  const editBtn = document.getElementById('detailDescEditBtn');
  const readView = document.getElementById('detailDescReadView');
  const editTextarea = document.getElementById('detailDescEditTextarea');

  if (readView) readView.innerText = mission.description || '등록된 미션 설명이 없습니다.';
  if (editTextarea) editTextarea.value = mission.description || '';

  if (editBtn) {
    if (isAdmin) editBtn.classList.remove('hidden');
    else editBtn.classList.add('hidden');
  }

  // 항상 읽기 모드로 시작
  toggleMissionDescEdit(false);

  // 4. 푸터 액션 버튼들
  const footer = document.getElementById('detailMissionFooter');
  if (footer) {
    let actionButtons = '';

    if (!isReadOnly) {
      if (isAdmin) {
        if (!mission.completed) {
          actionButtons += `
            <button onclick="approvePendingMission('${student.id}', '${mission.id}'); openMissionDetailModal('${mission.id}');" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-2xl text-xs shadow-xs transition-all flex items-center justify-center space-x-1">
              <span>도장 찍기 💮</span>
            </button>
          `;
        } else {
          actionButtons += `
            <button onclick="toggleMissionCompletion(getCurrentStudent(), getCurrentStudent().missions.find(m=>m.id==='${mission.id}')); openMissionDetailModal('${mission.id}');" class="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-2.5 rounded-2xl text-xs transition-all">
              완료 취소
            </button>
          `;
        }
      } else {
        if (!mission.completed && !mission.pending) {
          actionButtons += `
            <button onclick="handleMissionCheck('${mission.id}'); openMissionDetailModal('${mission.id}');" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-2xl text-xs shadow-xs transition-all flex items-center justify-center space-x-1">
              <span>미션 완료 / 승인 요청 🚀</span>
            </button>
          `;
        }
      }
    }

    actionButtons += `
      <button onclick="closeModal('missionDetailModal')" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-xs transition-all">
        닫기
      </button>
    `;

    footer.innerHTML = actionButtons;
  }

  openModal('missionDetailModal');
}

function toggleMissionDescEdit(isEditing) {
  if (isEditing && state.role !== 'admin') {
    showToast('선생님 모드에서만 설명을 수정할 수 있습니다.', '🔒');
    return;
  }

  const readView = document.getElementById('detailDescReadView');
  const editView = document.getElementById('detailDescEditView');
  const editBtn = document.getElementById('detailDescEditBtn');

  if (isEditing) {
    if (readView) readView.classList.add('hidden');
    if (editView) editView.classList.remove('hidden');
    if (editBtn) editBtn.classList.add('hidden');
  } else {
    if (readView) readView.classList.remove('hidden');
    if (editView) editView.classList.add('hidden');
    if (editBtn && state.role === 'admin') editBtn.classList.remove('hidden');
  }
}

function saveMissionDescFromModal() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 설명을 수정할 수 있습니다.', '🔒');
    return;
  }

  if (!currentDetailMissionId) return;

  const newDesc = document.getElementById('detailDescEditTextarea')?.value.trim() || '';

  // 모든 부원의 해당 미션 설명 일괄 업데이트
  const currentStudent = getCurrentStudent();
  const currentMission = currentStudent ? currentStudent.missions.find(m => m.id === currentDetailMissionId) : null;
  const targetTitle = currentMission ? currentMission.title : null;

  state.students.forEach(student => {
    if (student.missions && Array.isArray(student.missions)) {
      student.missions.forEach(m => {
        if (m.id === currentDetailMissionId || (targetTitle && m.title === targetTitle)) {
          m.description = newDesc;
        }
      });
      saveStudentToRTDB(student);
    }
  });

  const readView = document.getElementById('detailDescReadView');
  if (readView) readView.innerText = newDesc || '등록된 미션 설명이 없습니다.';

  toggleMissionDescEdit(false);
  renderUI();
  playSuccessSound();
  showToast('미션 설명이 성공적으로 저장되었습니다! 💾', '✨');
}

function openAddMissionModal() {
  document.getElementById('editingMissionId').value = '';
  document.getElementById('addMissionModalTitle').innerText = '✨ 새 탁구 미션 추가';
  document.getElementById('missionTitleInput').value = '';
  const descInput = document.getElementById('missionDescInput');
  if (descInput) descInput.value = '';
  openModal('addMissionModal');
}

function handleAddMission(event) {
  if (event) event.preventDefault();
  const editingId = document.getElementById('editingMissionId').value;
  const title = document.getElementById('missionTitleInput').value.trim();
  const week = parseInt(document.getElementById('missionWeekInput').value) || 1;
  const description = document.getElementById('missionDescInput')?.value.trim() || '';
  if (!title) return;

  const targetRadio = document.querySelector('input[name="missionTarget"]:checked');
  const targetScope = targetRadio ? targetRadio.value : 'all';

  const categoryRadio = document.querySelector('input[name="category"]:checked');
  const category = categoryRadio ? categoryRadio.value : 'personal';

  const difficultyRadio = document.querySelector('input[name="difficulty"]:checked');
  const difficulty = difficultyRadio ? difficultyRadio.value : '보통';
  const points = difficultyRadio ? parseInt(difficultyRadio.dataset.points) : 20;

  if (editingId) {
    state.students.forEach(student => {
      let updated = false;
      if (student.missions && Array.isArray(student.missions)) {
        student.missions.forEach(m => {
          if (m.id === editingId) {
            m.week = week;
            m.title = title;
            m.category = category;
            m.difficulty = difficulty;
            m.points = points;
            m.description = description;
            updated = true;
          }
        });
      }
      if (updated) saveStudentToRTDB(student);
    });
    showToast('미션 정보가 수정되었습니다!', '✏️');
  } else {
    const commonId = 'm_' + Date.now();
    const newMissionTemplate = {
      id: commonId,
      week: week,
      title: title,
      category: category,
      difficulty: difficulty,
      points: points,
      completed: false,
      pending: false,
      description: description
    };

    if (targetScope === 'all') {
      state.students.forEach(student => {
        if (!student.missions) student.missions = [];
        student.missions.push({ ...newMissionTemplate });
        saveStudentToRTDB(student);
      });
      showToast(`모든 부원에게 ${week}주차 미션이 추가되었습니다!`, '✨');
    } else {
      const currentStudent = getCurrentStudent();
      if (currentStudent) {
        if (!currentStudent.missions) currentStudent.missions = [];
        currentStudent.missions.push({ ...newMissionTemplate });
        saveStudentToRTDB(currentStudent);
      }
      showToast(`새 ${week}주차 미션이 추가되었습니다!`, '✨');
    }
  }

  renderUI();
  closeModal('addMissionModal');
  document.getElementById('missionTitleInput').value = '';
  const descInput = document.getElementById('missionDescInput');
  if (descInput) descInput.value = '';
}

function moveMission(missionId, direction) {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 순서를 변경할 수 있습니다.', '🔒');
    return;
  }

  const student = getCurrentStudent();
  if (!student || !student.missions) return;

  const searchVal = (document.getElementById('missionSearchInput')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('missionFilterStatus')?.value || 'all';

  let filtered = student.missions.filter(m => (m.category || 'personal') === activeTab);
  if (selectedWeek !== 'all') {
    filtered = filtered.filter(m => (m.week || 1) === selectedWeek);
  }
  if (searchVal) {
    filtered = filtered.filter(m => m.title.toLowerCase().includes(searchVal));
  }
  if (statusFilter === 'active') {
    filtered = filtered.filter(m => !m.completed);
  } else if (statusFilter === 'completed') {
    filtered = filtered.filter(m => m.completed);
  }

  const currIdx = filtered.findIndex(m => m.id === missionId);
  if (currIdx === -1) return;

  const targetIdx = direction === 'up' ? currIdx - 1 : currIdx + 1;
  if (targetIdx < 0 || targetIdx >= filtered.length) return;

  const currMission = filtered[currIdx];
  const targetMission = filtered[targetIdx];

  state.students.forEach(s => {
    if (s.missions && Array.isArray(s.missions)) {
      const idxA = s.missions.findIndex(m => m.id === currMission.id || m.title === currMission.title);
      const idxB = s.missions.findIndex(m => m.id === targetMission.id || m.title === targetMission.title);

      if (idxA !== -1 && idxB !== -1) {
        const temp = s.missions[idxA];
        s.missions[idxA] = s.missions[idxB];
        s.missions[idxB] = temp;
        saveStudentToRTDB(s);
      }
    }
  });

  renderUI();
  showToast('미션 순서가 변경되었습니다.', '↕️');
}

function deleteMission(missionId) {
  const currentStudent = getCurrentStudent();
  const targetMission = currentStudent ? currentStudent.missions.find(m => m.id === missionId) : null;
  const targetTitle = targetMission ? targetMission.title : null;

  showCustomConfirm('전체 부원 미션 삭제', '이 미션을 모든 부원의 목록에서 삭제하시겠습니까?', () => {
    state.students.forEach(student => {
      if (student.missions && Array.isArray(student.missions)) {
        student.missions = student.missions.filter(m => m.id !== missionId && (!targetTitle || m.title !== targetTitle));
        saveStudentToRTDB(student);
      }
    });

    renderUI();
    showToast('모든 부원의 목록에서 미션이 삭제되었습니다.', '🗑️');
  });
}
