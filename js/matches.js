import { state, session, getCurrentStudent } from './state.js';
import { openModal, closeModal, showToast, showCustomConfirm, playSuccessSound, triggerConfetti, escapeHtml, formatClassBadge } from './utils.js';
import { saveStudentToRTDB, saveMatchToRTDB, deleteMatchFromRTDB } from './db.js';
import { renderUI } from './render.js';

export function openScoreboardModal() {
  const p1Select = document.getElementById('sbPlayer1Select');
  if (!p1Select) return;
  p1Select.innerHTML = state.students.map(s => 
    `<option value="${s.id}">👤 [${formatClassBadge(s)}] ${escapeHtml(s.name)}</option>`
  ).join('');
  updateScoreboardPlayer2();
  resetScoreboard();
  openModal('scoreboardModal');
}

export function updateScoreboardPlayer2() {
  const p1Id = document.getElementById('sbPlayer1Select')?.value;
  const p2Select = document.getElementById('sbPlayer2Select');
  if (!p1Id || !p2Select) return;

  const p1 = state.students.find(s => s.id === p1Id);
  if (!p1) return;

  const sameClass = state.students.filter(s => s.id !== p1Id && s.grade === p1.grade && s.classNum === p1.classNum);
  p2Select.innerHTML = sameClass.map(s => 
    `<option value="${s.id}">👤 [${formatClassBadge(s)}] ${escapeHtml(s.name)}</option>`
  ).join('');
}

export function updateScore(playerNum, delta) {
  if (playerNum === 1) session.sbState.score1 = Math.max(0, session.sbState.score1 + delta);
  if (playerNum === 2) session.sbState.score2 = Math.max(0, session.sbState.score2 + delta);

  const score1El = document.getElementById('sbScore1Text');
  const score2El = document.getElementById('sbScore2Text');
  if (score1El) score1El.innerText = session.sbState.score1;
  if (score2El) score2El.innerText = session.sbState.score2;

  const total = session.sbState.score1 + session.sbState.score2;
  const isDeuce = session.sbState.score1 >= 10 && session.sbState.score2 >= 10;
  
  let server = 1;
  if (isDeuce) {
    server = (total % 2 === 0) ? 1 : 2;
  } else {
    server = (Math.floor(total / 2) % 2 === 0) ? 1 : 2;
  }

  const p1Badge = document.getElementById('sbP1ServeBadge');
  const p2Badge = document.getElementById('sbP2ServeBadge');
  if (p1Badge) p1Badge.style.opacity = server === 1 ? '1' : '0';
  if (p2Badge) p2Badge.style.opacity = server === 2 ? '1' : '0';
}

export function resetScoreboard() {
  session.sbState.score1 = 0;
  session.sbState.score2 = 0;
  updateScore(1, 0);
}

export function endScoreboardMatch() {
  const p1Select = document.getElementById('sbPlayer1Select');
  const p2Select = document.getElementById('sbPlayer2Select');
  if (!p1Select || !p2Select) return;

  const p1Id = p1Select.value;
  const p2Id = p2Select.value;
  const s1 = session.sbState.score1;
  const s2 = session.sbState.score2;

  if (!p1Id || !p2Id || p1Id === p2Id) {
    showToast('선수를 올바르게 선택해 주세요!', '⚠️');
    return;
  }

  if (s1 === s2) {
    showToast('무승부는 허용되지 않습니다!', '⚠️');
    return;
  }

  const p1 = state.students.find(s => s.id === p1Id);
  const p2 = state.students.find(s => s.id === p2Id);
  if (!p1 || !p2) return;

  const winner = s1 > s2 ? p1 : p2;
  const loser = s1 > s2 ? p2 : p1;

  winner.wins = (winner.wins || 0) + 1;
  winner.totalPoints = (winner.totalPoints || 0) + 10;
  loser.losses = (loser.losses || 0) + 1;
  loser.totalPoints = (loser.totalPoints || 0) + 5;

  const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  if (!winner.history) winner.history = [];
  winner.history.unshift({
    title: `[경기 승리] vs ${loser.name} (${s1}:${s2})`,
    points: 10,
    date: dateStr
  });

  if (!loser.history) loser.history = [];
  loser.history.unshift({
    title: `[경기 참가] vs ${winner.name} (${s1}:${s2})`,
    points: 5,
    date: dateStr
  });

  const matchObj = {
    id: 'm_' + Date.now(),
    p1Name: p1.name,
    p2Name: p2.name,
    p1Id: p1.id,
    p2Id: p2.id,
    score1: s1,
    score2: s2,
    winnerName: winner.name,
    winnerId: winner.id,
    date: dateStr
  };

  saveStudentToRTDB(winner);
  saveStudentToRTDB(loser);
  saveMatchToRTDB(matchObj);

  closeModal('scoreboardModal');
  playSuccessSound();
  triggerConfetti(winner.equippedCeremony);
  showToast(`경기 결과 저장 완료! (${winner.name} 승리 +10P)`, '🏆');
}

export function openMatchRecordModal() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 경기 결과를 기록할 수 있습니다.', '🔒');
    return;
  }

  const p1Select = document.getElementById('matchPlayer1Select');
  if (!p1Select) return;

  p1Select.innerHTML = state.students.map(s => 
    `<option value="${s.id}">👤 [${formatClassBadge(s)}] ${escapeHtml(s.name)}</option>`
  ).join('');

  updatePlayer2Options();
  openModal('matchRecordModal');
}

