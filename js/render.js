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
  const pBtn = document.getElementById('tabPersonalBtn') || document.getElementById('personalTabBtn');
  const tBtn = document.getElementById('tabTeamBtn') || document.getElementById('teamTabBtn');
  if (pBtn && tBtn) {
    if (c === 'personal') {
      pBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center space-x-1 shadow-sm bg-white text-emerald-800";
      tBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center space-x-1 text-slate-500 hover:text-slate-700";
    } else {
      tBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center space-x-1 shadow-sm bg-white text-emerald-800";
      pBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center space-x-1 text-slate-500 hover:text-slate-700";
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

function toggleTopGroupAccordion(topKey) {
  expandedTopGroups[topKey] = !expandedTopGroups[topKey];
  renderStudentDirectory();
}

function toggleSubGroupAccordion(subKey) {
  expandedSubGroups[subKey] = !expandedSubGroups[subKey];
  renderStudentDirectory();
}

function toggleRankingTopGroup(topKey) {
  expandedRankingTopGroups[topKey] = !expandedRankingTopGroups[topKey];
  renderMatchesView();
}

function toggleRankingSubGroup(subKey) {
  expandedRankingSubGroups[subKey] = !expandedRankingSubGroups[subKey];
  renderMatchesView();
}

function toggleClassAccordion(groupKey) {
  toggleTopGroupAccordion(groupKey);
}

function toggleRankingClassAccordion(groupKey) {
  toggleRankingTopGroup(groupKey);
}

function openLevelGuideModal() {
  const student = getCurrentStudent();
  const points = student ? (student.totalPoints || 0) : 0;
  const currentTitle = calculateLevelTitle(points);

  const container = document.getElementById('levelGuideListContainer');
  const summaryEl = document.getElementById('levelGuideUserSummary');

  if (summaryEl) {
    const guideList = typeof GRADE_LEVEL_GUIDE !== 'undefined' ? GRADE_LEVEL_GUIDE : [
      { level: 1, title: '🌱 탁구 입문자', min: 0, max: 49, desc: '기본 자세 및 라켓 잡는 법 익히기 단계', color: 'text-slate-700' },
      { level: 2, title: '🏓 핑퐁 아마추어', min: 50, max: 99, desc: '기본 랠리 10회 이상 지속 가능', color: 'text-emerald-700' },
      { level: 3, title: '⭐ 스핀 루키', min: 100, max: 199, desc: '정확한 서브 및 백핸드 리턴 완성', color: 'text-amber-600' },
      { level: 4, title: '⚡ 드라이브 스페셜리스트', min: 200, max: 349, desc: '회전 공 공격 및 풋워크 습득', color: 'text-sky-600' },
      { level: 5, title: '🔥 스매시 마스터', min: 350, max: 499, desc: '강력한 스매싱 결정을 내리는 에이스', color: 'text-orange-600' },
      { level: 6, title: '🛡️ 철벽 커트 에이스', min: 500, max: 749, desc: '다양한 회전 커트와 방어 수비 달인', color: 'text-indigo-600' },
      { level: 7, title: '👑 핑퐁 챔피언', min: 750, max: 999, desc: '학급 토너먼트 상위권의 실력자', color: 'text-purple-600' },
      { level: 8, title: '🌟 탁구의 신', min: 1000, max: Infinity, desc: '탁구 기술과 매너를 모두 정복한 전설', color: 'text-rose-600' }
    ];

    const nextGrade = guideList.find(g => g.min > points);
    const ptsToNext = nextGrade ? nextGrade.min - points : 0;

    summaryEl.innerHTML = `
      <div class="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-sm mb-3">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-semibold text-emerald-100">${student ? escapeHtml(student.name) : '내'} 현재 점수</span>
          <span class="text-base font-black text-amber-300">${points} P</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm font-black">${currentTitle}</span>
          ${nextGrade ? `<span class="text-[11px] bg-white/20 px-2 py-0.5 rounded-full text-emerald-100 font-bold">다음 등급까지 <b class="text-amber-300">${ptsToNext}P</b></span>` : `<span class="text-[11px] text-amber-300 font-black">최고 등급 달성! 🎉</span>`}
        </div>
      </div>
    `;

    if (container) {
      container.innerHTML = guideList.map(g => {
        const isCurrent = points >= g.min && (g.max === Infinity || points <= g.max);
        return `
          <div class="p-3 rounded-2xl border transition-all ${
            isCurrent 
              ? 'border-2 border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-300/60 scale-[1.02]' 
              : 'bg-slate-50 border-slate-200'
          }">
            <div class="flex justify-between items-center mb-0.5">
              <p class="font-extrabold text-xs ${g.color || 'text-slate-800'} flex items-center space-x-1.5">
                <span>${g.title}</span>
                ${isCurrent ? `<span class="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-md font-black shadow-2xs">📍 현재 등급</span>` : ''}
              </p>
              <span class="text-[10px] font-black text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                ${g.max === Infinity ? `${g.min} P 이상` : `${g.min} ~ ${g.max} P`}
              </span>
            </div>
            <p class="text-[10px] text-slate-500 mt-1">${g.desc}</p>
          </div>
        `;
      }).join('');
    }
  }

  openModal('levelGuideModal');
}

function openTimetableModal() {
  openModal('timetableModal');
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

  const timetableBtn = document.getElementById('timetableBtn');
  if (timetableBtn) {
    if (isAdmin) timetableBtn.classList.remove('hidden');
    else timetableBtn.classList.add('hidden');
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

  if (typeof renderGroupButtons === 'function') renderGroupButtons();

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
    const titleText = student.equippedTitle || calculateLevelTitle(student.totalPoints || 0);
    headerTitleBadge.innerHTML = `<span>${titleText}</span><i class="fa-solid fa-circle-info text-[9px] opacity-90"></i>`;
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

function renderStudentCardsList(list, isAdmin, showClassBadge = false) {
  return list.map(s => {
    const cardSkinClass = s.equippedCardSkin || 'card-skin-none';
    const nameSkinClass = s.equippedNameSkin || 'name-skin-none';
    const auraClass = s.equippedAura || 'aura-none';
    const frameClass = s.equippedFrame || 'frame-none';

    const studentNumLabel = showClassBadge
      ? (s.classNum ? `${s.classNum}반 ${s.number ? s.number + '번 ' : ''}` : (s.number ? `${s.number}번 ` : ''))
      : (s.number ? `${s.number}번 ` : '');

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
                ${studentNumLabel}${escapeHtml(s.name)}${s.id === loggedInStudentId ? ' (나)' : ''}
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
  }).join('');
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

  const tree = buildHierarchicalGroups(filtered);
  const isAdmin = state.role === 'admin';
  let html = '';

  Object.keys(tree).sort(compareGroupKeys).forEach(topKey => {
    const groupNode = tree[topKey];

    if (groupNode.isDirect) {
      // 1학년 1반 (단독 학급)
      const list = groupNode.students;
      list.sort((a, b) => (parseInt(a.number) || 999) - (parseInt(b.number) || 999) || a.name.localeCompare(b.name, 'ko'));

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
      const isExpanded = !!expandedTopGroups[topKey];

      html += `
        <div class="bg-white/90 rounded-2xl border border-emerald-200 overflow-hidden shadow-xs">
          <div onclick="toggleTopGroupAccordion('${escapeHtml(topKey)}')" class="px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-xs font-bold text-emerald-950 flex justify-between items-center cursor-pointer select-none hover:bg-emerald-100 transition-all border-b border-emerald-100">
            <div class="flex items-center space-x-1.5 min-w-0">
              <i class="fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-emerald-600 text-[10px] transition-transform"></i>
              <span class="truncate font-extrabold">🏫 ${escapeHtml(topKey)}</span>
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

          <div class="${isExpanded ? 'p-1.5 space-y-1.5' : 'hidden'}">
            ${renderStudentCardsList(list, isAdmin, false)}
          </div>
        </div>
      `;
    } else {
      // 2학년, 3학년 통합 대그룹 (안에 2학년 1반, 2반... 서브 아코디언 포함)
      const allGradeStudents = groupNode.students;
      const totalGradePoints = allGradeStudents.reduce((sum, s) => sum + (s.totalPoints || 0), 0);
      const avgGradePoints = allGradeStudents.length > 0 ? Math.round(totalGradePoints / allGradeStudents.length) : 0;
      let topGradeStudent = allGradeStudents[0];
      allGradeStudents.forEach(s => {
        if ((s.totalPoints || 0) > (topGradeStudent.totalPoints || 0)) topGradeStudent = s;
      });

      const isTopExpanded = !!expandedTopGroups[topKey];
      const subKeys = Object.keys(groupNode.subGroups).sort(compareSubGroupKeys);

      html += `
        <div class="bg-white/95 rounded-2xl border-2 border-indigo-200 overflow-hidden shadow-xs">
          <!-- 1단계: 학년 통합 대그룹 헤더 -->
          <div onclick="toggleTopGroupAccordion('${escapeHtml(topKey)}')" class="px-3.5 py-2.5 bg-gradient-to-r from-indigo-50 via-slate-50 to-teal-50 text-xs font-black text-indigo-950 flex justify-between items-center cursor-pointer select-none hover:bg-indigo-100 transition-all border-b border-indigo-100">
            <div class="flex items-center space-x-2 min-w-0">
              <i class="fa-solid ${isTopExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-indigo-600 text-[11px] transition-transform"></i>
              <span class="truncate font-black text-xs">🏛️ ${escapeHtml(topKey)} 전체</span>
              <span class="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-md font-extrabold">${subKeys.length}개 반</span>
            </div>
            <div class="flex items-center space-x-1.5 shrink-0">
              <span class="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black shadow-2xs">총 ${allGradeStudents.length}명</span>
            </div>
          </div>

          <div class="px-3 py-1.5 bg-indigo-50/60 text-[10px] border-b border-indigo-100/80 flex justify-between items-center text-slate-700 font-semibold">
            <div>학년 평균: <span class="font-extrabold text-indigo-700">${avgGradePoints}P</span></div>
            <div class="truncate">👑 학년 1위: <span class="font-extrabold text-slate-900">${escapeHtml(topGradeStudent ? topGradeStudent.name : '')}</span></div>
          </div>

          <!-- 2단계: 학년 내부 각 반(2학년 1반, 2반...) 서브 아코디언들 -->
          <div class="${isTopExpanded ? 'p-2 space-y-2 bg-slate-50/60' : 'hidden'}">
            ${subKeys.map(subKey => {
              const subObj = groupNode.subGroups[subKey];
              const subList = subObj.students;
              subList.sort((a, b) => (parseInt(a.number) || 999) - (parseInt(b.number) || 999) || a.name.localeCompare(b.name, 'ko'));

              const totalSubPoints = subList.reduce((sum, s) => sum + (s.totalPoints || 0), 0);
              const avgSubPoints = subList.length > 0 ? Math.round(totalSubPoints / subList.length) : 0;
              let topSubStudent = subList[0];
              subList.forEach(s => {
                if ((s.totalPoints || 0) > (topSubStudent.totalPoints || 0)) topSubStudent = s;
              });

              let totalSubMissions = 0;
              let totalSubCompleted = 0;
              subList.forEach(s => {
                if (s.missions) {
                  totalSubMissions += s.missions.length;
                  totalSubCompleted += s.missions.filter(m => m.completed).length;
                }
              });
              const subAvgCompletion = totalSubMissions > 0 ? Math.round((totalSubCompleted / totalSubMissions) * 100) : 0;
              const isSubExpanded = !!expandedSubGroups[subKey];

              return `
                <div class="bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-2xs">
                  <div onclick="toggleSubGroupAccordion('${escapeHtml(subKey)}')" class="px-3 py-1.5 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 text-[11px] font-extrabold text-emerald-950 flex justify-between items-center cursor-pointer select-none hover:bg-emerald-100 transition-all border-b border-emerald-100">
                    <div class="flex items-center space-x-1.5 min-w-0">
                      <i class="fa-solid ${isSubExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-emerald-600 text-[9px] transition-transform"></i>
                      <span class="truncate">🏫 ${escapeHtml(subKey)}</span>
                    </div>
                    <div class="flex items-center space-x-1.5 shrink-0">
                      <span class="text-[9px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">${subList.length}명</span>
                    </div>
                  </div>

                  <div class="px-2.5 py-1 bg-slate-50/80 text-[9px] border-b border-slate-100 grid grid-cols-3 gap-1 text-slate-600 text-center font-medium">
                    <div>평균: <span class="font-bold text-emerald-700">${avgSubPoints}P</span></div>
                    <div class="truncate">1위: <span class="font-bold text-slate-800">${escapeHtml(topSubStudent ? topSubStudent.name : '')}</span></div>
                    <div>달성: <span class="font-bold text-teal-700">${subAvgCompletion}%</span></div>
                  </div>

                  <div class="${isSubExpanded ? 'p-1.5 space-y-1.5' : 'hidden'}">
                    ${renderStudentCardsList(subList, isAdmin, true)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html;
  renderClassIndividualProgress();
}

function renderClassIndividualProgress() {
  const container = document.getElementById('classIndividualProgressContainer');
  if (!container) return;

  const activeStudent = getCurrentStudent();
  const activeGroupKey = getStudentGroupKey(activeStudent);

  const classStudents = state.students.filter(s => getStudentGroupKey(s) === activeGroupKey);

  classStudents.sort((a, b) => {
    const classA = parseInt(a.classNum) || 999;
    const classB = parseInt(b.classNum) || 999;
    if (classA !== classB) return classA - classB;
    const numA = parseInt(a.number) || 999;
    const numB = parseInt(b.number) || 999;
    if (numA !== numB) return numA - numB;
    return a.name.localeCompare(b.name, 'ko');
  });

  if (classStudents.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-slate-400 text-center py-2">소속 학급/학년에 부원이 없습니다.</p>`;
    return;
  }

  let html = `<div class="text-[11px] font-bold text-emerald-800 mb-1 px-1 flex items-center justify-between">
                <span>📍 ${escapeHtml(activeGroupKey)} 부원 현황</span>
                <span class="text-[10px] text-slate-400 font-normal">총 ${classStudents.length}명</span>
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

    const studentNumLabel = activeGroupKey === '1학년 1반'
      ? (s.number ? `${s.number}번 ` : '')
      : (s.classNum ? `${s.classNum}반 ${s.number ? s.number + '번 ' : ''}` : (s.number ? `${s.number}번 ` : ''));

    html += `
      <div onclick="switchActiveStudent('${s.id}')" class="p-2.5 rounded-2xl transition-all cursor-pointer ${cardSkinClass} ${
        isActive ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:opacity-95'
      }">
        <div class="flex justify-between items-center text-[11px] mb-1.5">
          <div class="flex items-center space-x-2 min-w-0 pr-1">
            <div class="w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 bg-emerald-50/80 ${frameClass} ${auraClass} shadow-2xs">
              ${s.avatar || '🏓'}
            </div>
            <span class="font-extrabold text-xs truncate ${nameSkinClass}">${studentNumLabel}${escapeHtml(s.name)}</span>
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

  const pBtn = document.getElementById('tabPersonalBtn') || document.getElementById('personalTabBtn');
  const tBtn = document.getElementById('tabTeamBtn') || document.getElementById('teamTabBtn');
  if (pBtn && tBtn) {
    if (activeTab === 'personal') {
      pBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center space-x-1 shadow-sm bg-white text-emerald-800";
      tBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center space-x-1 text-slate-500 hover:text-slate-700";
    } else {
      tBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center space-x-1 shadow-sm bg-white text-emerald-800";
      pBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center space-x-1 text-slate-500 hover:text-slate-700";
    }
  }

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
    const isTeacherCheck = !!mission.requiresTeacherCheck;

    let cardBgClass = 'border border-slate-200 bg-white hover:border-emerald-300';
    if (isDone) {
      cardBgClass = 'border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50/90';
    } else if (isPending) {
      cardBgClass = 'border-2 border-amber-400 bg-amber-50/90 shadow-md ring-1 ring-amber-300';
    } else if (isTeacherCheck) {
      // 👑 교사 직접 확인 미션 전용 차별화된 보라/인디고 색상
      cardBgClass = 'border-2 border-indigo-400 bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-indigo-50/40 shadow-sm ring-1 ring-indigo-200/80 hover:border-indigo-500';
    }

    return `
    <div class="relative p-3.5 rounded-2xl transition-all shadow-xs overflow-hidden flex items-center justify-between ${cardBgClass}">
      
      <!-- High-Visibility Stamp Effect for Completed Missions (Frontmost Layer & Centered) -->
      ${isDone ? `
        <div class="absolute left-1/2 top-1/2 z-30 opacity-95 pointer-events-none stamp-effect border-2 border-rose-600 text-rose-600 rounded-2xl px-3.5 py-1 text-[11px] sm:text-xs font-black tracking-widest bg-white/95 shadow-md flex items-center space-x-1.5 whitespace-nowrap">
          <span class="text-sm">💮</span>
          <span>선생님 승인 완료</span>
        </div>
      ` : ''}

      <div class="flex items-center space-x-3 flex-1 min-w-0 pr-2 relative z-10">
        <button onclick="handleMissionCheck('${mission.id}')" ${isReadOnly ? 'disabled' : ''} class="w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs ${
          isDone 
            ? 'bg-emerald-600 border-emerald-600 text-white' 
            : isPending 
              ? 'bg-amber-500 border-amber-500 text-white animate-pulse' 
              : isTeacherCheck 
                ? 'border-indigo-300 bg-indigo-50/70 hover:border-indigo-500 text-indigo-700' 
                : 'border-slate-300 bg-slate-50 hover:border-emerald-500'
        }" title="미션 체크/승인요청">
          <i class="fa-solid ${isDone ? 'fa-check text-sm' : isPending ? 'fa-hourglass-half text-xs animate-spin' : isTeacherCheck ? 'fa-eye text-xs text-indigo-400' : 'fa-check text-xs text-slate-300'}"></i>
        </button>

        <div onclick="openMissionDetailModal('${mission.id}')" class="min-w-0 flex-1 cursor-pointer group select-none">
          <div class="flex items-center space-x-1.5 mb-1 flex-wrap gap-y-1">
            <span class="bg-emerald-800 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0 shadow-2xs">[${mission.week || 1}주차]</span>
            ${isTeacherCheck ? `
              <span class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0 shadow-2xs flex items-center space-x-0.5">
                <span>👀</span>
                <span>교사 직접 확인</span>
              </span>
            ` : ''}
            <p class="font-black text-xs sm:text-sm text-slate-800 truncate group-hover:text-emerald-700 transition-colors ${isDone ? 'line-through text-slate-500 opacity-90' : ''}">
              ${escapeHtml(mission.title)}
            </p>
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

      <div class="flex items-center space-x-1.5 shrink-0 relative z-10">
        <!-- 설명 보기 / 선생님 미션 수정 버튼 -->
        <button onclick="openMissionDetailModal('${mission.id}')" class="px-2.5 sm:px-3 py-1.5 rounded-xl ${
          isAdmin 
            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-950 border border-indigo-300' 
            : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-900 border border-emerald-300'
        } font-extrabold text-[11px] sm:text-xs shadow-2xs flex items-center space-x-1 transition-all active:scale-95 hover:shadow-xs" title="${isAdmin ? '선생님 모드: 미션 제목, 배점, 설명 등 수정하기' : '미션 설명 및 수행 팁 보기'}">
          <span class="text-sm">${isAdmin ? '✏️' : '💡'}</span>
          <span class="font-black">${isAdmin ? '미션 수정' : '설명 보기'}</span>
        </button>

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

function renderRankingRows(list, showClassBadge = false) {
  if (rankingViewMode === 'list') {
    return `<div class="space-y-1.5">` + list.map((s, idx) => {
      const tot = (s.wins || 0) + (s.losses || 0);
      const winRate = tot > 0 ? Math.round((s.wins / tot) * 100) : 0;
      const studentLabel = showClassBadge
        ? (s.classNum ? `${s.classNum}반 ${s.number ? s.number + '번 ' : ''}${escapeHtml(s.name)}` : (s.number ? `${s.number}번 ${escapeHtml(s.name)}` : escapeHtml(s.name)))
        : (s.number ? `${s.number}번 ${escapeHtml(s.name)}` : escapeHtml(s.name));

      return `
        <div class="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 text-xs">
          <span class="font-bold text-slate-800 ${s.equippedNameSkin || 'name-skin-none'}">#${idx + 1} ${s.avatar || '🏓'} ${studentLabel}</span>
          <span class="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
            ${s.wins || 0}승 ${s.losses || 0}패 (${winRate}%)
          </span>
        </div>
      `;
    }).join('') + `</div>`;
  } else {
    return `<div class="space-y-2 pt-1">` + list.map((s, idx) => {
      const tot = (s.wins || 0) + (s.losses || 0);
      const winRate = tot > 0 ? Math.round((s.wins / tot) * 100) : 0;
      const studentLabel = showClassBadge
        ? (s.classNum ? `${s.classNum}반 ${s.number ? s.number + '번 ' : ''}${escapeHtml(s.name)}` : (s.number ? `${s.number}번 ${escapeHtml(s.name)}` : escapeHtml(s.name)))
        : (s.number ? `${s.number}번 ${escapeHtml(s.name)}` : escapeHtml(s.name));

      return `
        <div>
          <div class="flex justify-between text-[11px] font-bold mb-0.5">
            <span class="text-slate-800 ${s.equippedNameSkin || 'name-skin-none'}">#${idx + 1} ${s.avatar || '🏓'} ${studentLabel}</span>
            <span class="text-emerald-700 font-black">${winRate}% (${s.wins || 0}승 ${s.losses || 0}패)</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" style="width: ${Math.max(5, winRate)}%"></div>
          </div>
        </div>
      `;
    }).join('') + `</div>`;
  }
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

  const tree = buildHierarchicalGroups(state.students);
  let html = '';

  Object.keys(tree).sort(compareGroupKeys).forEach(topKey => {
    const groupNode = tree[topKey];

    if (groupNode.isDirect) {
      // 1학년 1반 (단독 랭킹 아코디언)
      const list = [...groupNode.students];
      list.sort((a, b) => {
        const totA = (a.wins || 0) + (a.losses || 0);
        const totB = (b.wins || 0) + (b.losses || 0);
        const rateA = totA > 0 ? (a.wins / totA) : 0;
        const rateB = totB > 0 ? (b.wins / totB) : 0;
        if (rateA !== rateB) return rateB - rateA;
        return (b.wins || 0) - (a.wins || 0);
      });

      const isExpanded = !!expandedRankingTopGroups[topKey];
      const topStudent = list[0];
      const topTot = topStudent ? (topStudent.wins || 0) + (topStudent.losses || 0) : 0;
      const topWinRate = topTot > 0 ? Math.round((topStudent.wins / topTot) * 100) : 0;

      html += `
        <div class="bg-white/90 rounded-2xl border border-emerald-200 overflow-hidden shadow-xs">
          <div onclick="toggleRankingTopGroup('${escapeHtml(topKey)}')" class="px-3.5 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-xs font-black text-emerald-950 flex justify-between items-center cursor-pointer select-none hover:bg-emerald-100 transition-all border-b border-emerald-100">
            <div class="flex items-center space-x-2 min-w-0">
              <i class="fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-emerald-600 text-[11px] transition-transform"></i>
              <span class="truncate">🏫 ${escapeHtml(topKey)}</span>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
              ${topStudent ? `
                <span class="text-[10px] text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg font-bold">
                  👑 1위: ${escapeHtml(topStudent.name)} (${topWinRate}%)
                </span>
              ` : ''}
              <span class="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black">${list.length}명</span>
            </div>
          </div>

          <div class="${isExpanded ? 'p-3' : 'hidden'}">
            ${renderRankingRows(list, false)}
          </div>
        </div>
      `;
    } else {
      // 2학년, 3학년 통합 랭킹 대그룹 (안에 2학년 1반, 2반... 서브 학급 랭킹 포함)
      const allGradeStudents = [...groupNode.students];
      allGradeStudents.sort((a, b) => {
        const totA = (a.wins || 0) + (a.losses || 0);
        const totB = (b.wins || 0) + (b.losses || 0);
        const rateA = totA > 0 ? (a.wins / totA) : 0;
        const rateB = totB > 0 ? (b.wins / totB) : 0;
        if (rateA !== rateB) return rateB - rateA;
        return (b.wins || 0) - (a.wins || 0);
      });

      const topGradeStudent = allGradeStudents[0];
      const topGradeTot = topGradeStudent ? (topGradeStudent.wins || 0) + (topGradeStudent.losses || 0) : 0;
      const topGradeWinRate = topGradeTot > 0 ? Math.round((topGradeStudent.wins / topGradeTot) * 100) : 0;
      const isTopExpanded = !!expandedRankingTopGroups[topKey];
      const subKeys = Object.keys(groupNode.subGroups).sort(compareSubGroupKeys);

      html += `
        <div class="bg-white/95 rounded-2xl border-2 border-indigo-200 overflow-hidden shadow-xs">
          <!-- 1단계: 학년 전체 랭킹 헤더 -->
          <div onclick="toggleRankingTopGroup('${escapeHtml(topKey)}')" class="px-3.5 py-2.5 bg-gradient-to-r from-indigo-50 via-slate-50 to-teal-50 text-xs font-black text-indigo-950 flex justify-between items-center cursor-pointer select-none hover:bg-indigo-100 transition-all border-b border-indigo-100">
            <div class="flex items-center space-x-2 min-w-0">
              <i class="fa-solid ${isTopExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-indigo-600 text-[11px] transition-transform"></i>
              <span class="truncate font-black text-xs">🏛️ ${escapeHtml(topKey)} 랭킹</span>
              <span class="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-md font-extrabold">${subKeys.length}개 반</span>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
              ${topGradeStudent ? `
                <span class="text-[10px] text-indigo-950 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg font-black">
                  👑 학년 1위: ${escapeHtml(topGradeStudent.name)} (${topGradeWinRate}%)
                </span>
              ` : ''}
              <span class="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black shadow-2xs">총 ${allGradeStudents.length}명</span>
            </div>
          </div>

          <!-- 2단계: 학년 내 각 반(2학년 1반, 2반...) 서브 랭킹 아코디언들 -->
          <div class="${isTopExpanded ? 'p-2.5 space-y-2 bg-slate-50/60' : 'hidden'}">
            ${subKeys.map(subKey => {
              const subObj = groupNode.subGroups[subKey];
              const subList = [...subObj.students];
              subList.sort((a, b) => {
                const totA = (a.wins || 0) + (a.losses || 0);
                const totB = (b.wins || 0) + (b.losses || 0);
                const rateA = totA > 0 ? (a.wins / totA) : 0;
                const rateB = totB > 0 ? (b.wins / totB) : 0;
                if (rateA !== rateB) return rateB - rateA;
                return (b.wins || 0) - (a.wins || 0);
              });

              const topSubStudent = subList[0];
              const topSubTot = topSubStudent ? (topSubStudent.wins || 0) + (topSubStudent.losses || 0) : 0;
              const topSubWinRate = topSubTot > 0 ? Math.round((topSubStudent.wins / topSubTot) * 100) : 0;
              const isSubExpanded = !!expandedRankingSubGroups[subKey];

              return `
                <div class="bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-2xs">
                  <div onclick="toggleRankingSubGroup('${escapeHtml(subKey)}')" class="px-3 py-2 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 text-[11px] font-extrabold text-emerald-950 flex justify-between items-center cursor-pointer select-none hover:bg-emerald-100 transition-all border-b border-emerald-100">
                    <div class="flex items-center space-x-1.5 min-w-0">
                      <i class="fa-solid ${isSubExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-emerald-600 text-[9px] transition-transform"></i>
                      <span class="truncate font-black">🏫 ${escapeHtml(subKey)}</span>
                    </div>
                    <div class="flex items-center space-x-1.5 shrink-0">
                      ${topSubStudent ? `
                        <span class="text-[9px] text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded-md font-bold">
                          1위: ${escapeHtml(topSubStudent.name)} (${topSubWinRate}%)
                        </span>
                      ` : ''}
                      <span class="text-[9px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">${subList.length}명</span>
                    </div>
                  </div>

                  <div class="${isSubExpanded ? 'p-2.5' : 'hidden'}">
                    ${renderRankingRows(subList, false)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
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
