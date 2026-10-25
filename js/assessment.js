/* TABLE TENNIS & BADMINTON PERFORMANCE ASSESSMENT (수행평가 관리 및 채점 모듈) */

let assessmentCurrentTab = 'form'; // 'form' | 'rubric' | 'overview'
let assessSportCurrentView = 'tt'; // 'tt' | 'bm' | 'all'
let isOverviewInlineMode = false;
let isRubricEditMode = false;

function switchAssessSportView(mode = 'tt') {
  assessSportCurrentView = mode;
  const ttSection = document.getElementById('assessSectionTableTennis');
  const bmSection = document.getElementById('assessSectionBadminton');

  const ttBtn = document.getElementById('assessSportTabTtBtn');
  const bmBtn = document.getElementById('assessSportTabBmBtn');
  const allBtn = document.getElementById('assessSportTabAllBtn');

  if (ttSection) ttSection.classList.toggle('hidden', mode === 'bm');
  if (bmSection) bmSection.classList.toggle('hidden', mode === 'tt');

  const activeTtClass = 'py-2 rounded-lg font-black text-xs transition-all bg-emerald-600 text-white shadow-xs flex items-center justify-center space-x-1 cursor-pointer';
  const activeBmClass = 'py-2 rounded-lg font-black text-xs transition-all bg-sky-600 text-white shadow-xs flex items-center justify-center space-x-1 cursor-pointer';
  const activeAllClass = 'py-2 rounded-lg font-black text-xs transition-all bg-indigo-600 text-white shadow-xs flex items-center justify-center space-x-1 cursor-pointer';
  const inactiveClass = 'py-2 rounded-lg font-extrabold text-xs transition-all text-slate-600 hover:bg-slate-200 flex items-center justify-center space-x-1 cursor-pointer';

  if (ttBtn) ttBtn.className = mode === 'tt' ? activeTtClass : inactiveClass;
  if (bmBtn) bmBtn.className = mode === 'bm' ? activeBmClass : inactiveClass;
  if (allBtn) allBtn.className = mode === 'all' ? activeAllClass : inactiveClass;
}

function openAssessmentModal(initialTab = 'form') {
  const isAdmin = state.role === 'admin';
  const modeBadge = document.getElementById('assessmentModeBadge');
  const teacherActionBox = document.getElementById('assessmentTeacherActionBox');
  const studentNoticeBox = document.getElementById('assessmentStudentNoticeBox');
  const commentInput = document.getElementById('assessmentCommentInput');
  const studentSelect = document.getElementById('assessmentStudentSelect');
  const classSelect = document.getElementById('assessmentClassSelect');
  const rubricTeacherControls = document.getElementById('rubricTeacherConfigControls');

  if (modeBadge) {
    if (isAdmin) {
      modeBadge.className = 'text-xs bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-lg';
      modeBadge.innerText = '👑 선생님 채점 모드';
    } else {
      modeBadge.className = 'text-xs bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-lg';
      modeBadge.innerText = '👤 부원 성적표 열람';
    }
  }

  if (teacherActionBox) {
    if (isAdmin) teacherActionBox.classList.remove('hidden');
    else teacherActionBox.classList.add('hidden');
  }

  if (studentNoticeBox) {
    if (!isAdmin) studentNoticeBox.classList.remove('hidden');
    else studentNoticeBox.classList.add('hidden');
  }

  if (rubricTeacherControls) {
    if (isAdmin) rubricTeacherControls.classList.remove('hidden');
    else rubricTeacherControls.classList.add('hidden');
  }

  if (!isAdmin && isRubricEditMode) {
    isRubricEditMode = false;
    const editorPanel = document.getElementById('rubricConfigEditorPanel');
    if (editorPanel) editorPanel.classList.add('hidden');
  }

  if (commentInput) {
    commentInput.readOnly = !isAdmin;
  }

  // Populate Class Selectors
  populateAssessmentClassOptions();

  // Load current student or active student
  const activeStudent = getCurrentStudent();
  if (activeStudent) {
    const classKey = getStudentExactClassKey(activeStudent);
    if (classSelect) classSelect.value = classKey;
    populateAssessmentStudentOptions(classKey);
    if (studentSelect) studentSelect.value = activeStudent.id;
    loadStudentAssessmentData(activeStudent.id);
  }

  // Render dynamic rubric tables
  renderAssessmentRubricTables();

  // Ensure sport view switcher matches state
  switchAssessSportView(assessSportCurrentView);

  // Switch to requested tab
  switchAssessmentTab(initialTab);

  openModal('assessmentModal');
}

function switchAssessmentTab(tab) {
  assessmentCurrentTab = tab;
  const formView = document.getElementById('assessmentViewForm');
  const rubricView = document.getElementById('assessmentViewRubric');
  const overviewView = document.getElementById('assessmentViewOverview');

  const formBtn = document.getElementById('assessmentTabFormBtn');
  const rubricBtn = document.getElementById('assessmentTabRubricBtn');
  const overviewBtn = document.getElementById('assessmentTabOverviewBtn');

  if (formView) formView.classList.toggle('hidden', tab !== 'form');
  if (rubricView) rubricView.classList.toggle('hidden', tab !== 'rubric');
  if (overviewView) overviewView.classList.toggle('hidden', tab !== 'overview');

  const activeBtnClass = 'py-2 rounded-xl bg-white text-emerald-800 shadow-xs transition-all flex items-center justify-center space-x-1';
  const inactiveBtnClass = 'py-2 rounded-xl text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center space-x-1';

  if (formBtn) formBtn.className = tab === 'form' ? activeBtnClass : inactiveBtnClass;
  if (rubricBtn) rubricBtn.className = tab === 'rubric' ? activeBtnClass : inactiveBtnClass;
  if (overviewBtn) overviewBtn.className = tab === 'overview' ? activeBtnClass : inactiveBtnClass;

  if (tab === 'rubric') {
    renderAssessmentRubricTables();
  } else if (tab === 'overview') {
    renderAssessmentOverviewTable();
  }
}

/* ==========================================================================
   TEACHER ASSESSMENT CONFIGURATION (수행평가 배점 및 등급별 개수 설정 에디터)
   ========================================================================== */

function toggleRubricEditMode() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 평가 기준을 수정할 수 있습니다.', '🔒');
    return;
  }

  isRubricEditMode = !isRubricEditMode;
  const editorPanel = document.getElementById('rubricConfigEditorPanel');
  const btnText = document.getElementById('rubricEditModeBtnText');
  const btn = document.getElementById('rubricEditModeToggleBtn');

  if (editorPanel) {
    editorPanel.classList.toggle('hidden', !isRubricEditMode);
  }

  if (btn) {
    if (isRubricEditMode) {
      btn.className = 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-md transition-all active:scale-95 cursor-pointer';
      if (btnText) btnText.innerText = '✖ 설정 닫기';
      populateRubricConfigForm();
    } else {
      btn.className = 'bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-xs transition-all active:scale-95 cursor-pointer';
      if (btnText) btnText.innerText = '⚙️ 배점 및 개수 설정 변경';
    }
  }
}

function populateRubricConfigForm() {
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = (val !== undefined) ? val : 0;
  };

  // Scores
  setVal('cfgScoreA', cfg.scores?.A);
  setVal('cfgScoreB', cfg.scores?.B);
  setVal('cfgScoreC', cfg.scores?.C);
  setVal('cfgScoreD', cfg.scores?.D);
  setVal('cfgScoreE', cfg.scores?.E);

  // Cutoffs
  setVal('cfgCutoffA', cfg.cutoffs?.A);
  setVal('cfgCutoffB', cfg.cutoffs?.B);

  // Grade 3 Serve
  setVal('cfgG3SvA', cfg.grade3?.serve?.thresholds?.A);
  setVal('cfgG3SvB', cfg.grade3?.serve?.thresholds?.B);
  setVal('cfgG3SvC', cfg.grade3?.serve?.thresholds?.C);
  setVal('cfgG3SvD', cfg.grade3?.serve?.thresholds?.D);

  // Grade 3 Forehand
  setVal('cfgG3FhA', cfg.grade3?.rally?.thresholds?.A);
  setVal('cfgG3FhB', cfg.grade3?.rally?.thresholds?.B);
  setVal('cfgG3FhC', cfg.grade3?.rally?.thresholds?.C);
  setVal('cfgG3FhD', cfg.grade3?.rally?.thresholds?.D);

  // Grade 2 Serve
  setVal('cfgG2SvA', cfg.grade2?.serve?.thresholds?.A);
  setVal('cfgG2SvB', cfg.grade2?.serve?.thresholds?.B);
  setVal('cfgG2SvC', cfg.grade2?.serve?.thresholds?.C);
  setVal('cfgG2SvD', cfg.grade2?.serve?.thresholds?.D);

  // Grade 2 Backhand
  setVal('cfgG2FhA', cfg.grade2?.rally?.thresholds?.A);
  setVal('cfgG2FhB', cfg.grade2?.rally?.thresholds?.B);
  setVal('cfgG2FhC', cfg.grade2?.rally?.thresholds?.C);
  setVal('cfgG2FhD', cfg.grade2?.rally?.thresholds?.D);

  // Badminton Grade 3 Serve & High Clear
  const bmG3 = cfg.badminton?.grade3 || DEFAULT_ASSESSMENT_CONFIG.badminton.grade3;
  setVal('cfgBmG3SvA', bmG3.serve?.thresholds?.A ?? 26);
  setVal('cfgBmG3SvB', bmG3.serve?.thresholds?.B ?? 22);
  setVal('cfgBmG3SvC', bmG3.serve?.thresholds?.C ?? 18);
  setVal('cfgBmG3SvD', bmG3.serve?.thresholds?.D ?? 14);

  setVal('cfgBmG3ClA', bmG3.clear?.thresholds?.A ?? 8);
  setVal('cfgBmG3ClB', bmG3.clear?.thresholds?.B ?? 6);
  setVal('cfgBmG3ClC', bmG3.clear?.thresholds?.C ?? 4);
  setVal('cfgBmG3ClD', bmG3.clear?.thresholds?.D ?? 2);

  // Badminton Grade 2 Serve & High Clear
  const bmG2 = cfg.badminton?.grade2 || DEFAULT_ASSESSMENT_CONFIG.badminton.grade2;
  setVal('cfgBmG2SvA', bmG2.serve?.thresholds?.A ?? 25);
  setVal('cfgBmG2SvB', bmG2.serve?.thresholds?.B ?? 21);
  setVal('cfgBmG2SvC', bmG2.serve?.thresholds?.C ?? 17);
  setVal('cfgBmG2SvD', bmG2.serve?.thresholds?.D ?? 13);

  setVal('cfgBmG2ClA', bmG2.clear?.thresholds?.A ?? 7);
  setVal('cfgBmG2ClB', bmG2.clear?.thresholds?.B ?? 5);
  setVal('cfgBmG2ClC', bmG2.clear?.thresholds?.C ?? 3);
  setVal('cfgBmG2ClD', bmG2.clear?.thresholds?.D ?? 1);
}

function saveAssessmentConfigFromForm() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 설정을 저장할 수 있습니다.', '🔒');
    return;
  }

  const getNum = (id, def) => {
    const el = document.getElementById(id);
    const n = parseInt(el?.value, 10);
    return isNaN(n) ? def : n;
  };

  const newConfig = {
    cutoffs: {
      A: Math.max(1, getNum('cfgCutoffA', 80)),
      B: Math.max(1, getNum('cfgCutoffB', 60))
    },
    scores: {
      A: Math.max(0, getNum('cfgScoreA', 50)),
      B: Math.max(0, getNum('cfgScoreB', 42)),
      C: Math.max(0, getNum('cfgScoreC', 35)),
      D: Math.max(0, getNum('cfgScoreD', 28)),
      E: Math.max(0, getNum('cfgScoreE', 20))
    },
    grade3: {
      serve: {
        name: '서브 정확성',
        unit: '점',
        maxAttempts: 10,
        maxPoints: 30,
        thresholds: {
          A: Math.max(1, getNum('cfgG3SvA', 27)),
          B: Math.max(1, getNum('cfgG3SvB', 23)),
          C: Math.max(1, getNum('cfgG3SvC', 19)),
          D: Math.max(1, getNum('cfgG3SvD', 15))
        }
      },
      rally: {
        name: '포핸드 드라이브 랠리',
        unit: '회',
        thresholds: {
          A: Math.max(1, getNum('cfgG3FhA', 30)),
          B: Math.max(1, getNum('cfgG3FhB', 23)),
          C: Math.max(1, getNum('cfgG3FhC', 16)),
          D: Math.max(1, getNum('cfgG3FhD', 9))
        }
      }
    },
    grade2: {
      serve: {
        name: '서브 정확성',
        unit: '점',
        maxAttempts: 10,
        maxPoints: 30,
        thresholds: {
          A: Math.max(1, getNum('cfgG2SvA', 26)),
          B: Math.max(1, getNum('cfgG2SvB', 22)),
          C: Math.max(1, getNum('cfgG2SvC', 18)),
          D: Math.max(1, getNum('cfgG2SvD', 14))
        }
      },
      rally: {
        name: '백핸드 쇼트 랠리',
        unit: '회',
        thresholds: {
          A: Math.max(1, getNum('cfgG2FhA', 25)),
          B: Math.max(1, getNum('cfgG2FhB', 19)),
          C: Math.max(1, getNum('cfgG2FhC', 13)),
          D: Math.max(1, getNum('cfgG2FhD', 7))
        }
      }
    },
    badminton: {
      grade3: {
        serve: {
          name: '배드민턴 서브 정확성',
          unit: '점',
          maxAttempts: 10,
          maxPoints: 30,
          thresholds: {
            A: Math.max(1, getNum('cfgBmG3SvA', 26)),
            B: Math.max(1, getNum('cfgBmG3SvB', 22)),
            C: Math.max(1, getNum('cfgBmG3SvC', 18)),
            D: Math.max(1, getNum('cfgBmG3SvD', 14))
          }
        },
        clear: {
          name: '배드민턴 하이클리어',
          unit: '회',
          maxAttempts: 10,
          thresholds: {
            A: Math.max(1, getNum('cfgBmG3ClA', 8)),
            B: Math.max(1, getNum('cfgBmG3ClB', 6)),
            C: Math.max(1, getNum('cfgBmG3ClC', 4)),
            D: Math.max(1, getNum('cfgBmG3ClD', 2))
          }
        }
      },
      grade2: {
        serve: {
          name: '배드민턴 서브 정확성',
          unit: '점',
          maxAttempts: 10,
          maxPoints: 30,
          thresholds: {
            A: Math.max(1, getNum('cfgBmG2SvA', 25)),
            B: Math.max(1, getNum('cfgBmG2SvB', 21)),
            C: Math.max(1, getNum('cfgBmG2SvC', 17)),
            D: Math.max(1, getNum('cfgBmG2SvD', 13))
          }
        },
        clear: {
          name: '배드민턴 하이클리어',
          unit: '회',
          maxAttempts: 10,
          thresholds: {
            A: Math.max(1, getNum('cfgBmG2ClA', 7)),
            B: Math.max(1, getNum('cfgBmG2ClB', 5)),
            C: Math.max(1, getNum('cfgBmG2ClC', 3)),
            D: Math.max(1, getNum('cfgBmG2ClD', 1))
          }
        }
      }
    }
  };

  state.assessmentConfig = newConfig;

  try {
    localStorage.setItem('tt_assessment_config', JSON.stringify(newConfig));
  } catch(e) {}

  if (typeof saveAssessmentConfigToRTDB === 'function') {
    saveAssessmentConfigToRTDB(newConfig);
  }

  refreshAssessmentConfigUI();
  playSuccessSound();
  showToast('수행평가 배점 및 기준 설정이 성공적으로 저장 및 반영되었습니다! 💾', '🎉');

  // Close edit mode
  toggleRubricEditMode();
}

function resetAssessmentConfigToDefault() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 초기화할 수 있습니다.', '🔒');
    return;
  }

  state.assessmentConfig = JSON.parse(JSON.stringify(DEFAULT_ASSESSMENT_CONFIG));

  try {
    localStorage.setItem('tt_assessment_config', JSON.stringify(state.assessmentConfig));
  } catch(e) {}

  if (typeof saveAssessmentConfigToRTDB === 'function') {
    saveAssessmentConfigToRTDB(state.assessmentConfig);
  }

  populateRubricConfigForm();
  refreshAssessmentConfigUI();
  showToast('수행평가 배점 및 기준이 기본값으로 초기화되었습니다. 🔄', '↩️');
}

