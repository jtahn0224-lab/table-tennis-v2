/* MATCH RECORDS & LIVE REFEREE SCOREBOARD */

let sbMode = 'singles'; // 'singles' (단식) | 'doubles' (복식)
let sbManualServerOverride = null;

function setScoreboardMode(mode) {
  sbMode = mode;
  const singlesBtn = document.getElementById('sbModeSinglesBtn');
  const doublesBtn = document.getElementById('sbModeDoublesBtn');
  const singlesContainer = document.getElementById('sbSinglesPlayerContainer');
  const doublesContainer = document.getElementById('sbDoublesPlayerContainer');
  const doublesGuide = document.getElementById('sbDoublesOrderGuide');

  if (mode === 'singles') {
    if (singlesBtn) {
      singlesBtn.className = "px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all bg-emerald-600 text-white shadow-md flex items-center space-x-1.5 cursor-pointer";
    }
    if (doublesBtn) {
      doublesBtn.className = "px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all text-slate-400 hover:text-white flex items-center space-x-1.5 cursor-pointer";
    }
    if (singlesContainer) singlesContainer.classList.remove('hidden');
    if (doublesContainer) doublesContainer.classList.add('hidden');
    if (doublesGuide) doublesGuide.classList.add('hidden');
  } else {
    if (doublesBtn) {
      doublesBtn.className = "px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all bg-emerald-600 text-white shadow-md flex items-center space-x-1.5 cursor-pointer";
    }
    if (singlesBtn) {
      singlesBtn.className = "px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all text-slate-400 hover:text-white flex items-center space-x-1.5 cursor-pointer";
    }
    if (singlesContainer) singlesContainer.classList.add('hidden');
    if (doublesContainer) doublesContainer.classList.remove('hidden');
    if (doublesGuide) doublesGuide.classList.remove('hidden');
    syncDoublesSelectors();
  }

  resetScoreboard();
  updateScoreboardPlayerDisplays();
}

function buildClassGroupedStudentOptions(filterClass = 'all') {
  const groups = {};
  state.students.forEach(s => {
    const classKey = getStudentExactClassKey(s);
    if (filterClass !== 'all' && classKey !== filterClass) return;
    if (!groups[classKey]) groups[classKey] = [];
    groups[classKey].push(s);
  });

  const sortedKeys = Object.keys(groups).sort(compareExactClassKeys);
  let html = '';
  sortedKeys.forEach(classKey => {
    // 💡 각 학년/반 내부에서 번호(number) 오름차순 (1번, 2번, 3번... 10번, 11번...) 정렬
    const list = groups[classKey].sort(compareStudentsByNumber);
    html += `<optgroup label="🏫 ${classKey} (${list.length}명)">`;
    list.forEach(s => {
      const numStr = s.number ? `${s.number}번 ` : '';
      html += `<option value="${s.id}">👤 ${numStr}${escapeHtml(s.name)}</option>`;
    });
    html += `</optgroup>`;
  });
  return html;
}

function filterDoublesByClass() {
  const filterVal = document.getElementById('sbDoublesClassFilter')?.value || 'all';
  const opts = buildClassGroupedStudentOptions(filterVal);
  
  const selectors = ['sbTeam1P1Select', 'sbTeam1P2Select', 'sbTeam2P1Select', 'sbTeam2P2Select'];
  
  let targetStudents = [];
  if (filterVal === 'all') {
    targetStudents = [...state.students].sort(compareStudentsByNumber);
  } else {
    targetStudents = state.students.filter(s => getStudentExactClassKey(s) === filterVal).sort(compareStudentsByNumber);
  }

  selectors.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = opts;
      if (targetStudents[idx]) {
        el.value = targetStudents[idx].id;
      } else if (targetStudents.length > 0) {
        el.value = targetStudents[0].id;
      }
    }
  });

  syncDoublesSelectors();
}

