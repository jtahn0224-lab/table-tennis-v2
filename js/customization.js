/* PROFILE CUSTOMIZATION (AVATARS, FRAMES, TITLES, AURAS, SKINS, CEREMONIES) */

function openAvatarModal() {
  if (checkReadOnlyGuard()) {
    showToast('타 부원의 프로필은 변경할 수 없습니다.', '🔒');
    return;
  }
  switchProfileCustomTab('avatar');
  openModal('avatarSelectModal');
}

function switchProfileCustomTab(tab) {
  profileCustomTab = tab;

  const secAvatar = document.getElementById('profileSectionAvatar');
  const secFrame = document.getElementById('profileSectionFrame');
  const secTitle = document.getElementById('profileSectionTitle');
  const secAura = document.getElementById('profileSectionAura');
  const secNameSkin = document.getElementById('profileSectionNameSkin');
  const secCardSkin = document.getElementById('profileSectionCardSkin');
  const secCeremony = document.getElementById('profileSectionCeremony');

  const tabs = ['Avatar', 'Frame', 'Title', 'Aura', 'NameSkin', 'CardSkin', 'Ceremony'];
  tabs.forEach(t => {
    const btn = document.getElementById(`profileTab${t}Btn`);
    if (btn) btn.className = "px-3 py-1.5 rounded-xl whitespace-nowrap transition-all text-slate-600 hover:text-slate-800 font-bold";
  });

  [secAvatar, secFrame, secTitle, secAura, secNameSkin, secCardSkin, secCeremony].forEach(sec => {
    if (sec) sec.classList.add('hidden');
  });

  const activeBtn = document.getElementById(`profileTab${tab.charAt(0).toUpperCase() + tab.slice(1)}Btn`);
  if (activeBtn) activeBtn.className = "px-3 py-1.5 rounded-xl whitespace-nowrap transition-all bg-white text-emerald-800 shadow-xs font-bold";

  if (tab === 'avatar') {
    if (secAvatar) secAvatar.classList.remove('hidden');
    renderAvatarGrid();
  } else if (tab === 'frame') {
    if (secFrame) secFrame.classList.remove('hidden');
    renderFramesList();
  } else if (tab === 'title') {
    if (secTitle) secTitle.classList.remove('hidden');
    renderTitlesList();
  } else if (tab === 'aura') {
    if (secAura) secAura.classList.remove('hidden');
    renderAurasList();
  } else if (tab === 'nameSkin') {
    if (secNameSkin) secNameSkin.classList.remove('hidden');
    renderNameSkinsList();
  } else if (tab === 'cardSkin') {
    if (secCardSkin) secCardSkin.classList.remove('hidden');
    renderCardSkinsList();
  } else if (tab === 'ceremony') {
    if (secCeremony) secCeremony.classList.remove('hidden');
    renderCeremoniesList();
  }
}

function renderAvatarGrid() {
  const container = document.getElementById('avatarGridContainer');
  if (!container) return;
  const student = getCurrentStudent();
  if (!student) return;

  const unlocked = student.unlockedAvatars || BASIC_AVATARS;

  container.innerHTML = ALL_AVATARS.map(av => {
    const isCurrent = student.avatar === av;
    const isFree = BASIC_AVATARS.includes(av);
    const isUnlocked = isFree || unlocked.includes(av);

    return `
      <button onclick="changeStudentAvatar('${av}')" class="relative p-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${
        isCurrent
          ? 'bg-emerald-100 border-emerald-600 shadow-sm'
          : isUnlocked
            ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200'
            : 'bg-slate-50/80 hover:bg-amber-50 border-slate-200 opacity-90'
      }">
        <span class="text-2xl">${av}</span>
        ${isCurrent ? `
          <span class="text-[9px] font-black text-emerald-700 mt-0.5 bg-emerald-200/80 px-1 rounded">사용중</span>
        ` : isUnlocked ? `
          <span class="text-[9px] font-bold text-slate-400 mt-0.5">${isFree ? '무료' : '해금됨'}</span>
        ` : `
          <span class="text-[9px] font-extrabold text-amber-600 mt-0.5 bg-amber-100 px-1 rounded border border-amber-200">10 P</span>
        `}
      </button>
    `;
  }).join('');
}

