import { initFirebaseAuth } from './firebase.js';
import { setupRealtimeListeners } from './db.js';
import { state, session } from './state.js';
import { openModal, closeModal, toggleMobileRosterDrawer, triggerConfetti } from './utils.js';
import { 
  showLoginGate, quickLoginStudent, toggleRoleModalFromLogin, handleStudentLogin,
  handleLogout, switchToSelfAccount, switchActiveStudent, toggleRoleModal,
  verifyAndSwitchToAdmin, confirmTeacherPasscode 
} from './auth.js';
import { 
  renderUI, renderMatchesView, renderRewardsList, switchMainTab, switchTab, 
  selectWeekFilter, switchRankingView, toggleClassAccordion 
} from './render.js';
import { 
  openAvatarModal, switchProfileCustomTab, changeStudentAvatar,
  equipFrame, unlockFrame, equipTitle, unlockTitle, equipAura, unlockAura,
  equipNameSkin, unlockNameSkin, equipCardSkin, unlockCardSkin,
  equipCeremony, unlockCeremony 
} from './customization.js';
import { 
  handleMissionCheck, approvePendingMission, rejectPendingMission,
  approveAllPendingMissions, openAddMissionModal, handleAddMission,
  moveMission, deleteMission 
} from './missions.js';
import { 
  openScoreboardModal, updateScoreboardPlayer2, updateScore, resetScoreboard,
  endScoreboardMatch, openMatchRecordModal, updatePlayer2Options,
  handleRecordMatch, deleteMatchRecord, deleteTimelineLog 
} from './matches.js';
import { 
  redeemReward, useCoupon, openAddRewardModal, handleAddReward,
  deleteReward, selectRewardIcon 
} from './rewards.js';
import { 
  saveSkillEvaluation, openAddStudentModal, saveNewStudent, deleteStudent,
  applyPointAdjustment, openSettingsModal, toggleTeacherMode, updatePasscode,
  openGroupGeneratorModal, generateRandomGroups, copyGroupResults 
} from './students.js';

/* EXPORT ALL HANDLERS TO GLOBAL SCOPE FOR HTML INLINE EVENTS */
Object.assign(window, {
  // Auth & Session
  handleStudentLogin,
  handleLogout,
  quickLoginStudent,
  toggleRoleModalFromLogin,
  switchToSelfAccount,
  switchActiveStudent,
  toggleRoleModal,
  verifyAndSwitchToAdmin,
  confirmTeacherPasscode,
  showLoginGate,

  // Navigation & Drawer
  toggleMobileRosterDrawer,
  openLevelGuideModal: () => openModal('levelGuideModal'),
  closeModal,
  openModal,
  switchMainTab,
  switchTab,
  selectWeekFilter,
  switchRankingView,
  toggleClassAccordion,
  renderUI,
  renderStudentDirectory,
  renderMatchesView,
  renderRewardsList,

  // Scoreboard & Matches
  openScoreboardModal,
  updateScoreboardPlayer2,
  updateScore,
  resetScoreboard,
  endScoreboardMatch,
  openMatchRecordModal,
  updatePlayer2Options,
  handleRecordMatch,
  deleteMatchRecord,
  deleteTimelineLog,

  // Missions
  handleMissionCheck,
  approvePendingMission,
  rejectPendingMission,
  approveAllPendingMissions,
  openAddMissionModal,
  handleAddMission,
  moveMission,
  deleteMission,

  // Customization & Effects
  openAvatarModal,
  switchProfileCustomTab,
  changeStudentAvatar,
  equipFrame,
  unlockFrame,
  equipTitle,
  unlockTitle,
  equipAura,
  unlockAura,
  equipNameSkin,
  unlockNameSkin,
  equipCardSkin,
  unlockCardSkin,
  equipCeremony,
  unlockCeremony,
  triggerConfetti,

  // Rewards & Coupons
  openAddRewardModal,
  handleAddReward,
  deleteReward,
  redeemReward,
  useCoupon,
  selectRewardIcon,

  // Students & Settings
  saveSkillEvaluation,
  openAddStudentModal,
  saveNewStudent,
  deleteStudent,
  applyPointAdjustment,
  openSettingsModal,
  toggleTeacherMode,
  updatePasscode,

  // Group Generator
  openGroupGeneratorModal,
  generateRandomGroups,
  copyGroupResults
});

// Realtime DB Init
initFirebaseAuth(() => {
  setupRealtimeListeners({
    onStudentsUpdate: () => renderUI(),
    onMatchesUpdate: () => renderMatchesView(),
    onRewardsUpdate: () => renderRewardsList(),
    onSettingsUpdate: () => renderUI()
  });
});

// App Startup
window.addEventListener('DOMContentLoaded', () => {
  switchMainTab('missions');
  renderUI();
  showLoginGate();
});
