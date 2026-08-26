import { state, session, getCurrentStudent, checkReadOnlyGuard } from './state.js';
import { openModal, closeModal, showToast, showCustomConfirm, playSuccessSound, triggerConfetti } from './utils.js';
import { saveStudentToRTDB, saveRewardsToRTDB } from './db.js';
import { renderUI } from './render.js';

export function redeemReward(rewardId) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  const reward = state.rewards.find(r => r.id === rewardId);
  if (!student || !reward) return;

  if ((student.totalPoints || 0) < reward.points) {
    showToast('포인트가 부족합니다!', '⚠️');
    return;
  }

  showCustomConfirm('보상 교환', `'${reward.title}' 쿠폰으로 교환하시겠습니까? (${reward.points} P 차감)`, () => {
    student.totalPoints -= reward.points;
    
    if (!student.redeemedRewards) student.redeemedRewards = [];
    student.redeemedRewards.push({
      id: 'coupon_' + Date.now(),
      title: reward.title,
      icon: reward.icon || '🎫',
      date: new Date().toLocaleDateString('ko-KR')
    });

    if (!student.history) student.history = [];
    student.history.unshift({
      title: `[보상 교환] ${reward.title}`,
      points: -reward.points,
      date: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    });

    saveStudentToRTDB(student);
    renderUI();
    playSuccessSound();
    triggerConfetti(student.equippedCeremony);
    showToast(`'${reward.title}' 쿠폰 교환 완료!`, '🎉');
  });
}

export function useCoupon(index) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student || !student.redeemedRewards || !student.redeemedRewards[index]) return;

  const coupon = student.redeemedRewards[index];
  showCustomConfirm('쿠폰 사용', `'${coupon.title}' 쿠폰을 사용 처리하시겠습니까?`, () => {
    student.redeemedRewards.splice(index, 1);
    saveStudentToRTDB(student);
    renderUI();
    showToast('쿠폰을 사용했습니다!', '✨');
  });
}

export function openAddRewardModal() {
  openModal('addRewardModal');
}

export function handleAddReward(e) {
  if (e) e.preventDefault();
  const title = document.getElementById('rewardTitleInput')?.value.trim();
  const points = parseInt(document.getElementById('rewardPointsInput')?.value);

  if (!title || !points) return;

  const newReward = {
    id: 'r_' + Date.now(),
    title: title,
    points: points,
    icon: session.selectedRewardIcon || '🎁'
  };

  state.rewards.push(newReward);
  saveRewardsToRTDB(state.rewards);

  renderUI();
  closeModal('addRewardModal');
  const titleInput = document.getElementById('rewardTitleInput');
  if (titleInput) titleInput.value = '';
  showToast('새 보상이 등록되었습니다!', '🎁');
}

export function deleteReward(rewardId) {
  state.rewards = state.rewards.filter(r => r.id !== rewardId);
  saveRewardsToRTDB(state.rewards);
  renderUI();
  showToast('보상이 삭제되었습니다.', '🗑️');
}

export function selectRewardIcon(icon) {
  session.selectedRewardIcon = icon;
  document.querySelectorAll('.reward-icon-opt').forEach(btn => {
    if (btn.innerText.includes(icon)) btn.classList.add('border-emerald-500', 'bg-emerald-100');
    else btn.classList.remove('border-emerald-500', 'bg-emerald-100');
  });
}
