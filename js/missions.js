/* MISSIONS & STAMP APPROVAL LOGIC */

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

function openAddMissionModal() {
  document.getElementById('editingMissionId').value = '';
  document.getElementById('addMissionModalTitle').innerText = '✨ 새 탁구 미션 추가';
  document.getElementById('missionTitleInput').value = '';
  openModal('addMissionModal');
}

function handleAddMission(event) {
  if (event) event.preventDefault();
  const editingId = document.getElementById('editingMissionId').value;
  const title = document.getElementById('missionTitleInput').value.trim();
  const week = parseInt(document.getElementById('missionWeekInput').value) || 1;
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
      pending: false
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