function changeStudentAvatar(newAvatar) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  if (!student.unlockedAvatars) {
    student.unlockedAvatars = [...BASIC_AVATARS, student.avatar];
  }

  const isFree = BASIC_AVATARS.includes(newAvatar);
  const isUnlocked = isFree || student.unlockedAvatars.includes(newAvatar);

  if (student.avatar === newAvatar) {
    showToast('현재 사용 중인 캐릭터입니다.', 'ℹ️');
    return;
  }

  if (isUnlocked) {
    student.avatar = newAvatar;
    saveStudentToRTDB(student);
    renderUI();
    renderAvatarGrid();
    playSuccessSound();
    showToast('프로필 캐릭터가 변경되었습니다!', '🎨');
  } else {
    const currentPoints = student.totalPoints || 0;
    if (currentPoints < 10) {
      showToast(`포인트가 부족합니다! (현재 ${currentPoints} P / 10 P 필요)`, '⚠️');
      return;
    }

    showCustomConfirm('캐릭터 해금 및 변경', `'${newAvatar}' 캐릭터를 10 P로 해금하고 변경하시겠습니까?`, () => {
      student.totalPoints -= 10;
      if (!student.unlockedAvatars.includes(newAvatar)) {
        student.unlockedAvatars.push(newAvatar);
      }
      student.avatar = newAvatar;

      const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      if (!student.history) student.history = [];
      student.history.unshift({
        title: `[캐릭터 해금] ${newAvatar} 캐릭터 해금`,
        points: -10,
        date: dateStr
      });

      saveStudentToRTDB(student);
      renderUI();
      renderAvatarGrid();
      playSuccessSound();
      triggerConfetti(student.equippedCeremony);
      showToast(`'${newAvatar}' 캐릭터를 해금하고 변경했습니다! (-10 P)`, '🎉');
    });
  }
}

