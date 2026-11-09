/* TOURNAMENT BRACKET GENERATOR & INTERACTIVE MANAGER */

let tournamentParticipantsDraft = [];
let tournamentSetupCollapsed = false;
let tournamentChecklistVisible = false;
let activeTournamentMatchContext = null; // { slotKey, roundIdx, matchIdx, isThirdPlace }
let tournamentOverviewMode = 'single'; // 'single' (현재 선택 슬롯) | 'all' (진행 중 대진표 모두 보기)
let tournamentFixedPairs = []; // [{ id, type: 'versus' | 'team', p1, p2 }]
let tournamentFixedPairsBySlot = { slot_1: [], slot_2: [], slot_3: [] };
let tournamentFixedPairType = 'versus'; // 'versus' (⚔️ 1라운드 맞대결 짝) | 'team' (🤝 한 팀 파트너 짝)
let quickPairFirstStudent = null; // 참가자 칩 연속 2명 클릭으로 빠른 짝 지정 시 1번째 선택 학생 이름

const TOURNAMENT_SLOT_DEFS = [
  { key: 'slot_1', num: 1, label: '제1 대진표', subLabel: '1코트 · A그룹', defaultTitle: '🏓 제1 토너먼트 대진표' },
  { key: 'slot_2', num: 2, label: '제2 대진표', subLabel: '2코트 · B그룹', defaultTitle: '🏓 제2 토너먼트 대진표' },
  { key: 'slot_3', num: 3, label: '제3 대진표', subLabel: '3코트 · C그룹', defaultTitle: '🏓 제3 토너먼트 대진표' }
];

function getTournamentSlotMeta(slotKey = state.activeTournamentSlot) {
  return TOURNAMENT_SLOT_DEFS.find(d => d.key === slotKey) || TOURNAMENT_SLOT_DEFS[0];
}

function ensureTournamentSlotsState() {
  if (!state.savedTournaments || typeof state.savedTournaments !== 'object') {
    state.savedTournaments = {
      slot_1: state.savedTournament || null,
      slot_2: null,
      slot_3: null
    };
  }
  if (!state.activeTournamentSlot || !['slot_1', 'slot_2', 'slot_3'].includes(state.activeTournamentSlot)) {
    state.activeTournamentSlot = 'slot_1';
  }
  state.savedTournament = state.savedTournaments[state.activeTournamentSlot] || null;
}

function getTournamentSlotStats(tour) {
  if (!tour || !Array.isArray(tour.rounds) || tour.rounds.length === 0) {
    return { active: false, totalReal: 0, completedReal: 0, championName: '' };
  }
  let totalReal = 0;
  let completedReal = 0;
  tour.rounds.forEach(r => {
    (r.matches || []).forEach(m => {
      if (!m.isByeMatch) {
        totalReal++;
        if (m.winnerSlot === 1 || m.winnerSlot === 2) completedReal++;
      }
    });
  });
  const finalRound = tour.rounds[tour.rounds.length - 1];
  const finalMatch = finalRound && finalRound.matches ? finalRound.matches[0] : null;
  const champPlayer = (finalMatch && (finalMatch.winnerSlot === 1 || finalMatch.winnerSlot === 2))
    ? (finalMatch.winnerSlot === 1 ? finalMatch.player1 : finalMatch.player2)
    : null;
  const championName = champPlayer ? stripStudentNumberPrefix(champPlayer.name) : '';
  return { active: true, totalReal, completedReal, championName };
}

function renderTournamentSlotTabs() {
  ensureTournamentSlotsState();
  const barEl = document.getElementById('tournamentSlotTabsBar');
  const summaryEl = document.getElementById('tournamentActiveSlotsSummary');

  const activeSlotsList = TOURNAMENT_SLOT_DEFS.filter(def => {
    const t = state.savedTournaments[def.key];
    return !!(t && Array.isArray(t.rounds) && t.rounds.length > 0);
  });

  if (summaryEl) {
    summaryEl.innerText = `동시 운영 중 ${activeSlotsList.length} / 3개`;
  }

  if (barEl) {
    barEl.innerHTML = TOURNAMENT_SLOT_DEFS.map(def => {
      const tour = state.savedTournaments[def.key];
      const isSelected = state.activeTournamentSlot === def.key;
      const stats = getTournamentSlotStats(tour);

      let statusHtml = '';
      if (stats.active) {
        if (stats.championName) {
          statusHtml = `<span class="text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-amber-300 text-slate-950' : 'bg-amber-100 text-amber-900'}">👑 우승: ${escapeHtml(stats.championName)}</span>`;
        } else {
          statusHtml = `<span class="text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'}">🏓 ${stats.completedReal}/${stats.totalReal}경기 완료</span>`;
        }
      } else {
        statusHtml = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}">+ 새 대진표 작성 가능</span>`;
      }

      const subDesc = stats.active
        ? `${escapeHtml(tour.title)} (${tour.bracketSize}강 · ${tour.participantCount}명)`
        : `${def.subLabel} 대진표를 새로 생성할 수 있습니다`;

      return `
        <button
          type="button"
          onclick="switchTournamentSlot('${def.key}')"
          class="p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            isSelected
              ? 'bg-slate-900 text-white border-amber-400 shadow-md ring-2 ring-amber-300/60'
              : (stats.active
                  ? 'bg-white hover:bg-amber-50/70 text-slate-800 border-amber-300 shadow-2xs'
                  : 'bg-white/75 hover:bg-white text-slate-600 border-dashed border-slate-300')
          }"
        >
          <div class="flex items-center justify-between gap-1 w-full">
            <span class="text-xs font-black flex items-center space-x-1.5">
              <span class="w-5 h-5 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950' : (stats.active ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600')} flex items-center justify-center text-[11px] font-black">${def.num}</span>
              <span>${def.label}</span>
            </span>
            ${statusHtml}
          </div>
          <p class="text-[11px] font-extrabold truncate w-full ${isSelected ? 'text-amber-200' : (stats.active ? 'text-slate-700' : 'text-slate-400')}">
            ${subDesc}
          </p>
        </button>
      `;
    }).join('');
  }

  // 전체 대진표 확인하기 모달 내부의 슬롯 전환 탭도 동기화
  const overviewTabsEl = document.getElementById('tournamentOverviewSlotTabs');
  if (overviewTabsEl) {
    let tabsHtml = TOURNAMENT_SLOT_DEFS.map(def => {
      const tour = state.savedTournaments[def.key];
      const stats = getTournamentSlotStats(tour);
      const isSelected = tournamentOverviewMode === 'single' && state.activeTournamentSlot === def.key;
      return `
        <button
          type="button"
          onclick="switchOverviewTournamentSlot('${def.key}')"
          class="px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
            isSelected
              ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-300'
              : (stats.active
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-900/60 text-slate-500 border border-dashed border-slate-700')
          }"
        >
          <span>🏆 ${def.label}</span>
          ${stats.active
            ? `<span class="text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'}">${escapeHtml(tour.title)} (${stats.completedReal}/${stats.totalReal})</span>`
            : `<span class="text-[10px] opacity-60">비어있음</span>`
          }
        </button>
      `;
    }).join('');

    if (activeSlotsList.length >= 2) {
      const isAllMode = tournamentOverviewMode === 'all';
      tabsHtml += `
        <button
          type="button"
          onclick="setTournamentOverviewAllSlotsMode()"
          class="px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
            isAllMode
              ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-sm ring-2 ring-emerald-200'
              : 'bg-emerald-900/50 hover:bg-emerald-800/70 text-emerald-200 border border-emerald-600/60'
          }"
        >
          <i class="fa-solid fa-table-columns text-[11px]"></i>
          <span>📊 진행 중 대진표 모두 한눈에 보기 (${activeSlotsList.length}개 동시 표시)</span>
        </button>
      `;
    }

    overviewTabsEl.innerHTML = tabsHtml;
  }
}

function applySlotStateToSetupInputs() {
  ensureTournamentSlotsState();
  const slotMeta = getTournamentSlotMeta(state.activeTournamentSlot);
  const tour = state.savedTournament;
  const textarea = document.getElementById('tournamentRosterInput');
  const titleInput = document.getElementById('tournamentTitleInput');
  const formatSelect = document.getElementById('tournamentGameFormatSelect');
  const matchTypeSelect = document.getElementById('tournamentMatchTypeSelect');
  const seedModeSelect = document.getElementById('tournamentSeedModeSelect');
  const thirdPlaceCheck = document.getElementById('tournamentThirdPlaceCheck');

  if (tour && Array.isArray(tour.rounds) && tour.rounds.length > 0) {
    if (textarea) textarea.value = Array.isArray(tour.rawRosterList) ? tour.rawRosterList.join('\n') : '';
    if (titleInput) titleInput.value = tour.title || slotMeta.defaultTitle;
    if (formatSelect && tour.gameFormat) formatSelect.value = tour.gameFormat;
    if (matchTypeSelect && tour.matchType) matchTypeSelect.value = tour.matchType;
    if (seedModeSelect && tour.seedMode) seedModeSelect.value = tour.seedMode;
    if (thirdPlaceCheck && typeof tour.includeThirdPlace === 'boolean') thirdPlaceCheck.checked = tour.includeThirdPlace;
    tournamentFixedPairs = Array.isArray(tour.fixedPairs) ? JSON.parse(JSON.stringify(tour.fixedPairs)) : (tournamentFixedPairsBySlot[state.activeTournamentSlot] || []);
    tournamentFixedPairsBySlot[state.activeTournamentSlot] = [...tournamentFixedPairs];
    tournamentFixedPairType = tour.matchType === 'doubles' ? 'team' : 'versus';
    quickPairFirstStudent = null;
    tournamentSetupCollapsed = true;
  } else {
    if (textarea) textarea.value = '';
    if (titleInput) titleInput.value = slotMeta.defaultTitle;
    tournamentFixedPairs = Array.isArray(tournamentFixedPairsBySlot[state.activeTournamentSlot])
      ? [...tournamentFixedPairsBySlot[state.activeTournamentSlot]]
      : [];
    const curMatchType = matchTypeSelect ? matchTypeSelect.value : 'singles';
    tournamentFixedPairType = curMatchType === 'doubles' ? 'team' : 'versus';
    quickPairFirstStudent = null;
    tournamentSetupCollapsed = false;
  }
  syncTournamentFixedPairTypeButtons();
}

function switchTournamentSlot(slotKey) {
  if (!['slot_1', 'slot_2', 'slot_3'].includes(slotKey)) return;
  ensureTournamentSlotsState();
  state.activeTournamentSlot = slotKey;
  state.savedTournament = state.savedTournaments[slotKey] || null;
  tournamentOverviewMode = 'single';

  // 변경된 활성 슬롯 정보를 localStorage에도 반영
  try {
    const hasAny = !!(state.savedTournaments.slot_1 || state.savedTournaments.slot_2 || state.savedTournaments.slot_3);
    if (hasAny) {
      localStorage.setItem('tt_saved_tournament', JSON.stringify({
        isMultiSlot: true,
        activeSlot: state.activeTournamentSlot,
        slots: state.savedTournaments
      }));
    }
  } catch (e) {}

  applySlotStateToSetupInputs();
  syncTournamentSetupVisibility();
  onTournamentRosterInput();
  renderTournamentSlotTabs();
  renderTournamentBracketUI();
  renderTournamentActiveBanner();
}

function switchOverviewTournamentSlot(slotKey) {
  ensureTournamentSlotsState();
  const targetTour = state.savedTournaments[slotKey];
  if (!targetTour || !Array.isArray(targetTour.rounds) || targetTour.rounds.length === 0) {
    // 비어있는 슬롯을 누르면 바로 해당 슬롯의 대진표 작성 화면으로 전환
    closeModal('tournamentOverviewModal');
    switchTournamentSlot(slotKey);
    openModal('tournamentModal');
    showToast(`${getTournamentSlotMeta(slotKey).label}가 비어 있어 대진표 작성 화면으로 이동했습니다.`, '🏓');
    return;
  }
  tournamentOverviewMode = 'single';
  state.activeTournamentSlot = slotKey;
  state.savedTournament = targetTour;
  applySlotStateToSetupInputs();
  renderTournamentSlotTabs();
  renderTournamentBracketUI();
  renderTournamentOverviewGraphic();
}

function setTournamentOverviewAllSlotsMode() {
  tournamentOverviewMode = 'all';
  renderTournamentSlotTabs();
  renderTournamentOverviewGraphic();
}