function openScoreboardModal() {
  const p1Select = document.getElementById('sbPlayer1Select');
  if (!p1Select) return;

  const groupedOpts = buildClassGroupedStudentOptions('all');

  p1Select.innerHTML = groupedOpts;
  updateScoreboardPlayer2();

  // Populate Doubles Class Filter
  const classFilterSelect = document.getElementById('sbDoublesClassFilter');
  if (classFilterSelect) {
    const classes = new Set();
    state.students.forEach(s => {
      classes.add(getStudentExactClassKey(s));
    });
    let filterOpts = `<option value="all">전체 학급 부원 (모든 반 보기)</option>`;
    Array.from(classes).sort(compareExactClassKeys).forEach(c => {
      filterOpts += `<option value="${c}">🏫 ${c}</option>`;
    });
    classFilterSelect.innerHTML = filterOpts;
  }

  // Populate Doubles Selectors with Grade/Class Optgroups
  const sortedStudents = [...state.students].sort(compareStudentsByNumber);
  ['sbTeam1P1Select', 'sbTeam1P2Select', 'sbTeam2P1Select', 'sbTeam2P2Select'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = groupedOpts;
      if (sortedStudents[idx]) {
        el.value = sortedStudents[idx].id;
      }
    }
  });

  setScoreboardMode('singles');
  openModal('scoreboardModal');
}

function updateScoreboardPlayer2() {
  const p1Id = document.getElementById('sbPlayer1Select')?.value;
  const p2Select = document.getElementById('sbPlayer2Select');
  if (!p1Id || !p2Select) return;

  const p1 = state.students.find(s => s.id === p1Id);
  if (!p1) return;

  const p1ClassKey = getStudentExactClassKey(p1);
  const sameClass = state.students.filter(s => s.id !== p1Id && getStudentExactClassKey(s) === p1ClassKey).sort(compareStudentsByNumber);
  const otherStudents = state.students.filter(s => s.id !== p1Id && getStudentExactClassKey(s) !== p1ClassKey);
  
  let html = '';
  if (sameClass.length > 0) {
    html += `<optgroup label="같은 학급 (${p1ClassKey} - ${sameClass.length}명)">`;
    sameClass.forEach(s => {
      const numStr = s.number ? `${s.number}번 ` : '';
      html += `<option value="${s.id}">👤 ${numStr}${escapeHtml(s.name)}</option>`;
    });
    html += `</optgroup>`;
  }
  if (otherStudents.length > 0) {
    const otherGroups = {};
    otherStudents.forEach(s => {
      const key = getStudentExactClassKey(s);
      if (!otherGroups[key]) otherGroups[key] = [];
      otherGroups[key].push(s);
    });
    Object.keys(otherGroups).sort(compareExactClassKeys).forEach(k => {
      const subList = otherGroups[k].sort(compareStudentsByNumber);
      html += `<optgroup label="🏫 ${k} (${subList.length}명)">`;
      subList.forEach(s => {
        const numStr = s.number ? `${s.number}번 ` : '';
        html += `<option value="${s.id}">👤 ${numStr}${escapeHtml(s.name)}</option>`;
      });
      html += `</optgroup>`;
    });
  }
  p2Select.innerHTML = html;
  updateScoreboardPlayerDisplays();
}

function syncDoublesSelectors() {
  updateScoreboardPlayerDisplays();
  const server = sbManualServerOverride !== null ? sbManualServerOverride : calculateDefaultServer();
  applyServerBadge(server);
}

function updateScoreboardPlayerDisplays() {
  const p1NameEl = document.getElementById('sbP1NameDisplay');
  const p2NameEl = document.getElementById('sbP2NameDisplay');

  if (sbMode === 'singles') {
    const p1Id = document.getElementById('sbPlayer1Select')?.value;
    const p2Id = document.getElementById('sbPlayer2Select')?.value;
    const p1 = state.students.find(s => s.id === p1Id);
    const p2 = state.students.find(s => s.id === p2Id);

    if (p1NameEl) p1NameEl.innerText = p1 ? `👤 ${p1.name}` : '선수 1';
    if (p2NameEl) p2NameEl.innerText = p2 ? `👤 ${p2.name}` : '선수 2';
  } else {
    const t1p1Id = document.getElementById('sbTeam1P1Select')?.value;
    const t1p2Id = document.getElementById('sbTeam1P2Select')?.value;
    const t2p1Id = document.getElementById('sbTeam2P1Select')?.value;
    const t2p2Id = document.getElementById('sbTeam2P2Select')?.value;

    const t1p1 = state.students.find(s => s.id === t1p1Id);
    const t1p2 = state.students.find(s => s.id === t1p2Id);
    const t2p1 = state.students.find(s => s.id === t2p1Id);
    const t2p2 = state.students.find(s => s.id === t2p2Id);

    const t1Name = `👥 팀 1 (${t1p1 ? t1p1.name : 'A1'} & ${t1p2 ? t1p2.name : 'A2'})`;
    const t2Name = `👥 팀 2 (${t2p1 ? t2p1.name : 'B1'} & ${t2p2 ? t2p2.name : 'B2'})`;

    if (p1NameEl) p1NameEl.innerText = t1Name;
    if (p2NameEl) p2NameEl.innerText = t2Name;
  }
}