function renderFramesList() {
  const container = document.getElementById('framesListContainer');
  if (!container) return;
  const student = getCurrentStudent();
  if (!student) return;

  const unlocked = student.unlockedFrames || ['frame-none'];
  const equipped = student.equippedFrame || 'frame-none';

  container.innerHTML = ALL_FRAMES.map(f => {
    const isEquipped = equipped === f.id;
    const isUnlocked = f.points === 0 || unlocked.includes(f.id);

    return `
      <div class="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
        <div class="flex items-center space-x-3 min-w-0 pr-2">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-50 ${f.class}">
            ${student.avatar || '🏓'}
          </div>
          <div class="min-w-0">
            <p class="font-extrabold text-xs text-slate-800 truncate">${f.name}</p>
            <p class="text-[10px] text-slate-400 truncate">${f.desc}</p>
          </div>
        </div>
        <div class="shrink-0">
          ${isEquipped ? `
            <span class="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">장착 중</span>
          ` : isUnlocked ? `
            <button onclick="equipFrame('${f.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
              장착하기
            </button>
          ` : `
            <button onclick="unlockFrame('${f.id}', ${f.points})" class="bg-amber-400 hover:bg-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs">
              해금 (${f.points} P)
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function equipFrame(frameId) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  student.equippedFrame = frameId;
  saveStudentToRTDB(student);
  renderUI();
  renderFramesList();
  playSuccessSound();
  showToast('프로필 테두리가 장착되었습니다!', '🖼️');
}

function unlockFrame(frameId, cost) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  const currentPoints = student.totalPoints || 0;
  if (currentPoints < cost) {
    showToast(`포인트가 부족합니다! (현재 ${currentPoints} P / ${cost} P 필요)`, '⚠️');
    return;
  }

  const frameObj = ALL_FRAMES.find(f => f.id === frameId);
  showCustomConfirm('테두리 해금', `'${frameObj?.name}' 테두리를 ${cost} P로 해금하시겠습니까?`, () => {
    student.totalPoints -= cost;
    if (!student.unlockedFrames) student.unlockedFrames = ['frame-none'];
    if (!student.unlockedFrames.includes(frameId)) student.unlockedFrames.push(frameId);
    student.equippedFrame = frameId;

    const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    if (!student.history) student.history = [];
    student.history.unshift({
      title: `[테두리 해금] ${frameObj?.name} 해금`,
      points: -cost,
      date: dateStr
    });

    saveStudentToRTDB(student);
    renderUI();
    renderFramesList();
    playSuccessSound();
    triggerConfetti(student.equippedCeremony);
    showToast(`'${frameObj?.name}' 테두리를 해금하고 장착했습니다! (-${cost} P)`, '🎉');
  });
}

function renderTitlesList() {
  const container = document.getElementById('titlesListContainer');
  if (!container) return;
  const student = getCurrentStudent();
  if (!student) return;

  const unlocked = student.unlockedTitles || [calculateLevelTitle(student.totalPoints || 0)];
  const equipped = student.equippedTitle || calculateLevelTitle(student.totalPoints || 0);

  container.innerHTML = ALL_TITLES.map(t => {
    const isEquipped = equipped === t.title;
    const isUnlocked = t.points === 0 || unlocked.includes(t.title);

    return `
      <div class="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
        <div class="min-w-0 pr-2">
          <span class="inline-block bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full mb-1">
            ${t.title}
          </span>
          <p class="text-[10px] text-slate-400 truncate">${t.desc}</p>
        </div>
        <div class="shrink-0">
          ${isEquipped ? `
            <span class="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">장착 중</span>
          ` : isUnlocked ? `
            <button onclick="equipTitle('${t.title}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
              장착하기
            </button>
          ` : `
            <button onclick="unlockTitle('${t.id}', '${t.title}', ${t.points})" class="bg-amber-400 hover:bg-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs">
              해금 (${t.points} P)
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function equipTitle(titleText) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  student.equippedTitle = titleText;
  saveStudentToRTDB(student);
  renderUI();
  renderTitlesList();
  playSuccessSound();
  showToast(`'${titleText}' 칭호가 장착되었습니다!`, '🏷️');
}

function unlockTitle(titleId, titleText, cost) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  const currentPoints = student.totalPoints || 0;
  if (currentPoints < cost) {
    showToast(`포인트가 부족합니다! (현재 ${currentPoints} P / ${cost} P 필요)`, '⚠️');
    return;
  }

  showCustomConfirm('칭호 해금', `'${titleText}' 칭호를 ${cost} P로 해금하시겠습니까?`, () => {
    student.totalPoints -= cost;
    if (!student.unlockedTitles) student.unlockedTitles = [];
    if (!student.unlockedTitles.includes(titleText)) student.unlockedTitles.push(titleText);
    student.equippedTitle = titleText;

    const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    if (!student.history) student.history = [];
    student.history.unshift({
      title: `[칭호 해금] ${titleText} 칭호 해금`,
      points: -cost,
      date: dateStr
    });

    saveStudentToRTDB(student);
    renderUI();
    renderTitlesList();
    playSuccessSound();
    triggerConfetti(student.equippedCeremony);
    showToast(`'${titleText}' 칭호를 해금하고 장착했습니다! (-${cost} P)`, '🎉');
  });
}

function renderAurasList() {
  const container = document.getElementById('aurasListContainer');
  if (!container) return;
  const student = getCurrentStudent();
  if (!student) return;

  const unlocked = student.unlockedAuras || ['aura-none'];
  const equipped = student.equippedAura || 'aura-none';

  container.innerHTML = ALL_AURAS.map(a => {
    const isEquipped = equipped === a.id;
    const isUnlocked = a.points === 0 || unlocked.includes(a.id);

    return `
      <div class="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
        <div class="flex items-center space-x-3 min-w-0 pr-2">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-50 border border-slate-200 ${a.class}">
            ${student.avatar || '🏓'}
          </div>
          <div class="min-w-0">
            <p class="font-extrabold text-xs text-slate-800 truncate">${a.name}</p>
            <p class="text-[10px] text-slate-400 truncate">${a.desc}</p>
          </div>
        </div>
        <div class="shrink-0">
          ${isEquipped ? `
            <span class="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">장착 중</span>
          ` : isUnlocked ? `
            <button onclick="equipAura('${a.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
              장착하기
            </button>
          ` : `
            <button onclick="unlockAura('${a.id}', ${a.points})" class="bg-amber-400 hover:bg-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs">
              해금 (${a.points} P)
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function equipAura(auraId) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  student.equippedAura = auraId;
  saveStudentToRTDB(student);
  renderUI();
  renderAurasList();
  playSuccessSound();
  showToast('오라 이펙트가 장착되었습니다!', '🔮');
}

function unlockAura(auraId, cost) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  const currentPoints = student.totalPoints || 0;
  if (currentPoints < cost) {
    showToast(`포인트가 부족합니다! (현재 ${currentPoints} P / ${cost} P 필요)`, '⚠️');
    return;
  }

  const auraObj = ALL_AURAS.find(a => a.id === auraId);
  showCustomConfirm('오라 해금', `'${auraObj?.name}' 오라를 ${cost} P로 해금하시겠습니까?`, () => {
    student.totalPoints -= cost;
    if (!student.unlockedAuras) student.unlockedAuras = ['aura-none'];
    if (!student.unlockedAuras.includes(auraId)) student.unlockedAuras.push(auraId);
    student.equippedAura = auraId;

    const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    if (!student.history) student.history = [];
    student.history.unshift({
      title: `[오라 해금] ${auraObj?.name} 해금`,
      points: -cost,
      date: dateStr
    });

    saveStudentToRTDB(student);
    renderUI();
    renderAurasList();
    playSuccessSound();
    triggerConfetti(student.equippedCeremony);
    showToast(`'${auraObj?.name}' 오라를 해금하고 장착했습니다! (-${cost} P)`, '🎉');
  });
}

function renderNameSkinsList() {
  const container = document.getElementById('nameSkinsListContainer');
  if (!container) return;
  const student = getCurrentStudent();
  if (!student) return;

  const unlocked = student.unlockedNameSkins || ['name-skin-none'];
  const equipped = student.equippedNameSkin || 'name-skin-none';

  container.innerHTML = ALL_NAME_SKINS.map(s => {
    const isEquipped = equipped === s.id;
    const isUnlocked = s.points === 0 || unlocked.includes(s.id);

    return `
      <div class="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
        <div class="min-w-0 pr-2">
          <p class="font-extrabold text-sm mb-0.5 ${s.class}">${student.name} (${s.name})</p>
          <p class="text-[10px] text-slate-400 truncate">${s.desc}</p>
        </div>
        <div class="shrink-0">
          ${isEquipped ? `
            <span class="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">장착 중</span>
          ` : isUnlocked ? `
            <button onclick="equipNameSkin('${s.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
              장착하기
            </button>
          ` : `
            <button onclick="unlockNameSkin('${s.id}', ${s.points})" class="bg-amber-400 hover:bg-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs">
              해금 (${s.points} P)
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function equipNameSkin(skinId) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  student.equippedNameSkin = skinId;
  saveStudentToRTDB(student);
  renderUI();
  renderNameSkinsList();
  playSuccessSound();
  showToast('네임 스킨이 장착되었습니다!', '🌈');
}

function unlockNameSkin(skinId, cost) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  const currentPoints = student.totalPoints || 0;
  if (currentPoints < cost) {
    showToast(`포인트가 부족합니다! (현재 ${currentPoints} P / ${cost} P 필요)`, '⚠️');
    return;
  }

  const skinObj = ALL_NAME_SKINS.find(s => s.id === skinId);
  showCustomConfirm('네임 스킨 해금', `'${skinObj?.name}' 스킨을 ${cost} P로 해금하시겠습니까?`, () => {
    student.totalPoints -= cost;
    if (!student.unlockedNameSkins) student.unlockedNameSkins = ['name-skin-none'];
    if (!student.unlockedNameSkins.includes(skinId)) student.unlockedNameSkins.push(skinId);
    student.equippedNameSkin = skinId;

    const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    if (!student.history) student.history = [];
    student.history.unshift({
      title: `[네임스킨 해금] ${skinObj?.name} 해금`,
      points: -cost,
      date: dateStr
    });

    saveStudentToRTDB(student);
    renderUI();
    renderNameSkinsList();
    playSuccessSound();
    triggerConfetti(student.equippedCeremony);
    showToast(`'${skinObj?.name}' 스킨을 해금하고 장착했습니다! (-${cost} P)`, '🎉');
  });
}

function renderCardSkinsList() {
  const container = document.getElementById('cardSkinsListContainer');
  if (!container) return;
  const student = getCurrentStudent();
  if (!student) return;

  const unlocked = student.unlockedCardSkins || ['card-skin-none'];
  const equipped = student.equippedCardSkin || 'card-skin-none';

  container.innerHTML = ALL_CARD_SKINS.map(c => {
    const isEquipped = equipped === c.id;
    const isUnlocked = c.points === 0 || unlocked.includes(c.id);

    return `
      <div class="p-3 rounded-2xl border flex items-center justify-between shadow-xs ${c.class}">
        <div class="min-w-0 pr-2">
          <p class="font-extrabold text-xs truncate mb-0.5">${c.name}</p>
          <p class="text-[10px] opacity-80 truncate">${c.desc}</p>
        </div>
        <div class="shrink-0">
          ${isEquipped ? `
            <span class="text-xs font-black text-emerald-950 bg-emerald-200 px-3 py-1 rounded-xl">장착 중</span>
          ` : isUnlocked ? `
            <button onclick="equipCardSkin('${c.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
              장착하기
            </button>
          ` : `
            <button onclick="unlockCardSkin('${c.id}', ${c.points})" class="bg-amber-400 hover:bg-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs">
              해금 (${c.points} P)
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function equipCardSkin(cardSkinId) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  student.equippedCardSkin = cardSkinId;
  saveStudentToRTDB(student);
  renderUI();
  renderCardSkinsList();
  playSuccessSound();
  showToast('카드 배경 스킨이 장착되었습니다!', '🎴');
}

function unlockCardSkin(cardSkinId, cost) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  const currentPoints = student.totalPoints || 0;
  if (currentPoints < cost) {
    showToast(`포인트가 부족합니다! (현재 ${currentPoints} P / ${cost} P 필요)`, '⚠️');
    return;
  }

  const cardObj = ALL_CARD_SKINS.find(c => c.id === cardSkinId);
  showCustomConfirm('카드 스킨 해금', `'${cardObj?.name}' 카드 스킨을 ${cost} P로 해금하시겠습니까?`, () => {
    student.totalPoints -= cost;
    if (!student.unlockedCardSkins) student.unlockedCardSkins = ['card-skin-none'];
    if (!student.unlockedCardSkins.includes(cardSkinId)) student.unlockedCardSkins.push(cardSkinId);
    student.equippedCardSkin = cardSkinId;

    const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    if (!student.history) student.history = [];
    student.history.unshift({
      title: `[카드스킨 해금] ${cardObj?.name} 해금`,
      points: -cost,
      date: dateStr
    });

    saveStudentToRTDB(student);
    renderUI();
    renderCardSkinsList();
    playSuccessSound();
    triggerConfetti(student.equippedCeremony);
    showToast(`'${cardObj?.name}' 스킨을 해금하고 장착했습니다! (-${cost} P)`, '🎉');
  });
}

function renderCeremoniesList() {
  const container = document.getElementById('ceremoniesListContainer');
  if (!container) return;
  const student = getCurrentStudent();
  if (!student) return;

  const unlocked = student.unlockedCeremonies || ['ceremony-default'];
  const equipped = student.equippedCeremony || 'ceremony-default';

  container.innerHTML = ALL_CEREMONIES.map(cer => {
    const isEquipped = equipped === cer.id;
    const isUnlocked = cer.points === 0 || unlocked.includes(cer.id);

    return `
      <div class="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
        <div class="min-w-0 pr-2">
          <p class="font-extrabold text-xs text-slate-800 truncate">${cer.name}</p>
          <p class="text-[10px] text-slate-400 truncate">${cer.desc}</p>
        </div>
        <div class="shrink-0 flex items-center space-x-1.5">
          <button onclick="triggerConfetti('${cer.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-xl">
            테스트 🎆
          </button>
          ${isEquipped ? `
            <span class="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">장착 중</span>
          ` : isUnlocked ? `
            <button onclick="equipCeremony('${cer.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
              장착하기
            </button>
          ` : `
            <button onclick="unlockCeremony('${cer.id}', ${cer.points})" class="bg-amber-400 hover:bg-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs">
              해금 (${cer.points} P)
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function equipCeremony(ceremonyId) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  student.equippedCeremony = ceremonyId;
  saveStudentToRTDB(student);
  renderUI();
  renderCeremoniesList();
  playSuccessSound();
  triggerConfetti(ceremonyId);
  showToast('세레머니 이펙트가 장착되었습니다!', '🎉');
}

function unlockCeremony(ceremonyId, cost) {
  if (checkReadOnlyGuard()) return;
  const student = getCurrentStudent();
  if (!student) return;

  const currentPoints = student.totalPoints || 0;
  if (currentPoints < cost) {
    showToast(`포인트가 부족합니다! (현재 ${currentPoints} P / ${cost} P 필요)`, '⚠️');
    return;
  }

  const cerObj = ALL_CEREMONIES.find(c => c.id === ceremonyId);
  showCustomConfirm('세레머니 해금', `'${cerObj?.name}' 세레머니를 ${cost} P로 해금하시겠습니까?`, () => {
    student.totalPoints -= cost;
    if (!student.unlockedCeremonies) student.unlockedCeremonies = ['ceremony-default'];
    if (!student.unlockedCeremonies.includes(ceremonyId)) student.unlockedCeremonies.push(ceremonyId);
    student.equippedCeremony = ceremonyId;

    const dateStr = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    if (!student.history) student.history = [];
    student.history.unshift({
      title: `[세레머니 해금] ${cerObj?.name} 해금`,
      points: -cost,
      date: dateStr
    });

    saveStudentToRTDB(student);
    renderUI();
    renderCeremoniesList();
    playSuccessSound();
    triggerConfetti(ceremonyId);
    showToast(`'${cerObj?.name}' 세레머니를 해금하고 장착했습니다! (-${cost} P)`, '🎉');
  });
}