function stripStudentNumberPrefix(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  // 복식 팀("1번 김탁구 & 2번 이핑퐁")인 경우 각 멤버별로 번호 제거
  if (str.includes('&')) {
    return str
      .split('&')
      .map(part => stripStudentNumberPrefix(part))
      .filter(Boolean)
      .join(' & ');
  }
  return str
    .replace(/^[-•*]\s*/, '')
    .replace(/^(?:\d+\s*학년\s*)?(?:\d+\s*반\s*)?(?:\d+\s*번\s*)+/, '')
    .replace(/^#?\d+\s*(?:번|\.|-\s*|\)\s*)/, '')
    .trim();
}

function parseStudentRosterText(rawText) {
  if (!rawText || !rawText.trim()) return [];
  const trimmed = rawText.trim();

  // 1) 줄바꿈, 쉼표, 세미콜론, 슬래시가 포함되어 있으면 우선 분리
  let tokens = [];
  if (/[\r\n,;/|]/.test(trimmed)) {
    tokens = trimmed.split(/[\r\n,;/|]+/);
  } else {
    // 단일 줄에 공백으로 여러 명을 입력한 경우 처리 (예: "김탁구 이핑퐁 박스매시" 또는 "1번 김탁구 2번 이핑퐁")
    const numberedMatches = trimmed.match(/(?:\d+\s*(?:번|\.)\s*)?[^\s\d]+/g);
    if (numberedMatches && numberedMatches.length >= 2) {
      tokens = numberedMatches;
    } else {
      tokens = trimmed.split(/\s+/);
    }
  }

  const parsed = [];
  tokens.forEach(t => {
    // "00번" 등을 제거하고 순수 학생 이름만 추출
    const clean = stripStudentNumberPrefix(t);
    if (clean) {
      parsed.push(clean);
    }
  });

  return parsed;
}

function matchStudentMetadata(rawName, preferredClass = 'all') {
  const cleanTarget = stripStudentNumberPrefix(rawName);
  let matched = null;

  if (preferredClass && preferredClass !== 'all') {
    matched = state.students.find(s =>
      getStudentExactClassKey(s) === preferredClass &&
      (s.name === cleanTarget || `${s.number}번 ${s.name}` === rawName.trim())
    );
  }
  if (!matched) {
    matched = state.students.find(s =>
      s.name === cleanTarget || `${s.number}번 ${s.name}` === rawName.trim()
    );
  }

  if (matched) {
    const tot = (matched.wins || 0) + (matched.losses || 0);
    const winRate = tot > 0 ? (matched.wins / tot) : 0;
    return {
      id: matched.id,
      name: matched.name,
      cleanName: matched.name,
      number: matched.number || '',
      classKey: getStudentExactClassKey(matched),
      avatar: matched.avatar || '🏓',
      wins: matched.wins || 0,
      losses: matched.losses || 0,
      winRate: winRate,
      points: matched.totalPoints || 0
    };
  }

  return {
    id: null,
    name: cleanTarget || rawName.trim(),
    cleanName: cleanTarget || rawName.trim(),
    number: '',
    classKey: '',
    avatar: '🏓',
    wins: 0,
    losses: 0,
    winRate: 0,
    points: 0
  };
}

function populateTournamentClassSelect() {
  const selectEl = document.getElementById('tournamentClassSelect');
  if (!selectEl) return;

  const currentVal = selectEl.value;
  const classCountMap = {};
  state.students.forEach(s => {
    const key = getStudentExactClassKey(s);
    classCountMap[key] = (classCountMap[key] || 0) + 1;
  });

  let opts = `<option value="all">전체 등록 부원 (총 ${state.students.length}명)</option>`;
  const sortedKeys = Object.keys(classCountMap).sort(compareExactClassKeys);
  sortedKeys.forEach(k => {
    opts += `<option value="${escapeHtml(k)}">🏫 ${escapeHtml(k)} (${classCountMap[k]}명)</option>`;
  });

  selectEl.innerHTML = opts;
  if (currentVal && (currentVal === 'all' || classCountMap[currentVal])) {
    selectEl.value = currentVal;
  } else if (sortedKeys.length > 0) {
    // 현재 선택된 학생의 학급을 기본값으로 선택
    const activeStd = getCurrentStudent();
    const activeKey = activeStd ? getStudentExactClassKey(activeStd) : '';
    if (activeKey && classCountMap[activeKey]) {
      selectEl.value = activeKey;
    }
  }

  renderTournamentClassCheckboxes();
}

// 🏫 반별 체크박스 렌더링 (반을 체크하면 해당 반 전체 학생이 명단에 추가/제거됨)
function renderTournamentClassCheckboxes() {
  const container = document.getElementById('tournamentClassCheckList');
  if (!container) return;

  const classMap = {};
  state.students.forEach(s => {
    const key = getStudentExactClassKey(s);
    if (!classMap[key]) classMap[key] = [];
    classMap[key].push(s);
  });

  const sortedKeys = Object.keys(classMap).sort(compareExactClassKeys);
  if (sortedKeys.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-slate-400 col-span-full text-center py-2">등록된 학급/학생이 없습니다.</p>`;
    return;
  }

  const currentNameSet = new Set(tournamentParticipantsDraft.map(n => stripStudentNumberPrefix(n)));

  container.innerHTML = sortedKeys.map(classKey => {
    const classStudents = classMap[classKey];
    const totalCount = classStudents.length;
    const includedCount = classStudents.filter(s => currentNameSet.has(stripStudentNumberPrefix(s.name))).length;
    const isAllChecked = totalCount > 0 && includedCount === totalCount;
    const isPartial = includedCount > 0 && includedCount < totalCount;

    const cardStyle = isAllChecked
      ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-300'
      : (isPartial ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950' : 'bg-slate-50/70 hover:bg-amber-50/40 border-slate-200 text-slate-700');

    return `
      <label class="flex items-center justify-between px-2.5 py-2 rounded-xl border cursor-pointer text-xs select-none transition-all ${cardStyle}">
        <div class="flex items-center space-x-1.5 min-w-0">
          <input
            type="checkbox"
            class="tournament-class-check accent-amber-500 w-4 h-4 rounded shrink-0"
            data-class-key="${escapeHtml(classKey)}"
            ${isAllChecked ? 'checked' : ''}
            onchange="onTournamentClassCheckChange(this.getAttribute('data-class-key'), this.checked)"
          >
          <span class="font-extrabold truncate">🏫 ${escapeHtml(classKey)}</span>
        </div>
        <span class="text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
          isAllChecked ? 'bg-amber-500 text-white' : (isPartial ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200')
        }">
          ${isPartial ? `${includedCount}/${totalCount}명` : `${totalCount}명`}
        </span>
      </label>
    `;
  }).join('');
}

function onTournamentClassCheckChange(classKey, isChecked) {
  if (!classKey) return;

  const classStudents = state.students
    .filter(s => getStudentExactClassKey(s) === classKey)
    .sort(compareStudentsByNumber);

  if (classStudents.length === 0) return;

  const textarea = document.getElementById('tournamentRosterInput');
  const currentList = textarea ? parseStudentRosterText(textarea.value) : [...tournamentParticipantsDraft];
  const classNames = classStudents.map(s => stripStudentNumberPrefix(s.name)).filter(Boolean);
  const classNameSet = new Set(classNames);

  let nextList = [];
  if (isChecked) {
    // 기존 명단 유지하면서 해당 반 학생 전체 추가 (중복 방지)
    nextList = [...currentList];
    const existingSet = new Set(nextList.map(n => stripStudentNumberPrefix(n)));
    classNames.forEach(name => {
      if (!existingSet.has(name)) {
        nextList.push(name);
        existingSet.add(name);
      }
    });
    showToast(`🏫 ${classKey} 전체 학생(${classNames.length}명)이 명단에 추가되었습니다!`, '☑️');
  } else {
    // 해당 반 학생들을 명단에서 제외
    nextList = currentList.filter(n => !classNameSet.has(stripStudentNumberPrefix(n)));
    showToast(`🏫 ${classKey} 학생(${classNames.length}명)이 명단에서 제외되었습니다.`, '➖');
  }

  if (textarea) {
    textarea.value = nextList.join('\n');
  }

  onTournamentRosterInput();
  updateTournamentTitleByCheckedClasses();
  if (tournamentChecklistVisible) {
    renderTournamentStudentChecklist();
  }
}

function toggleAllTournamentClassChecks(checkAll) {
  const textarea = document.getElementById('tournamentRosterInput');
  if (!textarea) return;

  if (checkAll) {
    const sortedAll = [...state.students].sort((a, b) => {
      const cCmp = compareExactClassKeys(getStudentExactClassKey(a), getStudentExactClassKey(b));
      if (cCmp !== 0) return cCmp;
      return compareStudentsByNumber(a, b);
    });
    const allNames = [];
    const seen = new Set();
    sortedAll.forEach(s => {
      const clean = stripStudentNumberPrefix(s.name);
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        allNames.push(clean);
      }
    });
    textarea.value = allNames.join('\n');
    showToast(`전체 학급(${allNames.length}명)을 모두 명단에 넣었습니다!`, '🏫');
  } else {
    textarea.value = '';
    showToast('모든 반 체크가 해제되었습니다.', '🔄');
  }

  onTournamentRosterInput();
  updateTournamentTitleByCheckedClasses();
  if (tournamentChecklistVisible) {
    renderTournamentStudentChecklist();
  }
}

function updateTournamentTitleByCheckedClasses() {
  const titleInput = document.getElementById('tournamentTitleInput');
  if (!titleInput) return;

  const slotMeta = getTournamentSlotMeta(state.activeTournamentSlot);
  const slotPrefix = `[${slotMeta.label}] `;
  const checkedEls = document.querySelectorAll('.tournament-class-check:checked');
  const checkedKeys = Array.from(checkedEls).map(el => el.getAttribute('data-class-key')).filter(Boolean);

  if (checkedKeys.length === 1) {
    titleInput.value = `🏓 ${slotPrefix}${checkedKeys[0]} 탁구 토너먼트`;
  } else if (checkedKeys.length === 2) {
    titleInput.value = `🏓 ${slotPrefix}${checkedKeys[0]}·${checkedKeys[1]} 탁구 토너먼트`;
  } else if (checkedKeys.length > 2) {
    titleInput.value = `🏓 ${slotPrefix}${checkedKeys[0]} 외 ${checkedKeys.length - 1}개반 탁구 토너먼트`;
  }
}

function openTournamentModal(targetSlotKey = null) {
  ensureTournamentSlotsState();
  if (targetSlotKey && ['slot_1', 'slot_2', 'slot_3'].includes(targetSlotKey)) {
    state.activeTournamentSlot = targetSlotKey;
    state.savedTournament = state.savedTournaments[targetSlotKey] || null;
  }

  populateTournamentClassSelect();
  applySlotStateToSetupInputs();
  syncTournamentSetupVisibility();
  onTournamentRosterInput();
  renderTournamentSlotTabs();
  renderTournamentBracketUI();
  openModal('tournamentModal');
}

function refreshTournamentModalIfOpen() {
  ensureTournamentSlotsState();
  renderTournamentSlotTabs();
  const modal = document.getElementById('tournamentModal');
  if (modal && !modal.classList.contains('hidden')) {
    renderTournamentBracketUI();
  }
  const overviewModal = document.getElementById('tournamentOverviewModal');
  if (overviewModal && !overviewModal.classList.contains('hidden')) {
    renderTournamentOverviewGraphic();
  }
}

function toggleTournamentSetupPanel(forceState) {
  if (typeof forceState === 'boolean') {
    tournamentSetupCollapsed = forceState;
  } else {
    tournamentSetupCollapsed = !tournamentSetupCollapsed;
  }
  syncTournamentSetupVisibility();
}

function syncTournamentSetupVisibility() {
  const panel = document.getElementById('tournamentSetupPanel');
  const toggleBtnText = document.getElementById('tournamentToggleSetupBtnText');
  const toggleBtnIcon = document.getElementById('tournamentToggleSetupBtnIcon');

  if (!panel) return;
  if (tournamentSetupCollapsed) {
    panel.classList.add('hidden');
    if (toggleBtnText) toggleBtnText.innerText = '명단 입력 / 대진 설정 펼치기';
    if (toggleBtnIcon) toggleBtnIcon.className = 'fa-solid fa-chevron-down text-[11px]';
  } else {
    panel.classList.remove('hidden');
    if (toggleBtnText) toggleBtnText.innerText = '명단 입력창 접기';
    if (toggleBtnIcon) toggleBtnIcon.className = 'fa-solid fa-chevron-up text-[11px]';
  }
}

function loadClassStudentsToTournament() {
  const scope = document.getElementById('tournamentClassSelect')?.value || 'all';
  let targetStudents = [];

  if (scope === 'all') {
    targetStudents = [...state.students].sort(compareStudentsByNumber);
  } else {
    targetStudents = state.students
      .filter(s => getStudentExactClassKey(s) === scope)
      .sort(compareStudentsByNumber);
  }

  if (targetStudents.length === 0) {
    showToast('선택한 학급에 등록된 학생이 없습니다.', '⚠️');
    return;
  }

  const lines = targetStudents.map(s => s.name);

  const textarea = document.getElementById('tournamentRosterInput');
  if (textarea) {
    textarea.value = lines.join('\n');
  }

  const titleInput = document.getElementById('tournamentTitleInput');
  if (titleInput && (!titleInput.value.trim() || titleInput.value.includes('챔피언십') || titleInput.value.includes('토너먼트'))) {
    titleInput.value = scope === 'all' ? '🏓 전체 부원 탁구 토너먼트' : `🏓 ${scope} 탁구 토너먼트`;
  }

  onTournamentRosterInput();
  if (tournamentChecklistVisible) {
    renderTournamentStudentChecklist();
  }
  showToast(`${targetStudents.length}명의 학생 명단을 불러왔습니다!`, '📥');
}

function toggleTournamentChecklist() {
  tournamentChecklistVisible = !tournamentChecklistVisible;
  const box = document.getElementById('tournamentChecklistBox');
  if (!box) return;

  if (tournamentChecklistVisible) {
    box.classList.remove('hidden');
    renderTournamentStudentChecklist();
  } else {
    box.classList.add('hidden');
  }
}

function renderTournamentStudentChecklist() {
  const container = document.getElementById('tournamentChecklistItems');
  if (!container) return;

  const scope = document.getElementById('tournamentClassSelect')?.value || 'all';
  let list = [];
  if (scope === 'all') {
    list = [...state.students].sort(compareStudentsByNumber);
  } else {
    list = state.students.filter(s => getStudentExactClassKey(s) === scope).sort(compareStudentsByNumber);
  }

  if (list.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-slate-400 col-span-full text-center py-2">해당 학급에 등록된 학생이 없습니다.</p>`;
    return;
  }

  const currentSet = new Set(tournamentParticipantsDraft.map(n => stripStudentNumberPrefix(n)));

  container.innerHTML = list.map(s => {
    const label = s.name;
    const isChecked = currentSet.has(s.name);
    return `
      <label class="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-amber-400 cursor-pointer text-xs select-none transition-all">
        <input type="checkbox" class="tournament-std-check accent-amber-500 rounded" value="${escapeHtml(label)}" ${isChecked ? 'checked' : ''} onchange="applyTournamentChecklistSelection()">
        <span class="truncate font-bold text-slate-700">${escapeHtml(label)}</span>
      </label>
    `;
  }).join('');
}

function selectAllTournamentChecklist(selectAll) {
  const checks = document.querySelectorAll('.tournament-std-check');
  checks.forEach(ch => { ch.checked = selectAll; });
  applyTournamentChecklistSelection();
}

function applyTournamentChecklistSelection() {
  const checks = document.querySelectorAll('.tournament-std-check:checked');
  const selectedNames = Array.from(checks).map(ch => ch.value);
  const textarea = document.getElementById('tournamentRosterInput');
  if (textarea) {
    textarea.value = selectedNames.join('\n');
  }
  onTournamentRosterInput();
}

function loadSampleTournamentRoster(count = 8) {
  const sampleNames = [
    '김탁구', '이핑퐁', '박스매시', '최드라이브',
    '정서브', '강커트', '윤발리', '한챔프',
    '오스핀', '서랠리', '신백핸드', '류포핸드'
  ].slice(0, count);

  const textarea = document.getElementById('tournamentRosterInput');
  if (textarea) {
    textarea.value = sampleNames.join('\n');
  }
  onTournamentRosterInput();
  showToast(`예시 명단(${count}명)이 입력되었습니다!`, '⚡');
}

function addSingleTournamentParticipant() {
  const input = document.getElementById('tournamentSingleAddInput');
  const textarea = document.getElementById('tournamentRosterInput');
  if (!input || !textarea) return;

  const val = input.value.trim();
  if (!val) return;

  const currentList = parseStudentRosterText(textarea.value);
  currentList.push(val);
  textarea.value = currentList.join('\n');
  input.value = '';
  onTournamentRosterInput();
}

function removeTournamentParticipantAt(idx) {
  const textarea = document.getElementById('tournamentRosterInput');
  if (!textarea) return;

  const currentList = parseStudentRosterText(textarea.value);
  if (idx >= 0 && idx < currentList.length) {
    currentList.splice(idx, 1);
    textarea.value = currentList.join('\n');
    onTournamentRosterInput();
    if (tournamentChecklistVisible) renderTournamentStudentChecklist();
  }
}

function clearTournamentRosterInput() {
  const textarea = document.getElementById('tournamentRosterInput');
  if (textarea) textarea.value = '';
  tournamentFixedPairs = [];
  tournamentFixedPairsBySlot[state.activeTournamentSlot || 'slot_1'] = [];
  quickPairFirstStudent = null;
  onTournamentRosterInput();
  if (tournamentChecklistVisible) renderTournamentStudentChecklist();
}

// 🎯 임의 지정 짝(고정 매치 / 고정 팀) 관리 헬퍼 함수들
function onTournamentMatchTypeChange() {
  const matchType = document.getElementById('tournamentMatchTypeSelect')?.value || 'singles';
  // 단식일 때는 '1라운드 맞대결 짝(versus)', 복식일 때는 '같은 팀 파트너 짝(team)'을 기본 선택으로 전환
  setTournamentFixedPairType(matchType === 'doubles' ? 'team' : 'versus');
  updateTournamentScalePreview();
}

function syncTournamentFixedPairTypeButtons() {
  const vsBtn = document.getElementById('tournamentPairTypeVersusBtn');
  const teamBtn = document.getElementById('tournamentPairTypeTeamBtn');
  const connLabel = document.getElementById('tournamentPairConnectorLabel');

  if (vsBtn && teamBtn) {
    if (tournamentFixedPairType === 'team') {
      teamBtn.className = 'px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer bg-indigo-600 text-white shadow-2xs';
      vsBtn.className = 'px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer text-slate-600 hover:bg-indigo-50';
    } else {
      vsBtn.className = 'px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer bg-indigo-600 text-white shadow-2xs';
      teamBtn.className = 'px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer text-slate-600 hover:bg-indigo-50';
    }
  }
  if (connLabel) {
    connLabel.innerText = tournamentFixedPairType === 'team' ? '&' : 'VS';
  }
}

function setTournamentFixedPairType(type) {
  tournamentFixedPairType = type === 'team' ? 'team' : 'versus';
  syncTournamentFixedPairTypeButtons();
  populateTournamentPairSelects();
}

function getStudentFixedPairInfo(cleanStudentName) {
  if (!cleanStudentName) return null;
  for (let i = 0; i < tournamentFixedPairs.length; i++) {
    const fp = tournamentFixedPairs[i];
    if (fp.p1 === cleanStudentName || fp.p2 === cleanStudentName) {
      return { pair: fp, num: i + 1, other: fp.p1 === cleanStudentName ? fp.p2 : fp.p1 };
    }
  }
  return null;
}

function populateTournamentPairSelects() {
  const p1Select = document.getElementById('tournamentPairP1Select');
  const p2Select = document.getElementById('tournamentPairP2Select');
  if (!p1Select || !p2Select) return;

  const prevP1 = p1Select.value;
  const prevP2 = p2Select.value;

  const pairedNamesSet = new Set();
  tournamentFixedPairs.forEach(fp => {
    if (fp.p1) pairedNamesSet.add(fp.p1);
    if (fp.p2 && fp.p2 !== '__BYE__') pairedNamesSet.add(fp.p2);
  });

  const rosterNames = [...tournamentParticipantsDraft];
  const rosterSet = new Set(rosterNames);

  const buildOptions = (isSecondSelect, excludeName = '') => {
    let html = `<option value="">${isSecondSelect ? '학생 2 선택' : '학생 1 선택'}</option>`;

    if (isSecondSelect && tournamentFixedPairType === 'versus') {
      html += `<option value="__BYE__">⏩ 부전승(BYE) 우선 배정</option>`;
    }

    const availableRoster = rosterNames.filter(n => n !== excludeName);
    if (availableRoster.length > 0) {
      html += `<optgroup label="🏆 현재 참가 명단 (${availableRoster.length}명)">`;
      availableRoster.forEach(name => {
        const isAlreadyPaired = pairedNamesSet.has(name);
        const suffix = isAlreadyPaired ? ' (지정됨)' : '';
        html += `<option value="${escapeHtml(name)}">${escapeHtml(name)}${suffix}</option>`;
      });
      html += `</optgroup>`;
    }

    // 아직 참가 명단에 없지만 학급에 등록된 전체 부원도 선택 시 자동 추가되도록 제공
    const otherStudents = state.students.filter(s => {
      const cName = stripStudentNumberPrefix(s.name);
      return cName && !rosterSet.has(cName) && cName !== excludeName;
    });
    if (otherStudents.length > 0) {
      html += `<optgroup label="🏫 등록 학급 부원 (선택 시 명단 자동 추가)">`;
      otherStudents.forEach(s => {
        const cName = stripStudentNumberPrefix(s.name);
        const clsKey = getStudentExactClassKey(s);
        html += `<option value="${escapeHtml(cName)}">${escapeHtml(cName)} (${escapeHtml(clsKey)})</option>`;
      });
      html += `</optgroup>`;
    }

    return html;
  };

  p1Select.innerHTML = buildOptions(false, '');
  if (quickPairFirstStudent) {
    p1Select.value = quickPairFirstStudent;
  } else if (prevP1 && Array.from(p1Select.options).some(o => o.value === prevP1)) {
    p1Select.value = prevP1;
  } else {
    // 아직 짝이 지정되지 않은 첫 번째 참가자를 기본 후보로 선택
    const firstUnpaired = rosterNames.find(n => !pairedNamesSet.has(n));
    if (firstUnpaired) p1Select.value = firstUnpaired;
  }

  const selectedP1 = p1Select.value;
  p2Select.innerHTML = buildOptions(true, selectedP1);
  if (prevP2 && prevP2 !== selectedP1 && Array.from(p2Select.options).some(o => o.value === prevP2)) {
    p2Select.value = prevP2;
  } else {
    const secondUnpaired = rosterNames.find(n => n !== selectedP1 && !pairedNamesSet.has(n));
    if (secondUnpaired) p2Select.value = secondUnpaired;
  }
}

function onTournamentPairP1Change() {
  const p1Select = document.getElementById('tournamentPairP1Select');
  const p2Select = document.getElementById('tournamentPairP2Select');
  if (!p1Select || !p2Select) return;
  const selectedP1 = p1Select.value;
  quickPairFirstStudent = selectedP1 || null;
  populateTournamentPairSelects();
}

function addTournamentFixedPair(p1Raw, p2Raw, pairType = tournamentFixedPairType) {
  const p1 = stripStudentNumberPrefix(p1Raw);
  const p2 = p2Raw === '__BYE__' ? '__BYE__' : stripStudentNumberPrefix(p2Raw);

  if (!p1 || !p2) {
    showToast('짝으로 묶을 두 학생을 선택해 주세요!', '⚠️');
    return;
  }
  if (p1 === p2) {
    showToast('서로 다른 두 학생을 선택해 주세요!', '⚠️');
    return;
  }

  // 만약 참가 명단(textarea)에 아직 없는 학생이면 자동으로 명단에 추가
  const textarea = document.getElementById('tournamentRosterInput');
  if (textarea) {
    const currentList = parseStudentRosterText(textarea.value);
    const existingSet = new Set(currentList.map(n => stripStudentNumberPrefix(n)));
    let modified = false;
    if (!existingSet.has(p1)) {
      currentList.push(p1);
      existingSet.add(p1);
      modified = true;
    }
    if (p2 !== '__BYE__' && !existingSet.has(p2)) {
      currentList.push(p2);
      existingSet.add(p2);
      modified = true;
    }
    if (modified) {
      textarea.value = currentList.join('\n');
    }
  }

  // 기존에 p1 또는 p2가 포함된 지정 짝이 있으면 교체
  tournamentFixedPairs = tournamentFixedPairs.filter(fp =>
    fp.p1 !== p1 && fp.p2 !== p1 &&
    (p2 === '__BYE__' || (fp.p1 !== p2 && fp.p2 !== p2))
  );

  const finalType = (p2 === '__BYE__') ? 'versus' : (pairType === 'team' ? 'team' : 'versus');
  tournamentFixedPairs.push({
    id: 'fp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    type: finalType,
    p1: p1,
    p2: p2
  });

  ensureTournamentSlotsState();
  tournamentFixedPairsBySlot[state.activeTournamentSlot] = [...tournamentFixedPairs];
  quickPairFirstStudent = null;

  onTournamentRosterInput();
  const labelStr = p2 === '__BYE__'
    ? `🎯 [${p1}] 부전승(BYE) 우선 배정 추가!`
    : (finalType === 'team' ? `🤝 지정 파트너 팀 추가: ${p1} & ${p2}` : `⚔️ 1라운드 맞대결 짝 추가: ${p1} vs ${p2}`);
  showToast(labelStr, '🔗');
}

function addTournamentFixedPairFromSelects() {
  const p1 = document.getElementById('tournamentPairP1Select')?.value || '';
  const p2 = document.getElementById('tournamentPairP2Select')?.value || '';
  addTournamentFixedPair(p1, p2, tournamentFixedPairType);
}

function onTournamentChipQuickPairClick(studentName) {
  const clean = stripStudentNumberPrefix(studentName);
  if (!clean) return;

  if (!quickPairFirstStudent) {
    quickPairFirstStudent = clean;
    onTournamentRosterInput();
    return;
  }

  if (quickPairFirstStudent === clean) {
    quickPairFirstStudent = null;
    onTournamentRosterInput();
    return;
  }

  addTournamentFixedPair(quickPairFirstStudent, clean, tournamentFixedPairType);
}

function removeTournamentFixedPair(pairId) {
  tournamentFixedPairs = tournamentFixedPairs.filter(fp => fp.id !== pairId);
  ensureTournamentSlotsState();
  tournamentFixedPairsBySlot[state.activeTournamentSlot] = [...tournamentFixedPairs];
  onTournamentRosterInput();
}

function clearTournamentFixedPairs() {
  if (tournamentFixedPairs.length === 0 && !quickPairFirstStudent) return;
  tournamentFixedPairs = [];
  quickPairFirstStudent = null;
  ensureTournamentSlotsState();
  tournamentFixedPairsBySlot[state.activeTournamentSlot] = [];
  onTournamentRosterInput();
  showToast('지정된 짝 목록이 초기화되었습니다. (전체 랜덤 추첨)', '🔄');
}

function renderTournamentFixedPairsUI() {
  const badgeEl = document.getElementById('tournamentFixedPairsCountBadge');
  const listEl = document.getElementById('tournamentFixedPairsList');
  const quickStatusEl = document.getElementById('tournamentQuickPairStatus');

  if (badgeEl) {
    badgeEl.innerText = `${tournamentFixedPairs.length}쌍 지정`;
  }

  if (quickStatusEl) {
    if (quickPairFirstStudent) {
      quickStatusEl.classList.remove('hidden');
      quickStatusEl.innerHTML = `🔗 <b>${escapeHtml(quickPairFirstStudent)}</b> 선택됨 ➔ 짝지을 두 번째 학생을 클릭하세요!`;
    } else {
      quickStatusEl.classList.add('hidden');
      quickStatusEl.innerHTML = '';
    }
  }

  if (listEl) {
    if (tournamentFixedPairs.length === 0) {
      listEl.innerHTML = `
        <p class="text-[10px] text-indigo-800/80 font-bold leading-snug">
          💡 지정한 짝만 대진(또는 복식 팀)을 고정하고, <b>나머지 인원은 전체 랜덤</b>으로 편성됩니다.
        </p>
      `;
    } else {
      listEl.innerHTML = tournamentFixedPairs.map((fp, idx) => {
        const isTeam = fp.type === 'team';
        const isBye = fp.p2 === '__BYE__';
        const badgeText = isBye ? `⏩ #${idx + 1} 부전승` : (isTeam ? `🤝 #${idx + 1} 한팀` : `⚔️ #${idx + 1} 맞대결`);
        const badgeClass = isTeam
          ? 'bg-emerald-600 text-white'
          : 'bg-indigo-600 text-white';
        const midText = isBye ? '➔' : (isTeam ? '&' : 'VS');
        const rightText = isBye ? '부전승(BYE)' : fp.p2;

        return `
          <div class="flex items-center justify-between gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200 shadow-2xs text-[11px]">
            <div class="flex items-center space-x-1.5 min-w-0">
              <span class="text-[9px] font-black px-1.5 py-0.5 rounded ${badgeClass} shrink-0">${badgeText}</span>
              <span class="font-black text-slate-800 truncate">${escapeHtml(fp.p1)}</span>
              <span class="text-[10px] font-black ${isTeam ? 'text-emerald-600' : 'text-indigo-600'} shrink-0">${midText}</span>
              <span class="font-black text-slate-800 truncate">${escapeHtml(rightText)}</span>
            </div>
            <button
              type="button"
              onclick="removeTournamentFixedPair('${escapeHtml(fp.id)}')"
              class="text-slate-400 hover:text-rose-600 px-1 font-black cursor-pointer shrink-0"
              title="이 지정 짝 해제"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        `;
      }).join('');
    }
  }

  populateTournamentPairSelects();
}

function onTournamentRosterInput() {
  const textarea = document.getElementById('tournamentRosterInput');
  const raw = textarea ? textarea.value : '';
  tournamentParticipantsDraft = parseStudentRosterText(raw);

  // 참가 인원 배지 업데이트
  const countBadge = document.getElementById('tournamentRosterCountBadge');
  if (countBadge) {
    countBadge.innerText = `총 ${tournamentParticipantsDraft.length}명`;
  }

  // 참가 학생 칩 렌더링 (클릭 시 빠른 짝 지정 가능 + 이미 지정된 짝 번호 표시)
  const chipsContainer = document.getElementById('tournamentParticipantChips');
  if (chipsContainer) {
    if (tournamentParticipantsDraft.length === 0) {
      chipsContainer.innerHTML = `<span class="text-[11px] text-slate-400 py-1">위에 학생 명단을 입력하거나 학급 명단을 불러오면 이곳에 참가자 목록이 표시됩니다.</span>`;
    } else {
      chipsContainer.innerHTML = tournamentParticipantsDraft.map((name, idx) => {
        const clean = stripStudentNumberPrefix(name);
        const pairInfo = getStudentFixedPairInfo(clean);
        const isFirstSelected = quickPairFirstStudent === clean;

        let chipStyle = 'bg-amber-50 hover:bg-indigo-50 text-amber-950 border-amber-200/80';
        let pairTag = '';
        if (isFirstSelected) {
          chipStyle = 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300';
          pairTag = `<span class="text-[9px] bg-white text-indigo-700 px-1 rounded font-black">1번째 선택</span>`;
        } else if (pairInfo) {
          const isTeam = pairInfo.pair.type === 'team';
          chipStyle = isTeam
            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border-indigo-300';
          pairTag = `<span class="text-[9px] ${isTeam ? 'bg-emerald-600' : 'bg-indigo-600'} text-white px-1 rounded font-black" title="지정 짝: ${escapeHtml(pairInfo.other === '__BYE__' ? '부전승' : pairInfo.other)}">${isTeam ? `🤝${pairInfo.num}팀` : `🎯${pairInfo.num}짝`}</span>`;
        }

        return `
          <span
            onclick="onTournamentChipQuickPairClick('${escapeHtml(clean)}')"
            class="inline-flex items-center space-x-1 border px-2.5 py-1 rounded-xl text-[11px] font-extrabold shadow-2xs cursor-pointer transition-all select-none ${chipStyle}"
            title="클릭하여 다른 학생과 지정 짝으로 묶기"
          >
            <span class="${isFirstSelected ? 'text-indigo-200' : 'text-amber-600'} font-black">${idx + 1}.</span>
            <span>${escapeHtml(name)}</span>
            ${pairTag}
            <button
              type="button"
              onclick="event.stopPropagation(); removeTournamentParticipantAt(${idx})"
              class="${isFirstSelected ? 'text-indigo-200 hover:text-white' : 'text-amber-400 hover:text-rose-500'} ml-1 transition-colors cursor-pointer"
              title="명단에서 제외"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </span>
        `;
      }).join('');
    }
  }

  renderTournamentClassCheckboxes();
  renderTournamentFixedPairsUI();
  updateTournamentScalePreview();
}

// 토너먼트 경기 진행 방식 헬퍼 ('single_11': 단판 11점 승부, 'bo3_11': 11점 1세트 · 3판 2선승제)
function isBo3Tournament(tour = state.savedTournament) {
  return !!(tour && tour.gameFormat === 'bo3_11');
}

function getTournamentGameFormatLabel(gameFormat, short = false) {
  if (gameFormat === 'bo3_11') {
    return short ? '🔥 11점 3판2선승' : '🔥 11점 1세트 · 3판 2선승제';
  }
  return short ? '⚡ 단판 11점제' : '⚡ 단판 11점 승부 (1세트)';
}

function ensureTournamentMatchSets(match) {
  if (!match) return [];
  if (!Array.isArray(match.sets) || match.sets.length < 3) {
    const existing = Array.isArray(match.sets) ? match.sets : [];
    match.sets = [0, 1, 2].map(idx => ({
      s1: existing[idx] && existing[idx].s1 !== undefined ? existing[idx].s1 : null,
      s2: existing[idx] && existing[idx].s2 !== undefined ? existing[idx].s2 : null
    }));
  }
  return match.sets;
}

function formatTournamentMatchScore(match, tour = state.savedTournament, includeSetDetails = true) {
  if (!match || match.isByeMatch) return '';
  const bo3 = isBo3Tournament(tour);
  if (bo3) {
    const sets = Array.isArray(match.sets) ? match.sets : [];
    const validSets = sets.filter(st => st && st.s1 !== null && st.s1 !== undefined && st.s2 !== null && st.s2 !== undefined && (st.s1 !== '' || st.s2 !== ''));
    const hasSetWins = match.score1 !== null && match.score1 !== undefined && match.score2 !== null && match.score2 !== undefined;
    if (!hasSetWins && validSets.length === 0) return '';
    const w1 = hasSetWins ? match.score1 : 0;
    const w2 = hasSetWins ? match.score2 : 0;
    const detailStr = (includeSetDetails && validSets.length > 0)
      ? ` (${validSets.map((st, i) => `${i + 1}S ${st.s1}:${st.s2}`).join(', ')})`
      : '';
    return `세트 ${w1} : ${w2}${detailStr}`;
  } else {
    if (match.score1 === null || match.score1 === undefined || match.score2 === null || match.score2 === undefined) {
      return '';
    }
    return `${match.score1} : ${match.score2}점`;
  }
}

function updateTournamentScalePreview() {
  const previewEl = document.getElementById('tournamentScalePreview');
  if (!previewEl) return;

  const matchType = document.getElementById('tournamentMatchTypeSelect')?.value || 'singles';
  const gameFormat = document.getElementById('tournamentGameFormatSelect')?.value || 'single_11';
  const formatBadgeText = getTournamentGameFormatLabel(gameFormat, false);
  const rawCount = tournamentParticipantsDraft.length;
  const fixedTeamCount = tournamentFixedPairs.filter(fp => fp.type === 'team' && fp.p2 !== '__BYE__').length;
  const entryCount = matchType === 'doubles'
    ? Math.ceil(rawCount / 2)
    : Math.max(0, rawCount - fixedTeamCount);
  const unitLabel = matchType === 'doubles' ? '팀' : '명';

  if (entryCount < 2) {
    previewEl.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 text-slate-500">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-circle-info text-amber-500"></i>
          <span>최소 <b>${matchType === 'doubles' ? '4명(2팀)' : '2명'}</b> 이상의 학생 명단을 입력하면 대진표 규모가 자동 계산됩니다.</span>
        </div>
        <span class="text-[11px] font-black px-2.5 py-0.5 rounded-lg ${gameFormat === 'bo3_11' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-sky-100 text-sky-800 border border-sky-300'}">${formatBadgeText}</span>
      </div>
    `;
    return;
  }

  const roundsCount = Math.ceil(Math.log2(entryCount));
  const bracketSize = Math.pow(2, roundsCount);
  const byesCount = bracketSize - entryCount;
  const firstRoundMatches = entryCount - (bracketSize / 2);

  const scaleLabel = bracketSize === 2 ? '결승 직행(2강)' : `${bracketSize}강 토너먼트`;
  const fixedPairBadge = tournamentFixedPairs.length > 0
    ? `<span class="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300">🎯 지정짝 ${tournamentFixedPairs.length}쌍 고정 + 나머지 랜덤</span>`
    : '';

  previewEl.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center flex-wrap gap-1.5">
        <span class="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">${scaleLabel}</span>
        <span class="font-extrabold text-slate-800">참가 ${rawCount}명 ${matchType === 'doubles' ? `(복식 ${entryCount}팀)` : ''}</span>
        <span class="text-[10px] font-black px-2 py-0.5 rounded-lg ${gameFormat === 'bo3_11' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-sky-100 text-sky-800 border border-sky-300'}">${formatBadgeText}</span>
        ${fixedPairBadge}
      </div>
      <div class="text-[11px] font-bold text-emerald-800">
        1라운드 <b>${firstRoundMatches}경기</b> 진행 · 부전승(BYE) <b>${byesCount}${unitLabel}</b> · 총 <b>${roundsCount}라운드</b>
      </div>
    </div>
  `;
}

// 표준 토너먼트 시드 배치 순서 생성 (1 vs P, 2 vs P-1 등이 대칭 배치되도록)
function generateStandardSeedOrder(bracketSize) {
  let rounds = Math.log2(bracketSize);
  let seeds = [1, 2];
  for (let r = 1; r < rounds; r++) {
    const nextSeeds = [];
    const sum = seeds.length * 2 + 1;
    for (let i = 0; i < seeds.length; i++) {
      nextSeeds.push(seeds[i]);
      nextSeeds.push(sum - seeds[i]);
    }
    seeds = nextSeeds;
  }
  return seeds; // 길이 = bracketSize (짝수 인덱스 vs 홀수 인덱스가 1라운드 매치)
}

function getRoundTitle(numMatchesInRound, roundIdx, totalRounds) {
  const slots = numMatchesInRound * 2;
  if (slots === 2) return '🏆 결승전 (Final)';
  if (slots === 4) return '🔥 4강 (준결승)';
  if (slots === 8) return '⚡ 8강 (준준결승)';
  if (slots === 16) return '🎯 16강';
  if (slots === 32) return '🏓 32강';
  if (slots === 64) return '🏟️ 64강';
  return `${slots}강 (${roundIdx + 1}라운드)`;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createByeSlotEntry() {
  return {
    entryId: 'BYE',
    name: '부전승 (BYE)',
    shortName: 'BYE',
    avatar: '⏩',
    isBye: true,
    seed: null
  };
}

function generateTournamentBracket(isReshuffle = false) {
  const textarea = document.getElementById('tournamentRosterInput');
  let rawNames = parseStudentRosterText(textarea ? textarea.value : '');

  if (isReshuffle && rawNames.length < 2 && state.savedTournament && state.savedTournament.rawRosterList) {
    rawNames = [...state.savedTournament.rawRosterList];
    if (textarea) textarea.value = rawNames.join('\n');
    onTournamentRosterInput();
  }

  // 재추첨 시 기존 저장된 지정 짝(fixedPairs)이 있으면 유지
  if (isReshuffle && tournamentFixedPairs.length === 0 && state.savedTournament && Array.isArray(state.savedTournament.fixedPairs)) {
    tournamentFixedPairs = JSON.parse(JSON.stringify(state.savedTournament.fixedPairs));
    ensureTournamentSlotsState();
    tournamentFixedPairsBySlot[state.activeTournamentSlot] = [...tournamentFixedPairs];
  }

  const matchType = document.getElementById('tournamentMatchTypeSelect')?.value || (isReshuffle && state.savedTournament?.matchType) || 'singles';
  const gameFormat = document.getElementById('tournamentGameFormatSelect')?.value || (isReshuffle && state.savedTournament?.gameFormat) || 'single_11';
  const seedMode = document.getElementById('tournamentSeedModeSelect')?.value || 'random';
  const includeThirdPlace = document.getElementById('tournamentThirdPlaceCheck') ? document.getElementById('tournamentThirdPlaceCheck').checked : true;
  const preferredClass = document.getElementById('tournamentClassSelect')?.value || 'all';
  const titleInput = document.getElementById('tournamentTitleInput');
  const tournamentTitle = (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : '🏓 탁구 챔피언십 토너먼트';

  // 지정 짝에 등록된 학생이 rawNames에 누락되어 있으면 자동 포함
  const rawCleanSet = new Set(rawNames.map(n => stripStudentNumberPrefix(n)));
  tournamentFixedPairs.forEach(fp => {
    const c1 = stripStudentNumberPrefix(fp.p1);
    const c2 = fp.p2 === '__BYE__' ? '__BYE__' : stripStudentNumberPrefix(fp.p2);
    if (c1 && !rawCleanSet.has(c1)) {
      rawNames.push(c1);
      rawCleanSet.add(c1);
    }
    if (c2 && c2 !== '__BYE__' && !rawCleanSet.has(c2)) {
      rawNames.push(c2);
      rawCleanSet.add(c2);
    }
  });

  if (matchType === ' singles' || matchType === 'singles') {
    if (rawNames.length < 2) {
      showToast('단식 토너먼트는 최소 2명 이상의 학생 이름을 입력해 주세요!', '⚠️');
      return;
    }
  } else {
    if (rawNames.length < 4) {
      showToast('복식(2인 1팀) 토너먼트는 최소 4명(2팀) 이상의 학생을 입력해 주세요!', '⚠️');
      return;
    }
  }

  // 학생 메타데이터 매칭
  let enrichedPlayers = rawNames.map((name, idx) => ({
    ...matchStudentMetadata(name, preferredClass),
    originalOrder: idx + 1
  }));

  // 1단계: 'team'(🤝 한 팀 파트너 짝) 우선 구성
  const usedPlayerIdxSet = new Set();
  const takePlayerByCleanName = (targetClean) => {
    if (!targetClean) return null;
    for (let i = 0; i < enrichedPlayers.length; i++) {
      if (usedPlayerIdxSet.has(i)) continue;
      if (enrichedPlayers[i].cleanName === targetClean || stripStudentNumberPrefix(enrichedPlayers[i].name) === targetClean) {
        usedPlayerIdxSet.add(i);
        return enrichedPlayers[i];
      }
    }
    return null;
  };

  const fixedTeamEntries = [];
  const teamPairs = tournamentFixedPairs.filter(fp => fp.type === 'team' && fp.p2 !== '__BYE__');
  teamPairs.forEach((tp, idx) => {
    const p1 = takePlayerByCleanName(stripStudentNumberPrefix(tp.p1));
    const p2 = takePlayerByCleanName(stripStudentNumberPrefix(tp.p2));
    if (p1 && p2) {
      fixedTeamEntries.push({
        entryId: `fixed_team_${idx + 1}`,
        name: `${p1.name} & ${p2.name}`,
        shortName: `${p1.cleanName}·${p2.cleanName}`,
        memberNames: [p1.name, p2.name],
        avatar: '🤝',
        playerIds: [p1.id, p2.id].filter(Boolean),
        isFixedTeam: true,
        fixedPairNum: idx + 1,
        winRate: ((p1.winRate || 0) + (p2.winRate || 0)) / 2,
        wins: (p1.wins || 0) + (p2.wins || 0),
        points: (p1.points || 0) + (p2.points || 0),
        seed: 0
      });
    }
  });

  // 고정 팀에 속하지 않은 나머지 학생 풀
  let remainingPlayers = enrichedPlayers.filter((_, idx) => !usedPlayerIdxSet.has(idx));

  // 추첨/배정 방식 적용 (나머지 학생들을 랜덤 셔플 또는 랭킹 정렬)
  if (seedMode === 'random' || isReshuffle) {
    shuffleInPlace(remainingPlayers);
  } else if (seedMode === 'ranking') {
    remainingPlayers.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.points - a.points;
    });
  }

  // 단식 / 복식 참가 엔트리 구성
  let allCandidateEntries = [...fixedTeamEntries];
  if (matchType === 'doubles') {
    for (let i = 0; i < remainingPlayers.length; i += 2) {
      const p1 = remainingPlayers[i];
      const p2 = remainingPlayers[i + 1];
      if (p2) {
        allCandidateEntries.push({
          entryId: `team_${allCandidateEntries.length + 1}`,
          name: `${p1.name} & ${p2.name}`,
          shortName: `${p1.cleanName}·${p2.cleanName}`,
          memberNames: [p1.name, p2.name],
          avatar: '👥',
          playerIds: [p1.id, p2.id].filter(Boolean),
          winRate: ((p1.winRate || 0) + (p2.winRate || 0)) / 2,
          wins: (p1.wins || 0) + (p2.wins || 0),
          points: (p1.points || 0) + (p2.points || 0),
          seed: 0
        });
      } else {
        // 홀수 인원일 경우 단독/파트너 미정 팀
        allCandidateEntries.push({
          entryId: `team_${allCandidateEntries.length + 1}`,
          name: `${p1.name} (파트너 미정)`,
          shortName: p1.cleanName,
          memberNames: [p1.name],
          avatar: '👤',
          playerIds: p1.id ? [p1.id] : [],
          winRate: p1.winRate || 0,
          wins: p1.wins || 0,
          points: p1.points || 0,
          seed: 0
        });
      }
    }
  } else {
    remainingPlayers.forEach((p, idx) => {
      allCandidateEntries.push({
        entryId: p.id || `p_${idx + 1}`,
        name: p.name,
        shortName: p.cleanName,
        avatar: p.avatar || '🏓',
        playerIds: p.id ? [p.id] : [],
        winRate: p.winRate || 0,
        wins: p.wins || 0,
        points: p.points || 0,
        seed: 0
      });
    });
  }

  // 2단계: 'versus'(⚔️ 1라운드 맞대결 짝 또는 부전승 지정) 분리
  const usedEntryIdxSet = new Set();
  const takeEntryByStudentName = (targetClean) => {
    if (!targetClean) return null;
    for (let i = 0; i < allCandidateEntries.length; i++) {
      if (usedEntryIdxSet.has(i)) continue;
      const ent = allCandidateEntries[i];
      const entClean = stripStudentNumberPrefix(ent.name);
      const hasInMembers = Array.isArray(ent.memberNames) && ent.memberNames.some(m => stripStudentNumberPrefix(m) === targetClean);
      if (entClean === targetClean || ent.shortName === targetClean || hasInMembers) {
        usedEntryIdxSet.add(i);
        return ent;
      }
    }
    return null;
  };

  const lockedVersusPairs = []; // [{ entry1, entry2, pairNum }]
  const lockedByeEntries = [];  // [{ entry1, pairNum }]
  const versusPairs = tournamentFixedPairs.filter(fp => fp.type === 'versus');

  versusPairs.forEach((vp, idx) => {
    const c1 = stripStudentNumberPrefix(vp.p1);
    const c2 = vp.p2 === '__BYE__' ? '__BYE__' : stripStudentNumberPrefix(vp.p2);
    if (c2 === '__BYE__') {
      const e1 = takeEntryByStudentName(c1);
      if (e1) {
        lockedByeEntries.push({ entry1: e1, pairNum: idx + 1 });
      }
    } else {
      const e1 = takeEntryByStudentName(c1);
      const e2 = takeEntryByStudentName(c2);
      if (e1 && e2) {
        lockedVersusPairs.push({ entry1: e1, entry2: e2, pairNum: idx + 1 });
      } else {
        // 한쪽만 찾아진 경우 다시 자유 풀로 복원
        if (e1) {
          const foundIdx = allCandidateEntries.indexOf(e1);
          if (foundIdx !== -1) usedEntryIdxSet.delete(foundIdx);
        }
        if (e2) {
          const foundIdx = allCandidateEntries.indexOf(e2);
          if (foundIdx !== -1) usedEntryIdxSet.delete(foundIdx);
        }
      }
    }
  });

  // 맞대결 고정에 속하지 않은 일반 엔트리 풀
  let freeEntries = allCandidateEntries.filter((_, idx) => !usedEntryIdxSet.has(idx));
  if (seedMode === 'random' || isReshuffle) {
    shuffleInPlace(freeEntries);
    shuffleInPlace(lockedVersusPairs);
  } else if (seedMode === 'ranking') {
    freeEntries.sort((a, b) => {
      if ((b.winRate || 0) !== (a.winRate || 0)) return (b.winRate || 0) - (a.winRate || 0);
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
      return (b.points || 0) - (a.points || 0);
    });
  }

  const N = lockedVersusPairs.length * 2 + lockedByeEntries.length + freeEntries.length;
  const totalRounds = Math.ceil(Math.log2(N));
  const bracketSize = Math.pow(2, totalRounds);
  const byesCount = bracketSize - N;
  const numFirstRoundMatches = bracketSize / 2;

  let slotEntries = [];
  const fixedMatchMetaByIdx = {}; // { [matchIdx]: { isFixedPairMatch: true, fixedPairNum } }

  if (lockedVersusPairs.length === 0 && lockedByeEntries.length === 0) {
    // 기존 시드 배치 방식 100% 유지
    const entries = freeEntries.map((ent, idx) => ({ ...ent, seed: idx + 1 }));
    if (seedMode === 'order' && byesCount === 0 && !isReshuffle) {
      slotEntries = [...entries];
    } else {
      const seedOrder = generateStandardSeedOrder(bracketSize); // 1-based seeds
      slotEntries = seedOrder.map(seedNum => {
        if (seedNum <= N) {
          return entries[seedNum - 1];
        }
        return createByeSlotEntry();
      });
    }
  } else {
    // 🎯 지정된 1라운드 맞대결 짝(lockedVersusPairs) 및 부전승 지정(lockedByeEntries)을 우선 배치하고 나머지는 전체 랜덤 배정
    slotEntries = new Array(bracketSize).fill(null);
    const seedOrder = generateStandardSeedOrder(bracketSize);
    const fullMatchIndices = [];
    const byeMatchIndices = [];

    for (let m = 0; m < numFirstRoundMatches; m++) {
      const sA = seedOrder[m * 2];
      const sB = seedOrder[m * 2 + 1];
      if (sA <= N && sB <= N) {
        fullMatchIndices.push(m);
      } else {
        byeMatchIndices.push(m);
      }
    }

    if (seedMode === 'random' || isReshuffle) {
      shuffleInPlace(fullMatchIndices);
      shuffleInPlace(byeMatchIndices);
    }

    const usedMatchIndices = new Set();

    // 1) ⚔️ 1라운드 맞대결 짝(lockedVersusPairs)을 실제 1라운드 경기 슬롯(fullMatchIndices 우선)에 고정 배치
    const versusCandidateMatches = [...fullMatchIndices, ...byeMatchIndices];
    lockedVersusPairs.forEach((vp, idx) => {
      const targetMatchIdx = versusCandidateMatches.find(mIdx => !usedMatchIndices.has(mIdx));
      if (targetMatchIdx !== undefined) {
        usedMatchIndices.add(targetMatchIdx);
        slotEntries[targetMatchIdx * 2] = {
          ...vp.entry1,
          isFixedVersus: true,
          fixedPairNum: vp.pairNum
        };
        slotEntries[targetMatchIdx * 2 + 1] = {
          ...vp.entry2,
          isFixedVersus: true,
          fixedPairNum: vp.pairNum
        };
        fixedMatchMetaByIdx[targetMatchIdx] = {
          isFixedPairMatch: true,
          fixedPairNum: vp.pairNum
        };
      }
    });

    // 2) 남은 1라운드 매치 슬롯 확인 (부전승 슬롯 vs 일반 2인 대진 슬롯)
    const remByeMatches = byeMatchIndices.filter(mIdx => !usedMatchIndices.has(mIdx));
    const remFullMatches = fullMatchIndices.filter(mIdx => !usedMatchIndices.has(mIdx));
    const remAllMatches = [...remByeMatches, ...remFullMatches];

    // 남은 실제 엔트리 풀 (부전승 우선 지정된 학생을 맨 앞에 배치하여 remByeMatches에 우선 배정)
    const remainingRealPool = [
      ...lockedByeEntries.map(lb => ({ ...lb.entry1, isFixedBye: true, fixedPairNum: lb.pairNum })),
      ...freeEntries
    ];

    const R_rem = remainingRealPool.length;
    const M_rem = remAllMatches.length;

    if (R_rem >= M_rem) {
      // M_rem개의 매치 중 (2*M_rem - R_rem)개는 (실제 선수 1명 + BYE 1개), (R_rem - M_rem)개는 (실제 선수 2명)
      const singleWithByeCount = Math.max(0, 2 * M_rem - R_rem);
      let poolCursor = 0;

      for (let i = 0; i < M_rem; i++) {
        const mIdx = remAllMatches[i];
        if (i < singleWithByeCount) {
          const p1 = remainingRealPool[poolCursor++];
          slotEntries[mIdx * 2] = p1 || createByeSlotEntry();
          slotEntries[mIdx * 2 + 1] = createByeSlotEntry();
          if (p1 && p1.isFixedBye) {
            fixedMatchMetaByIdx[mIdx] = { isFixedByeMatch: true, fixedPairNum: p1.fixedPairNum };
          }
        } else {
          const p1 = remainingRealPool[poolCursor++];
          const p2 = remainingRealPool[poolCursor++];
          slotEntries[mIdx * 2] = p1 || createByeSlotEntry();
          slotEntries[mIdx * 2 + 1] = p2 || createByeSlotEntry();
        }
      }
    } else {
      // 지정 짝 수가 많아 남은 개별 선수 수(R_rem)가 남은 매치 수(M_rem)보다 적은 경우
      let poolCursor = 0;
      for (let i = 0; i < M_rem; i++) {
        const mIdx = remAllMatches[i];
        if (poolCursor < R_rem) {
          const p1 = remainingRealPool[poolCursor++];
          slotEntries[mIdx * 2] = p1;
          slotEntries[mIdx * 2 + 1] = createByeSlotEntry();
        } else {
          slotEntries[mIdx * 2] = createByeSlotEntry();
          slotEntries[mIdx * 2 + 1] = createByeSlotEntry();
        }
      }
    }

    // 시드 번호 부여
    let seedCounter = 1;
    slotEntries.forEach(ent => {
      if (ent && !ent.isBye) {
        ent.seed = seedCounter++;
      }
    });
  }

  // 전체 라운드 및 매치 생성
  const rounds = [];
  for (let r = 0; r < totalRounds; r++) {
    const numMatches = bracketSize / Math.pow(2, r + 1);
    const roundMatches = [];

    for (let m = 0; m < numMatches; m++) {
      if (r === 0) {
        const p1 = slotEntries[m * 2];
        const p2 = slotEntries[m * 2 + 1];
        const isP1Bye = !!(p1 && p1.isBye);
        const isP2Bye = !!(p2 && p2.isBye);
        let winnerSlot = null;
        let isByeMatch = false;

        if (isP1Bye && !isP2Bye) {
          winnerSlot = 2;
          isByeMatch = true;
        } else if (!isP1Bye && isP2Bye) {
          winnerSlot = 1;
          isByeMatch = true;
        } else if (isP1Bye && isP2Bye) {
          winnerSlot = 1;
          isByeMatch = true;
        }

        const fixedMeta = fixedMatchMetaByIdx[m] || {};

        roundMatches.push({
          matchId: `r0_m${m}`,
          roundIdx: 0,
          matchIdx: m,
          label: `${m + 1}경기`,
          player1: p1,
          player2: p2,
          score1: null,
          score2: null,
          sets: [
            { s1: null, s2: null },
            { s1: null, s2: null },
            { s1: null, s2: null }
          ],
          winnerSlot: winnerSlot,
          isByeMatch: isByeMatch,
          isFixedPairMatch: !!fixedMeta.isFixedPairMatch,
          isFixedByeMatch: !!fixedMeta.isFixedByeMatch,
          fixedPairNum: fixedMeta.fixedPairNum || null
        });
      } else {
        roundMatches.push({
          matchId: `r${r}_m${m}`,
          roundIdx: r,
          matchIdx: m,
          label: numMatches === 1 ? '결승전' : `${m + 1}경기`,
          player1: null,
          player2: null,
          score1: null,
          score2: null,
          sets: [
            { s1: null, s2: null },
            { s1: null, s2: null },
            { s1: null, s2: null }
          ],
          winnerSlot: null,
          isByeMatch: false
        });
      }
    }

    rounds.push({
      roundIdx: r,
      title: getRoundTitle(numMatches, r, totalRounds),
      matches: roundMatches
    });
  }

  // 1라운드 부전승(BYE) 승자를 2라운드로 자동 진출 반영 (연쇄 부전승 포함)
  if (totalRounds > 1) {
    for (let r = 0; r < totalRounds - 1; r++) {
      rounds[r].matches.forEach((match, mIdx) => {
        if (match.winnerSlot === 1 || match.winnerSlot === 2) {
          const advancingPlayer = match.winnerSlot === 1 ? match.player1 : match.player2;
          const nextMatchIdx = Math.floor(mIdx / 2);
          const isTopSlot = (mIdx % 2 === 0);
          const nextMatch = rounds[r + 1].matches[nextMatchIdx];
          if (isTopSlot) {
            nextMatch.player1 = advancingPlayer;
          } else {
            nextMatch.player2 = advancingPlayer;
          }
          // 만약 다음 라운드 매치의 두 슬롯이 모두 채워졌는데 한쪽이 BYE이면 자동 부전승 처리
          if (nextMatch.player1 && nextMatch.player2) {
            if (nextMatch.player1.isBye && !nextMatch.player2.isBye) {
              nextMatch.winnerSlot = 2;
              nextMatch.isByeMatch = true;
            } else if (!nextMatch.player1.isBye && nextMatch.player2.isBye) {
              nextMatch.winnerSlot = 1;
              nextMatch.isByeMatch = true;
            }
          }
        }
      });
    }
  }

  // 3·4위 결정전 객체 (4강 이상일 때)
  let thirdPlaceMatch = null;
  if (includeThirdPlace && totalRounds >= 2 && N >= 4) {
    thirdPlaceMatch = {
      matchId: 'third_place',
      label: '🥉 3·4위 결정전',
      player1: null,
      player2: null,
      score1: null,
      score2: null,
      sets: [
        { s1: null, s2: null },
        { s1: null, s2: null },
        { s1: null, s2: null }
      ],
      winnerSlot: null
    };
  }

  const now = new Date();
  const createdAt = `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  ensureTournamentSlotsState();
  const slotMeta = getTournamentSlotMeta(state.activeTournamentSlot);

  const tournamentData = {
    id: 'tour_' + Date.now(),
    slotKey: state.activeTournamentSlot,
    title: tournamentTitle,
    matchType: matchType,
    gameFormat: gameFormat,
    seedMode: seedMode,
    includeThirdPlace: includeThirdPlace,
    fixedPairs: JSON.parse(JSON.stringify(tournamentFixedPairs)),
    rawRosterList: rawNames,
    participantCount: rawNames.length,
    entryCount: N,
    bracketSize: bracketSize,
    byesCount: byesCount,
    totalRounds: totalRounds,
    rounds: rounds,
    thirdPlaceMatch: thirdPlaceMatch,
    createdAt: createdAt
  };

  state.savedTournament = tournamentData;
  saveTournamentToRTDB(tournamentData, state.activeTournamentSlot);

  // 대진표 생성 후 자동으로 설정 패널을 접어 대진표를 한눈에 볼 수 있게 함
  tournamentSetupCollapsed = true;
  syncTournamentSetupVisibility();

  renderTournamentSlotTabs();
  renderTournamentBracketUI();
  renderTournamentActiveBanner();
  playSuccessSound();
  showToast(`🏆 [${slotMeta.label}] ${tournamentTitle} (${bracketSize}강 · ${getTournamentGameFormatLabel(gameFormat, true)}) 자동 작성 완료!`, '🎉');
}

function selectTournamentMatchWinner(roundIdx, matchIdx, slotNum, isThirdPlace = false) {
  const tour = state.savedTournament;
  if (!tour || !tour.rounds) return;
  const bo3 = isBo3Tournament(tour);

  if (isThirdPlace) {
    const tp = tour.thirdPlaceMatch;
    if (!tp || !tp.player1 || !tp.player2) return;
    tp.winnerSlot = (tp.winnerSlot === slotNum) ? null : slotNum;
    if (bo3 && tp.winnerSlot) {
      if (tp.winnerSlot === 1 && (tp.score1 === null || tp.score1 < 2)) {
        tp.score1 = 2;
        if (tp.score2 === null || tp.score2 === undefined || tp.score2 >= 2) tp.score2 = 0;
      } else if (tp.winnerSlot === 2 && (tp.score2 === null || tp.score2 < 2)) {
        tp.score2 = 2;
        if (tp.score1 === null || tp.score1 === undefined || tp.score1 >= 2) tp.score1 = 0;
      }
    }
    saveTournamentToRTDB(tour);
    renderTournamentBracketUI();
    renderTournamentActiveBanner();
    if (tp.winnerSlot) playSuccessSound();
    return;
  }

  const round = tour.rounds[roundIdx];
  if (!round || !round.matches[matchIdx]) return;
  const match = round.matches[matchIdx];

  if (match.isByeMatch) return;
  if (!match.player1 || !match.player2 || match.player1.isBye || match.player2.isBye) {
    showToast('아직 두 대진 상대가 모두 확정되지 않았습니다.', '⚠️');
    return;
  }

  // 이미 같은 슬롯이 승자로 선택된 경우 선택 해제 가능
  if (match.winnerSlot === slotNum) {
    match.winnerSlot = null;
    clearDownstreamAdvancement(tour, roundIdx, matchIdx);
  } else {
    match.winnerSlot = slotNum;
    if (bo3) {
      if (slotNum === 1 && (match.score1 === null || match.score1 < 2)) {
        match.score1 = 2;
        if (match.score2 === null || match.score2 === undefined || match.score2 >= 2) match.score2 = 0;
      } else if (slotNum === 2 && (match.score2 === null || match.score2 < 2)) {
        match.score2 = 2;
        if (match.score1 === null || match.score1 === undefined || match.score1 >= 2) match.score1 = 0;
      }
    }
    propagateWinnerToNextRound(tour, roundIdx, matchIdx);
  }

  saveTournamentToRTDB(tour);
  renderTournamentBracketUI();
  renderTournamentActiveBanner();

  // 결승전 우승자 확정 시 축하 폭죽
  const isFinal = (roundIdx === tour.rounds.length - 1);
  if (isFinal && match.winnerSlot) {
    playSuccessSound();
    triggerConfetti('ceremony-crowns');
    const champion = match.winnerSlot === 1 ? match.player1 : match.player2;
    showToast(`👑 축하합니다! ${champion.name} 최종 우승!`, '🏆');
  } else if (match.winnerSlot) {
    playSuccessSound();
  }
}

function propagateWinnerToNextRound(tour, roundIdx, matchIdx) {
  const match = tour.rounds[roundIdx].matches[matchIdx];
  const winner = match.winnerSlot === 1 ? match.player1 : (match.winnerSlot === 2 ? match.player2 : null);
  const loser = match.winnerSlot === 1 ? match.player2 : (match.winnerSlot === 2 ? match.player1 : null);

  // 다음 라운드가 존재하면 승자 진출
  if (roundIdx + 1 < tour.rounds.length) {
    const nextRound = tour.rounds[roundIdx + 1];
    const nextMatchIdx = Math.floor(matchIdx / 2);
    const isTopSlot = (matchIdx % 2 === 0);
    const nextMatch = nextRound.matches[nextMatchIdx];

    if (nextMatch) {
      const prevPlayer = isTopSlot ? nextMatch.player1 : nextMatch.player2;
      const changed = !prevPlayer || prevPlayer.name !== (winner ? winner.name : '');

      if (isTopSlot) {
        nextMatch.player1 = winner ? JSON.parse(JSON.stringify(winner)) : null;
      } else {
        nextMatch.player2 = winner ? JSON.parse(JSON.stringify(winner)) : null;
      }

      // 진출 선수가 바뀌었으면 이후 라운드 결과 초기화
      if (changed && nextMatch.winnerSlot) {
        nextMatch.winnerSlot = null;
        nextMatch.score1 = null;
        nextMatch.score2 = null;
        nextMatch.sets = [{ s1: null, s2: null }, { s1: null, s2: null }, { s1: null, s2: null }];
        clearDownstreamAdvancement(tour, roundIdx + 1, nextMatchIdx);
      }

      // 만약 다음 라운드 상대 슬롯이 부전승(BYE)인 경우 자동으로 다음 라운드도 진출 처리
      if (nextMatch.player1 && nextMatch.player2) {
        if (nextMatch.player1.isBye && !nextMatch.player2.isBye) {
          nextMatch.winnerSlot = 2;
          nextMatch.isByeMatch = true;
          propagateWinnerToNextRound(tour, roundIdx + 1, nextMatchIdx);
        } else if (!nextMatch.player1.isBye && nextMatch.player2.isBye) {
          nextMatch.winnerSlot = 1;
          nextMatch.isByeMatch = true;
          propagateWinnerToNextRound(tour, roundIdx + 1, nextMatchIdx);
        }
      }
    }
  }

  // 준결승(4강)인 경우 패자를 3·4위 결정전으로 자동 배치
  if (tour.thirdPlaceMatch && roundIdx === tour.rounds.length - 2) {
    if (matchIdx === 0) {
      tour.thirdPlaceMatch.player1 = loser && !loser.isBye ? JSON.parse(JSON.stringify(loser)) : null;
    } else if (matchIdx === 1) {
      tour.thirdPlaceMatch.player2 = loser && !loser.isBye ? JSON.parse(JSON.stringify(loser)) : null;
    }
    tour.thirdPlaceMatch.winnerSlot = null;
  }
}

function clearDownstreamAdvancement(tour, roundIdx, matchIdx) {
  if (roundIdx + 1 < tour.rounds.length) {
    const nextMatchIdx = Math.floor(matchIdx / 2);
    const isTopSlot = (matchIdx % 2 === 0);
    const nextMatch = tour.rounds[roundIdx + 1].matches[nextMatchIdx];
    if (nextMatch) {
      if (isTopSlot) nextMatch.player1 = null;
      else nextMatch.player2 = null;
      nextMatch.winnerSlot = null;
      nextMatch.score1 = null;
      nextMatch.score2 = null;
      nextMatch.sets = [{ s1: null, s2: null }, { s1: null, s2: null }, { s1: null, s2: null }];
      clearDownstreamAdvancement(tour, roundIdx + 1, nextMatchIdx);
    }
  }

  if (tour.thirdPlaceMatch && roundIdx === tour.rounds.length - 2) {
    if (matchIdx === 0) tour.thirdPlaceMatch.player1 = null;
    if (matchIdx === 1) tour.thirdPlaceMatch.player2 = null;
    tour.thirdPlaceMatch.winnerSlot = null;
  }
}

function checkAndCelebrateTournamentWinner(tour, roundIdx, match, isThirdPlace = false) {
  if (!tour || !match || !match.winnerSlot) return;
  const isFinal = !isThirdPlace && (roundIdx === tour.rounds.length - 1);
  if (isFinal) {
    playSuccessSound();
    triggerConfetti('ceremony-crowns');
    const champion = match.winnerSlot === 1 ? match.player1 : match.player2;
    if (champion) showToast(`👑 축하합니다! ${champion.name} 최종 우승!`, '🏆');
  } else {
    playSuccessSound();
  }
}

function onTournamentScoreChange(roundIdx, matchIdx, slotNum, valStr, isThirdPlace = false) {
  const tour = state.savedTournament;
  if (!tour) return;

  const bo3 = isBo3Tournament(tour);
  const rawNum = valStr === '' ? null : Math.max(0, parseInt(valStr, 10) || 0);
  const scoreVal = rawNum === null ? null : (bo3 ? Math.min(2, rawNum) : rawNum);
  const targetMatch = isThirdPlace ? tour.thirdPlaceMatch : tour.rounds[roundIdx]?.matches[matchIdx];
  if (!targetMatch) return;

  if (slotNum === 1) targetMatch.score1 = scoreVal;
  else targetMatch.score2 = scoreVal;

  if (bo3) {
    // 3판 2선승제: 2세트를 먼저 선취한 선수를 승자로 확정
    let autoWinner = null;
    if ((targetMatch.score1 || 0) >= 2 && (targetMatch.score1 || 0) > (targetMatch.score2 || 0)) {
      autoWinner = 1;
      if (targetMatch.score2 === null) targetMatch.score2 = 0;
    } else if ((targetMatch.score2 || 0) >= 2 && (targetMatch.score2 || 0) > (targetMatch.score1 || 0)) {
      autoWinner = 2;
      if (targetMatch.score1 === null) targetMatch.score1 = 0;
    }

    if (autoWinner !== null && targetMatch.winnerSlot !== autoWinner) {
      targetMatch.winnerSlot = autoWinner;
      if (!isThirdPlace) propagateWinnerToNextRound(tour, roundIdx, matchIdx);
      checkAndCelebrateTournamentWinner(tour, roundIdx, targetMatch, isThirdPlace);
    } else if (autoWinner === null && targetMatch.winnerSlot !== null && (targetMatch.score1 || 0) < 2 && (targetMatch.score2 || 0) < 2) {
      targetMatch.winnerSlot = null;
      if (!isThirdPlace) clearDownstreamAdvancement(tour, roundIdx, matchIdx);
    }
  } else {
    // 단판 11점 승부: 두 점수가 모두 입력되었고 서로 다르면 높은 점수를 승자로 설정
    if (targetMatch.score1 !== null && targetMatch.score2 !== null && targetMatch.score1 !== targetMatch.score2) {
      const autoWinner = targetMatch.score1 > targetMatch.score2 ? 1 : 2;
      if (targetMatch.winnerSlot !== autoWinner) {
        targetMatch.winnerSlot = autoWinner;
        if (!isThirdPlace) {
          propagateWinnerToNextRound(tour, roundIdx, matchIdx);
        }
        checkAndCelebrateTournamentWinner(tour, roundIdx, targetMatch, isThirdPlace);
      }
    }
  }

  saveTournamentToRTDB(tour);
  renderTournamentBracketUI();
  renderTournamentActiveBanner();
}

// 3판 2선승제(bo3_11)에서 세트 승수 버튼(0승 / 1승 / 2승 승리확정) 클릭 시
function onTournamentBo3SetWinsClick(roundIdx, matchIdx, slotNum, winsVal, isThirdPlace = false) {
  const tour = state.savedTournament;
  if (!tour) return;
  const targetMatch = isThirdPlace ? tour.thirdPlaceMatch : tour.rounds[roundIdx]?.matches[matchIdx];
  if (!targetMatch) return;

  if (slotNum === 1) {
    targetMatch.score1 = winsVal;
    if (targetMatch.score2 === null || targetMatch.score2 === undefined) targetMatch.score2 = 0;
    if (winsVal === 2 && targetMatch.score2 >= 2) targetMatch.score2 = 1;
  } else {
    targetMatch.score2 = winsVal;
    if (targetMatch.score1 === null || targetMatch.score1 === undefined) targetMatch.score1 = 0;
    if (winsVal === 2 && targetMatch.score1 >= 2) targetMatch.score1 = 1;
  }

  let nextWinner = null;
  if ((targetMatch.score1 || 0) >= 2 && (targetMatch.score1 || 0) > (targetMatch.score2 || 0)) {
    nextWinner = 1;
  } else if ((targetMatch.score2 || 0) >= 2 && (targetMatch.score2 || 0) > (targetMatch.score1 || 0)) {
    nextWinner = 2;
  }

  const prevWinner = targetMatch.winnerSlot;
  targetMatch.winnerSlot = nextWinner;

  if (!isThirdPlace) {
    if (nextWinner) {
      propagateWinnerToNextRound(tour, roundIdx, matchIdx);
    } else if (prevWinner) {
      clearDownstreamAdvancement(tour, roundIdx, matchIdx);
    }
  }

  saveTournamentToRTDB(tour);
  renderTournamentBracketUI();
  renderTournamentActiveBanner();

  if (nextWinner && nextWinner !== prevWinner) {
    checkAndCelebrateTournamentWinner(tour, roundIdx, targetMatch, isThirdPlace);
  }
}

// 3판 2선승제(bo3_11)에서 1~3세트 각 11점제 점수 입력 시 자동으로 세트 승수 및 2선승 승자 계산
function onTournamentBo3SetPointChange(roundIdx, matchIdx, setIdx, slotNum, valStr, isThirdPlace = false) {
  const tour = state.savedTournament;
  if (!tour) return;
  const targetMatch = isThirdPlace ? tour.thirdPlaceMatch : tour.rounds[roundIdx]?.matches[matchIdx];
  if (!targetMatch) return;

  const sets = ensureTournamentMatchSets(targetMatch);
  const ptVal = valStr === '' ? null : Math.max(0, parseInt(valStr, 10) || 0);
  if (!sets[setIdx]) sets[setIdx] = { s1: null, s2: null };

  if (slotNum === 1) sets[setIdx].s1 = ptVal;
  else sets[setIdx].s2 = ptVal;

  // 입력 완료된 세트들로부터 세트 승수(score1, score2) 자동 집계
  let w1 = 0;
  let w2 = 0;
  let anySetCompleted = false;
  sets.forEach(st => {
    if (st && st.s1 !== null && st.s1 !== undefined && st.s2 !== null && st.s2 !== undefined && st.s1 !== st.s2) {
      // 11점 이상이거나 한쪽이 다른 쪽보다 높게 입력된 유효 세트
      if (st.s1 >= 11 || st.s2 >= 11 || (st.s1 > 0 || st.s2 > 0)) {
        anySetCompleted = true;
        if (st.s1 > st.s2) w1++;
        else if (st.s2 > st.s1) w2++;
      }
    }
  });

  if (anySetCompleted) {
    targetMatch.score1 = Math.min(2, w1);
    targetMatch.score2 = Math.min(2, w2);
  }

  let nextWinner = null;
  if (w1 >= 2 && w1 > w2) nextWinner = 1;
  else if (w2 >= 2 && w2 > w1) nextWinner = 2;

  const prevWinner = targetMatch.winnerSlot;
  if (nextWinner !== null) {
    targetMatch.winnerSlot = nextWinner;
    if (!isThirdPlace) propagateWinnerToNextRound(tour, roundIdx, matchIdx);
  } else if (anySetCompleted && w1 < 2 && w2 < 2 && prevWinner !== null) {
    targetMatch.winnerSlot = null;
    if (!isThirdPlace) clearDownstreamAdvancement(tour, roundIdx, matchIdx);
  }

  saveTournamentToRTDB(tour);
  renderTournamentBracketUI();
  renderTournamentActiveBanner();

  if (nextWinner && nextWinner !== prevWinner) {
    checkAndCelebrateTournamentWinner(tour, roundIdx, targetMatch, isThirdPlace);
  }
}

function ensureOptionInSelect(selectEl, val, labelText) {
  if (!selectEl || !val) return;
  const exists = Array.from(selectEl.options).some(opt => opt.value === val);
  if (!exists) {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = `🏆 ${labelText}`;
    selectEl.insertBefore(opt, selectEl.firstChild);
  }
  selectEl.value = val;
}

function applyTournamentMatchPlayersToScoreboard(match, roundTitle = '') {
  if (!match || !match.player1 || !match.player2) return;
  const tour = state.savedTournament;
  const isDoubles = tour && tour.matchType === 'doubles';
  const bo3 = isBo3Tournament(tour);

  const bannerEl = document.getElementById('sbTournamentMatchBanner');
  if (bannerEl) {
    const prefix = roundTitle ? `${roundTitle} · ` : '';
    if (bo3) {
      const sets = ensureTournamentMatchSets(match);
      const completedSetCount = sets.filter(st => st.s1 !== null && st.s2 !== null && st.s1 !== st.s2).length;
      const currentSetNum = Math.min(3, completedSetCount + 1);
      const setWinsStr = `세트 ${match.score1 || 0}:${match.score2 || 0}`;
      bannerEl.innerText = `🏆 ${prefix}${match.label} [3판2선승 · ${currentSetNum}세트 (${setWinsStr})]: ${match.player1.name} vs ${match.player2.name}`;
    } else {
      bannerEl.innerText = `🏆 ${prefix}${match.label} [단판 11점제]: ${match.player1.name} vs ${match.player2.name}`;
    }
    bannerEl.classList.remove('hidden');
  }

  if (isDoubles) {
    setScoreboardMode('doubles');
    const filterEl = document.getElementById('sbDoublesClassFilter');
    if (filterEl && Array.from(filterEl.options).some(o => o.value === 'tournament')) {
      filterEl.value = 'tournament';
      filterDoublesByClass();
    }

    const t1Names = Array.isArray(match.player1.memberNames) && match.player1.memberNames.length > 0
      ? match.player1.memberNames
      : String(match.player1.name).split('&').map(s => s.trim());
    const t2Names = Array.isArray(match.player2.memberNames) && match.player2.memberNames.length > 0
      ? match.player2.memberNames
      : String(match.player2.name).split('&').map(s => s.trim());

    const pairs = [
      { selectId: 'sbTeam1P1Select', name: t1Names[0] || match.player1.name },
      { selectId: 'sbTeam1P2Select', name: t1Names[1] || t1Names[0] || match.player1.name },
      { selectId: 'sbTeam2P1Select', name: t2Names[0] || match.player2.name },
      { selectId: 'sbTeam2P2Select', name: t2Names[1] || t2Names[0] || match.player2.name }
    ];

    pairs.forEach(item => {
      const sel = document.getElementById(item.selectId);
      const pid = typeof resolveScoreboardPlayerIdByName === 'function'
        ? resolveScoreboardPlayerIdByName(item.name)
        : ('tour_std_' + encodeURIComponent(item.name));
      ensureOptionInSelect(sel, pid, item.name);
    });

    syncDoublesSelectors();
  } else {
    setScoreboardMode('singles');
    const p1Select = document.getElementById('sbPlayer1Select');
    const p2Select = document.getElementById('sbPlayer2Select');

    const p1Id = typeof resolveScoreboardPlayerIdByName === 'function'
      ? resolveScoreboardPlayerIdByName(match.player1.name)
      : ('tour_std_' + encodeURIComponent(match.player1.name));
    const p2Id = typeof resolveScoreboardPlayerIdByName === 'function'
      ? resolveScoreboardPlayerIdByName(match.player2.name)
      : ('tour_std_' + encodeURIComponent(match.player2.name));

    ensureOptionInSelect(p1Select, p1Id, match.player1.name);
    updateScoreboardPlayer2();
    ensureOptionInSelect(p2Select, p2Id, match.player2.name);
    updateScoreboardPlayerDisplays();
  }

  // 단판 11점제는 기존 점수를 복원하고, 3판 2선승제는 현재 진행할 세트의 점수를 0:0부터 시작
  if (bo3) {
    sbState.score1 = 0;
    sbState.score2 = 0;
  } else {
    sbState.score1 = (match.score1 !== null && match.score1 !== undefined) ? match.score1 : 0;
    sbState.score2 = (match.score2 !== null && match.score2 !== undefined) ? match.score2 : 0;
  }
  updateScore(1, 0);
}

function openScoreboardForTournamentMatch(roundIdx, matchIdx, isThirdPlace = false, targetSlotKey = null) {
  ensureTournamentSlotsState();
  const slotKey = targetSlotKey || state.activeTournamentSlot || 'slot_1';
  const tour = state.savedTournaments[slotKey] || state.savedTournament;
  if (!tour) return;

  if (slotKey !== state.activeTournamentSlot) {
    state.activeTournamentSlot = slotKey;
    state.savedTournament = tour;
    renderTournamentSlotTabs();
    renderTournamentBracketUI();
  }

  const match = isThirdPlace ? tour.thirdPlaceMatch : tour.rounds[roundIdx]?.matches[matchIdx];
  if (!match || !match.player1 || !match.player2) return;

  const slotLabel = getTournamentSlotMeta(slotKey).label;
  const baseRoundTitle = isThirdPlace ? '3·4위 결정전' : (tour.rounds[roundIdx]?.title || '');
  const roundTitle = `[${slotLabel}] ${baseRoundTitle}`;
  activeTournamentMatchContext = { slotKey, roundIdx, matchIdx, isThirdPlace };

  openScoreboardModal(true);
  applyTournamentMatchPlayersToScoreboard(match, roundTitle);

  showToast(`전광판에 [${slotLabel}] ${match.player1.name} vs ${match.player2.name} 대진이 자동 반영되었습니다!`, '🏓');
}

function recordScoreIntoTournamentMatch(tour, match, roundIdx, matchIdx, isThirdPlace, s1, s2) {
  const bo3 = isBo3Tournament(tour);
  if (bo3) {
    const sets = ensureTournamentMatchSets(match);
    // 아직 점수가 기록되지 않은 첫 번째 세트 슬롯 찾기
    let targetSetIdx = sets.findIndex(st => st.s1 === null || st.s2 === null || (st.s1 === 0 && st.s2 === 0));
    if (targetSetIdx === -1) targetSetIdx = Math.min(2, sets.length - 1);
    sets[targetSetIdx] = { s1, s2 };

    let w1 = 0;
    let w2 = 0;
    sets.forEach(st => {
      if (st && st.s1 !== null && st.s2 !== null && st.s1 !== st.s2) {
        if (st.s1 > st.s2) w1++;
        else if (st.s2 > st.s1) w2++;
      }
    });

    match.score1 = Math.min(2, w1);
    match.score2 = Math.min(2, w2);

    if (w1 >= 2 && w1 > w2) {
      match.winnerSlot = 1;
      if (!isThirdPlace) propagateWinnerToNextRound(tour, roundIdx, matchIdx);
      return { finished: true, currentSet: targetSetIdx + 1, w1: match.score1, w2: match.score2 };
    } else if (w2 >= 2 && w2 > w1) {
      match.winnerSlot = 2;
      if (!isThirdPlace) propagateWinnerToNextRound(tour, roundIdx, matchIdx);
      return { finished: true, currentSet: targetSetIdx + 1, w1: match.score1, w2: match.score2 };
    }
    return { finished: false, currentSet: targetSetIdx + 1, w1: match.score1, w2: match.score2 };
  } else {
    match.score1 = s1;
    match.score2 = s2;
    match.winnerSlot = s1 > s2 ? 1 : 2;
    if (!isThirdPlace) {
      propagateWinnerToNextRound(tour, roundIdx, matchIdx);
    }
    return { finished: true, currentSet: 1, w1: s1, w2: s2 };
  }
}

function syncMatchResultWithActiveTournament(p1, p2, s1, s2) {
  ensureTournamentSlotsState();

  const matchNames = (entry, playerObj) => {
    if (!entry || !playerObj) return false;
    const eClean = String(entry.name || '').replace(/^\d+번\s*/, '').trim();
    const pClean = String(playerObj.name || '').replace(/^\d+번\s*/, '').trim();
    return entry.name === playerObj.displayName || entry.name === playerObj.name || eClean === pClean;
  };

  // 현재 활성 슬롯을 우선 탐색하고, 이어서 나머지 슬롯도 탐색
  const orderedKeys = [
    state.activeTournamentSlot,
    ...TOURNAMENT_SLOT_DEFS.map(d => d.key).filter(k => k !== state.activeTournamentSlot)
  ];

  for (const slotKey of orderedKeys) {
    const tour = state.savedTournaments[slotKey];
    if (!tour || !Array.isArray(tour.rounds)) continue;

    for (let r = 0; r < tour.rounds.length; r++) {
      const matches = tour.rounds[r].matches || [];
      for (let m = 0; m < matches.length; m++) {
        const item = matches[m];
        if (item.isByeMatch || item.winnerSlot || !item.player1 || !item.player2) continue;

        if (matchNames(item.player1, p1) && matchNames(item.player2, p2)) {
          recordScoreIntoTournamentMatch(tour, item, r, m, false, s1, s2);
          saveTournamentToRTDB(tour, slotKey);
          renderTournamentSlotTabs();
          renderTournamentBracketUI();
          renderTournamentActiveBanner();
          return true;
        } else if (matchNames(item.player1, p2) && matchNames(item.player2, p1)) {
          recordScoreIntoTournamentMatch(tour, item, r, m, false, s2, s1);
          saveTournamentToRTDB(tour, slotKey);
          renderTournamentSlotTabs();
          renderTournamentBracketUI();
          renderTournamentActiveBanner();
          return true;
        }
      }
    }
  }
  return false;
}

function applyScoreboardResultToTournament(s1, s2) {
  ensureTournamentSlotsState();
  if (!activeTournamentMatchContext) return false;

  const { slotKey: ctxSlotKey, roundIdx, matchIdx, isThirdPlace } = activeTournamentMatchContext;
  const slotKey = ctxSlotKey || state.activeTournamentSlot || 'slot_1';
  const tour = state.savedTournaments[slotKey] || state.savedTournament;
  const match = tour ? (isThirdPlace ? tour.thirdPlaceMatch : tour.rounds[roundIdx]?.matches[matchIdx]) : null;

  if (!tour || !match) {
    activeTournamentMatchContext = null;
    return false;
  }

  const res = recordScoreIntoTournamentMatch(tour, match, roundIdx, matchIdx, isThirdPlace, s1, s2);
  if (res.finished) {
    activeTournamentMatchContext = null;
  } else {
    // 3판 2선승제에서 아직 2선승에 도달하지 않은 경우 다음 세트를 위해 컨텍스트 유지 및 배너 갱신
    const slotLabel = getTournamentSlotMeta(slotKey).label;
    const baseRoundTitle = isThirdPlace ? '3·4위 결정전' : (tour.rounds[roundIdx]?.title || '');
    applyTournamentMatchPlayersToScoreboard(match, `[${slotLabel}] ${baseRoundTitle}`);
  }

  saveTournamentToRTDB(tour, slotKey);
  renderTournamentSlotTabs();
  renderTournamentBracketUI();
  renderTournamentActiveBanner();
  return res;
}

function renderTournamentMatchCard(match, roundIdx, matchIdx, totalRounds, isThirdPlace = false) {
  const tour = state.savedTournament;
  const bo3 = isBo3Tournament(tour);
  const p1 = match.player1;
  const p2 = match.player2;
  const isBye = !!match.isByeMatch;
  const isReady = !!(p1 && p2 && !p1.isBye && !p2.isBye);
  const isCompleted = !!(match.winnerSlot === 1 || match.winnerSlot === 2);
  const winningPlayer = match.winnerSlot === 1 ? p1 : (match.winnerSlot === 2 ? p2 : null);
  const cleanWinnerName = winningPlayer ? stripStudentNumberPrefix(winningPlayer.name) : '';

  let statusBadge = '';
  if (isBye) {
    statusBadge = `<span class="text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-black">⏩ 부전승</span>`;
  } else if (isCompleted) {
    statusBadge = `<span class="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black shadow-2xs">🏆 승리 확정</span>`;
  } else if (isReady) {
    statusBadge = `<span class="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-black animate-pulse">🏓 진행 가능</span>`;
  } else {
    statusBadge = `<span class="text-[11px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold">⏳ 하위 승자 대기</span>`;
  }

  // 경기 방식에 따른 상단 표기 배지 (단판 11점제 vs 11점 3판2선승제) 및 지정 짝 배지
  const formatMiniBadge = !isBye ? (
    bo3
      ? `<span class="text-[10px] bg-orange-50 text-orange-800 border border-orange-200 px-1.5 py-0.5 rounded-md font-black" title="11점 1세트 · 3판 2선승제">🔥 3판2선승(11점)</span>`
      : `<span class="text-[10px] bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded-md font-black" title="11점 1세트 단판 승부">⚡ 11점 단판</span>`
  ) : '';
  const fixedMatchBadge = match.isFixedPairMatch
    ? `<span class="text-[10px] bg-indigo-100 text-indigo-900 border border-indigo-300 px-1.5 py-0.5 rounded-md font-black" title="임의 지정된 1라운드 고정 대진">🎯 지정짝${match.fixedPairNum ? ` #${match.fixedPairNum}` : ''}</span>`
    : (match.isFixedByeMatch ? `<span class="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded-md font-black">🎯 지정부전승</span>` : '');

  const renderSlot = (player, slotNum) => {
    const isWinner = match.winnerSlot === slotNum;
    const isLoser = match.winnerSlot && match.winnerSlot !== slotNum;
    const scoreVal = slotNum === 1 ? match.score1 : match.score2;
    const sideBadge = slotNum === 1
      ? `<span class="w-5 h-5 rounded-md bg-cyan-100 text-cyan-800 font-black text-[11px] flex items-center justify-center shrink-0">A</span>`
      : `<span class="w-5 h-5 rounded-md bg-rose-100 text-rose-800 font-black text-[11px] flex items-center justify-center shrink-0">B</span>`;

    if (!player) {
      return `
        <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-slate-400 text-xs">
          <div class="flex items-center space-x-2">
            ${sideBadge}
            <span class="italic font-bold">하위 경기 승자 진출 대기 ⬆️</span>
          </div>
          <span class="text-xs font-bold">-</span>
        </div>
      `;
    }

    if (player.isBye) {
      return `
        <div class="flex items-center justify-between px-3 py-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs">
          <span class="font-bold">⏩ 부전승 (BYE)</span>
          <span class="text-[11px] font-bold">상대 자동 진출 ⬆️</span>
        </div>
      `;
    }

    // "00번" 학번 접두어를 제거하고 순수 이름만 크고 선명하게 표시
    const cleanName = stripStudentNumberPrefix(player.name) || player.name;

    const slotStateClass = isWinner
      ? 'tournament-slot-winner'
      : (isLoser ? 'tournament-slot-loser' : 'bg-white hover:bg-amber-50/60 border-slate-200');

    // 우측 점수/세트승수 표기 영역 (단판 11점 승부 vs 3판 2선승제 구분)
    let rightScorePill = '';
    if (bo3) {
      const wins = Math.min(2, Math.max(0, parseInt(scoreVal, 10) || 0));
      const dot1 = wins >= 1 ? 'bg-orange-500 border-orange-500 text-white' : 'bg-slate-100 border-slate-300 text-transparent';
      const dot2 = wins >= 2 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-100 border-slate-300 text-transparent';
      rightScorePill = `
        <div class="flex items-center space-x-1 shrink-0" title="세트 승수: ${wins}승 (2세트 선취 승리)">
          <span class="w-3.5 h-3.5 rounded-full border ${dot1} flex items-center justify-center text-[8px] font-black">●</span>
          <span class="w-3.5 h-3.5 rounded-full border ${dot2} flex items-center justify-center text-[8px] font-black">●</span>
          <span class="text-xs font-black px-1.5 py-0.5 rounded-md ${
            isWinner ? 'bg-emerald-600 text-white' : (wins > 0 ? 'bg-orange-100 text-orange-900' : 'bg-slate-100 text-slate-500')
          }">${scoreVal !== null && scoreVal !== undefined ? `${wins}세트` : '-'}</span>
        </div>
      `;
    } else {
      rightScorePill = `
        <div class="flex items-center space-x-1 shrink-0">
          ${scoreVal !== null && scoreVal !== undefined ? `
            <span class="text-xs font-black px-2 py-0.5 rounded-lg ${
              isWinner ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-sky-50 text-sky-900 border border-sky-200'
            }">${scoreVal}점</span>
          ` : ''}
          ${isWinner ? `
            <span class="bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-2xs shrink-0">
              승리 ⬆️
            </span>
          ` : ''}
        </div>
      `;
    }

    // 하단 컨트롤 영역 (단판 11점 입력 vs 3판 2선승 세트승 버튼)
    let slotControlsHtml = '';
    if (isReady) {
      if (bo3) {
        const curWins = (scoreVal !== null && scoreVal !== undefined) ? parseInt(scoreVal, 10) : -1;
        slotControlsHtml = `
          <div class="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-slate-100/90">
            <span class="text-[10px] font-extrabold text-slate-500">세트 승수:</span>
            <div class="flex items-center space-x-1">
              ${[0, 1, 2].map(w => `
                <button
                  type="button"
                  onclick="onTournamentBo3SetWinsClick(${roundIdx}, ${matchIdx}, ${slotNum}, ${w}, ${isThirdPlace})"
                  class="px-2 py-0.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                    curWins === w
                      ? (w === 2 ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-300' : 'bg-orange-500 text-white shadow-2xs')
                      : 'bg-slate-100 hover:bg-amber-100 text-slate-600 border border-slate-200'
                  }"
                >${w === 2 ? '2선승 승리 ⬆️' : `${w}승`}</button>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        slotControlsHtml = `
          <div class="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-slate-100/90">
            <span class="text-[10px] font-extrabold text-sky-700">⚡ 11점 단판 점수:</span>
            <div class="flex items-center space-x-1.5">
              <input
                type="number"
                min="0"
                max="99"
                placeholder="11"
                value="${scoreVal !== null && scoreVal !== undefined ? scoreVal : ''}"
                onchange="onTournamentScoreChange(${roundIdx}, ${matchIdx}, ${slotNum}, this.value, ${isThirdPlace})"
                class="w-14 text-center text-xs font-black py-1 px-1.5 rounded-lg border border-sky-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
              <button
                type="button"
                onclick="selectTournamentMatchWinner(${roundIdx}, ${matchIdx}, ${slotNum}, ${isThirdPlace})"
                class="px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isWinner
                    ? 'bg-emerald-700 text-white shadow-2xs ring-2 ring-emerald-300'
                    : 'bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white border border-slate-200'
                }"
              >
                ${isWinner ? '승리 확정 ✓' : '승리 ⬆️'}
              </button>
            </div>
          </div>
        `;
      }
    }

    return `
      <div class="px-3 py-2.5 rounded-xl border-2 transition-all ${slotStateClass}">
        <div class="flex items-center justify-between gap-2">
          <div
            onclick="${isReady ? `selectTournamentMatchWinner(${roundIdx}, ${matchIdx}, ${slotNum}, ${isThirdPlace})` : ''}"
            class="flex items-center space-x-2 min-w-0 flex-1 ${isReady ? 'cursor-pointer' : ''}"
            title="${isReady ? '클릭하여 승자로 선택 (상위 라운드 진출 ⬆️)' : ''}"
          >
            ${isWinner
              ? `<span class="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">👑</span>`
              : sideBadge
            }
            <span class="text-base sm:text-[17px] font-black tracking-tight break-keep leading-snug ${isWinner ? 'text-emerald-950' : (isLoser ? 'text-slate-400 line-through' : 'text-slate-900')}">
              ${escapeHtml(cleanName)}
            </span>
            ${player.isFixedTeam ? `<span class="text-[9px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 rounded-md font-black shrink-0">🤝지정팀</span>` : ''}
          </div>
          ${rightScorePill}
        </div>
        ${slotControlsHtml}
      </div>
    `;
  };

  // 3판 2선승제(bo3_11)일 때 1~3세트별(각 11점제) 상세 스코어보드 표기 및 입력창
  let bo3SetScoreTableHtml = '';
  if (bo3 && isReady) {
    const sets = ensureTournamentMatchSets(match);
    bo3SetScoreTableHtml = `
      <div class="mt-2 pt-2 border-t border-orange-200/70 bg-orange-50/50 rounded-xl p-2">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-black text-orange-900 flex items-center space-x-1">
            <i class="fa-solid fa-list-ol text-orange-500"></i>
            <span>세트별 점수 (11점 1세트 · 2세트 선취 승)</span>
          </span>
          <span class="text-[10px] font-black text-emerald-700">
            ${match.score1 !== null && match.score2 !== null ? `세트 ${match.score1} : ${match.score2}` : '진행 전'}
          </span>
        </div>
        <div class="grid grid-cols-3 gap-1.5">
          ${[0, 1, 2].map(sIdx => {
            const st = sets[sIdx] || { s1: null, s2: null };
            const s1Win = st.s1 !== null && st.s2 !== null && st.s1 > st.s2;
            const s2Win = st.s1 !== null && st.s2 !== null && st.s2 > st.s1;
            return `
              <div class="bg-white rounded-lg border ${s1Win || s2Win ? 'border-orange-300 shadow-2xs' : 'border-slate-200'} p-1 text-center">
                <div class="text-[10px] font-black ${s1Win ? 'text-cyan-700' : (s2Win ? 'text-rose-700' : 'text-slate-500')} mb-0.5">
                  ${sIdx + 1}세트 ${s1Win ? '(A승)' : (s2Win ? '(B승)' : '')}
                </div>
                <div class="flex items-center justify-center space-x-0.5">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    placeholder="A"
                    value="${st.s1 !== null && st.s1 !== undefined ? st.s1 : ''}"
                    onchange="onTournamentBo3SetPointChange(${roundIdx}, ${matchIdx}, ${sIdx}, 1, this.value, ${isThirdPlace})"
                    class="w-9 text-center text-[11px] font-black py-0.5 rounded border ${s1Win ? 'border-cyan-400 bg-cyan-50 text-cyan-950' : 'border-slate-200 bg-slate-50 text-slate-700'} focus:outline-none focus:ring-1 focus:ring-orange-400"
                  >
                  <span class="text-[10px] font-black text-slate-400">:</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    placeholder="B"
                    value="${st.s2 !== null && st.s2 !== undefined ? st.s2 : ''}"
                    onchange="onTournamentBo3SetPointChange(${roundIdx}, ${matchIdx}, ${sIdx}, 2, this.value, ${isThirdPlace})"
                    class="w-9 text-center text-[11px] font-black py-0.5 rounded border ${s2Win ? 'border-rose-400 bg-rose-50 text-rose-950' : 'border-slate-200 bg-slate-50 text-slate-700'} focus:outline-none focus:ring-1 focus:ring-orange-400"
                  >
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  const cardStateClass = isBye
    ? 'match-bye'
    : (isCompleted ? 'match-completed' : (isReady ? 'match-ready' : ''));

  const scoreSummaryBadge = (!isBye && isCompleted)
    ? formatTournamentMatchScore(match, tour, false)
    : '';

  return `
    <div class="tournament-match-card p-3 space-y-2 ${cardStateClass}">
      <div class="flex items-center justify-between pb-1.5 border-b border-slate-100 gap-1.5 flex-wrap">
        <span class="text-xs font-black text-slate-700 flex items-center space-x-1 flex-wrap gap-y-1">
          <span class="inline-block w-2 h-2 rounded-full ${isCompleted || isBye ? 'bg-emerald-500' : (isReady ? 'bg-amber-500' : 'bg-slate-300')}"></span>
          <span>${escapeHtml(match.label)}</span>
          ${formatMiniBadge}
          ${fixedMatchBadge}
        </span>
        <div class="flex items-center space-x-1">
          ${isReady ? `
            <button
              type="button"
              onclick="openScoreboardForTournamentMatch(${roundIdx}, ${matchIdx}, ${isThirdPlace})"
              class="text-[11px] bg-teal-600 hover:bg-teal-700 text-white px-2 py-0.5 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-1 shadow-2xs active:scale-95"
              title="이 경기를 전광판으로 열기"
            >
              <i class="fa-solid fa-display text-[9px]"></i>
              <span>전광판</span>
            </button>
          ` : ''}
          ${statusBadge}
        </div>
      </div>

      ${(isCompleted || isBye) && cleanWinnerName ? `
        <div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-1 shadow-2xs">
          <span class="text-xs font-black flex items-center space-x-1 min-w-0">
            <span class="shrink-0">${roundIdx === totalRounds - 1 && !isThirdPlace ? '👑 우승:' : (isThirdPlace ? '🥉 3위:' : '⬆️ 진출:')}</span>
            <span class="text-amber-200 text-sm font-black truncate">${escapeHtml(cleanWinnerName)}</span>
          </span>
          <span class="text-[10px] font-extrabold bg-white/20 px-1.5 py-0.5 rounded-md shrink-0">
            ${scoreSummaryBadge ? escapeHtml(scoreSummaryBadge) : (roundIdx === totalRounds - 1 || isThirdPlace ? '확정' : '상위 진출')}
          </span>
        </div>
      ` : ''}

      <div class="space-y-1.5">
        ${renderSlot(p1, 1)}
        <div class="flex items-center justify-center">
          <span class="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            ${bo3 ? 'VS (11점 3판2선승)' : 'VS (11점 단판)'}
          </span>
        </div>
        ${renderSlot(p2, 2)}
      </div>
      ${bo3SetScoreTableHtml}
    </div>
  `;
}

// 하단 두 경기(25%, 75%)에서 상단 부모 경기(50%)로 모이는 계단식 트리 연결선 렌더링
function renderPyramidBranchConnector(child1, child2) {
  const c1Done = !!(child1 && (child1.winnerSlot === 1 || child1.winnerSlot === 2 || child1.isByeMatch));
  const c2Done = !!(child2 && (child2.winnerSlot === 1 || child2.winnerSlot === 2 || child2.isByeMatch));
  const anyDone = c1Done || c2Done;

  const leftColor = c1Done ? '#10b981' : '#cbd5e1';
  const rightColor = c2Done ? '#10b981' : '#cbd5e1';
  const stemColor = anyDone ? '#10b981' : '#cbd5e1';

  return `
    <div class="w-full h-11 relative select-none pointer-events-none shrink-0" aria-hidden="true">
      <!-- 왼쪽 하위 경기(25%)에서 올라오는 수직선 -->
      <div style="position:absolute; left:25%; bottom:0; height:50%; width:3px; margin-left:-1.5px; background:${leftColor}; border-radius:2px;"></div>
      <!-- 오른쪽 하위 경기(75%)에서 올라오는 수직선 -->
      <div style="position:absolute; left:75%; bottom:0; height:50%; width:3px; margin-left:-1.5px; background:${rightColor}; border-radius:2px;"></div>
      <!-- 왼쪽(25%) ~ 중앙(50%) 수평 연결선 -->
      <div style="position:absolute; left:25%; width:25%; top:50%; height:3px; margin-top:-1.5px; background:${leftColor};"></div>
      <!-- 중앙(50%) ~ 오른쪽(75%) 수평 연결선 -->
      <div style="position:absolute; left:50%; width:25%; top:50%; height:3px; margin-top:-1.5px; background:${rightColor};"></div>
      <!-- 중앙(50%)에서 상위 경기로 올라가는 수직 줄기 -->
      <div style="position:absolute; left:50%; top:0; height:50%; width:3px; margin-left:-1.5px; background:${stemColor}; border-radius:2px;"></div>
      <!-- 중앙 합류 화살표 배지 -->
      <div style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%);" class="w-6 h-6 rounded-full ${anyDone ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-500'} flex items-center justify-center text-[10px] font-black shadow-2xs">
        <i class="fa-solid fa-arrow-up"></i>
      </div>
    </div>
  `;
}

function renderTournamentBracketUI() {
  ensureTournamentSlotsState();
  renderTournamentSlotTabs();

  const emptyState = document.getElementById('tournamentEmptyState');
  const bracketSection = document.getElementById('tournamentBracketSection');
  const treeContainer = document.getElementById('tournamentBracketTree');
  const metaHeader = document.getElementById('tournamentMetaHeader');
  const championBanner = document.getElementById('tournamentChampionBanner');

  const slotMeta = getTournamentSlotMeta(state.activeTournamentSlot);
  const tour = state.savedTournament;
  if (!tour || !tour.rounds || tour.rounds.length === 0) {
    if (emptyState) {
      emptyState.classList.remove('hidden');
      emptyState.innerHTML = `
        <div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mx-auto mb-2.5 shadow-inner">
          <i class="fa-solid fa-sitemap"></i>
        </div>
        <p class="text-sm font-black text-slate-700">[${slotMeta.label}] 학생 명단을 넣고 [토너먼트 대진표 자동 작성하기] 버튼을 눌러보세요!</p>
        <p class="text-xs text-slate-400 font-semibold mt-1">상단 슬롯 탭(제1·제2·제3 대진표)을 눌러 최대 3개의 토너먼트 대진표를 동시에 만들어 운영할 수 있습니다.</p>
      `;
    }
    if (bracketSection) bracketSection.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (bracketSection) bracketSection.classList.remove('hidden');

  const unitLabel = tour.matchType === 'doubles' ? '팀' : '명';
  const bo3 = isBo3Tournament(tour);
  const gameFormatLabel = getTournamentGameFormatLabel(tour.gameFormat, false);

  if (metaHeader) {
    metaHeader.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="flex items-center flex-wrap gap-1.5">
            <span class="text-xs font-black px-2.5 py-0.5 rounded-lg bg-slate-900 text-amber-300 border border-amber-400/60">🏆 ${slotMeta.label}</span>
            <span class="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500 text-white">${tour.bracketSize}강 토너먼트</span>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              ${tour.matchType === 'doubles' ? `👥 복식 (${tour.entryCount}팀 / ${tour.participantCount}명)` : `👤 단식 (${tour.entryCount}명)`}
            </span>
            <span class="text-xs font-black px-2.5 py-0.5 rounded-lg border ${
              bo3 ? 'bg-orange-100 text-orange-900 border-orange-300' : 'bg-sky-100 text-sky-900 border-sky-300'
            }">${gameFormatLabel}</span>
            ${Array.isArray(tour.fixedPairs) && tour.fixedPairs.length > 0 ? `<span class="text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300">🎯 지정짝 ${tour.fixedPairs.length}쌍 반영 (나머지 랜덤)</span>` : ''}
            ${tour.byesCount > 0 ? `<span class="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">부전승 ${tour.byesCount}${unitLabel}</span>` : ''}
            <span class="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
              ⬆️ 하단(1라운드)에서 승리할수록 상단(결승·우승)으로 올라가는 계단식 트리 구조
            </span>
          </div>
          <h4 class="text-sm sm:text-base font-black text-slate-800 mt-1">${escapeHtml(tour.title)}</h4>
          <p class="text-[11px] text-slate-400 font-semibold">생성 일시: ${escapeHtml(tour.createdAt || '')}</p>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <button type="button" onclick="toggleTournamentSetupPanel()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-2.5 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer">
            <i id="tournamentToggleSetupBtnIcon" class="fa-solid ${tournamentSetupCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[11px]"></i>
            <span id="tournamentToggleSetupBtnText">${tournamentSetupCollapsed ? '명단 입력 / 대진 설정 펼치기' : '명단 입력창 접기'}</span>
          </button>
          <button type="button" onclick="generateTournamentBracket(true)" class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center space-x-1 cursor-pointer active:scale-95">
            <i class="fa-solid fa-shuffle text-[11px]"></i>
            <span>🎲 대진 재추첨</span>
          </button>
          <button type="button" onclick="openTournamentOverviewModal()" class="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer active:scale-95 ring-2 ring-amber-300/70">
            <i class="fa-solid fa-diagram-project text-[11px]"></i>
            <span>🖼️ 전체 대진표 확인하기</span>
          </button>
          <button type="button" onclick="copyTournamentBracketText()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center space-x-1 cursor-pointer active:scale-95">
            <i class="fa-solid fa-copy text-[11px]"></i>
            <span>📋 대진표 복사</span>
          </button>
          <button type="button" onclick="resetTournamentBracket(false)" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs px-2.5 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer active:scale-95">
            <i class="fa-solid fa-trash-can text-[11px]"></i>
            <span>${slotMeta.label} 초기화</span>
          </button>
        </div>
      </div>
    `;
  }

  // 우승자 / 준우승 / 3위 확인
  const finalRound = tour.rounds[tour.rounds.length - 1];
  const finalMatch = finalRound ? finalRound.matches[0] : null;
  const hasChampion = !!(finalMatch && (finalMatch.winnerSlot === 1 || finalMatch.winnerSlot === 2));
  const champion = hasChampion ? (finalMatch.winnerSlot === 1 ? finalMatch.player1 : finalMatch.player2) : null;
  const runnerUp = hasChampion ? (finalMatch.winnerSlot === 1 ? finalMatch.player2 : finalMatch.player1) : null;
  let thirdPlaceWinner = null;
  if (tour.thirdPlaceMatch && (tour.thirdPlaceMatch.winnerSlot === 1 || tour.thirdPlaceMatch.winnerSlot === 2)) {
    thirdPlaceWinner = tour.thirdPlaceMatch.winnerSlot === 1 ? tour.thirdPlaceMatch.player1 : tour.thirdPlaceMatch.player2;
  }

  if (championBanner) {
    if (hasChampion && champion) {
      championBanner.classList.remove('hidden');
      championBanner.innerHTML = `
        <div class="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-4 rounded-2xl text-white shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center text-2xl shadow-inner">👑</div>
            <div class="text-left">
              <p class="text-xs font-black text-amber-100 uppercase tracking-wider">[${slotMeta.label}] TOURNAMENT CHAMPION (최종 우승)</p>
              <p class="text-lg sm:text-xl font-black">${escapeHtml(stripStudentNumberPrefix(champion.name))}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-black">
            ${runnerUp ? `<span class="bg-white/20 px-3 py-1.5 rounded-xl">🥈 준우승: ${escapeHtml(stripStudentNumberPrefix(runnerUp.name))}</span>` : ''}
            ${thirdPlaceWinner ? `<span class="bg-white/20 px-3 py-1.5 rounded-xl">🥉 3위: ${escapeHtml(stripStudentNumberPrefix(thirdPlaceWinner.name))}</span>` : ''}
          </div>
        </div>
      `;
    } else {
      championBanner.classList.add('hidden');
      championBanner.innerHTML = '';
    }
  }

  // 하단(1라운드) ➔ 상단(결승전 · 우승자)으로 좁혀지며 올라가는 계단식 피라미드 대진표 렌더링
  if (treeContainer) {
    const baseMatchCount = tour.rounds[0].matches.length;
    const minCanvasWidth = Math.max(baseMatchCount * 245, 320);

    // 1. 최상단 최종 우승자(CHAMPION) 정상 박스 + 결승전에서 올라오는 수직 연결선
    const championPeakHtml = `
      <div class="flex flex-col items-center justify-center w-full">
        <div class="px-6 py-4 rounded-2xl border-2 text-center transition-all max-w-xs w-full ${
          hasChampion && champion
            ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white border-amber-300 shadow-lg ring-4 ring-amber-200/70'
            : 'bg-white text-slate-400 border-dashed border-amber-300 shadow-2xs'
        }">
          <div class="text-2xl mb-0.5">👑</div>
          <div class="text-[11px] font-black uppercase tracking-widest ${hasChampion ? 'text-amber-100' : 'text-amber-600'}">최종 우승 (CHAMPION)</div>
          <div class="text-lg sm:text-xl font-black mt-1 break-keep ${hasChampion ? 'text-white' : 'text-slate-400'}">
            ${hasChampion && champion ? escapeHtml(stripStudentNumberPrefix(champion.name)) : '결승전 승자 대기 중'}
          </div>
        </div>
        <!-- 결승전(하단)에서 우승석(상단)으로 올라오는 중앙 연결선 -->
        <div class="w-full h-9 relative select-none pointer-events-none">
          <div style="position:absolute; left:50%; top:0; bottom:0; width:3px; margin-left:-1.5px; background:${hasChampion ? '#f59e0b' : '#cbd5e1'};"></div>
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%);" class="w-6 h-6 rounded-full ${hasChampion ? 'bg-amber-500 text-white ring-4 ring-amber-100' : 'bg-slate-200 text-slate-500'} flex items-center justify-center text-[10px] font-black shadow-2xs">
            <i class="fa-solid fa-arrow-up"></i>
          </div>
        </div>
      </div>
    `;

    // 2. 라운드 역순 배치: 최상단(결승전: rounds.length - 1)부터 최하단(1라운드: 0)까지 렌더링
    const pyramidLevelsHtml = [];
    for (let rIdx = tour.rounds.length - 1; rIdx >= 0; rIdx--) {
      const round = tour.rounds[rIdx];
      const isFinalRound = (rIdx === tour.rounds.length - 1);
      const hasLowerRound = (rIdx > 0);
      const completedInRound = round.matches.filter(m => m.winnerSlot === 1 || m.winnerSlot === 2 || m.isByeMatch).length;

      const cellsHtml = round.matches.map((m, mIdx) => {
        const child1 = hasLowerRound ? tour.rounds[rIdx - 1].matches[mIdx * 2] : null;
        const child2 = hasLowerRound ? tour.rounds[rIdx - 1].matches[mIdx * 2 + 1] : null;

        return `
          <div class="tournament-pyramid-cell">
            <!-- 현재 라운드 경기 카드 -->
            <div class="tournament-pyramid-card-wrap">
              ${renderTournamentMatchCard(m, rIdx, mIdx, tour.rounds.length, false)}
            </div>
            <!-- 바로 아래 라운드(rIdx - 1)의 두 경기(25%, 75%)에서 현재 경기(50%)로 모여서 올라오는 계단식 가지선 -->
            ${hasLowerRound ? renderPyramidBranchConnector(child1, child2) : ''}
          </div>
        `;
      }).join('');

      pyramidLevelsHtml.push(`
        <div class="w-full">
          <!-- 라운드 단계 배지 -->
          <div class="flex items-center justify-center mb-2">
            <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-black shadow-2xs ${
              isFinalRound
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : (rIdx === 0 ? 'bg-slate-800 text-white' : 'bg-emerald-700 text-white')
            }">
              <span>${rIdx === 0 ? '🏁 시작 라운드:' : (isFinalRound ? '🏆 최종 라운드:' : `⬆️ ${rIdx + 1}단계:`)} ${escapeHtml(round.title)}</span>
              <span class="bg-white/20 px-2 py-0.2 rounded-full text-[11px]">${completedInRound}/${round.matches.length} 완료</span>
            </div>
          </div>
          <!-- 해당 라운드 경기 행 (위로 갈수록 경기 수가 절반씩 줄어들며 중앙으로 모아짐) -->
          <div class="tournament-pyramid-row">
            ${cellsHtml}
          </div>
        </div>
      `);
    }

    // 3. 3·4위 결정전 (활성화된 경우 하단에 별도 표시)
    const thirdPlaceSectionHtml = tour.thirdPlaceMatch ? `
      <div class="mt-8 pt-6 border-t-2 border-dashed border-amber-200 max-w-md mx-auto w-full">
        <div class="mb-2.5 text-center">
          <span class="inline-block w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-black bg-amber-100 text-amber-950 border border-amber-300">
            🥉 3·4위 결정전 (4강 패자전)
          </span>
        </div>
        ${renderTournamentMatchCard(tour.thirdPlaceMatch, tour.rounds.length - 1, 0, tour.rounds.length, true)}
      </div>
    ` : '';

    treeContainer.innerHTML = `
      <div class="tournament-pyramid-canvas" style="min-width: ${minCanvasWidth}px;">
        ${championPeakHtml}
        ${pyramidLevelsHtml.join('')}
      </div>
      ${thirdPlaceSectionHtml}
    `;
  }

  // 전체 대진표 확인하기 모달이 열려 있다면 실시간 동기화
  const overviewModal = document.getElementById('tournamentOverviewModal');
  if (overviewModal && !overviewModal.classList.contains('hidden')) {
    renderTournamentOverviewGraphic();
  }
}

function renderTournamentActiveBanner() {
  ensureTournamentSlotsState();
  const banner = document.getElementById('activeTournamentQuickBanner');
  if (!banner) return;

  const activeItems = TOURNAMENT_SLOT_DEFS.map(def => ({
    def,
    tour: state.savedTournaments[def.key],
    stats: getTournamentSlotStats(state.savedTournaments[def.key])
  })).filter(item => item.stats.active);

  if (activeItems.length === 0) {
    banner.classList.add('hidden');
    banner.innerHTML = '';
    return;
  }

  const emptyDef = TOURNAMENT_SLOT_DEFS.find(def => !getTournamentSlotStats(state.savedTournaments[def.key]).active);

  banner.classList.remove('hidden');
  banner.innerHTML = `
    <div class="p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/90 shadow-2xs space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div class="flex items-center space-x-1.5">
          <span class="text-xs font-black text-amber-950 flex items-center space-x-1">
            <span>🏆 진행 중인 토너먼트 대진표</span>
            <span class="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">${activeItems.length} / 3개 운영 중</span>
          </span>
        </div>
        <div class="flex items-center space-x-1.5">
          ${activeItems.length >= 2 ? `
            <button
              type="button"
              onclick="openTournamentOverviewModal('all')"
              class="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] px-2.5 py-1 rounded-xl shadow-2xs flex items-center space-x-1 cursor-pointer active:scale-95"
            >
              <i class="fa-solid fa-table-columns text-[9px]"></i>
              <span>📊 ${activeItems.length}개 대진표 한눈에 보기</span>
            </button>
          ` : ''}
          ${emptyDef ? `
            <button
              type="button"
              onclick="openTournamentModal('${emptyDef.key}')"
              class="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[11px] px-2.5 py-1 rounded-xl shadow-2xs flex items-center space-x-1 cursor-pointer active:scale-95"
            >
              <i class="fa-solid fa-plus text-[9px]"></i>
              <span>${emptyDef.label} 추가 생성</span>
            </button>
          ` : ''}
        </div>
      </div>

      <div class="grid grid-cols-1 ${activeItems.length === 2 ? 'md:grid-cols-2' : (activeItems.length >= 3 ? 'lg:grid-cols-3' : '')} gap-2">
        ${activeItems.map(({ def, tour, stats }) => {
          const isCurrent = state.activeTournamentSlot === def.key;
          const formatShort = getTournamentGameFormatLabel(tour.gameFormat, true);
          return `
            <div
              onclick="openTournamentModal('${def.key}')"
              class="p-2.5 rounded-xl bg-white/95 border-2 ${isCurrent ? 'border-amber-400 ring-2 ring-amber-200/70' : 'border-amber-200/80 hover:border-amber-400'} shadow-2xs flex items-center justify-between gap-2 cursor-pointer transition-all"
            >
              <div class="flex items-center space-x-2.5 min-w-0">
                <div class="w-8 h-8 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                  ${def.num}
                </div>
                <div class="min-w-0 text-left">
                  <div class="flex items-center flex-wrap gap-1">
                    <span class="text-[10px] font-black bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded-md">${def.label}</span>
                    <span class="text-[10px] font-black bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded-md">${tour.bracketSize}강</span>
                    <span class="text-[10px] font-black ${isBo3Tournament(tour) ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800'} px-1.5 py-0.2 rounded-md">${formatShort}</span>
                    <span class="text-[10px] text-emerald-700 font-extrabold">${stats.completedReal}/${stats.totalReal}경기</span>
                  </div>
                  <p class="text-xs font-black text-slate-800 truncate mt-0.5">
                    ${escapeHtml(tour.title)}
                    ${stats.championName ? `<span class="text-amber-700 ml-1">(👑 우승: ${escapeHtml(stats.championName)})</span>` : ''}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onclick="event.stopPropagation(); openTournamentOverviewModal('${def.key}');"
                  class="bg-slate-800 hover:bg-slate-900 text-amber-300 font-extrabold text-[11px] px-2 py-1.5 rounded-xl shadow-2xs flex items-center space-x-1 cursor-pointer active:scale-95"
                  title="${def.label} 전체 대진표 그림 보기"
                >
                  <i class="fa-solid fa-diagram-project text-[9px]"></i>
                  <span>대진표</span>
                </button>
                <span class="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] px-2 py-1.5 rounded-xl shadow-2xs flex items-center space-x-1">
                  <span>관리</span>
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function copyTournamentBracketText() {
  const tour = state.savedTournament;
  if (!tour || !tour.rounds) return;
  const slotMeta = getTournamentSlotMeta(state.activeTournamentSlot);

  let lines = [];
  lines.push(`[🏆 (${slotMeta.label}) ${tour.title} - ${tour.bracketSize}강 대진표]`);
  lines.push(`• 경기 방식: ${getTournamentGameFormatLabel(tour.gameFormat, false)}`);
  lines.push(`• 참가 인원: ${tour.participantCount}명 (${tour.matchType === 'doubles' ? `복식 ${tour.entryCount}팀` : `단식 ${tour.entryCount}명`})`);
  lines.push(`• 생성 일시: ${tour.createdAt || ''}\n`);

  tour.rounds.forEach(round => {
    lines.push(`■ ${round.title}`);
    round.matches.forEach(m => {
      const p1Name = m.player1 ? m.player1.name : '미정(TBD)';
      const p2Name = m.player2 ? m.player2.name : '미정(TBD)';
      const scoreInfo = formatTournamentMatchScore(m, tour, true);
      const scoreBracket = scoreInfo ? ` [${scoreInfo}]` : '';
      let winStr = '';
      if (m.isByeMatch) {
        const adv = m.winnerSlot === 1 ? p1Name : p2Name;
        winStr = ` ➔ [부전승 진출: ${adv}]`;
      } else if (m.winnerSlot === 1) {
        winStr = ` ➔ [승리: ${p1Name}]`;
      } else if (m.winnerSlot === 2) {
        winStr = ` ➔ [승리: ${p2Name}]`;
      }
      lines.push(` - ${m.label}: ${p1Name} vs ${p2Name}${scoreBracket}${winStr}`);
    });
    lines.push('');
  });

  if (tour.thirdPlaceMatch) {
    const tp = tour.thirdPlaceMatch;
    const p1Name = tp.player1 ? tp.player1.name : '4강 1경기 패자';
    const p2Name = tp.player2 ? tp.player2.name : '4강 2경기 패자';
    const tpScore = formatTournamentMatchScore(tp, tour, true);
    const winName = tp.winnerSlot === 1 ? p1Name : (tp.winnerSlot === 2 ? p2Name : '');
    lines.push(`■ 🥉 3·4위 결정전`);
    lines.push(` - ${p1Name} vs ${p2Name}${tpScore ? ` [${tpScore}]` : ''}${winName ? ` ➔ [3위: ${winName}]` : ''}`);
  }

  const textToCopy = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('토너먼트 대진표가 클립보드에 복사되었습니다!', '📋');
    }).catch(() => {
      fallbackCopyText(textToCopy);
    });
  } else {
    fallbackCopyText(textToCopy);
  }
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('토너먼트 대진표가 클립보드에 복사되었습니다!', '📋');
  } catch (e) {
    showToast('복사에 실패했습니다.', '⚠️');
  }
  document.body.removeChild(ta);
}

function resetTournamentBracket(resetAllSlots = false) {
  ensureTournamentSlotsState();
  const slotMeta = getTournamentSlotMeta(state.activeTournamentSlot);
  const titleMsg = resetAllSlots ? '전체 토너먼트 대진표 초기화' : `${slotMeta.label} 초기화`;
  const bodyMsg = resetAllSlots
    ? '3개 슬롯의 모든 토너먼트 대진표를 초기화하시겠습니까?'
    : `현재 선택된 [${slotMeta.label}]를 초기화하시겠습니까? (다른 슬롯의 대진표는 그대로 유지됩니다)`;

  showCustomConfirm(titleMsg, bodyMsg, () => {
    if (resetAllSlots) {
      state.savedTournaments = { slot_1: null, slot_2: null, slot_3: null };
      state.savedTournament = null;
      tournamentFixedPairs = [];
      tournamentFixedPairsBySlot = { slot_1: [], slot_2: [], slot_3: [] };
      saveTournamentToRTDB(null, 'slot_1');
      saveTournamentToRTDB(null, 'slot_2');
      saveTournamentToRTDB(null, 'slot_3');
    } else {
      state.savedTournament = null;
      tournamentFixedPairs = [];
      tournamentFixedPairsBySlot[state.activeTournamentSlot] = [];
      saveTournamentToRTDB(null, state.activeTournamentSlot);
    }
    applySlotStateToSetupInputs();
    onTournamentRosterInput();
    tournamentSetupCollapsed = false;
    syncTournamentSetupVisibility();
    onTournamentRosterInput();
    renderTournamentSlotTabs();
    renderTournamentBracketUI();
    renderTournamentActiveBanner();
    showToast(`${slotMeta.label}가 초기화되었습니다.`, '🔄');
  });
}

/* =========================================================================
   SPECTATOR FULL BRACKET GRAPHIC VIEWER (관중용 한눈에 보는 전체 대진표 그림)
   ========================================================================= */

let tournamentOverviewFitScreen = true;

function openTournamentOverviewModal(targetSlotKey = null) {
  ensureTournamentSlotsState();
  if (targetSlotKey === 'all') {
    tournamentOverviewMode = 'all';
  } else if (targetSlotKey && ['slot_1', 'slot_2', 'slot_3'].includes(targetSlotKey)) {
    tournamentOverviewMode = 'single';
    state.activeTournamentSlot = targetSlotKey;
    state.savedTournament = state.savedTournaments[targetSlotKey] || null;
  } else {
    tournamentOverviewMode = 'single';
  }

  const tour = state.savedTournament;
  const anyActive = TOURNAMENT_SLOT_DEFS.some(d => getTournamentSlotStats(state.savedTournaments[d.key]).active);
  if (!anyActive || (tournamentOverviewMode === 'single' && (!tour || !tour.rounds || tour.rounds.length === 0))) {
    showToast('먼저 토너먼트 대진표를 작성해 주세요.', '⚠️');
    return;
  }
  tournamentOverviewFitScreen = true;
  syncTournamentOverviewFitButtons();
  renderTournamentSlotTabs();
  renderTournamentOverviewGraphic();
  openModal('tournamentOverviewModal');
}

function syncTournamentOverviewFitButtons() {
  const btnTrue = document.getElementById('tournamentOverviewFitBtnTrue');
  const btnFalse = document.getElementById('tournamentOverviewFitBtnFalse');
  if (btnTrue && btnFalse) {
    if (tournamentOverviewFitScreen) {
      btnTrue.className = 'px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center space-x-1 cursor-pointer bg-amber-500 text-slate-950 shadow-2xs';
      btnFalse.className = 'px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-1 cursor-pointer text-slate-300 hover:text-white';
    } else {
      btnTrue.className = 'px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-1 cursor-pointer text-slate-300 hover:text-white';
      btnFalse.className = 'px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center space-x-1 cursor-pointer bg-amber-500 text-slate-950 shadow-2xs';
    }
  }
}

function setTournamentOverviewFitMode(fitMode) {
  tournamentOverviewFitScreen = !!fitMode;
  syncTournamentOverviewFitButtons();
  renderTournamentOverviewGraphic();
  const wrap = document.getElementById('tournamentOverviewGraphicWrap');
  if (wrap) {
    wrap.scrollLeft = 0;
    wrap.scrollTop = 0;
  }
}

function toggleTournamentOverviewFitMode() {
  setTournamentOverviewFitMode(!tournamentOverviewFitScreen);
}

function toggleTournamentOverviewFullscreen() {
  const card = document.getElementById('tournamentOverviewCard');
  if (!card) return;
  if (!document.fullscreenElement) {
    if (card.requestFullscreen) {
      card.requestFullscreen().catch(() => {});
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
}

function onOverviewSvgMatchClick(roundIdx, matchIdx, isThirdPlace = false, slotKey = null) {
  ensureTournamentSlotsState();
  const targetKey = slotKey || state.activeTournamentSlot || 'slot_1';
  const tour = state.savedTournaments[targetKey] || state.savedTournament;
  if (!tour || !tour.rounds) return;
  const match = isThirdPlace ? tour.thirdPlaceMatch : tour.rounds[roundIdx]?.matches[matchIdx];
  if (!match) return;

  const p1 = match.player1;
  const p2 = match.player2;
  const isReady = !!(p1 && p2 && !p1.isBye && !p2.isBye);
  if (!isReady) {
    showToast('아직 하위 라운드 승자가 결정되지 않았습니다.', '⏳');
    return;
  }
  openScoreboardForTournamentMatch(roundIdx, matchIdx, isThirdPlace, targetKey);
}

function onOverviewSvgLeafClick(matchIdx, slotNum, slotKey = null) {
  ensureTournamentSlotsState();
  const targetKey = slotKey || state.activeTournamentSlot || 'slot_1';
  if (targetKey !== state.activeTournamentSlot) {
    state.activeTournamentSlot = targetKey;
    state.savedTournament = state.savedTournaments[targetKey];
  }
  const tour = state.savedTournament;
  if (!tour || !tour.rounds || !tour.rounds[0]) return;
  const match = tour.rounds[0].matches[matchIdx];
  if (!match || match.isByeMatch) return;
  const isReady = !!(match.player1 && match.player2 && !match.player1.isBye && !match.player2.isBye);
  if (isReady) {
    selectTournamentMatchWinner(0, matchIdx, slotNum, false);
  }
}

function splitOverviewDisplayName(cleanName, maxCharsPerLine = 9) {
  if (!cleanName) return [''];
  if (cleanName.includes(' & ')) {
    const parts = cleanName.split(' & ').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return [`${parts[0]} · ${parts[1]}`];
    }
  }
  if (cleanName.length <= maxCharsPerLine) return [cleanName];
  return [cleanName.slice(0, maxCharsPerLine), cleanName.slice(maxCharsPerLine, maxCharsPerLine * 2)];
}

function buildTournamentOverviewSvg(tour, slotKeyOverride = null) {
  const slotKey = slotKeyOverride || tour.slotKey || state.activeTournamentSlot || 'slot_1';
  const slotMeta = getTournamentSlotMeta(slotKey);
  const R = tour.rounds.length;
  const numLeaves = tour.bracketSize; // 4, 8, 16, 32

  // 슬롯 개수에 따른 박스 너비 및 간격 설정
  let leafW = 196;
  let leafGap = 22;
  let pairExtraGap = 24;
  let nameFontSize = 16;

  if (numLeaves === 8) {
    leafW = 160;
    leafGap = 14;
    pairExtraGap = 18;
    nameFontSize = 15;
  } else if (numLeaves === 16) {
    leafW = 132;
    leafGap = 10;
    pairExtraGap = 12;
    nameFontSize = 13.5;
  } else if (numLeaves >= 32) {
    leafW = 114;
    leafGap = 8;
    pairExtraGap = 10;
    nameFontSize = 12.5;
  }

  // 좌측 라운드 안내 배지(x: 18~102)와 왼쪽 1번 시드 박스가 절대 겹치거나 잘리지 않도록 좌측 여백 확보
  const leftGuidePad = 128;
  const rightPad = 48;
  const numPairs = numLeaves / 2;
  const totalLeavesWidth = numLeaves * leafW + (numLeaves - 1) * leafGap + (numPairs - 1) * pairExtraGap;
  const svgW = Math.max(leftGuidePad + totalLeavesWidth + rightPad, 1120);
  const actualStartX = leftGuidePad + (svgW - leftGuidePad - rightPad - totalLeavesWidth) / 2;

  const headerH = 92;
  const topPad = 24;
  const champBoxH = 84;
  const champBoxW = Math.max(leafW + 64, 248);
  const nodeBoxH = 68;
  const nodeBoxW = Math.max(leafW + 12, 148);
  const leafBoxH = 62;
  const levelConnectorH = 62;
  const bottomFooterH = 54;

  // 각 레벨의 상단 Y 좌표 계산 (Level R = 최상단 우승석, Level 0 = 최하단 참가 선수 출발선)
  const levelTopY = {};
  const levelBottomY = {};

  levelTopY[R] = headerH + topPad;
  levelBottomY[R] = levelTopY[R] + champBoxH;

  for (let lvl = R - 1; lvl >= 1; lvl--) {
    levelTopY[lvl] = levelBottomY[lvl + 1] + levelConnectorH;
    levelBottomY[lvl] = levelTopY[lvl] + nodeBoxH;
  }

  levelTopY[0] = levelBottomY[1] + levelConnectorH;
  levelBottomY[0] = levelTopY[0] + leafBoxH;

  const svgH = levelBottomY[0] + bottomFooterH;

  // 각 레벨의 노드 중심 X 좌표 계산
  const xCenter = {};
  xCenter[0] = [];
  for (let i = 0; i < numLeaves; i++) {
    const pairIdx = Math.floor(i / 2);
    const xLeft = actualStartX + i * (leafW + leafGap) + pairIdx * pairExtraGap;
    xCenter[0][i] = xLeft + leafW / 2;
  }

  for (let lvl = 1; lvl <= R; lvl++) {
    const count = numLeaves / Math.pow(2, lvl);
    xCenter[lvl] = [];
    for (let i = 0; i < count; i++) {
      xCenter[lvl][i] = (xCenter[lvl - 1][i * 2] + xCenter[lvl - 1][i * 2 + 1]) / 2;
    }
  }

  // 전체 완료 경기 수 계산
  let totalRealMatches = 0;
  let completedRealMatches = 0;
  tour.rounds.forEach(r => {
    r.matches.forEach(m => {
      if (!m.isByeMatch) {
        totalRealMatches++;
        if (m.winnerSlot === 1 || m.winnerSlot === 2) completedRealMatches++;
      }
    });
  });

  const finalRound = tour.rounds[R - 1];
  const finalMatch = finalRound ? finalRound.matches[0] : null;
  const hasChampion = !!(finalMatch && (finalMatch.winnerSlot === 1 || finalMatch.winnerSlot === 2));
  const championPlayer = hasChampion ? (finalMatch.winnerSlot === 1 ? finalMatch.player1 : finalMatch.player2) : null;
  const cleanChampionName = championPlayer ? stripStudentNumberPrefix(championPlayer.name) : '';

  const linesSvg = [];
  const nodesSvg = [];
  const badgesSvg = [];

  // 1. 각 레벨 간 계단식 트리 연결선 (Level lvl-1 두 노드 -> Level lvl 부모 노드)
  for (let lvl = 1; lvl <= R; lvl++) {
    const round = tour.rounds[lvl - 1];
    const yChildTop = levelTopY[lvl - 1];
    const yParentBot = levelBottomY[lvl];
    const yMid = Math.round((yChildTop + yParentBot) / 2);
    const isFinalConnector = (lvl === R);

    round.matches.forEach((m, mIdx) => {
      const x1 = xCenter[lvl - 1][mIdx * 2];
      const x2 = xCenter[lvl - 1][mIdx * 2 + 1];
      const xMid = xCenter[lvl][mIdx];

      const win1 = m.winnerSlot === 1;
      const win2 = m.winnerSlot === 2;
      const anyWin = win1 || win2;

      const activeColor = isFinalConnector ? '#fbbf24' : '#10b981';
      const inactiveColor = '#334155';

      // 기본 배경 연결선 (비활성/패배 쪽 먼저 그리기)
      if (!win1) {
        linesSvg.push(`
          <path d="M ${x1} ${yChildTop} L ${x1} ${yMid} L ${xMid} ${yMid}" fill="none" stroke="${inactiveColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        `);
      }
      if (!win2) {
        linesSvg.push(`
          <path d="M ${x2} ${yChildTop} L ${x2} ${yMid} L ${xMid} ${yMid}" fill="none" stroke="${inactiveColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        `);
      }
      if (!anyWin) {
        linesSvg.push(`
          <path d="M ${xMid} ${yMid} L ${xMid} ${yParentBot + 5}" fill="none" stroke="${inactiveColor}" stroke-width="2.5" stroke-linecap="round" />
          <polygon points="${xMid},${yParentBot + 1} ${xMid - 5},${yParentBot + 9} ${xMid + 5},${yParentBot + 9}" fill="${inactiveColor}" />
        `);
      }

      // 승리자 진출 경로 하이라이트 선 (위에 굵고 선명하게 그리기)
      if (win1) {
        linesSvg.push(`
          <path d="M ${x1} ${yChildTop} L ${x1} ${yMid} L ${xMid} ${yMid} L ${xMid} ${yParentBot + 6}" fill="none" stroke="${activeColor}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#winnerGlow)" />
          <polygon points="${xMid},${yParentBot} ${xMid - 6},${yParentBot + 10} ${xMid + 6},${yParentBot + 10}" fill="${activeColor}" />
        `);
      } else if (win2) {
        linesSvg.push(`
          <path d="M ${x2} ${yChildTop} L ${x2} ${yMid} L ${xMid} ${yMid} L ${xMid} ${yParentBot + 6}" fill="none" stroke="${activeColor}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#winnerGlow)" />
          <polygon points="${xMid},${yParentBot} ${xMid - 6},${yParentBot + 10} ${xMid + 6},${yParentBot + 10}" fill="${activeColor}" />
        `);
      }

      // 분기점 중앙 라운드/점수 미니 배지 (단판 11점제 vs 11점 3판2선승제 구분 표기)
      const bo3 = isBo3Tournament(tour);
      const hasScore = !m.isByeMatch && m.score1 !== null && m.score1 !== undefined && m.score2 !== null && m.score2 !== undefined;
      let pillText = '';
      if (hasScore) {
        pillText = bo3 ? `세트 ${m.score1} : ${m.score2}` : `${m.score1} : ${m.score2}점`;
      } else {
        pillText = m.isByeMatch ? '부전승' : round.title;
      }
      const pillW = Math.max(pillText.length * 8.5 + 18, 56);
      const pillBg = anyWin ? (isFinalConnector ? '#b45309' : '#065f46') : '#1e293b';
      const pillBorder = anyWin ? activeColor : '#475569';
      const pillTextColor = anyWin ? '#ffffff' : '#94a3b8';

      badgesSvg.push(`
        <g transform="translate(${xMid}, ${yMid})">
          <rect x="${-pillW / 2}" y="-11" width="${pillW}" height="22" rx="11" fill="${pillBg}" stroke="${pillBorder}" stroke-width="1.5" />
          <text x="0" y="4" text-anchor="middle" fill="${pillTextColor}" font-size="11" font-weight="800" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(pillText)}</text>
        </g>
      `);
    });
  }

  // 2. 최하단 Level 0 (참가 선수 출발 슬롯) 렌더링
  const round0Matches = tour.rounds[0].matches;
  for (let i = 0; i < numLeaves; i++) {
    const mIdx = Math.floor(i / 2);
    const slotNum = (i % 2) + 1;
    const m0 = round0Matches[mIdx];
    const player = slotNum === 1 ? m0.player1 : m0.player2;

    const cx = xCenter[0][i];
    const x = cx - leafW / 2;
    const y = levelTopY[0];

    const isWinner = m0.winnerSlot === slotNum;
    const isLoser = m0.winnerSlot && m0.winnerSlot !== slotNum;
    const isByeSlot = !!(player && player.isBye);
    const isReady0 = !!(m0.player1 && m0.player2 && !m0.player1.isBye && !m0.player2.isBye);

    let boxFill = '#1e293b';
    let boxStroke = slotNum === 1 ? '#0ea5e9' : '#f43f5e';
    let strokeWidth = 2;
    let textColor = '#f8fafc';
    let subLabel = slotNum === 1 ? `1R ${mIdx + 1}경기 A` : `1R ${mIdx + 1}경기 B`;
    let subColor = slotNum === 1 ? '#38bdf8' : '#fb7185';

    if (isByeSlot) {
      boxFill = '#0f172a';
      boxStroke = '#334155';
      strokeWidth = 1.5;
      textColor = '#64748b';
      subLabel = '자동 진출 슬롯';
      subColor = '#475569';
    } else if (isWinner) {
      boxFill = '#064e3b';
      boxStroke = '#10b981';
      strokeWidth = 3;
      textColor = '#ffffff';
      subLabel = m0.isByeMatch ? '⏩ 부전승 출발' : '🏆 1라운드 승리';
      subColor = '#6ee7b7';
    } else if (isLoser) {
      boxFill = '#0f172a';
      boxStroke = '#334155';
      strokeWidth = 1.5;
      textColor = '#64748b';
      subLabel = '1라운드 패배';
      subColor = '#475569';
    }

    const rawName = isByeSlot ? '부전승 (BYE)' : (player ? stripStudentNumberPrefix(player.name) : '미정');
    const lines = splitOverviewDisplayName(rawName, numLeaves >= 16 ? 7 : 9);

    nodesSvg.push(`
      <g
        transform="translate(${x}, ${y})"
        onclick="onOverviewSvgLeafClick(${mIdx}, ${slotNum}, '${slotKey}')"
        style="cursor: ${isReady0 ? 'pointer' : 'default'};"
      >
        <rect width="${leafW}" height="${leafBoxH}" rx="12" fill="${boxFill}" stroke="${boxStroke}" stroke-width="${strokeWidth}" ${isByeSlot ? 'stroke-dasharray="5,4"' : ''} />
        <text x="${leafW / 2}" y="18" text-anchor="middle" fill="${subColor}" font-size="10.5" font-weight="800" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(subLabel)}</text>
        ${lines.length === 1 ? `
          <text x="${leafW / 2}" y="43" text-anchor="middle" fill="${textColor}" font-size="${nameFontSize}" font-weight="900" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(lines[0])}</text>
        ` : `
          <text x="${leafW / 2}" y="36" text-anchor="middle" fill="${textColor}" font-size="${nameFontSize - 2}" font-weight="900" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(lines[0])}</text>
          <text x="${leafW / 2}" y="52" text-anchor="middle" fill="${textColor}" font-size="${nameFontSize - 2}" font-weight="900" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(lines[1])}</text>
        `}
      </g>
    `);
  }

  // 3. 중간 레벨 Level 1 ~ Level R-1 (각 라운드 승리 진출석 / 대진 노드) 렌더링
  for (let lvl = 1; lvl < R; lvl++) {
    const round = tour.rounds[lvl - 1];
    const nextRound = tour.rounds[lvl];

    round.matches.forEach((m, mIdx) => {
      const cx = xCenter[lvl][mIdx];
      const x = cx - nodeBoxW / 2;
      const y = levelTopY[lvl];

      const isCompleted = !!(m.winnerSlot === 1 || m.winnerSlot === 2);
      const winnerPlayer = m.winnerSlot === 1 ? m.player1 : (m.winnerSlot === 2 ? m.player2 : null);
      const cleanWinner = winnerPlayer ? stripStudentNumberPrefix(winnerPlayer.name) : '';
      const isReady = !!(m.player1 && m.player2 && !m.player1.isBye && !m.player2.isBye);

      // 상위 라운드(nextRound)에서 이미 패배했는지 확인
      const parentMatch = nextRound ? nextRound.matches[Math.floor(mIdx / 2)] : null;
      const mySlotInParent = (mIdx % 2) + 1;
      const wonInParent = !!(parentMatch && parentMatch.winnerSlot === mySlotInParent);
      const lostInParent = !!(parentMatch && parentMatch.winnerSlot && parentMatch.winnerSlot !== mySlotInParent);

      let boxFill = '#0f172a';
      let boxStroke = '#334155';
      let strokeW = 2;
      let headerText = `⏳ ${m.label}`;
      let headerColor = '#94a3b8';
      let mainText = '하위 승자 대기 ⬆️';
      let mainColor = '#64748b';
      let mainFontSize = nameFontSize;

      const matchScoreTag = (!m.isByeMatch && m.score1 !== null && m.score1 !== undefined && m.score2 !== null && m.score2 !== undefined)
        ? (isBo3Tournament(tour) ? ` (세트 ${m.score1}:${m.score2})` : ` (${m.score1}:${m.score2}점)`)
        : '';

      if (isCompleted && winnerPlayer) {
        if (lostInParent) {
          boxFill = '#11302b';
          boxStroke = '#059669';
          strokeW = 2;
          headerText = m.isByeMatch ? `⏩ ${nextRound.title} 진출` : `✓ ${m.label} 승자${matchScoreTag}`;
          headerColor = '#6ee7b7';
          mainText = cleanWinner;
          mainColor = '#d1fae5';
        } else {
          boxFill = '#065f46';
          boxStroke = wonInParent ? '#34d399' : '#10b981';
          strokeW = 3;
          headerText = m.isByeMatch ? `⏩ 부전승 진출` : `🏆 ${m.label} 승리${matchScoreTag}`;
          headerColor = '#fde68a';
          mainText = `👑 ${cleanWinner}`;
          mainColor = '#ffffff';
        }
      } else if (isReady) {
        boxFill = '#1e293b';
        boxStroke = '#f59e0b';
        strokeW = 2.8;
        headerText = `🏓 ${m.label} (클릭:전광판)`;
        headerColor = '#fbbf24';
        const n1 = stripStudentNumberPrefix(m.player1.name);
        const n2 = stripStudentNumberPrefix(m.player2.name);
        mainText = `${n1} vs ${n2}`;
        mainColor = '#f8fafc';
        mainFontSize = Math.max(nameFontSize - 2, 12);
      } else if (m.player1 || m.player2) {
        const arrived = m.player1 || m.player2;
        const arrivedName = stripStudentNumberPrefix(arrived.name);
        boxFill = '#1e293b';
        boxStroke = '#475569';
        headerText = `⏳ ${m.label} 대기`;
        headerColor = '#94a3b8';
        mainText = `${arrivedName} vs 대기`;
        mainColor = '#cbd5e1';
        mainFontSize = Math.max(nameFontSize - 2.5, 11.5);
      }

      nodesSvg.push(`
        <g
          transform="translate(${x}, ${y})"
          onclick="onOverviewSvgMatchClick(${lvl - 1}, ${mIdx}, false, '${slotKey}')"
          style="cursor: ${isReady ? 'pointer' : 'default'};"
        >
          <rect width="${nodeBoxW}" height="${nodeBoxH}" rx="14" fill="${boxFill}" stroke="${boxStroke}" stroke-width="${strokeW}" />
          <text x="${nodeBoxW / 2}" y="21" text-anchor="middle" fill="${headerColor}" font-size="11" font-weight="800" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(headerText)}</text>
          <text x="${nodeBoxW / 2}" y="47" text-anchor="middle" fill="${mainColor}" font-size="${mainFontSize}" font-weight="900" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(mainText)}</text>
        </g>
      `);
    });
  }

  // 4. 최상단 Level R (👑 최종 우승 CHAMPION 정상 박스) 렌더링
  {
    const cx = xCenter[R][0];
    const x = cx - champBoxW / 2;
    const y = levelTopY[R];
    const isFinalReady = !!(finalMatch && finalMatch.player1 && finalMatch.player2 && !finalMatch.player1.isBye && !finalMatch.player2.isBye);

    let champFill = 'url(#champWaitGrad)';
    let champStroke = isFinalReady ? '#fbbf24' : '#64748b';
    let titleText = '👑 최종 우승 (CHAMPION)';
    let titleColor = '#fde68a';
    let bodyText = '결승전 승자 대기 중 ⬆️';
    let bodyColor = '#cbd5e1';

    if (hasChampion && cleanChampionName) {
      champFill = 'url(#champGoldGrad)';
      champStroke = '#fef08a';
      const finalScoreStr = formatTournamentMatchScore(finalMatch, tour, false);
      titleText = finalScoreStr ? `👑 TOURNAMENT CHAMPION (${finalScoreStr})` : '👑 TOURNAMENT CHAMPION (최종 우승)';
      titleColor = '#fffbeb';
      bodyText = `🏆 ${cleanChampionName}`;
      bodyColor = '#ffffff';
    } else if (isFinalReady) {
      const f1 = stripStudentNumberPrefix(finalMatch.player1.name);
      const f2 = stripStudentNumberPrefix(finalMatch.player2.name);
      titleText = '🔥 결승전 대결 진행 가능 (클릭: 전광판)';
      titleColor = '#fde047';
      bodyText = `${f1} VS ${f2}`;
      bodyColor = '#ffffff';
    }

    nodesSvg.push(`
      <g
        transform="translate(${x}, ${y})"
        onclick="onOverviewSvgMatchClick(${R - 1}, 0, false, '${slotKey}')"
        style="cursor: ${isFinalReady ? 'pointer' : 'default'};"
      >
        <rect width="${champBoxW}" height="${champBoxH}" rx="18" fill="${champFill}" stroke="${champStroke}" stroke-width="3.5" filter="url(#winnerGlow)" />
        <text x="${champBoxW / 2}" y="27" text-anchor="middle" fill="${titleColor}" font-size="12" font-weight="900" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(titleText)}</text>
        <text x="${champBoxW / 2}" y="58" text-anchor="middle" fill="${bodyColor}" font-size="20" font-weight="900" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(bodyText)}</text>
      </g>
    `);
  }

  // 5. 3·4위 결정전 박스 (활성화된 경우 우측 상단 여백에 배치)
  let thirdPlaceSvg = '';
  if (tour.thirdPlaceMatch) {
    const tp = tour.thirdPlaceMatch;
    const tpW = 240;
    const tpH = 92;
    const tpX = svgW - tpW - 36;
    const tpY = levelTopY[R];

    const tpDone = !!(tp.winnerSlot === 1 || tp.winnerSlot === 2);
    const tpReady = !!(tp.player1 && tp.player2);
    const tpWinner = tp.winnerSlot === 1 ? tp.player1 : (tp.winnerSlot === 2 ? tp.player2 : null);
    const cleanTpWinner = tpWinner ? stripStudentNumberPrefix(tpWinner.name) : '';

    const p1Text = tp.player1 ? stripStudentNumberPrefix(tp.player1.name) : '4강 1경기 패자';
    const p2Text = tp.player2 ? stripStudentNumberPrefix(tp.player2.name) : '4강 2경기 패자';
    const tpFormattedScore = formatTournamentMatchScore(tp, tour, false);
    const scoreStr = tpFormattedScore ? ` (${tpFormattedScore})` : '';

    const tpStroke = tpDone ? '#10b981' : (tpReady ? '#f59e0b' : '#475569');
    const tpFill = tpDone ? '#064e3b' : '#1e293b';

    thirdPlaceSvg = `
      <g
        transform="translate(${tpX}, ${tpY})"
        onclick="onOverviewSvgMatchClick(${R - 1}, 0, true, '${slotKey}')"
        style="cursor: ${tpReady ? 'pointer' : 'default'};"
      >
        <rect width="${tpW}" height="${tpH}" rx="16" fill="${tpFill}" stroke="${tpStroke}" stroke-width="2.5" />
        <text x="${tpW / 2}" y="24" text-anchor="middle" fill="#fcd34d" font-size="12" font-weight="900" font-family="Pretendard, 'Malgun Gothic', sans-serif">🥉 3·4위 결정전${escapeHtml(scoreStr)}</text>
        <text x="${tpW / 2}" y="48" text-anchor="middle" fill="#e2e8f0" font-size="13" font-weight="800" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(p1Text)} vs ${escapeHtml(p2Text)}</text>
        <text x="${tpW / 2}" y="73" text-anchor="middle" fill="${tpDone ? '#6ee7b7' : '#94a3b8'}" font-size="14" font-weight="900" font-family="Pretendard, 'Malgun Gothic', sans-serif">
          ${tpDone ? `🥉 3위 확정: ${escapeHtml(cleanTpWinner)}` : (tpReady ? '🏓 클릭하여 전광판 시작' : '⏳ 4강 종료 후 자동 배정')}
        </text>
      </g>
    `;
  }

  // 6. 각 층 좌측에 라운드 단계 표시 배지
  const levelGuideLabels = [];
  for (let lvl = 0; lvl <= R; lvl++) {
    const cy = (levelTopY[lvl] + levelBottomY[lvl]) / 2;
    let labelText = '';
    let pillColor = '#334155';
    if (lvl === 0) {
      labelText = '참가 선수';
      pillColor = '#0284c7';
    } else if (lvl === R) {
      labelText = '최종 우승';
      pillColor = '#d97706';
    } else {
      labelText = `${tour.rounds[lvl - 1].title} 승자`;
      pillColor = '#059669';
    }
    levelGuideLabels.push(`
      <g transform="translate(18, ${cy})">
        <rect x="0" y="-13" width="84" height="26" rx="8" fill="${pillColor}" opacity="0.9" />
        <text x="42" y="4" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="900" font-family="Pretendard, 'Malgun Gothic', sans-serif">${escapeHtml(labelText)}</text>
      </g>
    `);
  }

  const svgClass = 'block m-auto select-none';
  const svgStyle = tournamentOverviewFitScreen
    ? 'width: 100%; height: auto; max-width: 100%; max-height: 74vh;'
    : `width: ${svgW}px; min-width: ${svgW}px; height: auto;`;

  return {
    svgW,
    svgH,
    completedRealMatches,
    totalRealMatches,
    svgMarkup: `
      <svg
        id="tournamentOverviewSvgElement_${slotKey}"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${svgW} ${svgH}"
        preserveAspectRatio="xMidYMid meet"
        class="${svgClass}"
        style="${svgStyle}"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#090d16" />
            <stop offset="50%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#090d16" />
          </linearGradient>
          <linearGradient id="champGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="50%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
          <linearGradient id="champWaitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <filter id="winnerGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#10b981" flood-opacity="0.45" />
          </filter>
        </defs>

        <!-- 전체 배경 -->
        <rect width="${svgW}" height="${svgH}" rx="24" fill="url(#bgGrad)" />

        <!-- 상단 대회 타이틀 헤더 -->
        <g transform="translate(0, 0)">
          <rect x="20" y="16" width="${svgW - 40}" height="68" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
          <text x="${svgW / 2}" y="45" text-anchor="middle" fill="#ffffff" font-size="21" font-weight="900" font-family="Pretendard, 'Malgun Gothic', sans-serif">
            🏆 [${slotMeta.label}] ${escapeHtml(tour.title)} (${tour.bracketSize}강 토너먼트 전체 대진표)
          </text>
          <text x="${svgW / 2}" y="69" text-anchor="middle" fill="#94a3b8" font-size="13" font-weight="700" font-family="Pretendard, 'Malgun Gothic', sans-serif">
            경기 방식: ${getTournamentGameFormatLabel(tour.gameFormat, false)}  |  참가: ${tour.participantCount}명 (${tour.matchType === 'doubles' ? `복식 ${tour.entryCount}팀` : `단식 ${tour.entryCount}명`})  |  진행 현황: 총 ${totalRealMatches}경기 중 ${completedRealMatches}경기 완료
          </text>
        </g>

        <!-- 좌측 층별 라운드 안내 배지 -->
        ${levelGuideLabels.join('')}

        <!-- 계단식 트리 연결선 레이어 -->
        ${linesSvg.join('')}

        <!-- 분기점 점수/라운드 배지 레이어 -->
        ${badgesSvg.join('')}

        <!-- 각 층 대진/승자 노드 박스 레이어 -->
        ${nodesSvg.join('')}

        <!-- 3·4위 결정전 박스 -->
        ${thirdPlaceSvg}

        <!-- 하단 출발선 안내 바 -->
        <text x="${svgW / 2}" y="${svgH - 18}" text-anchor="middle" fill="#64748b" font-size="12" font-weight="800" font-family="Pretendard, 'Malgun Gothic', sans-serif">
          🏁 START LINE — 하단 참가 선수 출발선 (${isBo3Tournament(tour) ? '11점 1세트 · 3판 2선승제' : '단판 11점 승부'} · 승리 시 초록색 라인을 따라 상위 라운드로 실시간 이동합니다)
        </text>
      </svg>
    `
  };
}

