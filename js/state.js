/* GLOBAL STATE AND VARIABLES */
let state = {
  role: 'student',
  activeStudentId: 'std_1',
  students: [
    {
      id: 'std_1',
      name: '김탁구',
      grade: '1',
      classNum: '1',
      number: '1',
      className: '1학년 1반 1번',
      avatar: '🏓',
      unlockedAvatars: ['🏓', '🥇', '🏆', '⚡', '🔥'],
      equippedFrame: 'frame-emerald',
      unlockedFrames: ['frame-none', 'frame-emerald'],
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
      missions: JSON.parse(JSON.stringify(DEFAULT_MISSIONS)),
      skills: { forehand: 3, backhand: 3, serve: 3, manner: 5 },
      totalPoints: 200,
      wins: 1,
      losses: 0,
      history: [],
      redeemedRewards: []
    }
  ],
  rewards: JSON.parse(JSON.stringify(DEFAULT_REWARDS)),
  matchHistory: [],
  teacherMode: true,
  passcode: DEFAULT_PASSCODE
};

let loggedInStudentId = null;
let isReadOnly = false;

let currentMainTab = 'missions';
let activeTab = 'personal';
let selectedWeek = 'all';
let profileCustomTab = 'avatar';
let rankingViewMode = 'list';
let collapsedClasses = {};
let selectedRewardIcon = '🏓';
let pendingMissionContext = null;
let audioCtx = null;
let confirmActionCallback = null;

let sbState = {
  score1: 0,
  score2: 0,
  p1Id: null,
  p2Id: null,
  server: 1
};

let lastGeneratedGroupsText = '';

function getCurrentStudent() {
  return state.students.find(s => s.id === state.activeStudentId) || state.students[0];
}

function checkReadOnlyGuard() {
  if (state.role === 'admin') {
    isReadOnly = false;
  } else {
    isReadOnly = loggedInStudentId !== null && state.activeStudentId !== loggedInStudentId;
  }

  const notice = document.getElementById('readOnlyNoticeBanner');
  if (notice) {
    if (isReadOnly) notice.classList.remove('hidden');
    else notice.classList.add('hidden');
  }
  return isReadOnly;
}

function calculateLevelTitle(points) {
  const p = points || 0;
  if (p >= 1000) return '🌟 탁구의 신';
  if (p >= 750) return '👑 핑퐁 챔피언';
  if (p >= 500) return '🛡️ 철벽 커트 에이스';
  if (p >= 350) return '🔥 스매시 마스터';
  if (p >= 200) return '⚡ 드라이브 스페셜리스트';
  if (p >= 100) return '⭐ 스핀 루키';
  if (p >= 50) return '🏓 핑퐁 아마추어';
  return '🌱 탁구 입문자';
}

function getInitialMissionsForNewStudent() {
  const missionMap = new Map();
  DEFAULT_MISSIONS.forEach(m => missionMap.set(m.title, JSON.parse(JSON.stringify(m))));

  state.students.forEach(s => {
    if (s.missions && Array.isArray(s.missions)) {
      s.missions.forEach(m => {
        if (!missionMap.has(m.title)) {
          missionMap.set(m.title, {
            id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            week: m.week || 1,
            title: m.title,
            category: m.category || 'personal',
            difficulty: m.difficulty || '보통',
            points: m.points || 20,
            completed: false,
            pending: false,
            description: m.description || ''
          });
        }
      });
    }
  });

  return Array.from(missionMap.values()).map(m => ({
    ...m,
    completed: false,
    pending: false,
    description: m.description || ''
  }));
}
