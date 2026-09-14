/* TABLE TENNIS PERFORMANCE ASSESSMENT (수행평가 관리 및 채점 모듈) */

let assessmentCurrentTab = 'form'; // 'form' | 'rubric' | 'overview'
let isOverviewInlineMode = false;

function openAssessmentModal(initialTab = 'form') {
  const isAdmin = state.role === 'admin';
  const modeBadge = document.getElementById('assessmentModeBadge');
  const teacherActionBox = document.getElementById('assessmentTeacherActionBox');
  const studentNoticeBox = document.getElementById('assessmentStudentNoticeBox');
  const commentInput = document.getElementById('assessmentCommentInput');
  const studentSelect = document.getElementById('assessmentStudentSelect');
  const classSelect = document.getElementById('assessmentClassSelect');

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

  if (tab === 'overview') {
    renderAssessmentOverviewTable();
  }
}

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
    const scoreStr = s.assessment ? ` (총점: ${s.assessment.total || 0}점 / ${s.assessment.grade || '-'})` : ' (미평가)';
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
    total: 0,
    grade: '미평가',
    date: '',
    comment: ''
  };

  const gradeNum = getStudentGradeNum(student);
  const isGrade2 = (gradeNum === 2);

  // Dynamic Rubric Titles and Preset Buttons based on Grade
  const crit1Desc = document.getElementById('assessCriteria1Desc');
  const crit2Title = document.getElementById('assessCriteria2Title');
  const crit2Desc = document.getElementById('assessCriteria2Desc');
  const presetSvContainer = document.getElementById('assessPresetSvContainer');
  const presetFhContainer = document.getElementById('assessPresetFhContainer');

  if (crit1Desc) {
    crit1Desc.innerText = isGrade2 ? '10회 시도 / 26점 이상 A (50점 만점)' : '10회 시도 / 27점 이상 A (50점 만점)';
  }

  if (crit2Title) {
    crit2Title.innerText = isGrade2 ? '2. 백핸드 쇼트 랠리 (50점)' : '2. 포핸드 드라이브 랠리 (50점)';
  }

  if (crit2Desc) {
    crit2Desc.innerText = isGrade2 ? '2학년: 25회 이상 연속 성공 A (50점)' : '3학년: 30회 이상 연속 성공 A (50점)';
  }

  if (presetSvContainer) {
    if (isGrade2) {
      presetSvContainer.innerHTML = `
        <button type="button" onclick="setAssessItem('sv', 50)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">A (50)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">26점+</span></button>
        <button type="button" onclick="setAssessItem('sv', 42)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">B (42)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">22~25</span></button>
        <button type="button" onclick="setAssessItem('sv', 35)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">C (35)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">18~21</span></button>
        <button type="button" onclick="setAssessItem('sv', 28)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">D (28)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">14~17</span></button>
        <button type="button" onclick="setAssessItem('sv', 20)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">E (20)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">13점↓</span></button>
      `;
    } else {
      presetSvContainer.innerHTML = `
        <button type="button" onclick="setAssessItem('sv', 50)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">A (50)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">27점+</span></button>
        <button type="button" onclick="setAssessItem('sv', 42)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">B (42)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">23~26</span></button>
        <button type="button" onclick="setAssessItem('sv', 35)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">C (35)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">19~22</span></button>
        <button type="button" onclick="setAssessItem('sv', 28)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">D (28)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">15~18</span></button>
        <button type="button" onclick="setAssessItem('sv', 20)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">E (20)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">14점↓</span></button>
      `;
    }
  }

  if (presetFhContainer) {
    if (isGrade2) {
      presetFhContainer.innerHTML = `
        <button type="button" onclick="setAssessItem('fh', 50)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">A (50)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">25회+</span></button>
        <button type="button" onclick="setAssessItem('fh', 42)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">B (42)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">19~24</span></button>
        <button type="button" onclick="setAssessItem('fh', 35)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">C (35)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">13~18</span></button>
        <button type="button" onclick="setAssessItem('fh', 28)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">D (28)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">7~12</span></button>
        <button type="button" onclick="setAssessItem('fh', 20)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">E (20)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">6회↓</span></button>
      `;
    } else {
      presetFhContainer.innerHTML = `
        <button type="button" onclick="setAssessItem('fh', 50)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">A (50)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">30회+</span></button>
        <button type="button" onclick="setAssessItem('fh', 42)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">B (42)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">23~29</span></button>
        <button type="button" onclick="setAssessItem('fh', 35)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">C (35)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">16~22</span></button>
        <button type="button" onclick="setAssessItem('fh', 28)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">D (28)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">9~15</span></button>
        <button type="button" onclick="setAssessItem('fh', 20)" class="assess-opt-btn p-1 rounded-lg border border-slate-200 text-center hover:bg-emerald-50 leading-tight">E (20)<br><span class="text-[8px] sm:text-[9px] font-normal text-slate-500">8회↓</span></button>
      `;
    }
  }

  const svInput = document.getElementById('assessScoreSv');
  const fhInput = document.getElementById('assessScoreFh');
  const commentInput = document.getElementById('assessmentCommentInput');
  const dateText = document.getElementById('assessmentDateText');

  const rallyScore = (typeof assess.rally === 'number') ? assess.rally : (isGrade2 ? (assess.backhand || assess.forehand || 0) : (assess.forehand || 0));

  if (svInput) svInput.value = assess.serve || 0;
  if (fhInput) fhInput.value = rallyScore;
  if (commentInput) commentInput.value = assess.comment || '';
  if (dateText) dateText.innerText = assess.date ? `${assess.date} 채점` : '평가 전';

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
  }

  calcAssessmentTotal();
}