function refreshAssessmentConfigUI() {
  renderAssessmentRubricTables();

  const studentSelect = document.getElementById('assessmentStudentSelect');
  const currentStudentId = studentSelect?.value;
  if (currentStudentId) {
    loadStudentAssessmentData(currentStudentId);
  }

  if (assessmentCurrentTab === 'overview') {
    renderAssessmentOverviewTable();
  }
}

function renderAssessmentRubricTables() {
  const container = document.getElementById('rubricTablesContainer');
  if (!container) return;

  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const sc = cfg.scores;
  const cut = cfg.cutoffs;
  const g3 = cfg.grade3;
  const g2 = cfg.grade2;
  const bmG3 = cfg.badminton?.grade3 || DEFAULT_ASSESSMENT_CONFIG.badminton.grade3;
  const bmG2 = cfg.badminton?.grade2 || DEFAULT_ASSESSMENT_CONFIG.badminton.grade2;

  container.innerHTML = `
    <!-- Grade Cutoff & Dual-Sport Weight Card -->
    <div class="bg-gradient-to-r from-slate-900 to-slate-800 p-2.5 sm:p-3 rounded-xl text-white border border-slate-700 space-y-2">
      <div class="text-xs font-black flex items-center justify-between text-amber-300">
        <div class="flex items-center space-x-1">
          <i class="fa-solid fa-award"></i>
          <span>종합 성취 등급 기준 & 종목별 반영 비율</span>
        </div>
        <span class="text-[10px] text-slate-300 font-bold">탁구 50% + 배드민턴 50% = 100점</span>
      </div>
      <div class="grid grid-cols-2 gap-1.5 text-[10px] sm:text-[11px] font-bold">
        <div class="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 flex items-center justify-between">
          <span>🏓 탁구 (서브50 + 랠리50)</span>
          <span class="font-black text-emerald-300">100점 (50%)</span>
        </div>
        <div class="p-1.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-200 flex items-center justify-between">
          <span>🏸 배드민턴 (서브50 + 클리어50)</span>
          <span class="font-black text-sky-300">100점 (50%)</span>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-[11px] font-bold">
        <div class="p-1.5 sm:p-2 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-300">
          <span class="block font-black text-[11px] sm:text-xs">A (🥇)</span>
          <span>합산 ${cut.A}점 이상</span>
        </div>
        <div class="p-1.5 sm:p-2 rounded-lg bg-emerald-400/20 border border-emerald-400/50 text-emerald-300">
          <span class="block font-black text-[11px] sm:text-xs">B (🥈)</span>
          <span>합산 ${cut.B}~${cut.A - 1}점</span>
        </div>
        <div class="p-1.5 sm:p-2 rounded-lg bg-sky-400/20 border border-sky-400/50 text-sky-300">
          <span class="block font-black text-[11px] sm:text-xs">C (🥉)</span>
          <span>합산 ${cut.B}점 미만</span>
        </div>
      </div>
    </div>

    <!-- SECTION 1: 3학년 탁구 평가 기준 -->
    <div class="space-y-2">
      <div class="flex items-center space-x-1.5 pt-1">
        <span class="bg-indigo-600 text-white font-black text-[11px] sm:text-xs px-2 py-0.5 rounded-lg shrink-0">🏓 3학년 탁구 (50%)</span>
        <span class="text-[10px] sm:text-[11px] text-slate-500 font-bold truncate">서브(${sc.A}점) + 포핸드 드라이브 랠리(${sc.A}점) = 100점</span>
      </div>

      <!-- 3학년 Serve Rubric -->
      <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
        <div class="flex justify-between items-center mb-1.5 gap-1">
          <span class="font-black text-slate-800 text-[11px] sm:text-xs">1. 탁구 서브 정확성 (${sc.A}점 만점)</span>
          <span class="text-[9px] sm:text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0">10회 시도 / ${g3.serve.thresholds.A}점+ A</span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-[10px] sm:text-[11px] border-collapse min-w-[280px]">
            <thead>
              <tr class="bg-slate-100 text-slate-700 text-center font-bold">
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">구분</th>
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">배점</th>
                <th class="p-1 sm:p-1.5 border-b border-slate-200">성취 기준 (과녁 획득 점수 / 30점 만점)</th>
              </tr>
            </thead>
            <tbody class="text-slate-700">
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">A구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.A}점</td><td class="p-1 sm:p-1.5 font-semibold">과녁 점수 ${g3.serve.thresholds.A}점 이상</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-emerald-600">B구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.B}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${g3.serve.thresholds.B}~${g3.serve.thresholds.A - 1}점</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-sky-600">C구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.C}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${g3.serve.thresholds.C}~${g3.serve.thresholds.B - 1}점</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-orange-600">D구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.D}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${g3.serve.thresholds.D}~${g3.serve.thresholds.C - 1}점</td></tr>
              <tr><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-rose-600">E구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.E}점</td><td class="p-1 sm:p-1.5 text-slate-500">과녁 점수 ${g3.serve.thresholds.D - 1}점 이하</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3학년 Forehand Drive Rubric -->
      <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
        <div class="flex justify-between items-center mb-1.5 gap-1">
          <span class="font-black text-slate-800 text-[11px] sm:text-xs">2. 포핸드 드라이브 랠리 (${sc.A}점 만점)</span>
          <span class="text-[9px] sm:text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0">${g3.rally.thresholds.A}회+ A</span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-[10px] sm:text-[11px] border-collapse min-w-[280px]">
            <thead>
              <tr class="bg-slate-100 text-slate-700 text-center font-bold">
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">구분</th>
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">배점</th>
                <th class="p-1 sm:p-1.5 border-b border-slate-200">성취 기준 (연속 랠리 성공 횟수)</th>
              </tr>
            </thead>
            <tbody class="text-slate-700">
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">A구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.A}점</td><td class="p-1 sm:p-1.5 font-semibold">드라이브 ${g3.rally.thresholds.A}회 이상 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-emerald-600">B구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.B}점</td><td class="p-1 sm:p-1.5">${g3.rally.thresholds.B}회 ~ ${g3.rally.thresholds.A - 1}회 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-sky-600">C구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.C}점</td><td class="p-1 sm:p-1.5">${g3.rally.thresholds.C}회 ~ ${g3.rally.thresholds.B - 1}회 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-orange-600">D구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.D}점</td><td class="p-1 sm:p-1.5">${g3.rally.thresholds.D}회 ~ ${g3.rally.thresholds.C - 1}회 성공</td></tr>
              <tr><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-rose-600">E구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.E}점</td><td class="p-1 sm:p-1.5 text-slate-500">${g3.rally.thresholds.D - 1}회 이하 성공</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SECTION 2: 2학년 탁구 평가 기준 -->
    <div class="space-y-2 pt-1">
      <div class="flex items-center space-x-1.5 pt-1">
        <span class="bg-teal-600 text-white font-black text-[11px] sm:text-xs px-2 py-0.5 rounded-lg shrink-0">🏓 2학년 탁구 (50%)</span>
        <span class="text-[10px] sm:text-[11px] text-slate-500 font-bold truncate">서브(${sc.A}점) + 백핸드 쇼트 랠리(${sc.A}점) = 100점</span>
      </div>

      <!-- 2학년 Serve Rubric -->
      <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
        <div class="flex justify-between items-center mb-1.5 gap-1">
          <span class="font-black text-slate-800 text-[11px] sm:text-xs">1. 탁구 서브 정확성 (${sc.A}점 만점)</span>
          <span class="text-[9px] sm:text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md shrink-0">10회 시도 / ${g2.serve.thresholds.A}점+ A</span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-[10px] sm:text-[11px] border-collapse min-w-[280px]">
            <thead>
              <tr class="bg-slate-100 text-slate-700 text-center font-bold">
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">구분</th>
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">배점</th>
                <th class="p-1 sm:p-1.5 border-b border-slate-200">성취 기준 (과녁 획득 점수 / 30점 만점)</th>
              </tr>
            </thead>
            <tbody class="text-slate-700">
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">A구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.A}점</td><td class="p-1 sm:p-1.5 font-semibold">과녁 점수 ${g2.serve.thresholds.A}점 이상</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-emerald-600">B구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.B}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${g2.serve.thresholds.B}~${g2.serve.thresholds.A - 1}점</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-sky-600">C구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.C}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${g2.serve.thresholds.C}~${g2.serve.thresholds.B - 1}점</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-orange-600">D구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.D}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${g2.serve.thresholds.D}~${g2.serve.thresholds.C - 1}점</td></tr>
              <tr><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-rose-600">E구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.E}점</td><td class="p-1 sm:p-1.5 text-slate-500">과녁 점수 ${g2.serve.thresholds.D - 1}점 이하</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2학년 Backhand Short Rubric -->
      <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
        <div class="flex justify-between items-center mb-1.5 gap-1">
          <span class="font-black text-slate-800 text-[11px] sm:text-xs">2. 백핸드 쇼트 랠리 (${sc.A}점 만점)</span>
          <span class="text-[9px] sm:text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md shrink-0">${g2.rally.thresholds.A}회+ A</span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-[10px] sm:text-[11px] border-collapse min-w-[280px]">
            <thead>
              <tr class="bg-slate-100 text-slate-700 text-center font-bold">
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">구분</th>
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">배점</th>
                <th class="p-1 sm:p-1.5 border-b border-slate-200">성취 기준 (연속 랠리 성공 횟수)</th>
              </tr>
            </thead>
            <tbody class="text-slate-700">
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">A구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.A}점</td><td class="p-1 sm:p-1.5 font-semibold">쇼트 자세 ${g2.rally.thresholds.A}회 이상 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-emerald-600">B구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.B}점</td><td class="p-1 sm:p-1.5">${g2.rally.thresholds.B}회 ~ ${g2.rally.thresholds.A - 1}회 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-sky-600">C구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.C}점</td><td class="p-1 sm:p-1.5">${g2.rally.thresholds.C}회 ~ ${g2.rally.thresholds.B - 1}회 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-orange-600">D구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.D}점</td><td class="p-1 sm:p-1.5">${g2.rally.thresholds.D}회 ~ ${g2.rally.thresholds.C - 1}회 성공</td></tr>
              <tr><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-rose-600">E구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.E}점</td><td class="p-1 sm:p-1.5 text-slate-500">${g2.rally.thresholds.D - 1}회 이하 성공</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SECTION 3: 3학년 배드민턴 평가 기준 -->
    <div class="space-y-2 pt-1">
      <div class="flex items-center space-x-1.5 pt-1">
        <span class="bg-sky-600 text-white font-black text-[11px] sm:text-xs px-2 py-0.5 rounded-lg shrink-0">🏸 3학년 배드민턴 (50%)</span>
        <span class="text-[10px] sm:text-[11px] text-slate-500 font-bold truncate">서브(${sc.A}점) + 하이클리어(${sc.A}점) = 100점</span>
      </div>

      <!-- 3학년 Badminton Serve Rubric -->
      <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-sky-200">
        <div class="flex justify-between items-center mb-1.5 gap-1">
          <span class="font-black text-slate-800 text-[11px] sm:text-xs">1. 3학년 배드민턴 서브 정확성 (${sc.A}점 만점)</span>
          <span class="text-[9px] sm:text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md shrink-0">10회 시도 / ${bmG3.serve.thresholds.A}점+ A</span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-[10px] sm:text-[11px] border-collapse min-w-[280px]">
            <thead>
              <tr class="bg-sky-50 text-sky-900 text-center font-bold">
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">구분</th>
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">배점</th>
                <th class="p-1 sm:p-1.5 border-b border-slate-200">성취 기준 (구역별 3·2·1점 획득 / 10회 30점 만점)</th>
              </tr>
            </thead>
            <tbody class="text-slate-700">
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">A구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.A}점</td><td class="p-1 sm:p-1.5 font-semibold">과녁 점수 ${bmG3.serve.thresholds.A}점 이상</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-emerald-600">B구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.B}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${bmG3.serve.thresholds.B}~${bmG3.serve.thresholds.A - 1}점</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-sky-600">C구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.C}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${bmG3.serve.thresholds.C}~${bmG3.serve.thresholds.B - 1}점</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-orange-600">D구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.D}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${bmG3.serve.thresholds.D}~${bmG3.serve.thresholds.C - 1}점</td></tr>
              <tr><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-rose-600">E구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.E}점</td><td class="p-1 sm:p-1.5 text-slate-500">과녁 점수 ${bmG3.serve.thresholds.D - 1}점 이하</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3학년 Badminton High Clear Rubric -->
      <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-sky-200">
        <div class="flex justify-between items-center mb-1.5 gap-1">
          <span class="font-black text-slate-800 text-[11px] sm:text-xs">2. 3학년 배드민턴 하이클리어 (${sc.A}점 만점)</span>
          <span class="text-[9px] sm:text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md shrink-0">10회 시도 / ${bmG3.clear.thresholds.A}회+ A</span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-[10px] sm:text-[11px] border-collapse min-w-[280px]">
            <thead>
              <tr class="bg-sky-50 text-sky-900 text-center font-bold">
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">구분</th>
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">배점</th>
                <th class="p-1 sm:p-1.5 border-b border-slate-200">성취 기준 (10회 타격 중 목표 구역 IN 횟수)</th>
              </tr>
            </thead>
            <tbody class="text-slate-700">
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">A구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.A}점</td><td class="p-1 sm:p-1.5 font-semibold">10회 중 ${bmG3.clear.thresholds.A}회 이상 구역 IN 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-emerald-600">B구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.B}점</td><td class="p-1 sm:p-1.5">${bmG3.clear.thresholds.B}회 ~ ${bmG3.clear.thresholds.A - 1}회 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-sky-600">C구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.C}점</td><td class="p-1 sm:p-1.5">${bmG3.clear.thresholds.C}회 ~ ${bmG3.clear.thresholds.B - 1}회 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-orange-600">D구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.D}점</td><td class="p-1 sm:p-1.5">${bmG3.clear.thresholds.D}회 ~ ${bmG3.clear.thresholds.C - 1}회 성공</td></tr>
              <tr><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-rose-600">E구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.E}점</td><td class="p-1 sm:p-1.5 text-slate-500">${bmG3.clear.thresholds.D - 1}회 이하 성공</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SECTION 4: 2학년 배드민턴 평가 기준 -->
    <div class="space-y-2 pt-1">
      <div class="flex items-center space-x-1.5 pt-1">
        <span class="bg-violet-600 text-white font-black text-[11px] sm:text-xs px-2 py-0.5 rounded-lg shrink-0">🏸 2학년 배드민턴 (50%)</span>
        <span class="text-[10px] sm:text-[11px] text-slate-500 font-bold truncate">서브(${sc.A}점) + 하이클리어(${sc.A}점) = 100점</span>
      </div>

      <!-- 2학년 Badminton Serve Rubric -->
      <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-violet-200">
        <div class="flex justify-between items-center mb-1.5 gap-1">
          <span class="font-black text-slate-800 text-[11px] sm:text-xs">1. 2학년 배드민턴 서브 정확성 (${sc.A}점 만점)</span>
          <span class="text-[9px] sm:text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-md shrink-0">10회 시도 / ${bmG2.serve.thresholds.A}점+ A</span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-[10px] sm:text-[11px] border-collapse min-w-[280px]">
            <thead>
              <tr class="bg-violet-50 text-violet-900 text-center font-bold">
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">구분</th>
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">배점</th>
                <th class="p-1 sm:p-1.5 border-b border-slate-200">성취 기준 (구역별 3·2·1점 획득 / 10회 30점 만점)</th>
              </tr>
            </thead>
            <tbody class="text-slate-700">
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">A구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.A}점</td><td class="p-1 sm:p-1.5 font-semibold">과녁 점수 ${bmG2.serve.thresholds.A}점 이상</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-emerald-600">B구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.B}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${bmG2.serve.thresholds.B}~${bmG2.serve.thresholds.A - 1}점</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-sky-600">C구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.C}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${bmG2.serve.thresholds.C}~${bmG2.serve.thresholds.B - 1}점</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-orange-600">D구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.D}점</td><td class="p-1 sm:p-1.5">과녁 점수 ${bmG2.serve.thresholds.D}~${bmG2.serve.thresholds.C - 1}점</td></tr>
              <tr><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-rose-600">E구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.E}점</td><td class="p-1 sm:p-1.5 text-slate-500">과녁 점수 ${bmG2.serve.thresholds.D - 1}점 이하</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2학년 Badminton High Clear Rubric -->
      <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-violet-200">
        <div class="flex justify-between items-center mb-1.5 gap-1">
          <span class="font-black text-slate-800 text-[11px] sm:text-xs">2. 2학년 배드민턴 하이클리어 (${sc.A}점 만점)</span>
          <span class="text-[9px] sm:text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-md shrink-0">10회 시도 / ${bmG2.clear.thresholds.A}회+ A</span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-[10px] sm:text-[11px] border-collapse min-w-[280px]">
            <thead>
              <tr class="bg-violet-50 text-violet-900 text-center font-bold">
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">구분</th>
                <th class="p-1 sm:p-1.5 border-r border-b border-slate-200">배점</th>
                <th class="p-1 sm:p-1.5 border-b border-slate-200">성취 기준 (10회 타격 중 목표 구역 IN 횟수)</th>
              </tr>
            </thead>
            <tbody class="text-slate-700">
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">A구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.A}점</td><td class="p-1 sm:p-1.5 font-semibold">10회 중 ${bmG2.clear.thresholds.A}회 이상 구역 IN 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-emerald-600">B구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.B}점</td><td class="p-1 sm:p-1.5">${bmG2.clear.thresholds.B}회 ~ ${bmG2.clear.thresholds.A - 1}회 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-sky-600">C구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.C}점</td><td class="p-1 sm:p-1.5">${bmG2.clear.thresholds.C}회 ~ ${bmG2.clear.thresholds.B - 1}회 성공</td></tr>
              <tr class="border-b border-slate-200"><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-orange-600">D구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.D}점</td><td class="p-1 sm:p-1.5">${bmG2.clear.thresholds.D}회 ~ ${bmG2.clear.thresholds.C - 1}회 성공</td></tr>
              <tr><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold text-rose-600">E구간</td><td class="p-1 sm:p-1.5 border-r border-slate-200 text-center font-bold">${sc.E}점</td><td class="p-1 sm:p-1.5 text-slate-500">${bmG2.clear.thresholds.D - 1}회 이하 성공</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   STUDENT FORM ASSESSMENT & CLASS ROSTER
   ========================================================================== */

function populateAssessmentClassOptions() {
  const classSelect = document.getElementById('assessmentClassSelect');
  const overviewClassSelect = document.getElementById('assessmentOverviewClassSelect');

  const classes = new Set();
  state.students.forEach(s => {
    classes.add(getStudentExactClassKey(s));
  });

  const sortedClasses = Array.from(classes).sort(compareExactClassKeys);
  let html = '';
  sortedClasses.forEach(c => {
    html += `<option value="${c}">🏫 ${c}</option>`;
  });

  if (classSelect) classSelect.innerHTML = html;
  if (overviewClassSelect) overviewClassSelect.innerHTML = html;
}

function onAssessmentClassChange() {
  const classKey = document.getElementById('assessmentClassSelect')?.value;
  if (!classKey) return;
  populateAssessmentStudentOptions(classKey);
  const firstStudent = document.getElementById('assessmentStudentSelect')?.value;
  if (firstStudent) {
    loadStudentAssessmentData(firstStudent);
  }
}

function populateAssessmentStudentOptions(classKey) {
  const studentSelect = document.getElementById('assessmentStudentSelect');
  if (!studentSelect) return;

  const list = state.students
    .filter(s => getStudentExactClassKey(s) === classKey)
    .sort(compareStudentsByNumber);

  let html = '';
  list.forEach(s => {
    const numStr = s.number ? `${s.number}번 ` : '';
    const scoreStr = s.assessment ? ` (합산: ${s.assessment.total || 0}점 / ${s.assessment.grade || '-'})` : ' (미평가)';
    html += `<option value="${s.id}">👤 ${numStr}${escapeHtml(s.name)}${scoreStr}</option>`;
  });

  studentSelect.innerHTML = html;
}

function onAssessmentStudentChange() {
  const studentId = document.getElementById('assessmentStudentSelect')?.value;
  if (studentId) {
    loadStudentAssessmentData(studentId);
  }
}

function getStudentGradeNum(student) {
  if (!student) return 3;
  if (typeof normalizeStudentGradeClass === 'function') {
    const s = normalizeStudentGradeClass(student);
    const g = parseInt(s.grade, 10);
    if (g) return g;
  }
  if (student.grade) {
    const g = parseInt(student.grade, 10);
    if (g) return g;
  }
  const classKey = typeof getStudentExactClassKey === 'function' ? getStudentExactClassKey(student) : '';
  const m = classKey.match(/(\d+)학년/);
  if (m) return parseInt(m[1], 10);
  return 3;
}

function loadStudentAssessmentData(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;

  const assess = student.assessment || {
    serve: 0,
    forehand: 0,
    bmServe: 0,
    bmClear: 0,
    total: 0,
    grade: '미평가',
    date: '',
    comment: ''
  };

  const gradeNum = getStudentGradeNum(student);
  const isGrade2 = (gradeNum === 2);

  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const gradeKey = isGrade2 ? 'grade2' : 'grade3';
  const svTh = cfg[gradeKey].serve.thresholds;
  const rallyTh = cfg[gradeKey].rally.thresholds;
  const bmGradeCfg = cfg.badminton?.[gradeKey] || DEFAULT_ASSESSMENT_CONFIG.badminton[gradeKey];
  const bmSvTh = bmGradeCfg.serve.thresholds;
  const bmClTh = bmGradeCfg.clear.thresholds;
  const sc = cfg.scores;

  // Dynamic Rubric Titles and Preset Buttons based on Grade and Config
  const crit1Title = document.getElementById('assessCriteria1Title');
  const crit1Desc = document.getElementById('assessCriteria1Desc');
  const crit2Title = document.getElementById('assessCriteria2Title');
  const crit2Desc = document.getElementById('assessCriteria2Desc');
  const crit3Title = document.getElementById('assessCriteriaBmSvTitle');
  const crit3Desc = document.getElementById('assessCriteriaBmSvDesc');
  const crit4Title = document.getElementById('assessCriteriaBmClTitle');
  const crit4Desc = document.getElementById('assessCriteriaBmClDesc');

  const presetSvContainer = document.getElementById('assessPresetSvContainer');
  const presetFhContainer = document.getElementById('assessPresetFhContainer');
  const presetBmSvContainer = document.getElementById('assessPresetBmSvContainer');
  const presetBmClContainer = document.getElementById('assessPresetBmClContainer');

  if (crit1Title) {
    crit1Title.innerText = `1. 탁구 서브 정확성 (${sc.A}점)`;
  }

  if (crit1Desc) {
    crit1Desc.innerText = `${isGrade2 ? '2학년' : '3학년'}: 10회 시도 / ${svTh.A}점 이상 A (${sc.A}점 만점)`;
  }

  if (crit2Title) {
    crit2Title.innerText = isGrade2 ? `2. 백핸드 쇼트 랠리 (${sc.A}점)` : `2. 포핸드 드라이브 랠리 (${sc.A}점)`;
  }

  if (crit2Desc) {
    crit2Desc.innerText = isGrade2 ? `2학년: ${rallyTh.A}회 이상 연속 성공 A (${sc.A}점)` : `3학년: ${rallyTh.A}회 이상 연속 성공 A (${sc.A}점)`;
  }

  if (crit3Title) {
    crit3Title.innerText = `1. 배드민턴 서브 정확성 (${sc.A}점)`;
  }

  if (crit3Desc) {
    crit3Desc.innerText = `${isGrade2 ? '2학년' : '3학년'}: 구역별 3·2·1점 / 10회 중 ${bmSvTh.A}점 이상 A (${sc.A}점)`;
  }

  if (crit4Title) {
    crit4Title.innerText = `2. 배드민턴 하이클리어 (${sc.A}점)`;
  }

  if (crit4Desc) {
    crit4Desc.innerText = `${isGrade2 ? '2학년' : '3학년'}: 10회 타구 중 목표 구역 내 ${bmClTh.A}회 이상 성공 시 A (${sc.A}점)`;
  }

  if (presetSvContainer) {
    presetSvContainer.innerHTML = `
      <button type="button" onclick="setAssessItem('sv', ${sc.A})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">A (${sc.A})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${svTh.A}점+</span></button>
      <button type="button" onclick="setAssessItem('sv', ${sc.B})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">B (${sc.B})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${svTh.B}~${svTh.A - 1}</span></button>
      <button type="button" onclick="setAssessItem('sv', ${sc.C})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">C (${sc.C})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${svTh.C}~${svTh.B - 1}</span></button>
      <button type="button" onclick="setAssessItem('sv', ${sc.D})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">D (${sc.D})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${svTh.D}~${svTh.C - 1}</span></button>
      <button type="button" onclick="setAssessItem('sv', ${sc.E})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">E (${sc.E})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${svTh.D - 1}점↓</span></button>
    `;
  }

  if (presetFhContainer) {
    presetFhContainer.innerHTML = `
      <button type="button" onclick="setAssessItem('fh', ${sc.A})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">A (${sc.A})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${rallyTh.A}회+</span></button>
      <button type="button" onclick="setAssessItem('fh', ${sc.B})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">B (${sc.B})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${rallyTh.B}~${rallyTh.A - 1}</span></button>
      <button type="button" onclick="setAssessItem('fh', ${sc.C})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">C (${sc.C})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${rallyTh.C}~${rallyTh.B - 1}</span></button>
      <button type="button" onclick="setAssessItem('fh', ${sc.D})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">D (${sc.D})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${rallyTh.D}~${rallyTh.C - 1}</span></button>
      <button type="button" onclick="setAssessItem('fh', ${sc.E})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">E (${sc.E})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${rallyTh.D - 1}회↓</span></button>
    `;
  }

  if (presetBmSvContainer) {
    presetBmSvContainer.innerHTML = `
      <button type="button" onclick="setAssessItem('bmSv', ${sc.A})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-sky-50 leading-tight">A (${sc.A})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${bmSvTh.A}점+</span></button>
      <button type="button" onclick="setAssessItem('bmSv', ${sc.B})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-sky-50 leading-tight">B (${sc.B})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${bmSvTh.B}~${bmSvTh.A - 1}</span></button>
      <button type="button" onclick="setAssessItem('bmSv', ${sc.C})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-sky-50 leading-tight">C (${sc.C})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${bmSvTh.C}~${bmSvTh.B - 1}</span></button>
      <button type="button" onclick="setAssessItem('bmSv', ${sc.D})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-sky-50 leading-tight">D (${sc.D})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${bmSvTh.D}~${bmSvTh.C - 1}</span></button>
      <button type="button" onclick="setAssessItem('bmSv', ${sc.E})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-sky-50 leading-tight">E (${sc.E})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${bmSvTh.D - 1}점↓</span></button>
    `;
  }

  if (presetBmClContainer) {
    presetBmClContainer.innerHTML = `
      <button type="button" onclick="setAssessItem('bmCl', ${sc.A})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-sky-50 leading-tight">A (${sc.A})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${bmClTh.A}회+</span></button>
      <button type="button" onclick="setAssessItem('bmCl', ${sc.B})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-sky-50 leading-tight">B (${sc.B})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${bmClTh.B}~${bmClTh.A - 1}</span></button>
      <button type="button" onclick="setAssessItem('bmCl', ${sc.C})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-sky-50 leading-tight">C (${sc.C})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${bmClTh.C}~${bmClTh.B - 1}</span></button>
      <button type="button" onclick="setAssessItem('bmCl', ${sc.D})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-sky-50 leading-tight">D (${sc.D})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${bmClTh.D}~${bmClTh.C - 1}</span></button>
      <button type="button" onclick="setAssessItem('bmCl', ${sc.E})" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-sky-50 leading-tight">E (${sc.E})<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">${bmClTh.D - 1}회↓</span></button>
    `;
  }

  const svInput = document.getElementById('assessScoreSv');
  const fhInput = document.getElementById('assessScoreFh');
  const bmSvInput = document.getElementById('assessScoreBmSv');
  const bmClInput = document.getElementById('assessScoreBmCl');
  const commentInput = document.getElementById('assessmentCommentInput');
  const dateText = document.getElementById('assessmentDateText');

  const targetResultBox = document.getElementById('assessServeTargetResultBox');
  const targetResultText = document.getElementById('assessServeTargetResultText');
  const rallyResultBox = document.getElementById('assessRallyResultBox');
  const rallyResultText = document.getElementById('assessRallyResultText');
  const bmServeResultBox = document.getElementById('assessBmServeResultBox');
  const bmServeResultText = document.getElementById('assessBmServeResultText');
  const bmClearResultBox = document.getElementById('assessBmClearResultBox');
  const bmClearResultText = document.getElementById('assessBmClearResultText');

  const openRallyBtnText = document.getElementById('assessOpenRallyBtnText');

  const rallyTypeName = isGrade2 ? '백핸드 쇼트' : '포핸드 드라이브';
  if (openRallyBtnText) {
    openRallyBtnText.innerText = `${isGrade2 ? '2학년 백핸드' : '3학년 포핸드'} 랠리 실기 채점판 열기 🏓`;
  }

  const rallyScore = (typeof assess.rally === 'number') ? assess.rally : (isGrade2 ? (assess.backhand || assess.forehand || 0) : (assess.forehand || 0));

  if (svInput) svInput.value = assess.serve || 0;
  if (fhInput) fhInput.value = rallyScore;
  if (bmSvInput) bmSvInput.value = assess.bmServe || 0;
  if (bmClInput) bmClInput.value = assess.bmClear || 0;
  if (commentInput) commentInput.value = assess.comment || '';
  if (dateText) dateText.innerText = assess.date ? `${assess.date} 채점` : '평가 전';

  // Display Converted Serve Target Result if recorded
  if (targetResultBox && targetResultText) {
    if (typeof assess.serveTargetRaw === 'number' && (assess.serveTargetRaw > 0 || assess.serveTargetAttempts > 0)) {
      const targetAttempts = assess.serveTargetAttempts || 10;
      const targetRubric = calculateServeRubricScore(assess.serveTargetRaw, gradeNum, true);
      targetResultText.innerHTML = `과녁 실기 <b class="text-amber-600 font-mono">${assess.serveTargetRaw}점</b>(30점 만점, ${targetAttempts}회) 획득 ➔ <b class="text-emerald-700 font-mono">${assess.serve || targetRubric.score}점</b>(${targetRubric.tier || 'A'}구간)으로 환산 반영됨`;
      targetResultBox.classList.remove('hidden');
    } else {
      targetResultBox.classList.add('hidden');
    }
  }

  // Display Converted Rally Result if recorded
  if (rallyResultBox && rallyResultText) {
    if (typeof assess.rallyCountRaw === 'number' && assess.rallyCountRaw > 0) {
      const rallyRubric = calculateRallyRubricScore(assess.rallyCountRaw, gradeNum);
      rallyResultText.innerHTML = `${rallyTypeName} 실기 <b class="text-cyan-600 font-mono">${assess.rallyCountRaw}회</b> 성공 ➔ <b class="text-emerald-700 font-mono">${assess.rally || rallyRubric.score}점</b>(${rallyRubric.tier || 'A'}구간)으로 환산 반영됨`;
      rallyResultBox.classList.remove('hidden');
    } else {
      rallyResultBox.classList.add('hidden');
    }
  }

  // Display Converted Badminton Serve Result if recorded
  if (bmServeResultBox && bmServeResultText) {
    if (typeof assess.bmServeRaw === 'number' && (assess.bmServeRaw > 0 || assess.bmServeAttempts > 0)) {
      const bmAttempts = assess.bmServeAttempts || 10;
      const bmSvRubric = calculateBmServeRubricScore(assess.bmServeRaw, gradeNum, true);
      bmServeResultText.innerHTML = `배드민턴 서브 실기 <b class="text-amber-600 font-mono">${assess.bmServeRaw}점</b>(30점 만점, ${bmAttempts}회) 획득 ➔ <b class="text-sky-700 font-mono">${assess.bmServe || bmSvRubric.score}점</b>(${bmSvRubric.tier || 'A'}구간)으로 환산 반영됨`;
      bmServeResultBox.classList.remove('hidden');
    } else {
      bmServeResultBox.classList.add('hidden');
    }
  }

  // Display Converted Badminton High Clear Result if recorded
  if (bmClearResultBox && bmClearResultText) {
    if (typeof assess.bmClearRaw === 'number' && (assess.bmClearRaw > 0 || assess.bmClearAttempts > 0)) {
      const bmClAttempts = assess.bmClearAttempts || 10;
      const bmClRubric = calculateBmClearRubricScore(assess.bmClearRaw, gradeNum, true);
      bmClearResultText.innerHTML = `하이클리어 실기 <b class="text-sky-600 font-mono">${assess.bmClearRaw}/${bmClAttempts}회</b> 구역 IN 성공 ➔ <b class="text-sky-700 font-mono">${assess.bmClear || bmClRubric.score}점</b>(${bmClRubric.tier || 'A'}구간)으로 환산 반영됨`;
      bmClearResultBox.classList.remove('hidden');
    } else {
      bmClearResultBox.classList.add('hidden');
    }
  }

  calcAssessmentTotal();
}

function setAssessItem(category, score) {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 점수를 입력 및 수정할 수 있습니다.', '🔒');
    return;
  }

  if (category === 'sv') {
    const el = document.getElementById('assessScoreSv');
    if (el) el.value = score;
  } else if (category === 'fh') {
    const el = document.getElementById('assessScoreFh');
    if (el) el.value = score;
  } else if (category === 'bmSv') {
    const el = document.getElementById('assessScoreBmSv');
    if (el) el.value = score;
  } else if (category === 'bmCl') {
    const el = document.getElementById('assessScoreBmCl');
    if (el) el.value = score;
  }

  calcAssessmentTotal();
}

function calcAssessmentTotal() {
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const maxScore = cfg.scores?.A || 50;
  const sv = Math.min(maxScore, Math.max(0, parseInt(document.getElementById('assessScoreSv')?.value) || 0));
  const fh = Math.min(maxScore, Math.max(0, parseInt(document.getElementById('assessScoreFh')?.value) || 0));
  const bmSv = Math.min(maxScore, Math.max(0, parseInt(document.getElementById('assessScoreBmSv')?.value) || 0));
  const bmCl = Math.min(maxScore, Math.max(0, parseInt(document.getElementById('assessScoreBmCl')?.value) || 0));

  const ttTotal = sv + fh; // max 100
  const bmTotal = bmSv + bmCl; // max 100
  const raw200 = ttTotal + bmTotal; // max 200
  const ttWeighted = Math.round(ttTotal * 0.5 * 10) / 10; // max 50
  const bmWeighted = Math.round(bmTotal * 0.5 * 10) / 10; // max 50
  const total = Math.round((ttWeighted + bmWeighted) * 10) / 10; // max 100

  let grade = '미평가';
  let gradeBadgeClass = 'bg-white/20 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-white/30 backdrop-blur-sm';

  const cutA = cfg.cutoffs?.A || 80;
  const cutB = cfg.cutoffs?.B || 60;

  if (raw200 > 0) {
    if (total >= cutA) {
      grade = 'A (최우수 🥇)';
      gradeBadgeClass = 'bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm';
    } else if (total >= cutB) {
      grade = 'B (우수 🥈)';
      gradeBadgeClass = 'bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl border border-emerald-300 shadow-sm';
    } else {
      grade = 'C (보통 🥉)';
      gradeBadgeClass = 'bg-sky-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl border border-sky-300 shadow-sm';
    }
  }

  const totalEl = document.getElementById('assessmentTotalScore');
  const raw200El = document.getElementById('assessmentRaw200Score');
  const ttSubEl = document.getElementById('assessmentTtSubTotalText');
  const bmSubEl = document.getElementById('assessmentBmSubTotalText');
  const ttSectionBadge = document.getElementById('assessSectionTtScoreBadge');
  const bmSectionBadge = document.getElementById('assessSectionBmScoreBadge');
  const gradeEl = document.getElementById('assessmentGradeBadge');

  if (totalEl) totalEl.innerText = total;
  if (raw200El) raw200El.innerText = raw200;
  if (ttSubEl) ttSubEl.innerText = `${ttTotal}/100점 (${ttWeighted}점)`;
  if (bmSubEl) bmSubEl.innerText = `${bmTotal}/100점 (${bmWeighted}점)`;
  if (ttSectionBadge) ttSectionBadge.innerText = `${ttTotal} / 100점 (50% 환산: ${ttWeighted}점)`;
  if (bmSectionBadge) bmSectionBadge.innerText = `${bmTotal} / 100점 (50% 환산: ${bmWeighted}점)`;

  if (gradeEl) {
    gradeEl.innerText = grade;
    gradeEl.className = gradeBadgeClass;
  }
}

function saveStudentAssessment() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 수행평가 결과를 저장할 수 있습니다.', '🔒');
    return;
  }

  const studentId = document.getElementById('assessmentStudentSelect')?.value;
  if (!studentId) {
    showToast('평가할 부원을 선택해 주세요.', '⚠️');
    return;
  }

  const student = state.students.find(s => s.id === studentId);
  if (!student) return;

  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const maxScore = cfg.scores?.A || 50;

  const sv = Math.min(maxScore, Math.max(0, parseInt(document.getElementById('assessScoreSv')?.value) || 0));
  const fh = Math.min(maxScore, Math.max(0, parseInt(document.getElementById('assessScoreFh')?.value) || 0));
  const bmSv = Math.min(maxScore, Math.max(0, parseInt(document.getElementById('assessScoreBmSv')?.value) || 0));
  const bmCl = Math.min(maxScore, Math.max(0, parseInt(document.getElementById('assessScoreBmCl')?.value) || 0));
  const comment = document.getElementById('assessmentCommentInput')?.value.trim() || '';

  const gradeNum = getStudentGradeNum(student);
  const isGrade2 = (gradeNum === 2);
  const rallyType = isGrade2 ? 'backhand' : 'forehand';

  const ttTotal = sv + fh;
  const bmTotal = bmSv + bmCl;
  const raw200 = ttTotal + bmTotal;
  const total = Math.round((ttTotal * 0.5 + bmTotal * 0.5) * 10) / 10;

  const cutA = cfg.cutoffs?.A || 80;
  const cutB = cfg.cutoffs?.B || 60;

  let grade = 'C';
  if (total >= cutA) grade = 'A';
  else if (total >= cutB) grade = 'B';

  const dateStr = new Date().toLocaleDateString('ko-KR');
  const prevAssess = student.assessment || {};

  student.assessment = {
    serve: sv,
    forehand: isGrade2 ? (prevAssess.forehand || 0) : fh,
    backhand: isGrade2 ? fh : (prevAssess.backhand || 0),
    rally: fh,
    rallyType: rallyType,
    ttTotal: ttTotal,
    bmServe: bmSv,
    bmClear: bmCl,
    bmTotal: bmTotal,
    raw200: raw200,
    total: total,
    grade: grade,
    date: dateStr,
    comment: comment,
    serveTargetRaw: (typeof prevAssess.serveTargetRaw === 'number') ? prevAssess.serveTargetRaw : undefined,
    serveTargetAttempts: (typeof prevAssess.serveTargetAttempts === 'number') ? prevAssess.serveTargetAttempts : undefined,
    rallyCountRaw: (typeof prevAssess.rallyCountRaw === 'number') ? prevAssess.rallyCountRaw : undefined,
    bmServeRaw: (typeof prevAssess.bmServeRaw === 'number') ? prevAssess.bmServeRaw : undefined,
    bmServeAttempts: (typeof prevAssess.bmServeAttempts === 'number') ? prevAssess.bmServeAttempts : undefined,
    bmClearRaw: (typeof prevAssess.bmClearRaw === 'number') ? prevAssess.bmClearRaw : undefined,
    bmClearAttempts: (typeof prevAssess.bmClearAttempts === 'number') ? prevAssess.bmClearAttempts : undefined
  };

  Object.keys(student.assessment).forEach(k => {
    if (student.assessment[k] === undefined) delete student.assessment[k];
  });

  saveStudentToRTDB(student);
  playSuccessSound();
  showToast(`[${student.name}] 부원 수행평가(탁구 ${ttTotal * 0.5}점 + 배드민턴 ${bmTotal * 0.5}점 = ${total}점 / ${grade}등급)가 저장되었습니다!`, '💾');

  // Refresh student dropdown label
  const classKey = getStudentExactClassKey(student);
  populateAssessmentStudentOptions(classKey);
  const studentSelect = document.getElementById('assessmentStudentSelect');
  if (studentSelect) studentSelect.value = student.id;
  const dateText = document.getElementById('assessmentDateText');
  if (dateText) dateText.innerText = `${dateStr} 채점`;
}

function selectStudentForAssessmentFromOverview(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;

  const classKey = getStudentExactClassKey(student);
  const classSelect = document.getElementById('assessmentClassSelect');
  if (classSelect) classSelect.value = classKey;
  populateAssessmentStudentOptions(classKey);

  const studentSelect = document.getElementById('assessmentStudentSelect');
  if (studentSelect) studentSelect.value = student.id;

  loadStudentAssessmentData(student.id);
  switchAssessmentTab('form');
  showToast(`[${student.name}] 부원 채점 화면으로 이동했습니다.`, '✏️');
}

function toggleOverviewInlineEdit() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 빠른 직접 채점 기능을 사용할 수 있습니다.', '🔒');
    return;
  }

  isOverviewInlineMode = !isOverviewInlineMode;
  const toggleBtn = document.getElementById('overviewInlineToggleBtn');
  const toggleText = document.getElementById('overviewInlineToggleText');
  const batchSaveBox = document.getElementById('overviewBatchSaveContainer');

  if (toggleBtn) {
    if (isOverviewInlineMode) {
      toggleBtn.className = 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-2.5 py-1 rounded-xl text-xs flex items-center space-x-1 shadow-xs transition-all';
      if (toggleText) toggleText.innerText = '빠른 채점 모드 켜짐 ⚡';
    } else {
      toggleBtn.className = 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold px-2.5 py-1 rounded-xl text-xs flex items-center space-x-1 shadow-2xs transition-all';
      if (toggleText) toggleText.innerText = '테이블 직접 채점 모드';
    }
  }

  if (batchSaveBox) {
    batchSaveBox.classList.toggle('hidden', !isOverviewInlineMode);
  }

  renderAssessmentOverviewTable();
}

function renderAssessmentOverviewTable() {
  const classSelect = document.getElementById('assessmentOverviewClassSelect');
  const classKey = classSelect?.value || document.getElementById('assessmentClassSelect')?.value;
  const tbody = document.getElementById('assessmentOverviewTableBody');
  if (!tbody || !classKey) return;

  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const maxScore = cfg.scores?.A || 50;
  const cutA = cfg.cutoffs?.A || 80;
  const cutB = cfg.cutoffs?.B || 60;

  const m = classKey.match(/(\d+)학년/);
  const classGrade = m ? parseInt(m[1], 10) : 3;
  const isGrade2 = (classGrade === 2);
  const thRally = document.getElementById('thAssessRallyCol');
  if (thRally) {
    thRally.innerText = isGrade2 ? `🏓쇼트(${maxScore})` : `🏓드라이브(${maxScore})`;
  }

  const list = state.students
    .filter(s => getStudentExactClassKey(s) === classKey)
    .sort(compareStudentsByNumber);

  // Statistics Calculation
  const totalCount = list.length;
  let evaluatedCount = 0;
  let totalScoreSum = 0;
  const gradeCounts = { A: 0, B: 0, C: 0, unrated: 0 };

  list.forEach(s => {
    if (s.assessment && typeof s.assessment.total === 'number' && s.assessment.total > 0) {
      evaluatedCount++;
      totalScoreSum += s.assessment.total;
      let g = s.assessment.grade;
      if (!g || g === '미평가') {
        if (s.assessment.total >= cutA) g = 'A';
        else if (s.assessment.total >= cutB) g = 'B';
        else g = 'C';
      }
      if (gradeCounts[g] !== undefined) gradeCounts[g]++;
      else gradeCounts.C++;
    } else {
      gradeCounts.unrated++;
    }
  });

  const completionRate = totalCount > 0 ? Math.round((evaluatedCount / totalCount) * 100) : 0;
  const avgScore = evaluatedCount > 0 ? (totalScoreSum / evaluatedCount).toFixed(1) : '0.0';
  const topGradeRate = evaluatedCount > 0 ? Math.round(((gradeCounts.A + gradeCounts.B) / evaluatedCount) * 100) : 0;

  // Update Stat Dashboard Elements
  const statTotalEl = document.getElementById('statClassTotalCount');
  const statCompEl = document.getElementById('statClassCompletionRate');
  const statAvgEl = document.getElementById('statClassAverageScore');
  const statTopEl = document.getElementById('statClassTopGradeRate');
  const gradeDistBar = document.getElementById('assessmentGradeDistributionBar');

  if (statTotalEl) statTotalEl.innerText = `${totalCount}명`;
  if (statCompEl) statCompEl.innerText = `${completionRate}% (${evaluatedCount}/${totalCount})`;
  if (statAvgEl) statAvgEl.innerText = `${avgScore}점`;
  if (statTopEl) statTopEl.innerText = `${topGradeRate}%`;

  if (gradeDistBar) {
    gradeDistBar.innerHTML = `
      <span class="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-lg">A등급: ${gradeCounts.A}명</span>
      <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg">B등급: ${gradeCounts.B}명</span>
      <span class="bg-sky-100 text-sky-900 border border-sky-300 px-2 py-0.5 rounded-lg">C등급: ${gradeCounts.C}명</span>
      <span class="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">미평가: ${gradeCounts.unrated}명</span>
    `;
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="p-4 text-center text-slate-400">해당 학급에 등록된 부원이 없습니다.</td></tr>`;
    return;
  }

  let html = '';
  list.forEach(s => {
    const a = s.assessment || { serve: 0, forehand: 0, backhand: 0, bmServe: 0, bmClear: 0, total: 0, grade: '미평가' };
    const sv = a.serve || 0;
    const fh = (typeof a.rally === 'number') ? a.rally : (isGrade2 ? (a.backhand || a.forehand || 0) : (a.forehand || 0));
    const bmSv = a.bmServe || 0;
    const bmCl = a.bmClear || 0;

    const ttSub = sv + fh;
    const bmSub = bmSv + bmCl;
    const ttWeighted = Math.round(ttSub * 0.5 * 10) / 10;
    const bmWeighted = Math.round(bmSub * 0.5 * 10) / 10;
    const calcTotal = Math.round((ttWeighted + bmWeighted) * 10) / 10;
    const hasAnyScore = (sv > 0 || fh > 0 || bmSv > 0 || bmCl > 0 || a.total > 0);
    const displayTotalNum = hasAnyScore ? calcTotal : 0;
    const total = hasAnyScore ? `${displayTotalNum}점` : '-';

    let grade = a.grade || '미평가';
    if (hasAnyScore) {
      if (displayTotalNum >= cutA) grade = 'A';
      else if (displayTotalNum >= cutB) grade = 'B';
      else grade = 'C';
    }

    let gradeColor = 'text-slate-400';
    if (grade === 'A') gradeColor = 'text-amber-600 font-black';
    else if (grade === 'B') gradeColor = 'text-emerald-600 font-black';
    else if (grade === 'C') gradeColor = 'text-blue-600 font-black';

    if (isOverviewInlineMode && state.role === 'admin') {
      // Inline Interactive Input Row (11 columns)
      html += `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors" data-std-id="${s.id}">
          <td class="p-1.5 border-r border-slate-100 font-bold">${s.number || '-'}번</td>
          <td class="p-1.5 border-r border-slate-100 font-extrabold text-slate-800">${escapeHtml(s.name)}</td>
          <td class="p-1 border-r border-slate-100">
            <input type="number" min="0" max="${maxScore}" value="${sv}" data-type="sv" onchange="onInlineScoreChange(this)" class="w-12 text-center p-1 rounded-md border border-slate-300 font-bold text-xs bg-emerald-50 focus:ring-1 focus:ring-emerald-500">
          </td>
          <td class="p-1 border-r border-slate-100">
            <input type="number" min="0" max="${maxScore}" value="${fh}" data-type="fh" onchange="onInlineScoreChange(this)" class="w-12 text-center p-1 rounded-md border border-slate-300 font-bold text-xs bg-emerald-50 focus:ring-1 focus:ring-emerald-500">
          </td>
          <td class="p-1.5 border-r border-slate-100 font-black text-emerald-700 bg-emerald-50/40 inline-tt-sub">${ttSub} (${ttWeighted})</td>
          <td class="p-1 border-r border-slate-100">
            <input type="number" min="0" max="${maxScore}" value="${bmSv}" data-type="bmSv" onchange="onInlineScoreChange(this)" class="w-12 text-center p-1 rounded-md border border-slate-300 font-bold text-xs bg-sky-50 focus:ring-1 focus:ring-sky-500">
          </td>
          <td class="p-1 border-r border-slate-100">
            <input type="number" min="0" max="${maxScore}" value="${bmCl}" data-type="bmCl" onchange="onInlineScoreChange(this)" class="w-12 text-center p-1 rounded-md border border-slate-300 font-bold text-xs bg-sky-50 focus:ring-1 focus:ring-sky-500">
          </td>
          <td class="p-1.5 border-r border-slate-100 font-black text-sky-700 bg-sky-50/40 inline-bm-sub">${bmSub} (${bmWeighted})</td>
          <td class="p-1.5 border-r border-slate-100 font-black text-indigo-700 bg-indigo-50/40 inline-total">${total}</td>
          <td class="p-1.5 border-r border-slate-100 inline-grade ${gradeColor}">${grade}</td>
          <td class="p-1">
            <button type="button" onclick="selectStudentForAssessmentFromOverview('${s.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold">
              상세
            </button>
          </td>
        </tr>
      `;
    } else {
      // Clean Clickable Table Row (11 columns)
      html += `
        <tr onclick="selectStudentForAssessmentFromOverview('${s.id}')" class="border-b border-slate-100 hover:bg-emerald-50/50 cursor-pointer transition-colors group">
          <td class="p-1.5 border-r border-slate-100 font-bold">${s.number || '-'}번</td>
          <td class="p-1.5 border-r border-slate-100 font-extrabold text-slate-800 group-hover:text-emerald-700">${escapeHtml(s.name)}</td>
          <td class="p-1.5 border-r border-slate-100">${sv > 0 ? `${sv}` : '-'}</td>
          <td class="p-1.5 border-r border-slate-100">${fh > 0 ? `${fh}` : '-'}</td>
          <td class="p-1.5 border-r border-slate-100 font-extrabold text-emerald-700 bg-emerald-50/30">${ttSub > 0 ? `${ttSub} (${ttWeighted})` : '-'}</td>
          <td class="p-1.5 border-r border-slate-100">${bmSv > 0 ? `${bmSv}` : '-'}</td>
          <td class="p-1.5 border-r border-slate-100">${bmCl > 0 ? `${bmCl}` : '-'}</td>
          <td class="p-1.5 border-r border-slate-100 font-extrabold text-sky-700 bg-sky-50/30">${bmSub > 0 ? `${bmSub} (${bmWeighted})` : '-'}</td>
          <td class="p-1.5 border-r border-slate-100 font-black text-indigo-700 bg-indigo-50/30">${total}</td>
          <td class="p-1.5 border-r border-slate-100 ${gradeColor}">${grade}</td>
          <td class="p-1">
            <span class="text-[10px] text-emerald-600 font-bold group-hover:underline">
              ✏️ 채점
            </span>
          </td>
        </tr>
      `;
    }
  });

  tbody.innerHTML = html;
}