export function updatePlayer2Options() {
  const p1Id = document.getElementById('matchPlayer1Select')?.value;
  const p2Select = document.getElementById('matchPlayer2Select');
  if (!p1Id || !p2Select) return;

  const p1 = state.students.find(s => s.id === p1Id);
  if (!p1) return;

  const sameClassStudents = state.students.filter(s => {
    if (s.id === p1Id) return false;
    if (p1.grade && p1.classNum) {
      return s.grade === p1.grade && s.classNum === p1.classNum;
    }
    return true;
  });

  if (sameClassStudents.length === 0) {
    p2Select.innerHTML = `<option value="">(해당 학년·반에 대결 상대가 없습니다)</option>`;
    p2Select.disabled = true;
  } else {
    p2Select.disabled = false;
    p2Select.innerHTML = sameClassStudents.map(s => `
      <option value="${s.id}">👤 [${formatClassBadge(s)}] ${escapeHtml(s.name)}</option>
    `).join('');
  }
}

export function deleteTimelineLog(index) {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 활동 기록을 삭제할 수 있습니다.', '🔒');
    return;
  }

  const student = getCurrentStudent();
  if (!student || !student.history || !student.history[index]) return;

  const logItem = student.history[index];
  showCustomConfirm('활동 기록 삭제', `'${logItem.title}' 내역을 삭제하시겠습니까?`, () => {
    student.history.splice(index, 1);
    saveStudentToRTDB(student);
    renderUI();
    showToast('활동 기록이 삭제되었습니다.', '🗑️');
  });
}

export function handleRecordMatch(event) {
  if (event) event.preventDefault();
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 기록 가능합니다.', '🔒');
    return;
  }

  const p1Id = document.getElementById('matchPlayer1Select')?.value;
  const p2Id = document.getElementById('matchPlayer2Select')?.value;
  const s1 = parseInt(document.getElementById('matchScore1')?.value) || 0;
  const s2 = parseInt(document.getElementById('matchScore2')?.value) || 0;

  if (!p1Id || !p2Id || p1Id === p2Id) {
    showToast('서로 다른 두 부원을 선택해 주세요!', '⚠️');
    return;
  }

  if (s1 === s2) {
    showToast('무승부는 허용되지 않습니다!', '⚠️');
    return;
  }

  const p1 = state.students.find(s => s.id === p1Id);
  const p2 = state.students.find(s => s.id === p2Id);
  if (!p1 || !p2) return;

  const winner = s1 > s2 ? p1 : p2;
  const loser = s1 > s2 ? p2 : p1;

  winner.wins = (winner.wins || 0) + 1;
  winner.totalPoints = (winner.totalPoints || 0) + 10;
  loser.losses = (loser.losses || 0) + 1;
  loser.totalPoints = (loser.totalPoints || 0) + 5;

  const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  if (!winner.history) winner.history = [];
  winner.history.unshift({
    title: `[경기 승리] vs ${loser.name} (${s1}:${s2})`,
    points: 10,
    date: dateStr
  });

  if (!loser.history) loser.history = [];
  loser.history.unshift({
    title: `[경기 참가] vs ${winner.name} (${s1}:${s2})`,
    points: 5,
    date: dateStr
  });

  const matchObj = {
    id: 'm_' + Date.now(),
    p1Name: p1.name,
    p2Name: p2.name,
    p1Id: p1.id,
    p2Id: p2.id,
    score1: s1,
    score2: s2,
    winnerName: winner.name,
    winnerId: winner.id,
    date: dateStr
  };

  saveStudentToRTDB(winner);
  saveStudentToRTDB(loser);
  saveMatchToRTDB(matchObj);

  closeModal('matchRecordModal');
  playSuccessSound();
  triggerConfetti(winner.equippedCeremony);
  showToast(`경기 결과 저장 완료! (${winner.name} 승리 +10P)`, '🏆');
}

export function deleteMatchRecord(matchId) {
  const match = state.matchHistory.find(m => m.id === matchId);
  if (!match) return;

  showCustomConfirm('경기 기록 삭제', '이 경기를 삭제하면 승패 및 포인트(+10P/+5P)가 차감 복원됩니다. 진행할까요?', () => {
    const winner = state.students.find(s => s.id === match.winnerId || s.name === match.winnerName);
    const loser = state.students.find(s => s.id !== winner?.id && (s.name === match.p1Name || s.name === match.p2Name));

    if (winner) {
      winner.wins = Math.max(0, (winner.wins || 0) - 1);
      winner.totalPoints = Math.max(0, (winner.totalPoints || 0) - 10);
      saveStudentToRTDB(winner);
    }
    if (loser) {
      loser.losses = Math.max(0, (loser.losses || 0) - 1);
      loser.totalPoints = Math.max(0, (loser.totalPoints || 0) - 5);
      saveStudentToRTDB(loser);
    }

    deleteMatchFromRTDB(matchId);
    showToast('경기 기록이 삭제 및 원상 복구되었습니다.', '🗑️');
  });
}