function calculateDefaultServer() {
  const total = sbState.score1 + sbState.score2;
  const isDeuce = sbState.score1 >= 10 && sbState.score2 >= 10;

  if (sbMode === 'singles') {
    if (isDeuce) {
      return (total % 2 === 0) ? 1 : 2;
    }
    return (Math.floor(total / 2) % 2 === 0) ? 1 : 2;
  } else {
    // 🏓 복식 4인 공식 서브 로테이션: 0: A1(팀1), 1: B1(팀2), 2: A2(팀1), 3: B2(팀2)
    if (isDeuce) {
      return total % 4;
    }
    return Math.floor(total / 2) % 4;
  }
}

function toggleScoreboardServe() {
  const currentServer = sbManualServerOverride !== null ? sbManualServerOverride : calculateDefaultServer();
  if (sbMode === 'singles') {
    sbManualServerOverride = currentServer === 1 ? 2 : 1;
  } else {
    sbManualServerOverride = (currentServer + 1) % 4;
  }
  applyServerBadge(sbManualServerOverride);
}

function applyServerBadge(server) {
  const p1Badge = document.getElementById('sbP1ServeBadge');
  const p2Badge = document.getElementById('sbP2ServeBadge');
  const p1Text = document.getElementById('sbP1ServeText');
  const p2Text = document.getElementById('sbP2ServeText');

  const p1ReceiveBadge = document.getElementById('sbP1ReceiveBadge');
  const p2ReceiveBadge = document.getElementById('sbP2ReceiveBadge');
  const p1ReceiveText = document.getElementById('sbP1ReceiveText');
  const p2ReceiveText = document.getElementById('sbP2ReceiveText');
  const activeRallyEl = document.getElementById('sbDoublesActiveRally');

  if (sbMode === 'singles') {
    // 단식 모드: 리시브 배지 비활성화 및 기본 서브 배지 적용
    if (p1ReceiveBadge) {
      p1ReceiveBadge.classList.add('hidden');
      p1ReceiveBadge.style.opacity = '0';
      p1ReceiveBadge.style.visibility = 'hidden';
    }
    if (p2ReceiveBadge) {
      p2ReceiveBadge.classList.add('hidden');
      p2ReceiveBadge.style.opacity = '0';
      p2ReceiveBadge.style.visibility = 'hidden';
    }

    if (p1Text) p1Text.innerText = 'SERVING 🏓';
    if (p2Text) p2Text.innerText = 'SERVING 🏓';

    if (p1Badge) {
      if (server === 1) {
        p1Badge.classList.remove('hidden');
        p1Badge.style.opacity = '1';
        p1Badge.style.visibility = 'visible';
        p1Badge.style.pointerEvents = 'auto';
        p1Badge.classList.add('animate-pulse');
      } else {
        p1Badge.style.opacity = '0';
        p1Badge.style.visibility = 'hidden';
        p1Badge.style.pointerEvents = 'none';
        p1Badge.classList.remove('animate-pulse');
      }
    }

    if (p2Badge) {
      if (server === 2) {
        p2Badge.classList.remove('hidden');
        p2Badge.style.opacity = '1';
        p2Badge.style.visibility = 'visible';
        p2Badge.style.pointerEvents = 'auto';
        p2Badge.classList.add('animate-pulse');
      } else {
        p2Badge.style.opacity = '0';
        p2Badge.style.visibility = 'hidden';
        p2Badge.style.pointerEvents = 'none';
        p2Badge.classList.remove('animate-pulse');
      }
    }
  } else {
    // 🏓 복식 4단계 공식 서브-리시브 로테이션 (0: A1->B1, 1: B1->A2, 2: A2->B2, 3: B2->A1)
    const t1p1Id = document.getElementById('sbTeam1P1Select')?.value;
    const t1p2Id = document.getElementById('sbTeam1P2Select')?.value;
    const t2p1Id = document.getElementById('sbTeam2P1Select')?.value;
    const t2p2Id = document.getElementById('sbTeam2P2Select')?.value;

    const t1p1 = state.students.find(s => s.id === t1p1Id);
    const t1p2 = state.students.find(s => s.id === t1p2Id);
    const t2p1 = state.students.find(s => s.id === t2p1Id);
    const t2p2 = state.students.find(s => s.id === t2p2Id);

    const nameA1 = t1p1 ? t1p1.name : 'A1';
    const nameA2 = t1p2 ? t1p2.name : 'A2';
    const nameB1 = t2p1 ? t2p1.name : 'B1';
    const nameB2 = t2p2 ? t2p2.name : 'B2';

    let serverName = '';
    let receiverName = '';
    let isTeam1Serving = false;

    if (server === 0) {
      // 0단계: A1 서브 ➔ B1 리시브
      serverName = nameA1;
      receiverName = nameB1;
      isTeam1Serving = true;
    } else if (server === 1) {
      // 1단계: B1 서브 ➔ A2 리시브
      serverName = nameB1;
      receiverName = nameA2;
      isTeam1Serving = false;
    } else if (server === 2) {
      // 2단계: A2 서브 ➔ B2 리시브
      serverName = nameA2;
      receiverName = nameB2;
      isTeam1Serving = true;
    } else {
      // 3단계: B2 서브 ➔ A1 리시브
      serverName = nameB2;
      receiverName = nameA1;
      isTeam1Serving = false;
    }

    // 상단 랠리 정보 배너 갱신
    if (activeRallyEl) {
      activeRallyEl.innerHTML = `🔄 현재 랠리: <span class="text-cyan-300 font-black">🏓 ${escapeHtml(serverName)}(서브)</span> ➔ <span class="text-amber-300 font-black">🛡️ ${escapeHtml(receiverName)}(리시브)</span>`;
    }

    if (isTeam1Serving) {
      // 팀 1: 서브 담당, 팀 2: 리시브 담당
      if (p1Badge) {
        if (p1Text) p1Text.innerText = `${serverName} SERVING 🏓`;
        p1Badge.classList.remove('hidden');
        p1Badge.style.opacity = '1';
        p1Badge.style.visibility = 'visible';
        p1Badge.style.pointerEvents = 'auto';
        p1Badge.classList.add('animate-pulse');
      }
      if (p1ReceiveBadge) {
        p1ReceiveBadge.classList.add('hidden');
        p1ReceiveBadge.style.opacity = '0';
        p1ReceiveBadge.style.visibility = 'hidden';
        p1ReceiveBadge.style.pointerEvents = 'none';
        p1ReceiveBadge.classList.remove('animate-pulse');
      }

      if (p2Badge) {
        p2Badge.classList.add('hidden');
        p2Badge.style.opacity = '0';
        p2Badge.style.visibility = 'hidden';
        p2Badge.style.pointerEvents = 'none';
        p2Badge.classList.remove('animate-pulse');
      }
      if (p2ReceiveBadge) {
        if (p2ReceiveText) p2ReceiveText.innerText = `${receiverName} RECEIVING 🛡️`;
        p2ReceiveBadge.classList.remove('hidden');
        p2ReceiveBadge.style.opacity = '1';
        p2ReceiveBadge.style.visibility = 'visible';
        p2ReceiveBadge.style.pointerEvents = 'auto';
        p2ReceiveBadge.classList.add('animate-pulse');
      }
    } else {
      // 팀 2: 서브 담당, 팀 1: 리시브 담당
      if (p1Badge) {
        p1Badge.classList.add('hidden');
        p1Badge.style.opacity = '0';
        p1Badge.style.visibility = 'hidden';
        p1Badge.style.pointerEvents = 'none';
        p1Badge.classList.remove('animate-pulse');
      }
      if (p1ReceiveBadge) {
        if (p1ReceiveText) p1ReceiveText.innerText = `${receiverName} RECEIVING 🛡️`;
        p1ReceiveBadge.classList.remove('hidden');
        p1ReceiveBadge.style.opacity = '1';
        p1ReceiveBadge.style.visibility = 'visible';
        p1ReceiveBadge.style.pointerEvents = 'auto';
        p1ReceiveBadge.classList.add('animate-pulse');
      }

      if (p2Badge) {
        if (p2Text) p2Text.innerText = `${serverName} SERVING 🏓`;
        p2Badge.classList.remove('hidden');
        p2Badge.style.opacity = '1';
        p2Badge.style.visibility = 'visible';
        p2Badge.style.pointerEvents = 'auto';
        p2Badge.classList.add('animate-pulse');
      }
      if (p2ReceiveBadge) {
        p2ReceiveBadge.classList.add('hidden');
        p2ReceiveBadge.style.opacity = '0';
        p2ReceiveBadge.style.visibility = 'hidden';
        p2ReceiveBadge.style.pointerEvents = 'none';
        p2ReceiveBadge.classList.remove('animate-pulse');
      }
    }
  }
}