function onInlineScoreChange(inputEl) {
  const tr = inputEl.closest('tr');
  if (!tr) return;

  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const maxScore = cfg.scores?.A || 50;

  const sv = Math.min(maxScore, Math.max(0, parseInt(tr.querySelector('input[data-type="sv"]')?.value) || 0));
  const fh = Math.min(maxScore, Math.max(0, parseInt(tr.querySelector('input[data-type="fh"]')?.value) || 0));
  const bmSv = Math.min(maxScore, Math.max(0, parseInt(tr.querySelector('input[data-type="bmSv"]')?.value) || 0));
  const bmCl = Math.min(maxScore, Math.max(0, parseInt(tr.querySelector('input[data-type="bmCl"]')?.value) || 0));

  const ttSub = sv + fh;
  const bmSub = bmSv + bmCl;
  const ttWeighted = Math.round(ttSub * 0.5 * 10) / 10;
  const bmWeighted = Math.round(bmSub * 0.5 * 10) / 10;
  const total = Math.round((ttWeighted + bmWeighted) * 10) / 10;

  const cutA = cfg.cutoffs?.A || 80;
  const cutB = cfg.cutoffs?.B || 60;

  let grade = 'C';
  if (total >= cutA) grade = 'A';
  else if (total >= cutB) grade = 'B';

  const ttSubEl = tr.querySelector('.inline-tt-sub');
  const bmSubEl = tr.querySelector('.inline-bm-sub');
  const totalEl = tr.querySelector('.inline-total');
  const gradeEl = tr.querySelector('.inline-grade');

  if (ttSubEl) ttSubEl.innerText = `${ttSub} (${ttWeighted})`;
  if (bmSubEl) bmSubEl.innerText = `${bmSub} (${bmWeighted})`;
  if (totalEl) totalEl.innerText = `${total}점`;
  if (gradeEl) {
    gradeEl.innerText = grade;
    gradeEl.className = `p-1.5 border-r border-slate-100 inline-grade ${grade === 'A' ? 'text-amber-600 font-black' : (grade === 'B' ? 'text-emerald-600 font-black' : 'text-blue-600 font-black')}`;
  }
}