function renderTournamentOverviewGraphic() {
  ensureTournamentSlotsState();
  renderTournamentSlotTabs();

  const wrap = document.getElementById('tournamentOverviewGraphicWrap');
  const titleEl = document.getElementById('tournamentOverviewTitle');
  const progressEl = document.getElementById('tournamentOverviewProgressText');
  if (!wrap) return;

  if (tournamentOverviewMode === 'all') {
    const activeDefs = TOURNAMENT_SLOT_DEFS.filter(d => getTournamentSlotStats(state.savedTournaments[d.key]).active);
    if (activeDefs.length === 0) return;

    let totalDoneAll = 0;
    let totalMatchesAll = 0;
    const cardsHtml = activeDefs.map(def => {
      const t = state.savedTournaments[def.key];
      const built = buildTournamentOverviewSvg(t, def.key);
      totalDoneAll += built.completedRealMatches;
      totalMatchesAll += built.totalRealMatches;
      return `
        <div class="w-full bg-slate-900/90 border border-slate-700 rounded-2xl p-2 sm:p-3 space-y-2">
          <div class="flex items-center justify-between px-2">
            <span class="text-xs font-black text-amber-300 flex items-center space-x-1.5">
              <span class="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md font-black">${def.label}</span>
              <span class="text-white">${escapeHtml(t.title)} (${t.bracketSize}강 · ${getTournamentGameFormatLabel(t.gameFormat, true)})</span>
            </span>
            <button
              type="button"
              onclick="switchOverviewTournamentSlot('${def.key}')"
              class="text-[11px] bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 font-black px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >이 대진표만 크게 보기</button>
          </div>
          ${built.svgMarkup}
        </div>
      `;
    }).join('');

    if (titleEl) {
      titleEl.innerText = `📊 동시 운영 토너먼트 전체 대진표 (${activeDefs.length}개 대진표 모아보기)`;
    }
    if (progressEl) {
      progressEl.innerText = `전체 합산 진행: ${totalDoneAll} / ${totalMatchesAll}경기 완료`;
    }
    wrap.innerHTML = `<div class="w-full space-y-4 m-auto">${cardsHtml}</div>`;
    return;
  }

  const slotMeta = getTournamentSlotMeta(state.activeTournamentSlot);
  const tour = state.savedTournament;
  if (!tour || !tour.rounds || tour.rounds.length === 0) return;

  const built = buildTournamentOverviewSvg(tour, state.activeTournamentSlot);
  if (titleEl) {
    titleEl.innerText = `[${slotMeta.label}] ${tour.title} (${tour.bracketSize}강 · ${getTournamentGameFormatLabel(tour.gameFormat, true)})`;
  }
  if (progressEl) {
    progressEl.innerText = `실시간 경기 진행: ${built.completedRealMatches} / ${built.totalRealMatches}경기 완료`;
  }

  wrap.innerHTML = built.svgMarkup;
}