function updateScore(playerNum, delta) {
  if (playerNum === 1) sbState.score1 = Math.max(0, sbState.score1 + delta);
  if (playerNum === 2) sbState.score2 = Math.max(0, sbState.score2 + delta);

  const score1El = document.getElementById('sbScore1Text');
  const score2El = document.getElementById('sbScore2Text');
  if (score1El) score1El.innerText = sbState.score1;
  if (score2El) score2El.innerText = sbState.score2;

  sbManualServerOverride = null; // 점수 변동 시 자동 룰로 복귀
  const server = calculateDefaultServer();
  applyServerBadge(server);

  // Match Point / Deuce Status Badge
  const statusBadge = document.getElementById('sbMatchStatusBadge');
  if (statusBadge) {
    const s1 = sbState.score1;
    const s2 = sbState.score2;
    const isDeuce = s1 >= 10 && s2 >= 10;
    const team1Label = sbMode === 'singles' ? '선수 1' : '팀 1';
    const team2Label = sbMode === 'singles' ? '선수 2' : '팀 2';

    if (isDeuce) {
      if (s1 === s2) {
        statusBadge.innerText = '⚡ DEUCE (10:10)';
        statusBadge.className = 'text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-rose-600 text-white shadow-md animate-pulse';
        statusBadge.classList.remove('hidden');
      } else {
        const leader = s1 > s2 ? team1Label : team2Label;
        statusBadge.innerText = `🔥 ADVANTAGE (${leader})`;
        statusBadge.className = 'text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-amber-400 text-slate-950 shadow-md animate-bounce';
        statusBadge.classList.remove('hidden');
      }
    } else if (s1 === 10 || s2 === 10) {
      const leader = s1 === 10 ? team1Label : team2Label;
      statusBadge.innerText = `🎯 MATCH POINT (${leader})`;
      statusBadge.className = 'text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-amber-400 text-slate-950 shadow-md animate-bounce';
      statusBadge.classList.remove('hidden');
    } else {
      statusBadge.classList.add('hidden');
    }
  }
}