function calcAssessmentTotal() {
  const sv = Math.min(50, Math.max(0, parseInt(document.getElementById('assessScoreSv')?.value) || 0));
  const fh = Math.min(50, Math.max(0, parseInt(document.getElementById('assessScoreFh')?.value) || 0));

  const total = sv + fh;
  let grade = '미평가';
  let gradeBadgeClass = 'bg-white/20 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-white/30 backdrop-blur-sm';

  if (total > 0 || (sv > 0 || fh > 0)) {
    if (total >= 80) {
      grade = 'A (최우수 🥇)';
      gradeBadgeClass = 'bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm';
    } else if (total >= 60) {
      grade = 'B (우수 🥈)';
      gradeBadgeClass = 'bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl border border-emerald-300 shadow-sm';
    } else {
      grade = 'C (보통 🥉)';
      gradeBadgeClass = 'bg-sky-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl border border-sky-300 shadow-sm';
    }
  }

  const totalEl = document.getElementById('assessmentTotalScore');
  const gradeEl = document.getElementById('assessmentGradeBadge');

  if (totalEl) totalEl.innerText = total;
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

  const sv = Math.min(50, Math.max(0, parseInt(document.getElementById('assessScoreSv')?.value) || 0));
  const fh = Math.min(50, Math.max(0, parseInt(document.getElementById('assessScoreFh')?.value) || 0));
  const comment = document.getElementById('assessmentCommentInput')?.value.trim() || '';

  const gradeNum = getStudentGradeNum(student);
  const isGrade2 = (gradeNum === 2);
  const rallyType = isGrade2 ? 'backhand' : 'forehand';

  const total = sv + fh;
  let grade = 'C';
  if (total >= 80) grade = 'A';
  else if (total >= 60) grade = 'B';

  const dateStr = new Date().toLocaleDateString('ko-KR');

  student.assessment = {
    serve: sv,
    forehand: isGrade2 ? (student.assessment?.forehand || 0) : fh,
    backhand: isGrade2 ? fh : (student.assessment?.backhand || 0),
    rally: fh,
    rallyType: rallyType,
    total: total,
    grade: grade,
    date: dateStr,
    comment: comment
  };

  saveStudentToRTDB(student);
  playSuccessSound();
  showToast(`[${student.name}] 부원의 수행평가(${total}점 / ${grade}등급)가 실시간 저장되었습니다!`, '💾');

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

  const m = classKey.match(/(\d+)학년/);
  const classGrade = m ? parseInt(m[1], 10) : 3;
  const isGrade2 = (classGrade === 2);
  const thRally = document.getElementById('thAssessRallyCol');
  if (thRally) {
    thRally.innerText = isGrade2 ? '백핸드 쇼트(50)' : '포핸드 드라이브(50)';
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
      const g = s.assessment.grade || 'C';
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
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400">해당 학급에 등록된 부원이 없습니다.</td></tr>`;
    return;
  }

  let html = '';
  list.forEach(s => {
    const a = s.assessment || { serve: 0, forehand: 0, backhand: 0, total: 0, grade: '미평가' };
    const sv = a.serve || 0;
    const fh = (typeof a.rally === 'number') ? a.rally : (isGrade2 ? (a.backhand || a.forehand || 0) : (a.forehand || 0));
    const total = (a.total > 0 || (sv > 0 || fh > 0)) ? `${a.total}점` : '-';
    const grade = a.grade || '미평가';

    let gradeColor = 'text-slate-400';
    if (grade === 'A') gradeColor = 'text-amber-600 font-black';
    else if (grade === 'B') gradeColor = 'text-emerald-600 font-black';
    else if (grade === 'C') gradeColor = 'text-blue-600 font-black';

    if (isOverviewInlineMode && state.role === 'admin') {
      // Inline Interactive Input Row
      html += `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors" data-std-id="${s.id}">
          <td class="p-2 border-r border-slate-100 font-bold">${s.number || '-'}번</td>
          <td class="p-2 border-r border-slate-100 font-extrabold text-slate-800">${escapeHtml(s.name)}</td>
          <td class="p-1 border-r border-slate-100">
            <input type="number" min="0" max="50" value="${sv}" data-type="sv" onchange="onInlineScoreChange(this)" class="w-14 text-center p-1 rounded-md border border-slate-300 font-bold text-xs bg-emerald-50 focus:ring-1 focus:ring-emerald-500">
          </td>
          <td class="p-1 border-r border-slate-100">
            <input type="number" min="0" max="50" value="${fh}" data-type="fh" onchange="onInlineScoreChange(this)" class="w-14 text-center p-1 rounded-md border border-slate-300 font-bold text-xs bg-emerald-50 focus:ring-1 focus:ring-emerald-500">
          </td>
          <td class="p-2 border-r border-slate-100 font-black text-emerald-700 inline-total">${total}</td>
          <td class="p-2 border-r border-slate-100 inline-grade ${gradeColor}">${grade}</td>
          <td class="p-1.5">
            <button type="button" onclick="selectStudentForAssessmentFromOverview('${s.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold">
              상세
            </button>
          </td>
        </tr>
      `;
    } else {
      // Clean Clickable Table Row
      html += `
        <tr onclick="selectStudentForAssessmentFromOverview('${s.id}')" class="border-b border-slate-100 hover:bg-emerald-50/50 cursor-pointer transition-colors group">
          <td class="p-2 border-r border-slate-100 font-bold">${s.number || '-'}번</td>
          <td class="p-2 border-r border-slate-100 font-extrabold text-slate-800 group-hover:text-emerald-700">${escapeHtml(s.name)}</td>
          <td class="p-2 border-r border-slate-100">${sv > 0 ? `${sv}점` : '-'}</td>
          <td class="p-2 border-r border-slate-100">${fh > 0 ? `${fh}점` : '-'}</td>
          <td class="p-2 border-r border-slate-100 font-black text-emerald-700">${total}</td>
          <td class="p-2 border-r border-slate-100 ${gradeColor}">${grade}</td>
          <td class="p-1.5">
            <span class="text-[10px] text-emerald-600 font-bold group-hover:underline">
              ✏️ 채점하기
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

  const sv = Math.min(50, Math.max(0, parseInt(tr.querySelector('input[data-type="sv"]')?.value) || 0));
  const fh = Math.min(50, Math.max(0, parseInt(tr.querySelector('input[data-type="fh"]')?.value) || 0));

  const total = sv + fh;
  let grade = 'C';
  if (total >= 80) grade = 'A';
  else if (total >= 60) grade = 'B';

  const totalEl = tr.querySelector('.inline-total');
  const gradeEl = tr.querySelector('.inline-grade');

  if (totalEl) totalEl.innerText = `${total}점`;
  if (gradeEl) {
    gradeEl.innerText = grade;
    gradeEl.className = `p-2 border-r border-slate-100 inline-grade ${grade === 'A' ? 'text-amber-600 font-black' : (grade === 'B' ? 'text-emerald-600 font-black' : 'text-blue-600 font-black')}`;
  }
}

function saveOverviewBatchAssessment() {
  if (state.role !== 'admin') {
    showToast('선생님 모드에서만 수행평가를 일괄 저장할 수 있습니다.', '🔒');
    return;
  }

  const rows = document.querySelectorAll('#assessmentOverviewTableBody tr[data-std-id]');
  if (rows.length === 0) return;

  const dateStr = new Date().toLocaleDateString('ko-KR');
  let savedCount = 0;

  rows.forEach(tr => {
    const studentId = tr.getAttribute('data-std-id');
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const gradeNum = getStudentGradeNum(student);
    const isGrade2 = (gradeNum === 2);
    const rallyType = isGrade2 ? 'backhand' : 'forehand';

    const sv = Math.min(50, Math.max(0, parseInt(tr.querySelector('input[data-type="sv"]')?.value) || 0));
    const fh = Math.min(50, Math.max(0, parseInt(tr.querySelector('input[data-type="fh"]')?.value) || 0));

    const total = sv + fh;
    let grade = 'C';
    if (total >= 80) grade = 'A';
    else if (total >= 60) grade = 'B';

    student.assessment = {
      serve: sv,
      forehand: isGrade2 ? (student.assessment?.forehand || 0) : fh,
      backhand: isGrade2 ? fh : (student.assessment?.backhand || 0),
      rally: fh,
      rallyType: rallyType,
      total: total,
      grade: grade,
      date: dateStr,
      comment: student.assessment?.comment || ''
    };

    saveStudentToRTDB(student);
    savedCount++;
  });

  playSuccessSound();
  showToast(`학급 전체 부원(${savedCount}명)의 수행평가 점수가 실시간 일괄 저장되었습니다!`, '🎉');
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

  const m = classKey.match(/(\d+)학년/);
  const classGrade = m ? parseInt(m[1], 10) : 3;
  const isGrade2 = (classGrade === 2);
  const rallyColName = isGrade2 ? '백핸드 쇼트(50)' : '포핸드 드라이브(50)';

  let text = `[양주중학교 체육수업 탁구 수행평가 일람표 - ${classKey}]\n`;
  text += `번호\t이름\t서브(50)\t${rallyColName}\t총점(100)\t등급\t피드백\n`;

  list.forEach(s => {
    const a = s.assessment;
    const num = s.number || '';
    const name = s.name || '';
    const sv = a ? a.serve : '';
    const fh = a ? ((typeof a.rally === 'number') ? a.rally : (isGrade2 ? (a.backhand || a.forehand || 0) : (a.forehand || 0))) : '';
    const total = a ? a.total : '';
    const grade = a ? a.grade : '';
    const comment = a ? a.comment : '';
    text += `${num}\t${name}\t${sv}\t${fh}\t${total}\t${grade}\t${comment}\n`;
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

  const m = classKey.match(/(\d+)학년/);
  const classGrade = m ? parseInt(m[1], 10) : 3;
  const isGrade2 = (classGrade === 2);
  const rallyColName = isGrade2 ? '백핸드 쇼트(50점)' : '포핸드 드라이브(50점)';

  let csvContent = "\uFEFF"; // UTF-8 BOM for Excel Korean encoding
  csvContent += `학년,반,번호,이름,서브(50점),${rallyColName},총점(100점),등급,평가일자,선생님 피드백\n`;

  list.forEach(s => {
    const a = s.assessment;
    const g = s.grade || '';
    const c = s.classNum || '';
    const num = s.number || '';
    const name = (s.name || '').replaceAll('"', '""');
    const sv = a ? a.serve : 0;
    const fh = a ? ((typeof a.rally === 'number') ? a.rally : (isGrade2 ? (a.backhand || a.forehand || 0) : (a.forehand || 0))) : 0;
    const total = a ? a.total : 0;
    const grade = a ? a.grade : '미평가';
    const date = a ? a.date : '';
    const comment = a ? `"${(a.comment || '').replaceAll('"', '""')}"` : '""';

    csvContent += `${g},${c},${num},"${name}",${sv},${fh},${total},${grade},${date},${comment}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `양주중_체육_탁구수행평가_${classKey.replaceAll(' ', '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`[${classKey}] 탁구 수행평가 CSV 파일이 다운로드되었습니다.`, '📥');
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

  if (gradeSpecBadge) {
    gradeSpecBadge.innerText = isGrade2 ? '🌱 2학년: 10회 중 26점 이상 A (30점 만점)' : '🎓 3학년: 10회 중 27점 이상 A (30점 만점)';
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

function calculateServeRubricScore(rawPoints, gradeNum = 3) {
  const isGrade2 = (gradeNum === 2);
  if (rawPoints <= 0) return { score: 0, gradeName: '미평가 📋', badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700' };

  if (isGrade2) {
    // 2학년 기준: 10회 시도 중 26점 이상 A (50점 환산)
    if (rawPoints >= 26) return { score: 50, gradeName: 'A (50점 환산 🥇)', badgeClass: 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-300' };
    if (rawPoints >= 22) return { score: 42, gradeName: 'B (42점 환산 🥈)', badgeClass: 'bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.6)] border border-emerald-300' };
    if (rawPoints >= 18) return { score: 35, gradeName: 'C (35점 환산 🥉)', badgeClass: 'bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.6)] border border-sky-300' };
    if (rawPoints >= 14) return { score: 28, gradeName: 'D (28점 환산 🌱)', badgeClass: 'bg-orange-400 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.6)] border border-orange-300' };
    return { score: 20, gradeName: 'E (20점 환산 ⚠️)', badgeClass: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400' };
  } else {
    // 3학년 기준: 10회 시도 중 27점 이상 A (50점 환산)
    if (rawPoints >= 27) return { score: 50, gradeName: 'A (50점 환산 🥇)', badgeClass: 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-300' };
    if (rawPoints >= 23) return { score: 42, gradeName: 'B (42점 환산 🥈)', badgeClass: 'bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.6)] border border-emerald-300' };
    if (rawPoints >= 19) return { score: 35, gradeName: 'C (35점 환산 🥉)', badgeClass: 'bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.6)] border border-sky-300' };
    if (rawPoints >= 15) return { score: 28, gradeName: 'D (28점 환산 🌱)', badgeClass: 'bg-orange-400 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.6)] border border-orange-300' };
    return { score: 20, gradeName: 'E (20점 환산 ⚠️)', badgeClass: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400' };
  }
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
  showToast(`마지막 ${removed.point}점 타격이 취소되었습니다.`, '↩️');
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
  const scoreEl = document.getElementById('serveTargetCurrentScore');
  const countBadge = document.getElementById('serveTargetHitCountBadge');
  const countText = document.getElementById('serveTargetHitCountText');
  const logEl = document.getElementById('serveTargetHitLog');
  const gradeBadge = document.getElementById('serveTargetGradeBadge');

  const gradeNum = getStudentGradeNum(currentServeTargetStudent);
  const rubric = calculateServeRubricScore(totalPoints, gradeNum);

  // Directly display raw accumulated target score (e.g. 3, 6, 9... up to 30)
  if (scoreEl) scoreEl.innerText = totalPoints;
  if (countBadge) countBadge.innerText = `${serveTargetHits.length}구 성공 (${totalPoints} / 30점)`;
  if (countText) countText.innerText = `${serveTargetHits.length}회 기록 (과녁 ${totalPoints}점)`;

  if (gradeBadge) {
    gradeBadge.innerText = rubric.gradeName;
    gradeBadge.className = `text-xs sm:text-sm font-black px-4 py-1.5 rounded-xl ${rubric.badgeClass}`;
  }

  if (logEl) {
    if (serveTargetHits.length === 0) {
      logEl.innerHTML = '<span class="text-xs text-slate-500">과녁의 번호(3, 2, 1)를 누르면 실시간 기록됩니다.</span>';
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
        }
        return `<span class="text-xs font-black px-2.5 py-1 rounded-xl border ${colorClass} animate-pop flex items-center space-x-1"><span>#${i + 1}</span><span class="font-mono">+${h.point}점</span><span>(${label})</span></span>`;
      }).join('');
      logEl.scrollTop = logEl.scrollHeight;
    }
  }
}

function applyServeTargetScore(autoSave = false) {
  const totalPoints = serveTargetHits.reduce((sum, h) => sum + h.point, 0);
  const gradeNum = getStudentGradeNum(currentServeTargetStudent);
  const rubric = calculateServeRubricScore(totalPoints, gradeNum);
  const finalScore = rubric.score;

  const svInput = document.getElementById('assessScoreSv');
  if (svInput) {
    svInput.value = finalScore;
  }

  calcAssessmentTotal();
  closeModal('serveTargetModal');

  if (autoSave) {
    if (state.role !== 'admin') {
      showToast('선생님 모드에서만 서버 저장이 가능합니다. (점수는 반영됨)', '🔒');
      return;
    }
    saveStudentAssessment();
  } else {
    showToast(`🎯 서브 과녁 ${totalPoints}점(30점 만점) 획득 ➔ 채점표에 ${finalScore}점(${rubric.gradeName.split(' ')[0]}) 반영 완료!`, '✅');
  }
}

function playHitZoneSound(point) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

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