function downloadTournamentBracketImage() {
  ensureTournamentSlotsState();
  const slotKey = state.activeTournamentSlot || 'slot_1';
  const slotMeta = getTournamentSlotMeta(slotKey);
  const tour = state.savedTournament;
  const svgEl = document.getElementById(`tournamentOverviewSvgElement_${slotKey}`) || document.querySelector('#tournamentOverviewGraphicWrap svg');
  if (!tour || !svgEl) {
    showToast('저장할 대진표가 없습니다.', '⚠️');
    return;
  }

  const built = buildTournamentOverviewSvg(tour, slotKey);
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgEl);
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const scale = 2; // 고해상도 2배율 PNG 출력
  const canvas = document.createElement('canvas');
  canvas.width = built.svgW * scale;
  canvas.height = built.svgH * scale;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    try {
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeTitle = (tour.title || '탁구토너먼트').replace(/[\\/:*?"<>|]/g, '_');
      link.download = `${slotMeta.label}_${safeTitle}_${tour.bracketSize}강_전체대진표.png`;
      link.href = pngUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('고화질 전체 대진표 그림(PNG)이 저장되었습니다!', '🖼️');
    } catch (e) {
      showToast('이미지 저장 중 오류가 발생했습니다.', '⚠️');
    }
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    showToast('이미지 변환에 실패했습니다.', '⚠️');
  };

  img.src = url;
}