function resetScoreboard() {
  sbState.score1 = 0;
  sbState.score2 = 0;
  sbManualServerOverride = null;
  updateScore(1, 0);
  updateScoreboardPlayerDisplays();
}

function endScoreboardMatch() {
  const s1 = sbState.score1;
  const s2 = sbState.score2;

  if (s1 === s2) {
    showToast('무승부는 허용되지 않습니다! 점수를 결정해 주세요.', '⚠️');
    return;
  }

  const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  if (sbMode === 'singles') {
    // 👤 단식 경기 저장
    const p1Select = document.getElementById('sbPlayer1Select');
    const p2Select = document.getElementById('sbPlayer2Select');
    if (!p1Select || !p2Select) return;

    const p1Id = p1Select.value;
    const p2Id = p2Select.value;

    if (!p1Id || !p2Id || p1Id === p2Id) {
      showToast('선수를 올바르게 선택해 주세요 (서로 다른 선수 선택 필요)!', '⚠️');
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

    if (!winner.history) winner.history = [];
    winner.history.unshift({
      title: `[단식 승리] vs ${loser.name} (${s1}:${s2})`,
      points: 10,
      date: dateStr
    });

    if (!loser.history) loser.history = [];
    loser.history.unshift({
      title: `[단식 참가] vs ${winner.name} (${s1}:${s2})`,
      points: 5,
      date: dateStr
    });

    const matchObj = {
      id: 'm_' + Date.now(),
      matchType: 'singles',
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
    showToast(`단식 경기 결과 저장 완료! (${winner.name} 승리 +10P)`, '🏆');

  } else {
    // 👥 복식 경기 저장
    const t1p1Id = document.getElementById('sbTeam1P1Select')?.value;
    const t1p2Id = document.getElementById('sbTeam1P2Select')?.value;
    const t2p1Id = document.getElementById('sbTeam2P1Select')?.value;
    const t2p2Id = document.getElementById('sbTeam2P2Select')?.value;

    const selectedIds = [t1p1Id, t1p2Id, t2p1Id, t2p2Id];
    const uniqueIds = new Set(selectedIds.filter(Boolean));

    if (uniqueIds.size < 4) {
      showToast('복식 경기는 4명의 서로 다른 선수를 모두 선택해야 합니다!', '⚠️');
      return;
    }

    const t1p1 = state.students.find(s => s.id === t1p1Id);
    const t1p2 = state.students.find(s => s.id === t1p2Id);
    const t2p1 = state.students.find(s => s.id === t2p1Id);
    const t2p2 = state.students.find(s => s.id === t2p2Id);

    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return;

    const winningTeam = s1 > s2 ? [t1p1, t1p2] : [t2p1, t2p2];
    const losingTeam = s1 > s2 ? [t2p1, t2p2] : [t1p1, t1p2];
    const winningTeamName = s1 > s2 ? `${t1p1.name} & ${t1p2.name}` : `${t2p1.name} & ${t2p2.name}`;
    const losingTeamName = s1 > s2 ? `${t2p1.name} & ${t2p2.name}` : `${t1p1.name} & ${t1p2.name}`;

    winningTeam.forEach(s => {
      s.wins = (s.wins || 0) + 1;
      s.totalPoints = (s.totalPoints || 0) + 10;
      if (!s.history) s.history = [];
      s.history.unshift({
        title: `[복식 승리] (${winningTeamName}) vs (${losingTeamName}) [${s1}:${s2}]`,
        points: 10,
        date: dateStr
      });
      saveStudentToRTDB(s);
    });

    losingTeam.forEach(s => {
      s.losses = (s.losses || 0) + 1;
      s.totalPoints = (s.totalPoints || 0) + 5;
      if (!s.history) s.history = [];
      s.history.unshift({
        title: `[복식 참가] (${losingTeamName}) vs (${winningTeamName}) [${s1}:${s2}]`,
        points: 5,
        date: dateStr
      });
      saveStudentToRTDB(s);
    });

    const matchObj = {
      id: 'm_' + Date.now(),
      matchType: 'doubles',
      p1Name: `${t1p1.name}, ${t1p2.name}`,
      p2Name: `${t2p1.name}, ${t2p2.name}`,
      team1Ids: [t1p1.id, t1p2.id],
      team2Ids: [t2p1.id, t2p2.id],
      score1: s1,
      score2: s2,
      winnerName: winningTeamName,
      winnerIds: winningTeam.map(s => s.id),
      date: dateStr
    };

    saveMatchToRTDB(matchObj);

    closeModal('scoreboardModal');
    playSuccessSound();
    triggerConfetti(winningTeam[0].equippedCeremony);
    showToast(`복식 경기 결과 저장 완료! (${winningTeamName} 팀 승리 각각 +10P)`, '🏆');
  }
}

function openMatchRecordModal() {
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

function updatePlayer2Options() {
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

function deleteTimelineLog(index) {
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

function handleRecordMatch(event) {
  if (event) event.preventDefault();
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 기록 가능합니다.', '🔒');
    return;
  }

  const p1Id = document.getElementById('matchPlayer1Select').value;
  const p2Id = document.getElementById('matchPlayer2Select').value;
  const s1 = parseInt(document.getElementById('matchScore1').value) || 0;
  const s2 = parseInt(document.getElementById('matchScore2').value) || 0;

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

function deleteMatchRecord(matchId) {
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
