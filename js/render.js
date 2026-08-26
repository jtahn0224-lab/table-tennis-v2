/* UI RENDERER & TAB CONTROLLERS */

function switchMainTab(tabName) {
  currentMainTab = tabName;

  const viewIds = ['viewMissions', 'viewMatches', 'viewRewards', 'viewStats'];
  const btnIds = ['mainNavMissionsBtn', 'mainNavMatchesBtn', 'mainNavRewardsBtn', 'mainNavStatsBtn'];

  viewIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  btnIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.className = "py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all duration-200 flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-1 text-slate-600 hover:text-slate-800";
    }
  });

  const activeView = document.getElementById(`view${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (activeView) activeView.classList.remove('hidden');

  const activeBtn = document.getElementById(`mainNav${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Btn`);
  if (activeBtn) {
    activeBtn.className = "py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all duration-200 flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-1 bg-white text-emerald-800 shadow-sm";
  }

  renderUI();
}

function switchTab(c) {
  activeTab = c;
  const pBtn = document.getElementById('personalTabBtn');
  const tBtn = document.getElementById('teamTabBtn');
  if (pBtn && tBtn) {
    if (c === 'personal') {
      pBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-white text-emerald-800 shadow-sm flex items-center justify-center space-x-1";
      tBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-800 flex items-center justify-center space-x-1";
    } else {
      tBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-white text-emerald-800 shadow-sm flex items-center justify-center space-x-1";
      pBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-800 flex items-center justify-center space-x-1";
    }
  }
  renderUI();
}

function selectWeekFilter(week) {
  selectedWeek = week;
  for (let i = 1; i <= 10; i++) {
    const btn = document.getElementById(`weekBtn_${i}`);
    if (btn) {
      if (selectedWeek === i) {
        btn.className = "px-3 py-1.5 rounded-xl whitespace-nowrap transition-all bg-emerald-600 text-white shadow-xs font-bold";
      } else {
        btn.className = "px-3 py-1.5 rounded-xl whitespace-nowrap transition-all bg-slate-100 text-slate-600 hover:bg-emerald-50 font-bold";
      }
    }
  }
  const allBtn = document.getElementById('weekBtn_all');
  if (allBtn) {
    if (selectedWeek === 'all') {
      allBtn.className = "px-3 py-1.5 rounded-xl whitespace-nowrap transition-all bg-emerald-600 text-white shadow-xs font-bold";
    } else {
      allBtn.className = "px-3 py-1.5 rounded-xl whitespace-nowrap transition-all bg-slate-100 text-slate-600 hover:bg-emerald-50 font-bold";
    }
  }
  renderUI();
}

function switchRankingView(m) {
  rankingViewMode = m;
  renderMatchesView();
}

function toggleClassAccordion(groupKey) {
  collapsedClasses[groupKey] = !collapsedClasses[groupKey];
  renderStudentDirectory();
}

function renderUI() {
  checkReadOnlyGuard();
  const student = getCurrentStudent();
  const isAdmin = state.role === 'admin';

  const roleBadgeTag = document.getElementById('roleBadgeTag');
  if (roleBadgeTag) {
    roleBadgeTag.innerText = isAdmin ? '선생님 모드' : '부원 모드';
    roleBadgeTag.className = isAdmin ? 'text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950' : 'text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white';
  }

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    if (isAdmin) settingsBtn.classList.remove('hidden');
    else settingsBtn.classList.add('hidden');
  }

  const modeSwitchBtn = document.getElementById('modeSwitchBtn');
  if (modeSwitchBtn) {
    if (isAdmin) {
      modeSwitchBtn.classList.remove('hidden');
      const textEl = document.getElementById('modeSwitchBtnText');
      if (textEl) textEl.innerText = "부원 모드로 전환";
    } else {
      modeSwitchBtn.classList.add('hidden');
    }
  }

  const sidebarAddStudentBtn = document.getElementById('sidebarAddStudentBtn');
  if (sidebarAddStudentBtn) {
    if (isAdmin) sidebarAddStudentBtn.classList.remove('hidden');
    else sidebarAddStudentBtn.classList.add('hidden');
  }

  const addMissionBtn = document.getElementById('addMissionBtn');
  if (addMissionBtn) {
    if (isAdmin) addMissionBtn.classList.remove('hidden');
    else addMissionBtn.classList.add('hidden');
  }

  const addMatchBtn = document.getElementById('addMatchBtn');
  if (addMatchBtn) {
    if (isAdmin) addMatchBtn.classList.remove('hidden');
    else addMatchBtn.classList.add('hidden');
  }

  const addRewardBtn = document.getElementById('addRewardBtn');
  if (addRewardBtn) {
    if (isAdmin) addRewardBtn.classList.remove('hidden');
    else addRewardBtn.classList.add('hidden');
  }

  const adminPointAdjustBox = document.getElementById('adminPointAdjustBox');
  if (adminPointAdjustBox) {
    if (isAdmin) adminPointAdjustBox.classList.remove('hidden');
    else adminPointAdjustBox.classList.add('hidden');
  }

  // HEADER RENDERING
  const mainProfileHeader = document.getElementById('mainProfileHeader');
  const headerName = document.getElementById('headerName');
  const headerClassEl = document.getElementById('headerClass');
  const headerAvatarIcon = document.getElementById('headerAvatarIcon');
  const headerAvatar = document.getElementById('headerAvatar');
  const headerTitleBadge = document.getElementById('headerTitleBadge');
  const userLevelTitle = document.getElementById('userLevelTitle');

  if (mainProfileHeader && student) {
    mainProfileHeader.className = `mb-4 p-3.5 rounded-2xl shadow-xs flex items-center justify-between gap-3 transition-all ${student.equippedCardSkin || 'card-skin-none'}`;
  }

  if (headerName && student) {
    headerName.innerText = student.name;
    headerName.className = `font-black text-base sm:text-lg leading-tight truncate ${student.equippedNameSkin || 'name-skin-none'}`;
  }
  if (headerClassEl) headerClassEl.innerText = student ? formatClassBadge(student) : '';
  if (headerAvatarIcon && student) headerAvatarIcon.innerText = student.avatar || '🏓';

  if (headerAvatar && student) {
    headerAvatar.className = `w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0 relative transition-all ${student.equippedFrame || 'frame-none'} ${student.equippedAura || 'aura-none'}`;
  }

  if (headerTitleBadge && student) {
    headerTitleBadge.innerText = student.equippedTitle || calculateLevelTitle(student.totalPoints || 0);
  }

  if (userLevelTitle) userLevelTitle.innerText = calculateLevelTitle(student ? student.totalPoints : 0);

  const totalPointsEl = document.getElementById('totalPoints');
  if (totalPointsEl) totalPointsEl.innerText = `${student ? (student.totalPoints || 0) : 0} P`;

  const missions = student ? (student.missions || []) : [];
  const totalMissions = missions.length;
  const completedMissions = missions.filter(m => m.completed).length;
  const pct = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

  const progressPercentEl = document.getElementById('progressPercent');
  if (progressPercentEl) progressPercentEl.innerText = `${pct}%`;

  const completedCountTextEl = document.getElementById('completedCountText');
  if (completedCountTextEl) completedCountTextEl.innerText = `(${completedMissions}/${totalMissions} 완료)`;

  const progressBarEl = document.getElementById('progressBar');
  if (progressBarEl) progressBarEl.style.width = `${pct}%`;

  // Pending Approval Section
  const pendingApprovalSection = document.getElementById('adminApprovalSection');
  const pendingList = document.getElementById('pendingList');
  const pendingCountBadge = document.getElementById('pendingCountBadge');

  let allPending = [];
  state.students.forEach(s => {
    if (s.missions && Array.isArray(s.missions)) {
      s.missions.forEach(m => {
        if (m.pending && !m.completed) {
          allPending.push({ student: s, mission: m });
        }
      });
    }
  });

  if (isAdmin && allPending.length > 0) {
    if (pendingApprovalSection) pendingApprovalSection.classList.remove('hidden');
    if (pendingCountBadge) pendingCountBadge.innerText = `${allPending.length}건`;
    if (pendingList) {
      pendingList.innerHTML = allPending.map(item => `
        <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs">
          <div class="min-w-0 flex-1 pr-2">
            <p class="text-[11px] font-bold text-amber-900 truncate">👤 [${formatClassBadge(item.student)}] ${escapeHtml(item.student.name)}</p>
            <p class="text-xs font-extrabold text-slate-800 truncate">[${item.mission.week || 1}주차] ${escapeHtml(item.mission.title)}</p>
            <span class="text-[10px] font-black text-amber-600">+${item.mission.points} P</span>
          </div>
          <div class="flex space-x-1.5 shrink-0">
            <button onclick="approvePendingMission('${item.student.id}', '${item.mission.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs">
              승인(도장) 💮
            </button>
            <button onclick="rejectPendingMission('${item.student.id}', '${item.mission.id}')" class="bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold px-2 py-1 rounded-lg">
              반려
            </button>
          </div>
        </div>
      `).join('');
    }
  } else {
    if (pendingApprovalSection) pendingApprovalSection.classList.add('hidden');
  }

  // Render Active Management Lists
  const modalDeleteListSection = document.getElementById('modalStudentDeleteListSection');
  if (modalDeleteListSection) {
    if (isAdmin) modalDeleteListSection.classList.remove('hidden');
    else modalDeleteListSection.classList.add('hidden');
  }

  const modalStudentDeleteList = document.getElementById('modalStudentDeleteList');
  if (modalStudentDeleteList && isAdmin) {
    modalStudentDeleteList.innerHTML = state.students.map(s => `
      <div class="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
        <div class="flex items-center space-x-1.5 min-w-0 pr-1">
          <span class="text-sm">${s.avatar || '🏓'}</span>
          <span class="font-bold text-slate-800 truncate ${s.equippedNameSkin || 'name-skin-none'}">${escapeHtml(s.name)}</span>
          <span class="text-[10px] text-slate-400 shrink-0">(${formatClassBadge(s) || '학급미지정'})</span>
        </div>
        <button onclick="deleteStudent('${s.id}')" class="bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-2.5 py-1 rounded-lg text-[10px] flex items-center space-x-1 transition-all shrink-0 shadow-xs">
          <i class="fa-solid fa-trash-can"></i>
          <span>삭제</span>
        </button>
      </div>
    `).join('');
  }

  renderStudentDirectory();
  renderMissionsView();
  renderMatchesView();
  renderRewardsList();
  renderStatsView();
}

function renderStudentDirectory() {
  const container = document.getElementById('groupedStudentList');
  if (!container) return;

  const searchInput = document.getElementById('directorySearchInput');
  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const filtered = state.students.filter(s => s.name.toLowerCase().includes(query));

  const totalBadge = document.getElementById('directoryTotalBadge');
  if (totalBadge) totalBadge.innerText = `${state.students.length}명`;

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">검색 결과가 없습니다.</p>`;
    renderClassIndividualProgress();
    return;
  }

  const groups = {};
  filtered.forEach(s => {
    let key = '기타 / 학년 미지정';
    if (s.grade && s.classNum) key = `${s.grade}학년 ${s.classNum}반`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  const isAdmin = state.role === 'admin';
  let html = '';

  Object.keys(groups).sort().forEach(groupKey => {
    const list = groups[groupKey];
    
    list.sort((a, b) => {
      const numA = parseInt(a.number) || 999;
      const numB = parseInt(b.number) || 999;
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name, 'ko');
    });

    const totalClassPoints = list.reduce((sum, s) => sum + (s.totalPoints || 0), 0);
    const avgPoints = list.length > 0 ? Math.round(totalClassPoints / list.length) : 0;
    
    let topStudent = list[0];
    list.forEach(s => {
      if ((s.totalPoints || 0) > (topStudent.totalPoints || 0)) topStudent = s;
    });

    let totalClassMissions = 0;
    let totalClassCompleted = 0;
    list.forEach(s => {
      if (s.missions) {
        totalClassMissions += s.missions.length;
        totalClassCompleted += s.missions.filter(m => m.completed).length;
      }
    });
    const classAvgCompletion = totalClassMissions > 0 ? Math.round((totalClassCompleted / totalClassMissions) * 100) : 0;

    const isCollapsed = !!collapsedClasses[groupKey];

    html += `
      <div class="bg-white/80 rounded-2xl border border-emerald-100 overflow-hidden shadow-xs">
        <div onclick="toggleClassAccordion('${escapeHtml(groupKey)}')" class="px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-xs font-bold text-emerald-950 flex justify-between items-center cursor-pointer select-none hover:bg-emerald-100 transition-all border-b border-emerald-100">
          <div class="flex items-center space-x-1.5 min-w-0">
            <i class="fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'} text-emerald-600 text-[10px]"></i>
            <span class="truncate font-extrabold">${escapeHtml(groupKey)}</span>
          </div>
          <div class="flex items-center space-x-1.5 shrink-0">
            <span class="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black">${list.length}명</span>
          </div>
        </div>

        <div class="px-3 py-1.5 bg-slate-50/90 text-[10px] border-b border-slate-100 grid grid-cols-3 gap-1 text-slate-600 font-semibold text-center">
          <div>평균: <span class="font-extrabold text-emerald-700">${avgPoints}P</span></div>
          <div class="truncate">👑 1위: <span class="font-extrabold text-slate-800">${escapeHtml(topStudent ? topStudent.name : '')}</span></div>
          <div>달성: <span class="font-extrabold text-teal-700">${classAvgCompletion}%</span></div>
        </div>

        <div class="${isCollapsed ? 'hidden' : 'p-1.5 space-y-1.5'}">
          ${list.map(s => {
            const cardSkinClass = s.equippedCardSkin || 'card-skin-none';
            const nameSkinClass = s.equippedNameSkin || 'name-skin-none';
            const auraClass = s.equippedAura || 'aura-none';
            const frameClass = s.equippedFrame || 'frame-none';

            return `
            <div onclick="switchActiveStudent('${s.id}')" class="flex justify-between items-center p-2 rounded-xl cursor-pointer text-xs transition-all ${cardSkinClass} ${
              s.id === state.activeStudentId ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:opacity-95'
            }">
              <div class="flex items-center space-x-2.5 min-w-0 pr-1">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 bg-emerald-50/80 ${frameClass} ${auraClass} shadow-2xs">
                  ${s.avatar || '🏓'}
                </div>
                <div class="min-w-0 flex flex-col justify-center">
                  <div class="flex items-center space-x-1 truncate">
                    <p class="truncate font-extrabold text-xs leading-tight ${nameSkinClass}">
                      ${s.number ? `${s.number}번 ` : ''}${escapeHtml(s.name)}${s.id === loggedInStudentId ? ' (나)' : ''}
                    </p>
                  </div>
                  <div>
                    <span class="inline-block mt-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-black truncate border ${
                      s.id === state.activeStudentId 
                        ? 'bg-emerald-800/90 text-amber-300 border-emerald-500/40' 
                        : 'bg-amber-100/90 text-amber-900 border-amber-200'
                    }">
                      ${s.equippedTitle || calculateLevelTitle(s.totalPoints || 0)}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-1.5 shrink-0">
                <span class="font-extrabold ${s.id === state.activeStudentId ? 'text-amber-300' : 'text-emerald-700'}">${s.totalPoints || 0} P</span>
                ${isAdmin ? `
                  <button onclick="event.stopPropagation(); deleteStudent('${s.id}')" class="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-all text-xs" title="부원 삭제">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  renderClassIndividualProgress();
}

function renderClassIndividualProgress() {
  const container = document.getElementById('classIndividualProgressContainer');
  if (!container) return;

  const activeStudent = getCurrentStudent();
  let activeGradeClass = '기타 / 학년 미지정';
  if (activeStudent && activeStudent.grade && activeStudent.classNum) {
    activeGradeClass = `${activeStudent.grade}학년 ${activeStudent.classNum}반`;
  }

  const classStudents = state.students.filter(s => {
    if (s.grade && s.classNum) {
      return `${s.grade}학년 ${s.classNum}반` === activeGradeClass;
    }
    return activeGradeClass === '기타 / 학년 미지정';
  });

  classStudents.sort((a, b) => (parseInt(a.number) || 999) - (parseInt(b.number) || 999));

  if (classStudents.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-slate-400 text-center py-2">소속 학급에 부원이 없습니다.</p>`;
    return;
  }

  let html = `<div class="text-[11px] font-bold text-emerald-800 mb-1 px-1 flex items-center justify-between">
                <span>📍 ${escapeHtml(activeGradeClass)} 부원 현황</span>
              </div>`;

  classStudents.forEach(s => {
    const missions = s.missions || [];
    const total = missions.length;
    const completed = missions.filter(m => m.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isActive = s.id === state.activeStudentId;

    const cardSkinClass = s.equippedCardSkin || 'card-skin-none';
    const nameSkinClass = s.equippedNameSkin || 'name-skin-none';
    const auraClass = s.equippedAura || 'aura-none';
    const frameClass = s.equippedFrame || 'frame-none';

    html += `
      <div onclick="switchActiveStudent('${s.id}')" class="p-2.5 rounded-2xl transition-all cursor-pointer ${cardSkinClass} ${
        isActive ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:opacity-95'
      }">
        <div class="flex justify-between items-center text-[11px] mb-1.5">
          <div class="flex items-center space-x-2 min-w-0 pr-1">
            <div class="w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 bg-emerald-50/80 ${frameClass} ${auraClass} shadow-2xs">
              ${s.avatar || '🏓'}
            </div>
            <span class="font-extrabold text-xs truncate ${nameSkinClass}">${s.number ? `${s.number}번 ` : ''}${escapeHtml(s.name)}</span>
            <span class="text-[9px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.2 rounded-md shrink-0 border border-amber-200">
              ${s.equippedTitle || calculateLevelTitle(s.totalPoints || 0)}
            </span>
          </div>
          <span class="font-black text-xs shrink-0 ${isActive ? 'text-amber-300' : 'text-emerald-700'}">${pct}% <span class="text-[9px] opacity-75">(${completed}/${total})</span></span>
        </div>
        <div class="w-full bg-black/20 rounded-full h-1.5 overflow-hidden p-0.5">
          <div class="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-300" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderMissionsView() {
  const student = getCurrentStudent();
  const missions = student ? (student.missions || []) : [];
  const isAdmin = state.role === 'admin';

  const searchInput = document.getElementById('missionSearchInput');
  const searchVal = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const filterSelect = document.getElementById('missionFilterStatus');
  const statusFilter = filterSelect ? filterSelect.value : 'all';

  let filtered = missions.filter(m => (m.category || 'personal') === activeTab);

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

  const personalCount = missions.filter(m => (m.category || 'personal') === 'personal' && (selectedWeek === 'all' || (m.week || 1) === selectedWeek)).length;
  const teamCount = missions.filter(m => m.category === 'team' && (selectedWeek === 'all' || (m.week || 1) === selectedWeek)).length;

  const pBadge = document.getElementById('personalBadge');
  const tBadge = document.getElementById('teamBadge');
  if (pBadge) pBadge.innerText = personalCount;
  if (tBadge) tBadge.innerText = teamCount;

  const listContainer = document.getElementById('missionList');
  if (!listContainer) return;

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center p-6 bg-white/50 rounded-3xl border border-dashed border-emerald-200 min-h-[180px]">
        <div class="text-3xl mb-2">🏓</div>
        <p class="font-bold text-slate-700 text-xs">해당 조건의 미션이 없습니다.</p>
        <p class="text-[11px] text-slate-400 mt-0.5">새 미션을 등록하거나 주차 필터를 변경해 보세요.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(mission => {
    const isPending = mission.pending && !mission.completed;
    const isDone = mission.completed;

    return `
    <div class="relative p-3.5 rounded-2xl transition-all shadow-xs overflow-hidden flex items-center justify-between ${
      isDone 
        ? 'border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50/90' 
        : isPending 
          ? 'border-2 border-amber-400 bg-amber-50/90 shadow-md ring-1 ring-amber-300' 
          : 'border border-slate-200 bg-white hover:border-emerald-300'
    }">
      
      <!-- High-Visibility Stamp Effect for Completed Missions -->
      ${isDone ? `
        <div class="absolute right-12 bottom-1 z-0 opacity-90 pointer-events-none stamp-effect border-2 border-rose-600 text-rose-600 rounded-xl px-2.5 py-0.5 text-[11px] font-black tracking-widest bg-white/90 shadow-sm flex items-center space-x-1">
          <span>💮</span>
          <span>선생님 승인 완료</span>
        </div>
      ` : ''}

      <div class="flex items-center space-x-3 flex-1 min-w-0 pr-2 relative z-10">
        <button onclick="handleMissionCheck('${mission.id}')" ${isReadOnly ? 'disabled' : ''} class="w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs ${
          isDone 
            ? 'bg-emerald-600 border-emerald-600 text-white' 
            : isPending 
              ? 'bg-amber-500 border-amber-500 text-white animate-pulse' 
              : 'border-slate-300 bg-slate-50 hover:border-emerald-500'
        }">
          <i class="fa-solid ${isDone ? 'fa-check text-sm' : isPending ? 'fa-hourglass-half text-xs animate-spin' : 'fa-check text-xs text-slate-300'}"></i>
        </button>

        <div class="min-w-0 flex-1">
          <div class="flex items-center space-x-1.5 mb-1 flex-wrap gap-y-1">
            <span class="bg-emerald-800 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0 shadow-2xs">[${mission.week || 1}주차]</span>
            <p class="font-black text-xs text-slate-800 truncate ${isDone ? 'line-through text-slate-500 opacity-90' : ''}">${escapeHtml(mission.title)}</p>
          </div>

          <div class="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span class="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">+${mission.points} P</span>
            <span class="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">${mission.difficulty || '보통'}</span>

            ${isPending ? `
              <span class="inline-flex items-center space-x-1 text-[10px] font-black text-amber-900 bg-amber-200 border border-amber-400 px-2 py-0.5 rounded-full animate-pulse shadow-2xs">
                <i class="fa-solid fa-clock text-[9px]"></i>
                <span>⏳ 선생님 승인 대기중</span>
              </span>
            ` : ''}

            ${isDone ? `
              <span class="inline-flex items-center space-x-1 text-[10px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full shadow-2xs">
                <span>💮 도장 완료</span>
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-1 shrink-0 relative z-10">
        ${isAdmin ? `
          <div class="flex flex-col space-y-0.5 mr-1">
            <button onclick="moveMission('${mission.id}', 'up')" class="w-6 h-5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 rounded flex items-center justify-center text-[10px] font-bold border border-slate-200 transition-colors" title="위로 이동">
              <i class="fa-solid fa-chevron-up"></i>
            </button>
            <button onclick="moveMission('${mission.id}', 'down')" class="w-6 h-5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 rounded flex items-center justify-center text-[10px] font-bold border border-slate-200 transition-colors" title="아래로 이동">
              <i class="fa-solid fa-chevron-down"></i>
            </button>
          </div>
        ` : ''}
        ${isAdmin && isPending ? `
          <button onclick="approvePendingMission('${student.id}', '${mission.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-md active:scale-95 transition-all">
            도장 찍기 💮
          </button>
        ` : ''}
        ${isAdmin ? `
          <button onclick="deleteMission('${mission.id}')" class="text-slate-300 hover:text-rose-500 p-1.5 text-xs transition-colors" title="미션 삭제">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `;
  }).join('');
}

function renderMatchesView() {
  const container = document.getElementById('classLeaderboardContainer');
  const historyList = document.getElementById('matchHistoryList');
  if (!container) return;

  const viewListBtn = document.getElementById('rankingViewListBtn');
  const viewGraphBtn = document.getElementById('rankingViewGraphBtn');

  if (rankingViewMode === 'list') {
    if (viewListBtn) viewListBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-black transition-all bg-white text-emerald-800 shadow-sm flex items-center justify-center space-x-1";
    if (viewGraphBtn) viewGraphBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-black transition-all text-slate-500 hover:text-slate-800 flex items-center justify-center space-x-1";
  } else {
    if (viewGraphBtn) viewGraphBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-black transition-all bg-white text-emerald-800 shadow-sm flex items-center justify-center space-x-1";
    if (viewListBtn) viewListBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-black transition-all text-slate-500 hover:text-slate-800 flex items-center justify-center space-x-1";
  }

  const groups = {};
  state.students.forEach(s => {
    let key = '기타 / 학년 미지정';
    if (s.grade && s.classNum) key = `${s.grade}학년 ${s.classNum}반`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ ...s });
  });

  let html = '';
  Object.keys(groups).sort().forEach(groupKey => {
    const list = groups[groupKey];
    list.sort((a, b) => {
      const totA = (a.wins || 0) + (a.losses || 0);
      const totB = (b.wins || 0) + (b.losses || 0);
      const rateA = totA > 0 ? (a.wins / totA) : 0;
      const rateB = totB > 0 ? (b.wins / totB) : 0;
      return rateB - rateA;
    });

    html += `
      <div class="bg-white/80 rounded-2xl border border-emerald-200 p-3.5 shadow-xs">
        <h4 class="font-black text-xs text-emerald-950 mb-2.5 pb-1 border-b border-emerald-100 flex justify-between">
          <span>🏫 ${escapeHtml(groupKey)}</span>
          <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">${list.length}명</span>
        </h4>
    `;

    if (rankingViewMode === 'list') {
      html += `<div class="space-y-1.5">`;
      list.forEach((s, idx) => {
        const tot = (s.wins || 0) + (s.losses || 0);
        const winRate = tot > 0 ? Math.round((s.wins / tot) * 100) : 0;
        html += `
          <div class="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 text-xs">
            <span class="font-bold text-slate-800 ${s.equippedNameSkin || 'name-skin-none'}">#${idx + 1} ${s.avatar || '🏓'} ${escapeHtml(s.name)}</span>
            <span class="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
              ${s.wins || 0}승 ${s.losses || 0}패 (${winRate}%)
            </span>
          </div>
        `;
      });
      html += `</div>`;
    } else {
      html += `<div class="space-y-2 pt-1">`;
      list.forEach((s, idx) => {
        const tot = (s.wins || 0) + (s.losses || 0);
        const winRate = tot > 0 ? Math.round((s.wins / tot) * 100) : 0;
        html += `
          <div>
            <div class="flex justify-between text-[11px] font-bold mb-0.5">
              <span class="text-slate-800 ${s.equippedNameSkin || 'name-skin-none'}">#${idx + 1} ${s.avatar || '🏓'} ${escapeHtml(s.name)}</span>
              <span class="text-emerald-700 font-black">${winRate}% (${s.wins || 0}승 ${s.losses || 0}패)</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" style="width: ${Math.max(5, winRate)}%"></div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;
  });
  container.innerHTML = html;

  if (historyList) {
    if (state.matchHistory.length === 0) {
      historyList.innerHTML = `<p class="text-[11px] text-slate-400 text-center py-2">아직 기록된 경기가 없습니다.</p>`;
    } else {
      historyList.innerHTML = state.matchHistory.map(m => `
        <div class="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
          <span class="font-bold text-slate-800">${escapeHtml(m.p1Name)} (${m.score1}) vs (${m.score2}) ${escapeHtml(m.p2Name)}</span>
          <div class="flex items-center space-x-1">
            <span class="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">🏆 ${escapeHtml(m.winnerName)}</span>
            ${state.role === 'admin' ? `
              <button onclick="deleteMatchRecord('${m.id}')" class="text-slate-300 hover:text-rose-500 p-1 text-xs transition-colors">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }
  }
}

function renderRewardsList() {
  const container = document.getElementById('rewardsList');
  if (!container) return;
  const student = getCurrentStudent();
  const pts = student ? (student.totalPoints || 0) : 0;
  const isAdmin = state.role === 'admin';

  if (!state.rewards || state.rewards.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">등록된 보상이 없습니다.</p>`;
  } else {
    container.innerHTML = state.rewards.map(r => `
      <div class="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
        <div>
          <p class="font-bold text-slate-800">${escapeHtml(r.title)}</p>
          <p class="text-amber-500 font-extrabold">${r.points} P 필요</p>
        </div>
        <div class="flex items-center space-x-1">
          <button onclick="redeemReward('${r.id}')" ${pts < r.points || isReadOnly ? 'disabled' : ''} class="bg-amber-400 hover:bg-amber-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-xs">
            교환하기 🎟️
          </button>
          ${isAdmin ? `
            <button onclick="deleteReward('${r.id}')" class="text-slate-300 hover:text-rose-500 p-1 text-xs">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  const redeemedContainer = document.getElementById('redeemedCouponsList');
  if (redeemedContainer) {
    const redeemed = student ? (student.redeemedRewards || []) : [];
    if (redeemed.length === 0) {
      redeemedContainer.innerHTML = `<p class="text-[11px] text-amber-800/70 text-center py-2">보관 중인 보상 쿠폰이 없습니다.</p>`;
    } else {
      redeemedContainer.innerHTML = redeemed.map((coupon, idx) => `
        <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200 text-xs shadow-xs">
          <div class="flex items-center space-x-2 min-w-0 pr-1">
            <span class="text-base shrink-0">${coupon.icon || '🎫'}</span>
            <div class="min-w-0">
              <p class="font-bold text-slate-800 truncate">${escapeHtml(coupon.title)}</p>
              <p class="text-[9px] text-slate-400">${coupon.date}</p>
            </div>
          </div>
          <button onclick="useCoupon(${idx})" ${isReadOnly ? 'disabled' : ''} class="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 shadow-xs">
            사용 완료
          </button>
        </div>
      `).join('');
    }
  }
}

function renderStatsView() {
  const student = getCurrentStudent();
  if (!student) return;

  const missions = student.missions || [];
  const completedCount = missions.filter(m => m.completed).length;
  const statCompletedCountEl = document.getElementById('statCompletedCount');
  if (statCompletedCountEl) statCompletedCountEl.innerText = `${completedCount}개`;

  let earned = 0;
  if (student.history) {
    student.history.forEach(h => {
      if (h.points > 0) earned += h.points;
    });
  }
  const statTotalEarnedPointsEl = document.getElementById('statTotalEarnedPoints');
  if (statTotalEarnedPointsEl) statTotalEarnedPointsEl.innerText = `${earned} P`;

  if (student.skills) {
    const fhRange = document.getElementById('skillForehandRange');
    const fhVal = document.getElementById('skillForehandVal');
    if (fhRange) fhRange.value = student.skills.forehand || 3;
    if (fhVal) fhVal.innerText = `${student.skills.forehand || 3}점`;

    const bhRange = document.getElementById('skillBackhandRange');
    const bhVal = document.getElementById('skillBackhandVal');
    if (bhRange) bhRange.value = student.skills.backhand || 3;
    if (bhVal) bhVal.innerText = `${student.skills.backhand || 3}점`;

    const svRange = document.getElementById('skillServeRange');
    const svVal = document.getElementById('skillServeVal');
    if (svRange) svRange.value = student.skills.serve || 3;
    if (svVal) svVal.innerText = `${student.skills.serve || 3}점`;

    const mnRange = document.getElementById('skillMannerRange');
    const mnVal = document.getElementById('skillMannerVal');
    if (mnRange) mnRange.value = student.skills.manner || 5;
    if (mnVal) mnVal.innerText = `${student.skills.manner || 5}점`;
  }

  const historyList = document.getElementById('historyLogList');
  if (historyList) {
    if (!student.history || student.history.length === 0) {
      historyList.innerHTML = `<p class="text-slate-400 text-center py-4 text-xs">아직 달성한 활동 기록이 없습니다.</p>`;
    } else {
      historyList.innerHTML = student.history.slice(0, 15).map((h, idx) => `
        <div class="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
          <div class="min-w-0 pr-2">
            <p class="font-bold text-slate-800 truncate">${escapeHtml(h.title)}</p>
            <p class="text-[10px] text-slate-400">${h.date}</p>
          </div>
          <div class="flex items-center space-x-1.5 shrink-0">
            <span class="font-extrabold text-xs ${h.points >= 0 ? 'text-emerald-600' : 'text-rose-500'}">
              ${h.points >= 0 ? '+' : ''}${h.points} P
            </span>
            ${state.role === 'admin' ? `
              <button onclick="deleteTimelineLog(${idx})" class="text-slate-300 hover:text-rose-500 p-1 text-xs transition-colors" title="기록 삭제">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }
  }
}