function saveOverviewBatchAssessment() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 수행평가를 일괄 저장할 수 있습니다.', '🔒');
    return;
  }

  const rows = document.querySelectorAll('#assessmentOverviewTableBody tr[data-std-id]');
  if (rows.length === 0) return;

  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const maxScore = cfg.scores?.A || 50;
  const cutA = cfg.cutoffs?.A || 80;
  const cutB = cfg.cutoffs?.B || 60;

  const dateStr = new Date().toLocaleDateString('ko-KR');
  let savedCount = 0;

  rows.forEach(tr => {
    const studentId = tr.getAttribute('data-std-id');
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const gradeNum = getStudentGradeNum(student);
    const isGrade2 = (gradeNum === 2);
    const rallyType = isGrade2 ? 'backhand' : 'forehand';

    const sv = Math.min(maxScore, Math.max(0, parseInt(tr.querySelector('input[data-type="sv"]')?.value) || 0));
    const fh = Math.min(maxScore, Math.max(0, parseInt(tr.querySelector('input[data-type="fh"]')?.value) || 0));
    const bmSv = Math.min(maxScore, Math.max(0, parseInt(tr.querySelector('input[data-type="bmSv"]')?.value) || 0));
    const bmCl = Math.min(maxScore, Math.max(0, parseInt(tr.querySelector('input[data-type="bmCl"]')?.value) || 0));

    const ttTotal = sv + fh;
    const bmTotal = bmSv + bmCl;
    const raw200 = ttTotal + bmTotal;
    const total = Math.round((ttTotal * 0.5 + bmTotal * 0.5) * 10) / 10;

    let grade = 'C';
    if (total >= cutA) grade = 'A';
    else if (total >= cutB) grade = 'B';

    const prevAssess = student.assessment || {};

    student.assessment = {
      ...prevAssess,
      serve: sv,
      forehand: isGrade2 ? (prevAssess.forehand || 0) : fh,
      backhand: isGrade2 ? fh : (prevAssess.backhand || 0),
      rally: fh,
      rallyType: rallyType,
      ttTotal: ttTotal,
      bmServe: bmSv,
      bmClear: bmCl,
      bmTotal: bmTotal,
      raw200: raw200,
      total: total,
      grade: grade,
      date: dateStr,
      comment: prevAssess.comment || ''
    };

    saveStudentToRTDB(student);
    savedCount++;
  });

  playSuccessSound();
  showToast(`학급 전체 부원(${savedCount}명)의 탁구+배드민턴 수행평가 점수가 일괄 저장되었습니다!`, '🎉');
  toggleOverviewInlineEdit(); // return to clean overview mode
}

function copyAssessmentOverviewTable() {
  const classKey = document.getElementById('assessmentOverviewClassSelect')?.value || '';
  const list = state.students
    .filter(s => getStudentExactClassKey(s) === classKey)
    .sort(compareStudentsByNumber);

  if (list.length === 0) {
    showToast('복사할 부원 데이터가 없습니다.', '⚠️');
    return;
  }

  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const maxScore = cfg.scores?.A || 50;
  const m = classKey.match(/(\d+)학년/);
  const classGrade = m ? parseInt(m[1], 10) : 3;
  const isGrade2 = (classGrade === 2);
  const rallyColName = isGrade2 ? `백핸드 쇼트(${maxScore})` : `포핸드 드라이브(${maxScore})`;

  let text = `[양주중학교 체육수업 탁구(50%)+배드민턴(50%) 수행평가 일람표 - ${classKey}]\n`;
  text += `번호\t이름\t탁구서브(${maxScore})\t${rallyColName}\t탁구합계(50%환산)\t배드민턴서브(${maxScore})\t하이클리어(${maxScore})\t배드민턴합계(50%환산)\t종합점수(100)\t등급\t피드백\n`;

  list.forEach(s => {
    const a = s.assessment;
    const num = s.number || '';
    const name = s.name || '';
    const sv = a ? (a.serve || 0) : '';
    const fh = a ? ((typeof a.rally === 'number') ? a.rally : (isGrade2 ? (a.backhand || a.forehand || 0) : (a.forehand || 0))) : '';
    const ttSub = a ? (sv + fh) : '';
    const ttW = a ? Math.round(ttSub * 0.5 * 10) / 10 : '';
    const bmSv = a ? (a.bmServe || 0) : '';
    const bmCl = a ? (a.bmClear || 0) : '';
    const bmSub = a ? (bmSv + bmCl) : '';
    const bmW = a ? Math.round(bmSub * 0.5 * 10) / 10 : '';
    const total = a ? a.total : '';
    const grade = a ? a.grade : '';
    const comment = a ? a.comment : '';
    text += `${num}\t${name}\t${sv}\t${fh}\t${a ? `${ttSub}(${ttW})` : ''}\t${bmSv}\t${bmCl}\t${a ? `${bmSub}(${bmW})` : ''}\t${total}\t${grade}\t${comment}\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    showToast(`[${classKey}] 수행평가 일람표가 클립보드에 복사되었습니다. (엑셀에 바로 붙여넣기 가능)`, '📋');
  }).catch(() => {
    showToast('클립보드 복사에 실패했습니다.', '⚠️');
  });
}

function downloadAssessmentCSV() {
  const classKey = document.getElementById('assessmentOverviewClassSelect')?.value || '';
  const list = state.students
    .filter(s => getStudentExactClassKey(s) === classKey)
    .sort(compareStudentsByNumber);

  if (list.length === 0) {
    showToast('다운로드할 부원 데이터가 없습니다.', '⚠️');
    return;
  }

  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const maxScore = cfg.scores?.A || 50;
  const m = classKey.match(/(\d+)학년/);
  const classGrade = m ? parseInt(m[1], 10) : 3;
  const isGrade2 = (classGrade === 2);
  const rallyColName = isGrade2 ? `탁구_백핸드쇼트(${maxScore}점)` : `탁구_포핸드드라이브(${maxScore}점)`;

  let csvContent = "\uFEFF"; // UTF-8 BOM for Excel Korean encoding
  csvContent += `학년,반,번호,이름,탁구_서브(${maxScore}점),${rallyColName},탁구소계(100점),탁구환산(50%),배드민턴_서브(${maxScore}점),배드민턴_하이클리어(${maxScore}점),배드민턴소계(100점),배드민턴환산(50%),종합총점(100점),등급,평가일자,선생님 피드백\n`;

  list.forEach(s => {
    const a = s.assessment;
    const g = s.grade || '';
    const c = s.classNum || '';
    const num = s.number || '';
    const name = (s.name || '').replaceAll('"', '""');
    const sv = a ? (a.serve || 0) : 0;
    const fh = a ? ((typeof a.rally === 'number') ? a.rally : (isGrade2 ? (a.backhand || a.forehand || 0) : (a.forehand || 0))) : 0;
    const ttSub = sv + fh;
    const ttW = Math.round(ttSub * 0.5 * 10) / 10;
    const bmSv = a ? (a.bmServe || 0) : 0;
    const bmCl = a ? (a.bmClear || 0) : 0;
    const bmSub = bmSv + bmCl;
    const bmW = Math.round(bmSub * 0.5 * 10) / 10;
    const total = a ? a.total : 0;
    const grade = a ? a.grade : '미평가';
    const date = a ? a.date : '';
    const comment = a ? `"${(a.comment || '').replaceAll('"', '""')}"` : '""';

    csvContent += `${g},${c},${num},"${name}",${sv},${fh},${ttSub},${ttW},${bmSv},${bmCl},${bmSub},${bmW},${total},${grade},${date},${comment}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `양주중_체육_탁구배드민턴_수행평가_${classKey.replaceAll(' ', '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`[${classKey}] 탁구+배드민턴 수행평가 CSV 파일이 다운로드되었습니다.`, '📥');
}

/* ==========================================================================
   3x3 SERVE TARGET ASSESSMENT (3x3 서브 실기 과녁 수행평가 모듈)
   ========================================================================== */

let serveTargetHits = [];
let currentServeTargetStudent = null;

function openServeTargetModal() {
  const studentSelect = document.getElementById('assessmentStudentSelect');
  let studentId = studentSelect?.value;
  
  if (!studentId) {
    const current = getCurrentStudent();
    if (current) studentId = current.id;
  }

  currentServeTargetStudent = state.students.find(s => s.id === studentId);
  const nameEl = document.getElementById('serveTargetStudentName');
  const nameElMobile = document.getElementById('serveTargetStudentNameMobile');
  const modeBadge = document.getElementById('serveTargetModeBadge');
  const gradeSpecBadge = document.getElementById('serveTargetGradeSpecBadge');

  const gradeNum = getStudentGradeNum(currentServeTargetStudent);
  const isGrade2 = (gradeNum === 2);
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;

  if (gradeSpecBadge) {
    const th2 = cfg.grade2?.serve?.thresholds?.A || 26;
    const th3 = cfg.grade3?.serve?.thresholds?.A || 27;
    gradeSpecBadge.innerText = isGrade2 ? `🌱 2학년: 10회 중 ${th2}점 이상 A (30점 만점)` : `🎓 3학년: 10회 중 ${th3}점 이상 A (30점 만점)`;
  }

  if (currentServeTargetStudent) {
    const classBadge = formatClassBadge(currentServeTargetStudent);
    const fullName = `${classBadge} ${currentServeTargetStudent.name}`;
    if (nameEl) nameEl.innerText = fullName;
    if (nameElMobile) nameElMobile.innerText = fullName;
  } else {
    if (nameEl) nameEl.innerText = '부원 선택 필요';
    if (nameElMobile) nameElMobile.innerText = '부원 선택 필요';
  }

  if (modeBadge) {
    if (state.role === 'admin') {
      modeBadge.className = 'text-xs bg-indigo-600 text-white font-extrabold px-3 py-1 rounded-xl shadow-sm border border-indigo-400/40';
      modeBadge.innerText = '👑 선생님 채점';
    } else {
      modeBadge.className = 'text-xs bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-xl shadow-sm border border-emerald-400/40';
      modeBadge.innerText = '👤 부원 연습 모드';
    }
  }

  // Reset hits for a new fresh session
  serveTargetHits = [];
  updateServeTargetUI();

  openModal('serveTargetModal');
}

function calculateServeRubricScore(rawPoints, gradeNum = 3, hasAttempts = false) {
  const isGrade2 = (gradeNum === 2);
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const gradeKey = isGrade2 ? 'grade2' : 'grade3';
  const th = cfg[gradeKey]?.serve?.thresholds || (isGrade2 ? { A: 26, B: 22, C: 18, D: 14 } : { A: 27, B: 23, C: 19, D: 15 });
  const sc = cfg.scores || { A: 50, B: 42, C: 35, D: 28, E: 20 };

  if (rawPoints <= 0 && !hasAttempts) {
    return { score: 0, tier: '-', tierName: '미평가', gradeName: '미평가 📋', badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700' };
  }
  if (rawPoints <= 0 && hasAttempts) {
    return { score: sc.E, tier: 'E', tierName: 'E', gradeName: `E (${sc.E}점 환산 ⚠️)`, badgeClass: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400' };
  }

  if (rawPoints >= th.A) {
    return { score: sc.A, tier: 'A', tierName: 'A', gradeName: `A (${sc.A}점 환산 🥇)`, badgeClass: 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-300' };
  }
  if (rawPoints >= th.B) {
    return { score: sc.B, tier: 'B', tierName: 'B', gradeName: `B (${sc.B}점 환산 🥈)`, badgeClass: 'bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.6)] border border-emerald-300' };
  }
  if (rawPoints >= th.C) {
    return { score: sc.C, tier: 'C', tierName: 'C', gradeName: `C (${sc.C}점 환산 🥉)`, badgeClass: 'bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.6)] border border-sky-300' };
  }
  if (rawPoints >= th.D) {
    return { score: sc.D, tier: 'D', tierName: 'D', gradeName: `D (${sc.D}점 환산 🌱)`, badgeClass: 'bg-orange-400 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.6)] border border-orange-300' };
  }
  return { score: sc.E, tier: 'E', tierName: 'E', gradeName: `E (${sc.E}점 환산 ⚠️)`, badgeClass: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400' };
}

function hitServeTargetZone(point, name, index) {
  serveTargetHits.push({
    point: point,
    name: name,
    index: index,
    time: Date.now()
  });

  playHitZoneSound(point);
  updateServeTargetUI();
}

function undoServeHit() {
  if (serveTargetHits.length === 0) {
    showToast('취소할 타격 기록이 없습니다.', '⚠️');
    return;
  }
  const removed = serveTargetHits.pop();
  showToast(`마지막 ${removed.point}점 (${removed.name}) 기록이 취소되었습니다.`, '↩️');
  updateServeTargetUI();
}

function resetServeTargetHits() {
  if (serveTargetHits.length === 0) return;
  serveTargetHits = [];
  updateServeTargetUI();
  showToast('서브 타격 기록이 0점으로 초기화되었습니다.', '🔄');
}

function updateServeTargetUI() {
  const totalPoints = serveTargetHits.reduce((sum, h) => sum + h.point, 0);
  const totalAttempts = serveTargetHits.length;
  const successHits = serveTargetHits.filter(h => h.point > 0).length;
  const failHits = serveTargetHits.filter(h => h.point === 0).length;

  const scoreEl = document.getElementById('serveTargetCurrentScore');
  const countBadge = document.getElementById('serveTargetHitCountBadge');
  const countText = document.getElementById('serveTargetHitCountText');
  const logEl = document.getElementById('serveTargetHitLog');
  const gradeBadge = document.getElementById('serveTargetGradeBadge');

  const rawScoreText = document.getElementById('serveTargetLiveRawScoreText');
  const finalScoreText = document.getElementById('serveTargetLiveFinalScoreText');
  const tierBadge = document.getElementById('serveTargetConversionTierBadge');
  const summarySentence = document.getElementById('serveTargetSummarySentence');

  const gradeNum = getStudentGradeNum(currentServeTargetStudent);
  const rubric = calculateServeRubricScore(totalPoints, gradeNum, totalAttempts > 0);
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const maxScore = cfg.scores?.A || 50;

  // Directly display raw accumulated target score (e.g. 3, 6, 9... up to 30)
  if (scoreEl) scoreEl.innerText = totalPoints;
  if (countBadge) {
    if (totalAttempts === 0) {
      countBadge.innerText = '0회 시도 (0/30점)';
    } else {
      countBadge.innerText = `${totalAttempts}회 시도 (${successHits}성공 · ${totalPoints}/30점)`;
    }
  }
  if (countText) {
    if (totalAttempts === 0) {
      countText.innerText = '0회';
    } else {
      countText.innerText = `${totalAttempts}회 (성공 ${successHits} / 실패 ${failHits})`;
    }
  }

  if (gradeBadge) {
    gradeBadge.innerText = rubric.gradeName;
    gradeBadge.className = `text-xs sm:text-sm font-black px-4 py-1.5 rounded-xl ${rubric.badgeClass}`;
  }

  // Update Live Conversion Box Elements
  if (rawScoreText) {
    rawScoreText.innerText = `${totalPoints}점 (30점 만점)`;
  }
  if (finalScoreText) {
    finalScoreText.innerText = `${rubric.score}점 (${maxScore}점 만점)`;
  }
  if (tierBadge) {
    if (totalAttempts === 0) {
      tierBadge.innerText = '대기 중 ⏳';
      tierBadge.className = 'text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700';
    } else {
      tierBadge.innerText = `${rubric.tier}구간 확정 ✨`;
      tierBadge.className = `text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded ${rubric.badgeClass}`;
    }
  }
  if (summarySentence) {
    if (totalAttempts === 0) {
      summarySentence.innerHTML = '🎯 과녁 번호(3, 2, 1) 또는 [실패 0점]을 누르면 실시간 환산 점수가 표시됩니다.';
    } else {
      summarySentence.innerHTML = `🎯 과녁에서 <span class="text-amber-300 font-black font-mono text-xs sm:text-sm">${totalPoints}점</span>(30점 만점) 획득 ➔ 수행평가 <span class="text-emerald-300 font-black font-mono text-xs sm:text-sm">${rubric.score}점</span>(${rubric.tier}구간)으로 환산되었습니다!`;
    }
  }

  if (logEl) {
    if (serveTargetHits.length === 0) {
      logEl.innerHTML = '<span class="text-xs text-slate-500">과녁 번호(3, 2, 1) 또는 [실패 0점] 버튼을 누르면 실시간 기록됩니다.</span>';
    } else {
      logEl.innerHTML = serveTargetHits.map((h, i) => {
        let colorClass = 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
        let label = '구석';
        if (h.point === 2) {
          colorClass = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]';
          label = '사이드/라인';
        } else if (h.point === 1) {
          colorClass = 'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
          label = '센터';
        } else if (h.point === 0) {
          colorClass = 'bg-slate-900/90 text-rose-400 border-rose-600/80 shadow-[0_0_8px_rgba(225,29,72,0.4)]';
          label = '실패/아웃 ❌';
        }
        return `<span class="text-xs font-black px-2.5 py-1 rounded-xl border ${colorClass} animate-pop flex items-center space-x-1"><span>#${i + 1}</span><span class="font-mono">${h.point > 0 ? '+' + h.point : '0'}점</span><span>(${label})</span></span>`;
      }).join('');
      logEl.scrollTop = logEl.scrollHeight;
    }
  }
}

function applyServeTargetScore(autoSave = false) {
  const totalPoints = serveTargetHits.reduce((sum, h) => sum + h.point, 0);
  const totalAttempts = serveTargetHits.length;
  const gradeNum = getStudentGradeNum(currentServeTargetStudent);
  const rubric = calculateServeRubricScore(totalPoints, gradeNum, totalAttempts > 0);
  const finalScore = rubric.score;

  const svInput = document.getElementById('assessScoreSv');
  if (svInput) {
    svInput.value = finalScore;
  }

  // Record raw target performance on student object
  if (currentServeTargetStudent) {
    if (!currentServeTargetStudent.assessment) {
      currentServeTargetStudent.assessment = {};
    }
    currentServeTargetStudent.assessment.serveTargetRaw = totalPoints;
    currentServeTargetStudent.assessment.serveTargetAttempts = totalAttempts;
    currentServeTargetStudent.assessment.serve = finalScore;
  }

  // Update Tab 1 Serve Target Result Indicator
  const resultBox = document.getElementById('assessServeTargetResultBox');
  const resultText = document.getElementById('assessServeTargetResultText');
  if (resultBox && resultText) {
    resultText.innerHTML = `과녁 실기 <b class="text-amber-600 font-mono">${totalPoints}점</b>(30점 만점, ${totalAttempts}회) 획득 ➔ <b class="text-emerald-700 font-mono">${finalScore}점</b>(${rubric.tier}구간)으로 환산 반영됨`;
    resultBox.classList.remove('hidden');
  }

  calcAssessmentTotal();
  closeModal('serveTargetModal');

  const conversionMsg = `🎯 과녁에서 ${totalPoints}점(30점 만점)을 얻어 ➔ 수행평가 서브 ${finalScore}점(${rubric.tier}구간)으로 환산 반영되었습니다!`;

  if (autoSave) {
    if (state.role !== 'admin') {
      showToast('선생님 모드에서만 서버 저장이 가능합니다. (점수는 반영됨)', '🔒');
      return;
    }
    saveStudentAssessment();
  } else {
    showToast(conversionMsg, '🎯');
  }
}

function playHitZoneSound(point) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (point === 0) {
      // Miss / Fault low buzz sound
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18); // A2 drop

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
      return;
    }

    let freq = 523.25; // C5 (1 pt)
    if (point === 3) freq = 880; // A5 (3 pt - high bell)
    else if (point === 2) freq = 659.25; // E5 (2 pt)

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    if (point === 3) {
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.08); // C6 sparkle
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {}
}

/* ==========================================================================
   RALLY ASSESSMENT MODULE (학년별 포핸드/백핸드 랠리 실기 수행평가 모듈)
   ========================================================================== */

let currentRallyCount = 0;
let rallyHistory = [];
let currentRallyStudent = null;

function openRallyModal() {
  const studentSelect = document.getElementById('assessmentStudentSelect');
  let studentId = studentSelect?.value;
  
  if (!studentId) {
    const current = getCurrentStudent();
    if (current) studentId = current.id;
  }

  currentRallyStudent = state.students.find(s => s.id === studentId);
  const nameEl = document.getElementById('rallyStudentName');
  const nameElMobile = document.getElementById('rallyStudentNameMobile');
  const modeBadge = document.getElementById('rallyModeBadge');
  const gradeSpecBadge = document.getElementById('rallyGradeSpecBadge');
  const modalTitle = document.getElementById('rallyModalTitle');
  const typeNameText = document.getElementById('rallyTypeNameText');
  const targetGoalBadge = document.getElementById('rallyTargetGoalBadge');

  const gradeNum = getStudentGradeNum(currentRallyStudent);
  const isGrade2 = (gradeNum === 2);
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;

  const thA = isGrade2 ? (cfg.grade2?.rally?.thresholds?.A || 25) : (cfg.grade3?.rally?.thresholds?.A || 30);
  const rallyTypeName = isGrade2 ? '백핸드 쇼트 랠리' : '포핸드 드라이브 랠리';

  if (modalTitle) {
    modalTitle.innerText = `${isGrade2 ? '2학년 백핸드' : '3학년 포핸드'} 랠리 실기 채점판`;
  }
  if (typeNameText) {
    typeNameText.innerText = `${rallyTypeName} (${isGrade2 ? '2학년' : '3학년'})`;
  }
  if (targetGoalBadge) {
    targetGoalBadge.innerText = `A구간 목표: ${thA}회 이상 (${cfg.scores?.A || 50}점)`;
  }
  if (gradeSpecBadge) {
    gradeSpecBadge.innerText = isGrade2 ? `🌱 2학년: 백핸드 쇼트 ${thA}회 이상 A (50점 만점)` : `🎓 3학년: 포핸드 드라이브 ${thA}회 이상 A (50점 만점)`;
  }

  if (currentRallyStudent) {
    const classBadge = formatClassBadge(currentRallyStudent);
    const fullName = `${classBadge} ${currentRallyStudent.name}`;
    if (nameEl) nameEl.innerText = fullName;
    if (nameElMobile) nameElMobile.innerText = fullName;
  } else {
    if (nameEl) nameEl.innerText = '부원 선택 필요';
    if (nameElMobile) nameElMobile.innerText = '부원 선택 필요';
  }

  if (modeBadge) {
    if (state.role === 'admin') {
      modeBadge.className = 'text-xs bg-indigo-600 text-white font-extrabold px-3 py-1 rounded-xl shadow-sm border border-indigo-400/40';
      modeBadge.innerText = '👑 선생님 채점';
    } else {
      modeBadge.className = 'text-xs bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-xl shadow-sm border border-emerald-400/40';
      modeBadge.innerText = '👤 부원 연습 모드';
    }
  }

  currentRallyCount = 0;
  rallyHistory = [];
  updateRallyUI();

  openModal('rallyAssessmentModal');
}

function calculateRallyRubricScore(count, gradeNum = 3) {
  const isGrade2 = (gradeNum === 2);
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const gradeKey = isGrade2 ? 'grade2' : 'grade3';
  const th = cfg[gradeKey]?.rally?.thresholds || (isGrade2 ? { A: 25, B: 19, C: 13, D: 7 } : { A: 30, B: 23, C: 16, D: 9 });
  const sc = cfg.scores || { A: 50, B: 42, C: 35, D: 28, E: 20 };

  if (count <= 0) {
    return { score: 0, tier: '-', tierName: '미평가', gradeName: '미평가 📋', badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700' };
  }
  if (count >= th.A) {
    return { score: sc.A, tier: 'A', tierName: 'A', gradeName: `A (${sc.A}점 환산 🥇)`, badgeClass: 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-300' };
  }
  if (count >= th.B) {
    return { score: sc.B, tier: 'B', tierName: 'B', gradeName: `B (${sc.B}점 환산 🥈)`, badgeClass: 'bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.6)] border border-emerald-300' };
  }
  if (count >= th.C) {
    return { score: sc.C, tier: 'C', tierName: 'C', gradeName: `C (${sc.C}점 환산 🥉)`, badgeClass: 'bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.6)] border border-sky-300' };
  }
  if (count >= th.D) {
    return { score: sc.D, tier: 'D', tierName: 'D', gradeName: `D (${sc.D}점 환산 🌱)`, badgeClass: 'bg-orange-400 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.6)] border border-orange-300' };
  }
  return { score: sc.E, tier: 'E', tierName: 'E', gradeName: `E (${sc.E}점 환산 ⚠️)`, badgeClass: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400' };
}

function addRallyCount(amount = 1) {
  const prev = currentRallyCount;
  currentRallyCount = Math.max(0, currentRallyCount + amount);
  rallyHistory.push({ amount, count: currentRallyCount, time: Date.now() });

  playRallyHitSound(currentRallyCount);
  updateRallyUI();
}

function undoRallyCount() {
  if (rallyHistory.length === 0) {
    if (currentRallyCount > 0) {
      currentRallyCount = Math.max(0, currentRallyCount - 1);
      updateRallyUI();
      showToast('랠리 카운트가 1회 감소되었습니다.', '↩️');
    } else {
      showToast('취소할 랠리 기록이 없습니다.', '⚠️');
    }
    return;
  }
  const last = rallyHistory.pop();
  currentRallyCount = Math.max(0, currentRallyCount - last.amount);
  showToast(`마지막 +${last.amount}회 기록이 취소되었습니다. (현재 ${currentRallyCount}회)`, '↩️');
  updateRallyUI();
}

function resetRallyCount() {
  if (currentRallyCount === 0 && rallyHistory.length === 0) return;
  currentRallyCount = 0;
  rallyHistory = [];
  updateRallyUI();
  showToast('랠리 카운트가 0회로 초기화되었습니다.', '🔄');
}

function updateRallyUI() {
  const gradeNum = getStudentGradeNum(currentRallyStudent);
  const isGrade2 = (gradeNum === 2);
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const gradeKey = isGrade2 ? 'grade2' : 'grade3';
  const th = cfg[gradeKey]?.rally?.thresholds || (isGrade2 ? { A: 25, B: 19, C: 13, D: 7 } : { A: 30, B: 23, C: 16, D: 9 });
  const sc = cfg.scores || { A: 50, B: 42, C: 35, D: 28, E: 20 };
  const maxScore = sc.A || 50;

  const rubric = calculateRallyRubricScore(currentRallyCount, gradeNum);

  const countText = document.getElementById('rallyCurrentCountText');
  const countBadge = document.getElementById('rallyCountBadge');
  const gradeBadge = document.getElementById('rallyGradeBadge');
  const progressHint = document.getElementById('rallyTierProgressHint');
  const rawCountText = document.getElementById('rallyLiveRawCountText');
  const finalScoreText = document.getElementById('rallyLiveFinalScoreText');
  const tierBadge = document.getElementById('rallyConversionTierBadge');
  const summarySentence = document.getElementById('rallySummarySentence');
  const statusText = document.getElementById('rallyProgressStatusText');
  const milestoneContainer = document.getElementById('rallyMilestoneChips');

  if (countText) countText.innerText = currentRallyCount;
  if (countBadge) {
    if (currentRallyCount === 0) {
      countBadge.innerText = '0회 연속 성공';
    } else {
      countBadge.innerText = `${currentRallyCount}회 연속 성공 🔥`;
    }
  }

  if (gradeBadge) {
    gradeBadge.innerText = rubric.gradeName;
    gradeBadge.className = `text-xs sm:text-sm font-black px-4 py-1.5 rounded-xl ${rubric.badgeClass}`;
  }

  // Next tier progress hint
  if (progressHint) {
    if (currentRallyCount >= th.A) {
      progressHint.innerText = `🎉 최고 등급 A구간 달성! (${th.A}회 이상)`;
    } else if (currentRallyCount >= th.B) {
      progressHint.innerText = `A구간까지 +${th.A - currentRallyCount}회 더 필요`;
    } else if (currentRallyCount >= th.C) {
      progressHint.innerText = `B구간까지 +${th.B - currentRallyCount}회 더 필요`;
    } else if (currentRallyCount >= th.D) {
      progressHint.innerText = `C구간까지 +${th.C - currentRallyCount}회 더 필요`;
    } else {
      progressHint.innerText = `D구간까지 +${th.D - currentRallyCount}회 더 필요`;
    }
  }

  // Real-time conversion card
  if (rawCountText) {
    rawCountText.innerText = `${currentRallyCount}회 성공`;
  }
  if (finalScoreText) {
    finalScoreText.innerText = `${rubric.score}점 (${maxScore}점 만점)`;
  }
  if (tierBadge) {
    if (currentRallyCount === 0) {
      tierBadge.innerText = '대기 중 ⏳';
      tierBadge.className = 'text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700';
    } else {
      tierBadge.innerText = `${rubric.tier}구간 확정 ✨`;
      tierBadge.className = `text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded ${rubric.badgeClass}`;
    }
  }

  if (summarySentence) {
    if (currentRallyCount === 0) {
      summarySentence.innerHTML = '🏓 화면의 [랠리 성공!] 버튼을 터치하면 실시간 환산 점수가 계산됩니다.';
    } else {
      const rallyName = isGrade2 ? '백핸드 쇼트' : '포핸드 드라이브';
      summarySentence.innerHTML = `🏓 ${rallyName} <span class="text-cyan-300 font-black font-mono text-xs sm:text-sm">${currentRallyCount}회</span> 연속 성공 ➔ 수행평가 <span class="text-emerald-300 font-black font-mono text-xs sm:text-sm">${rubric.score}점</span>(${rubric.tier}구간)으로 환산되었습니다!`;
    }
  }

  // Progress percentage toward A goal
  const pct = Math.min(100, Math.round((currentRallyCount / th.A) * 100));
  if (statusText) statusText.innerText = `${pct}% 달성 (${currentRallyCount}/${th.A}회)`;

  // Milestones
  if (milestoneContainer) {
    const milestones = [
      { name: 'A구간', count: th.A, score: sc.A, icon: '🥇', achieved: currentRallyCount >= th.A },
      { name: 'B구간', count: th.B, score: sc.B, icon: '🥈', achieved: currentRallyCount >= th.B },
      { name: 'C구간', count: th.C, score: sc.C, icon: '🥉', achieved: currentRallyCount >= th.C },
      { name: 'D구간', count: th.D, score: sc.D, icon: '🌱', achieved: currentRallyCount >= th.D }
    ];

    milestoneContainer.innerHTML = milestones.map(m => {
      if (m.achieved) {
        return `<span class="text-xs font-black px-2.5 py-1 rounded-xl border bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)] flex items-center space-x-1 animate-pop"><span>${m.icon} ${m.name}</span><span class="font-mono">(${m.count}회+)</span><span>✔ 달성!</span></span>`;
      } else {
        return `<span class="text-xs font-bold px-2 py-1 rounded-xl border bg-slate-900/60 text-slate-500 border-slate-800 flex items-center space-x-1 opacity-70"><span>${m.icon} ${m.name}</span><span class="font-mono">(${m.count}회)</span></span>`;
      }
    }).join('');
  }
}

function applyRallyScore(autoSave = false) {
  const gradeNum = getStudentGradeNum(currentRallyStudent);
  const isGrade2 = (gradeNum === 2);
  const rubric = calculateRallyRubricScore(currentRallyCount, gradeNum);
  const finalScore = rubric.score;

  const fhInput = document.getElementById('assessScoreFh');
  if (fhInput) {
    fhInput.value = finalScore;
  }

  // Record raw rally performance on student object
  if (currentRallyStudent) {
    if (!currentRallyStudent.assessment) {
      currentRallyStudent.assessment = {};
    }
    currentRallyStudent.assessment.rallyCountRaw = currentRallyCount;
    currentRallyStudent.assessment.rally = finalScore;
    if (isGrade2) {
      currentRallyStudent.assessment.backhand = finalScore;
    } else {
      currentRallyStudent.assessment.forehand = finalScore;
    }
  }

  // Update Tab 1 Rally Result Indicator
  const resultBox = document.getElementById('assessRallyResultBox');
  const resultText = document.getElementById('assessRallyResultText');
  const rallyTypeName = isGrade2 ? '백핸드 쇼트' : '포핸드 드라이브';
  if (resultBox && resultText) {
    resultText.innerHTML = `${rallyTypeName} 실기 <b class="text-cyan-600 font-mono">${currentRallyCount}회</b> 성공 ➔ <b class="text-emerald-700 font-mono">${finalScore}점</b>(${rubric.tier}구간)으로 환산 반영됨`;
    resultBox.classList.remove('hidden');
  }

  calcAssessmentTotal();
  closeModal('rallyAssessmentModal');

  const conversionMsg = `🏓 랠리 ${currentRallyCount}회 성공을 달성하여 ➔ 수행평가 ${rallyTypeName} ${finalScore}점(${rubric.tier}구간)으로 환산 반영되었습니다!`;

  if (autoSave) {
    if (state.role !== 'admin') {
      showToast('선생님 모드에서만 서버 저장이 가능합니다. (점수는 반영됨)', '🔒');
      return;
    }
    saveStudentAssessment();
  } else {
    showToast(conversionMsg, '🏓');
  }
}

function playRallyHitSound(count) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Ping pong ball crisp table bounce sound with slight pitch variation
    const baseFreq = 700 + ((count % 10) * 25);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.09);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {}
}

/* ==========================================================================
   BADMINTON SERVE ASSESSMENT MODULE (배드민턴 서브 3·2·1점 구역 채점판 모듈)
   ========================================================================== */

let bmServeHits = [];
let currentBmServeStudent = null;

function openBadmintonServeModal() {
  const studentSelect = document.getElementById('assessmentStudentSelect');
  let studentId = studentSelect?.value;

  if (!studentId) {
    const current = getCurrentStudent();
    if (current) studentId = current.id;
  }

  currentBmServeStudent = state.students.find(s => s.id === studentId);
  const nameEl = document.getElementById('bmServeStudentName');
  const nameElMobile = document.getElementById('bmServeStudentNameMobile');
  const modeBadge = document.getElementById('bmServeModeBadge');
  const specBadge = document.getElementById('bmServeGradeSpecBadge');
  const goalHint = document.getElementById('bmServeGoalHintText');

  const gradeNum = getStudentGradeNum(currentBmServeStudent);
  const isGrade2 = (gradeNum === 2);
  const gradeKey = isGrade2 ? 'grade2' : 'grade3';
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const bmGradeCfg = cfg.badminton?.[gradeKey] || DEFAULT_ASSESSMENT_CONFIG.badminton[gradeKey];
  const bmSvThA = bmGradeCfg?.serve?.thresholds?.A || (isGrade2 ? 25 : 26);
  const maxScore = cfg.scores?.A || 50;

  if (specBadge) {
    specBadge.innerText = isGrade2 ? `🌱 2학년 배드민턴: 10회 중 ${bmSvThA}점 이상 ${maxScore}점(A) · 30점 만점` : `🎓 3학년 배드민턴: 10회 중 ${bmSvThA}점 이상 ${maxScore}점(A) · 30점 만점`;
  }
  if (goalHint) {
    goalHint.innerText = `${isGrade2 ? '2학년' : '3학년'}: 10회 시도 (${bmSvThA}점 이상 ${maxScore}점)`;
  }

  if (currentBmServeStudent) {
    const classBadge = formatClassBadge(currentBmServeStudent);
    const fullName = `${classBadge} ${currentBmServeStudent.name}`;
    if (nameEl) nameEl.innerText = fullName;
    if (nameElMobile) nameElMobile.innerText = fullName;
  } else {
    if (nameEl) nameEl.innerText = '부원 선택 필요';
    if (nameElMobile) nameElMobile.innerText = '부원 선택 필요';
  }

  if (modeBadge) {
    if (state.role === 'admin') {
      modeBadge.className = 'text-xs bg-indigo-600 text-white font-extrabold px-3 py-1 rounded-xl shadow-sm border border-indigo-400/40';
      modeBadge.innerText = '👑 선생님 채점';
    } else {
      modeBadge.className = 'text-xs bg-sky-600 text-white font-extrabold px-3 py-1 rounded-xl shadow-sm border border-sky-400/40';
      modeBadge.innerText = '👤 부원 연습 모드';
    }
  }

  bmServeHits = [];
  updateBmServeUI();

  openModal('badmintonServeModal');
}

function calculateBmServeRubricScore(rawPoints, gradeNum = 3, hasAttempts = false) {
  const isGrade2 = (gradeNum === 2);
  const gradeKey = isGrade2 ? 'grade2' : 'grade3';
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const bmGradeCfg = cfg.badminton?.[gradeKey] || DEFAULT_ASSESSMENT_CONFIG.badminton[gradeKey];
  const th = bmGradeCfg?.serve?.thresholds || (isGrade2 ? { A: 25, B: 21, C: 17, D: 13 } : { A: 26, B: 22, C: 18, D: 14 });
  const sc = cfg.scores || { A: 50, B: 42, C: 35, D: 28, E: 20 };

  if (rawPoints <= 0 && !hasAttempts) {
    return { score: 0, tier: '-', tierName: '미평가', gradeName: '미평가 📋', badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700' };
  }
  if (rawPoints <= 0 && hasAttempts) {
    return { score: sc.E, tier: 'E', tierName: 'E', gradeName: `E (${sc.E}점 환산 ⚠️)`, badgeClass: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400' };
  }

  if (rawPoints >= th.A) {
    return { score: sc.A, tier: 'A', tierName: 'A', gradeName: `A (${sc.A}점 환산 🥇)`, badgeClass: 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-300' };
  }
  if (rawPoints >= th.B) {
    return { score: sc.B, tier: 'B', tierName: 'B', gradeName: `B (${sc.B}점 환산 🥈)`, badgeClass: 'bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.6)] border border-emerald-300' };
  }
  if (rawPoints >= th.C) {
    return { score: sc.C, tier: 'C', tierName: 'C', gradeName: `C (${sc.C}점 환산 🥉)`, badgeClass: 'bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.6)] border border-sky-300' };
  }
  if (rawPoints >= th.D) {
    return { score: sc.D, tier: 'D', tierName: 'D', gradeName: `D (${sc.D}점 환산 🌱)`, badgeClass: 'bg-orange-400 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.6)] border border-orange-300' };
  }
  return { score: sc.E, tier: 'E', tierName: 'E', gradeName: `E (${sc.E}점 환산 ⚠️)`, badgeClass: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400' };
}

function hitBmServeZone(point, name, index) {
  if (bmServeHits.length >= 10) {
    showToast('이미 10회 시도가 모두 기록되었습니다. (수정하려면 1회 취소 또는 초기화를 눌러주세요)', '⚠️');
    return;
  }

  bmServeHits.push({
    point: point,
    name: name,
    index: index,
    time: Date.now()
  });

  playHitZoneSound(point);
  updateBmServeUI();
}

function undoBmServeHit() {
  if (bmServeHits.length === 0) {
    showToast('취소할 배드민턴 서브 기록이 없습니다.', '⚠️');
    return;
  }
  const removed = bmServeHits.pop();
  showToast(`마지막 ${removed.point}점 (${removed.name}) 기록이 취소되었습니다.`, '↩️');
  updateBmServeUI();
}

function resetBmServeHits() {
  if (bmServeHits.length === 0) return;
  bmServeHits = [];
  updateBmServeUI();
  showToast('배드민턴 서브 타격 기록이 0점으로 초기화되었습니다.', '🔄');
}

function updateBmServeUI() {
  const totalPoints = bmServeHits.reduce((sum, h) => sum + h.point, 0);
  const totalAttempts = bmServeHits.length;
  const successHits = bmServeHits.filter(h => h.point > 0).length;
  const failHits = bmServeHits.filter(h => h.point === 0).length;

  const scoreEl = document.getElementById('bmServeCurrentScore');
  const countBadge = document.getElementById('bmServeHitCountBadge');
  const countText = document.getElementById('bmServeHitCountText');
  const logEl = document.getElementById('bmServeHitLog');
  const gradeBadge = document.getElementById('bmServeGradeBadge');

  const rawScoreText = document.getElementById('bmServeLiveRawScoreText');
  const finalScoreText = document.getElementById('bmServeLiveFinalScoreText');
  const tierBadge = document.getElementById('bmServeConversionTierBadge');
  const summarySentence = document.getElementById('bmServeSummarySentence');

  const gradeNum = getStudentGradeNum(currentBmServeStudent);
  const rubric = calculateBmServeRubricScore(totalPoints, gradeNum, totalAttempts > 0);
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const maxScore = cfg.scores?.A || 50;

  if (scoreEl) scoreEl.innerText = totalPoints;
  if (countBadge) {
    if (totalAttempts === 0) {
      countBadge.innerText = '0 / 10회 시도 (0/30점)';
    } else {
      countBadge.innerText = `${totalAttempts} / 10회 시도 (${successHits}성공 · ${totalPoints}/30점)`;
    }
  }
  if (countText) {
    if (totalAttempts === 0) {
      countText.innerText = '0 / 10회';
    } else {
      countText.innerText = `${totalAttempts}/10회 (성공 ${successHits} / 폴트 ${failHits})`;
    }
  }

  if (gradeBadge) {
    gradeBadge.innerText = rubric.gradeName;
    gradeBadge.className = `text-xs sm:text-sm font-black px-4 py-1.5 rounded-xl ${rubric.badgeClass}`;
  }

  if (rawScoreText) {
    rawScoreText.innerText = `${totalPoints}점 (30점 만점)`;
  }
  if (finalScoreText) {
    finalScoreText.innerText = `${rubric.score}점 (${maxScore}점 만점)`;
  }
  if (tierBadge) {
    if (totalAttempts === 0) {
      tierBadge.innerText = '대기 중 ⏳';
      tierBadge.className = 'text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700';
    } else {
      tierBadge.innerText = `${rubric.tier}구간 확정 ✨`;
      tierBadge.className = `text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded ${rubric.badgeClass}`;
    }
  }
  if (summarySentence) {
    if (totalAttempts === 0) {
      summarySentence.innerHTML = '🏸 배드민턴 서브 구역(3, 2, 1) 또는 [실패 0점]을 누르면 실시간 환산 점수가 표시됩니다.';
    } else {
      summarySentence.innerHTML = `🏸 서브 구역에서 <span class="text-amber-300 font-black font-mono text-xs sm:text-sm">${totalPoints}점</span>(30점 만점, ${totalAttempts}회) 획득 ➔ 수행평가 <span class="text-sky-300 font-black font-mono text-xs sm:text-sm">${rubric.score}점</span>(${rubric.tier}구간)으로 환산되었습니다!`;
    }
  }

  if (logEl) {
    if (bmServeHits.length === 0) {
      logEl.innerHTML = '<span class="text-xs text-slate-500">서브 구역(3, 2, 1점) 또는 [폴트 0점] 버튼을 누르면 실시간 기록됩니다.</span>';
    } else {
      logEl.innerHTML = bmServeHits.map((h, i) => {
        let colorClass = 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
        let label = '코너/라인';
        if (h.point === 2) {
          colorClass = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]';
          label = '사이드/경계';
        } else if (h.point === 1) {
          colorClass = 'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
          label = '센터';
        } else if (h.point === 0) {
          colorClass = 'bg-slate-900/90 text-rose-400 border-rose-600/80 shadow-[0_0_8px_rgba(225,29,72,0.4)]';
          label = '폴트/아웃 ❌';
        }
        return `<span class="text-xs font-black px-2.5 py-1 rounded-xl border ${colorClass} animate-pop flex items-center space-x-1"><span>#${i + 1}</span><span class="font-mono">${h.point > 0 ? '+' + h.point : '0'}점</span><span>(${label})</span></span>`;
      }).join('');
      logEl.scrollTop = logEl.scrollHeight;
    }
  }
}

function applyBmServeScore(autoSave = false) {
  const totalPoints = bmServeHits.reduce((sum, h) => sum + h.point, 0);
  const totalAttempts = bmServeHits.length;
  const gradeNum = getStudentGradeNum(currentBmServeStudent);
  const rubric = calculateBmServeRubricScore(totalPoints, gradeNum, totalAttempts > 0);
  const finalScore = rubric.score;

  const bmSvInput = document.getElementById('assessScoreBmSv');
  if (bmSvInput) {
    bmSvInput.value = finalScore;
  }

  if (currentBmServeStudent) {
    if (!currentBmServeStudent.assessment) {
      currentBmServeStudent.assessment = {};
    }
    currentBmServeStudent.assessment.bmServeRaw = totalPoints;
    currentBmServeStudent.assessment.bmServeAttempts = totalAttempts;
    currentBmServeStudent.assessment.bmServe = finalScore;
  }

  const resultBox = document.getElementById('assessBmServeResultBox');
  const resultText = document.getElementById('assessBmServeResultText');
  if (resultBox && resultText) {
    resultText.innerHTML = `배드민턴 서브 실기 <b class="text-amber-600 font-mono">${totalPoints}점</b>(30점 만점, ${totalAttempts}회) 획득 ➔ <b class="text-sky-700 font-mono">${finalScore}점</b>(${rubric.tier}구간)으로 환산 반영됨`;
    resultBox.classList.remove('hidden');
  }

  calcAssessmentTotal();
  closeModal('badmintonServeModal');

  const conversionMsg = `🏸 배드민턴 서브 ${totalPoints}점(30점 만점)을 얻어 ➔ 수행평가 ${finalScore}점(${rubric.tier}구간)으로 환산 반영되었습니다!`;

  if (autoSave) {
    if (state.role !== 'admin') {
      showToast('선생님 모드에서만 서버 저장이 가능합니다. (점수는 반영됨)', '🔒');
      return;
    }
    saveStudentAssessment();
  } else {
    showToast(conversionMsg, '🏸');
  }
}

/* ==========================================================================
   BADMINTON HIGH CLEAR ASSESSMENT MODULE (배드민턴 하이클리어 10회 실기 채점판)
   ========================================================================== */

let bmClearShots = []; // array of booleans (true = IN, false = OUT)
let currentBmClearStudent = null;

function openBadmintonClearModal() {
  const studentSelect = document.getElementById('assessmentStudentSelect');
  let studentId = studentSelect?.value;

  if (!studentId) {
    const current = getCurrentStudent();
    if (current) studentId = current.id;
  }

  currentBmClearStudent = state.students.find(s => s.id === studentId);
  const nameEl = document.getElementById('bmClearStudentName');
  const nameElMobile = document.getElementById('bmClearStudentNameMobile');
  const modeBadge = document.getElementById('bmClearModeBadge');
  const specBadge = document.getElementById('bmClearGradeSpecBadge');
  const targetGoalBadge = document.getElementById('bmClearTargetGoalBadge');

  const gradeNum = getStudentGradeNum(currentBmClearStudent);
  const isGrade2 = (gradeNum === 2);
  const gradeKey = isGrade2 ? 'grade2' : 'grade3';
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const bmGradeCfg = cfg.badminton?.[gradeKey] || DEFAULT_ASSESSMENT_CONFIG.badminton[gradeKey];
  const thA = bmGradeCfg?.clear?.thresholds?.A || (isGrade2 ? 7 : 8);
  const maxScore = cfg.scores?.A || 50;

  if (specBadge) {
    specBadge.innerText = isGrade2 ? `🌱 2학년: 10회 중 목표 구역 ${thA}회 이상 성공 시 ${maxScore}점(A)` : `🎓 3학년: 10회 중 목표 구역 ${thA}회 이상 성공 시 ${maxScore}점(A)`;
  }
  if (targetGoalBadge) {
    targetGoalBadge.innerText = `${isGrade2 ? '2학년' : '3학년'} 목표: 10회 중 ${thA}회 이상 ➔ ${maxScore}점(A)`;
  }

  if (currentBmClearStudent) {
    const classBadge = formatClassBadge(currentBmClearStudent);
    const fullName = `${classBadge} ${currentBmClearStudent.name}`;
    if (nameEl) nameEl.innerText = fullName;
    if (nameElMobile) nameElMobile.innerText = fullName;
  } else {
    if (nameEl) nameEl.innerText = '부원 선택 필요';
    if (nameElMobile) nameElMobile.innerText = '부원 선택 필요';
  }

  if (modeBadge) {
    if (state.role === 'admin') {
      modeBadge.className = 'text-xs bg-indigo-600 text-white font-extrabold px-3 py-1 rounded-xl shadow-sm border border-indigo-400/40';
      modeBadge.innerText = '👑 선생님 채점';
    } else {
      modeBadge.className = 'text-xs bg-sky-600 text-white font-extrabold px-3 py-1 rounded-xl shadow-sm border border-sky-400/40';
      modeBadge.innerText = '👤 부원 연습 모드';
    }
  }

  bmClearShots = [];
  updateBmClearUI();

  openModal('badmintonClearModal');
}

function calculateBmClearRubricScore(successCount, gradeNum = 3, hasAttempts = false) {
  const isGrade2 = (gradeNum === 2);
  const gradeKey = isGrade2 ? 'grade2' : 'grade3';
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const bmGradeCfg = cfg.badminton?.[gradeKey] || DEFAULT_ASSESSMENT_CONFIG.badminton[gradeKey];
  const th = bmGradeCfg?.clear?.thresholds || (isGrade2 ? { A: 7, B: 5, C: 3, D: 1 } : { A: 8, B: 6, C: 4, D: 2 });
  const sc = cfg.scores || { A: 50, B: 42, C: 35, D: 28, E: 20 };

  if (successCount <= 0 && !hasAttempts) {
    return { score: 0, tier: '-', tierName: '미평가', gradeName: '미평가 📋', badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700' };
  }
  if (successCount <= 0 && hasAttempts) {
    return { score: sc.E, tier: 'E', tierName: 'E', gradeName: `E (${sc.E}점 환산 ⚠️)`, badgeClass: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400' };
  }

  if (successCount >= th.A) {
    return { score: sc.A, tier: 'A', tierName: 'A', gradeName: `A (${sc.A}점 환산 🥇)`, badgeClass: 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-300' };
  }
  if (successCount >= th.B) {
    return { score: sc.B, tier: 'B', tierName: 'B', gradeName: `B (${sc.B}점 환산 🥈)`, badgeClass: 'bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.6)] border border-emerald-300' };
  }
  if (successCount >= th.C) {
    return { score: sc.C, tier: 'C', tierName: 'C', gradeName: `C (${sc.C}점 환산 🥉)`, badgeClass: 'bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.6)] border border-sky-300' };
  }
  if (successCount >= th.D) {
    return { score: sc.D, tier: 'D', tierName: 'D', gradeName: `D (${sc.D}점 환산 🌱)`, badgeClass: 'bg-orange-400 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.6)] border border-orange-300' };
  }
  return { score: sc.E, tier: 'E', tierName: 'E', gradeName: `E (${sc.E}점 환산 ⚠️)`, badgeClass: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400' };
}

function recordBmClearShot(isSuccess) {
  if (bmClearShots.length >= 10) {
    showToast('이미 10회 시도가 모두 완료되었습니다! (수정하려면 1회 취소 또는 초기화를 눌러주세요)', '⚠️');
    return;
  }

  bmClearShots.push(Boolean(isSuccess));
  playShuttleHitSound(isSuccess);
  updateBmClearUI();
}

function undoBmClearShot() {
  if (bmClearShots.length === 0) {
    showToast('취소할 하이클리어 기록이 없습니다.', '⚠️');
    return;
  }
  const removed = bmClearShots.pop();
  showToast(`마지막 #${bmClearShots.length + 1}차 (${removed ? '구역 IN 성공' : 'OUT/실패'}) 기록이 취소되었습니다.`, '↩️');
  updateBmClearUI();
}

function resetBmClearShots() {
  if (bmClearShots.length === 0) return;
  bmClearShots = [];
  updateBmClearUI();
  showToast('하이클리어 10회 타격 기록이 초기화되었습니다.', '🔄');
}

function updateBmClearUI() {
  const totalAttempts = bmClearShots.length;
  const successCount = bmClearShots.filter(Boolean).length;
  const failCount = totalAttempts - successCount;

  const gradeNum = getStudentGradeNum(currentBmClearStudent);
  const isGrade2 = (gradeNum === 2);
  const gradeKey = isGrade2 ? 'grade2' : 'grade3';
  const cfg = state.assessmentConfig || DEFAULT_ASSESSMENT_CONFIG;
  const bmGradeCfg = cfg.badminton?.[gradeKey] || DEFAULT_ASSESSMENT_CONFIG.badminton[gradeKey];
  const th = bmGradeCfg?.clear?.thresholds || (isGrade2 ? { A: 7, B: 5, C: 3, D: 1 } : { A: 8, B: 6, C: 4, D: 2 });
  const sc = cfg.scores || { A: 50, B: 42, C: 35, D: 28, E: 20 };
  const maxScore = sc.A || 50;

  const rubric = calculateBmClearRubricScore(successCount, gradeNum, totalAttempts > 0);

  const countText = document.getElementById('bmClearCurrentSuccessText');
  const attemptBadge = document.getElementById('bmClearCountBadge');
  const attemptCounterText = document.getElementById('bmClearAttemptCounterText');
  const gradeBadge = document.getElementById('bmClearGradeBadge');
  const progressHint = document.getElementById('bmClearTierProgressHint');
  const slotsContainer = document.getElementById('bmClearShotSlotsGrid');
  const rawCountText = document.getElementById('bmClearLiveRawCountText');
  const finalScoreText = document.getElementById('bmClearLiveFinalScoreText');
  const tierBadge = document.getElementById('bmClearConversionTierBadge');
  const summarySentence = document.getElementById('bmClearSummarySentence');
  const shotLogSummary = document.getElementById('bmClearShotLogSummary');
  const shotLog = document.getElementById('bmClearShotLog');

  if (countText) countText.innerText = successCount;
  if (attemptBadge) {
    if (totalAttempts === 0) {
      attemptBadge.innerText = '0회 시도 (0회 성공)';
    } else {
      attemptBadge.innerText = `${totalAttempts}/10회 시도 (IN ${successCount} · OUT ${failCount})`;
    }
  }
  if (attemptCounterText) {
    attemptCounterText.innerText = `${totalAttempts} / 10회 완료 (성공 ${successCount}회)`;
  }

  if (gradeBadge) {
    gradeBadge.innerText = rubric.gradeName;
    gradeBadge.className = `text-[10px] sm:text-xs md:text-sm font-black px-3 py-1 rounded-xl ${rubric.badgeClass}`;
  }

  if (progressHint) {
    if (successCount >= th.A) {
      progressHint.innerText = `🎉 최고 등급 A구간 달성! (${th.A}회 이상 성공)`;
    } else {
      const remainingShots = 10 - totalAttempts;
      const neededForA = th.A - successCount;
      if (neededForA <= remainingShots) {
        progressHint.innerText = `A구간(${th.A}회)까지 +${neededForA}회 더 성공 필요 (남은 기회 ${remainingShots}회)`;
      } else {
        progressHint.innerText = `남은 기회 ${remainingShots}회 · 최선을 다해 성공 횟수를 높이세요!`;
      }
    }
  }

  // Render 10 Shot Progress Slots
  if (slotsContainer) {
    let slotsHtml = '';
    for (let i = 0; i < 10; i++) {
      if (i < bmClearShots.length) {
        const isOk = bmClearShots[i];
        if (isOk) {
          slotsHtml += `<div class="h-8 sm:h-9 rounded-lg bg-emerald-500 border border-emerald-300 text-slate-950 font-black text-[10px] sm:text-xs flex flex-col items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pop leading-none"><span>#${i + 1}</span><span class="text-[9px]">⭕IN</span></div>`;
        } else {
          slotsHtml += `<div class="h-8 sm:h-9 rounded-lg bg-rose-950/90 border border-rose-500/70 text-rose-300 font-black text-[10px] sm:text-xs flex flex-col items-center justify-center leading-none"><span>#${i + 1}</span><span class="text-[9px]">❌OUT</span></div>`;
        }
      } else {
        slotsHtml += `<div class="h-8 sm:h-9 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-500 font-bold text-[10px] flex items-center justify-center">#${i + 1}</div>`;
      }
    }
    slotsContainer.innerHTML = slotsHtml;
  }

  if (rawCountText) {
    rawCountText.innerText = `${successCount}회 (${totalAttempts}/10회)`;
  }
  if (finalScoreText) {
    finalScoreText.innerText = `${rubric.score}점 (${maxScore}점 만점)`;
  }
  if (tierBadge) {
    if (totalAttempts === 0) {
      tierBadge.innerText = '대기 중 ⏳';
      tierBadge.className = 'text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700';
    } else {
      tierBadge.innerText = `${rubric.tier}구간 확정 ✨`;
      tierBadge.className = `text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded ${rubric.badgeClass}`;
    }
  }

  if (summarySentence) {
    if (totalAttempts === 0) {
      summarySentence.innerHTML = '🚀 [성공(IN)] 또는 [실패(OUT)] 버튼을 누르면 실시간 환산 점수가 표시됩니다.';
    } else {
      summarySentence.innerHTML = `🚀 하이클리어 10회 중 <span class="text-cyan-300 font-black font-mono text-xs sm:text-sm">${successCount}회</span> 구역 IN 성공 ➔ 수행평가 <span class="text-emerald-300 font-black font-mono text-xs sm:text-sm">${rubric.score}점</span>(${rubric.tier}구간)으로 환산되었습니다!`;
    }
  }

  if (shotLogSummary) {
    shotLogSummary.innerText = `${totalAttempts}/10회 시도 (IN ${successCount} · OUT ${failCount})`;
  }

  if (shotLog) {
    if (bmClearShots.length === 0) {
      shotLog.innerHTML = '<span class="text-[11px] text-slate-500">타구 결과(성공/실패) 터치 시 순서대로 기록됩니다.</span>';
    } else {
      shotLog.innerHTML = bmClearShots.map((isOk, i) => {
        if (isOk) {
          return `<span class="text-xs font-black px-2.5 py-1 rounded-xl border bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)] flex items-center space-x-1 animate-pop"><span>#${i + 1}구</span><span>⭕ IN 성공</span></span>`;
        } else {
          return `<span class="text-xs font-black px-2.5 py-1 rounded-xl border bg-slate-900/90 text-rose-400 border-rose-600/70 flex items-center space-x-1 animate-pop"><span>#${i + 1}구</span><span>❌ OUT/미달</span></span>`;
        }
      }).join('');
      shotLog.scrollTop = shotLog.scrollHeight;
    }
  }
}

function applyBmClearScore(autoSave = false) {
  const totalAttempts = bmClearShots.length;
  const successCount = bmClearShots.filter(Boolean).length;
  const gradeNum = getStudentGradeNum(currentBmClearStudent);
  const rubric = calculateBmClearRubricScore(successCount, gradeNum, totalAttempts > 0);
  const finalScore = rubric.score;

  const bmClInput = document.getElementById('assessScoreBmCl');
  if (bmClInput) {
    bmClInput.value = finalScore;
  }

  if (currentBmClearStudent) {
    if (!currentBmClearStudent.assessment) {
      currentBmClearStudent.assessment = {};
    }
    currentBmClearStudent.assessment.bmClearRaw = successCount;
    currentBmClearStudent.assessment.bmClearAttempts = totalAttempts || 10;
    currentBmClearStudent.assessment.bmClear = finalScore;
  }

  const resultBox = document.getElementById('assessBmClearResultBox');
  const resultText = document.getElementById('assessBmClearResultText');
  if (resultBox && resultText) {
    resultText.innerHTML = `하이클리어 실기 <b class="text-sky-600 font-mono">${successCount}/${totalAttempts || 10}회</b> 구역 IN 성공 ➔ <b class="text-sky-700 font-mono">${finalScore}점</b>(${rubric.tier}구간)으로 환산 반영됨`;
    resultBox.classList.remove('hidden');
  }

  calcAssessmentTotal();
  closeModal('badmintonClearModal');

  const conversionMsg = `🏸 하이클리어 ${successCount}회 성공을 달성하여 ➔ 수행평가 ${finalScore}점(${rubric.tier}구간)으로 환산 반영되었습니다!`;

  if (autoSave) {
    if (state.role !== 'admin') {
      showToast('선생님 모드에서만 서버 저장이 가능합니다. (점수는 반영됨)', '🔒');
      return;
    }
    saveStudentAssessment();
  } else {
    showToast(conversionMsg, '🏸');
  }
}

function playShuttleHitSound(isSuccess) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (!isSuccess) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      return;
    }

    osc.type = 'sine';
    osc.frequency.setValueAtTime(784, now); // G5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.1); // D6
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.26, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {}
}
