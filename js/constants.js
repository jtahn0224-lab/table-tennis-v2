/* 10-WEEK TABLE TENNIS CHALLENGE CONSTANTS */
const DEFAULT_PASSCODE = "1234";

/* 5 BASIC FREE AVATARS & 100 TOTAL AVATARS LIST */
const BASIC_AVATARS = ['🏓', '🥇', '🏆', '⚡', '🔥'];
const ALL_AVATARS = [
  '🏓', '🥇', '🏆', '⚡', '🔥', '👑', '🌟', '🎯', '🚀', '💥',
  '🦸‍♂️', '🦸‍♀️', '🥷', '🧙‍♂️', '🧙‍♀️', '🧛‍♂️', '🧜‍♂️', '🧚‍♀️', '🤖', '👾',
  '🦁', '🐯', '🐻', '🦊', '🐱', '🐶', '🐼', '🐨', '🐰', '🦝',
  '🐺', '🦅', '🦉', '🦄', '🐲', '🐉', '🦈', '🐬', '🐙', '🦖',
  '🦕', '🦍', '🦣', '🦚', '🦩', '🦔', '🦦', '🦥', '🦨', '🦡',
  '⚽', '🏀', '🏈', '⚾', '🥎', '🏐', '🏐', '🎾', '🥏', '🎱',
  '🏑', '🏒', '🥍', '🏹', '🥊', '🥋', '🛹', '🛼', '🚴', '🏋️',
  '💎', '🌈', '🔮', '🧿', '🌌', '🪐', '☀️', '🌙', '🎆', '🎇',
  '✨', '🎨', '🎭', '🎪', '🎤', '🎧', '🎷', '🎸', '🎹', '🎮',
  '🕹️', '🧩', '🎲', '♟️', '🏎️', '🏍️', '🛸', '🛰️', '⚓', '🤺'
];

/* UNLOCKABLE PROFILE FRAMES */
const ALL_FRAMES = [
  { id: 'frame-none', name: '기본 테두리', points: 0, class: 'frame-none', desc: '심플한 기본 테두리' },
  { id: 'frame-emerald', name: '에메랄드 글로우', points: 150, class: 'frame-emerald', desc: '은은하게 빛나는 에메랄드 빛 프레임' },
  { id: 'frame-gold', name: '황금 챔피언', points: 300, class: 'frame-gold', desc: '챔피언에게 어울리는 찬란한 금빛 프레임' },
  { id: 'frame-neon', name: '네온 사이버', points: 400, class: 'frame-neon', desc: '사이키델릭하게 깜빡이는 네온 프레임' },
  { id: 'frame-flame', name: '불꽃 스매시', points: 500, class: 'frame-flame', desc: '강렬하게 타오르는 붉은 화염 프레임' },
  { id: 'frame-purple', name: '마법의 보라', points: 350, class: 'frame-purple', desc: '신비로운 보랏빛 오라 프레임' }
];

/* UNLOCKABLE LIMITED TITLES */
const ALL_TITLES = [
  { id: 't_default', title: '🌱 탁구 입문자', points: 0, desc: '기본 등급 칭호' },
  { id: 't_smash', title: '🏓 1반 스매시 폭격기', points: 200, desc: '강력한 스매싱을 날리는 에이스' },
  { id: 't_cut', title: '🛡️ 철벽 커트 마스터', points: 300, desc: '어떤 공이든 깎아서 돌려주는 수비 달인' },
  { id: 't_bgm', title: '🎵 탁구장 BGM DJ', points: 250, desc: '체육 시간 분위기를 책임지는 음악가' },
  { id: 't_manner', title: '🤝 매너 플레이어', points: 200, desc: '정정당당하고 상대를 배려하는 부원' },
  { id: 't_flame', title: '🔥 불꽃 랠리어', points: 400, desc: '랠리가 끊이지 않는 정열의 선수' },
  { id: 't_speed', title: '⚡ 빛의 드라이브', points: 400, desc: '눈에 보이지 않는 속도의 공격수' },
  { id: 't_mvp', title: '👑 이주의 MVP', points: 600, desc: '학급 탁구 수업 최고의 스타' },
  { id: 't_god', title: '🌟 전설의 핑퐁마스터', points: 1000, desc: '탁구 기술과 매너를 모두 정복한 전설' }
];

/* UNLOCKABLE AURAS & PARTICLES */
const ALL_AURAS = [
  { id: 'aura-none', name: '기본 (없음)', points: 0, class: 'aura-none', desc: '효과 없음' },
  { id: 'aura-flame', name: '🔥 불꽃 화염 오라', points: 300, class: 'aura-flame', desc: '타오르는 붉은 화염 오라 파티클' },
  { id: 'aura-lightning', name: '⚡ 사이버 번개 오라', points: 400, class: 'aura-lightning', desc: '깜빡이는 청빛 네온 번개 스파크' },
  { id: 'aura-starlight', name: '✨ 은하수 별빛 오라', points: 500, class: 'aura-starlight', desc: '황금빛 별가루와 은하수가 순환하는 효과' },
  { id: 'aura-sakura', name: '🌸 벚꽃 핑크 오라', points: 350, class: 'aura-sakura', desc: '부드럽게 피어나는 분홍빛 벚꽃 오라' }
];

/* UNLOCKABLE NAME ANIMATION TEXT SKINS */
const ALL_NAME_SKINS = [
  { id: 'name-skin-none', name: '기본 이름', points: 0, class: 'name-skin-none', desc: '기본 텍스트 스타일' },
  { id: 'name-skin-rainbow', name: '🌈 무지개 파도 스킨', points: 300, class: 'name-skin-rainbow', desc: '영롱한 무지갯빛이 흘러가는 글자 애니메이션' },
  { id: 'name-skin-shine', name: '💎 골드 샤인 스킨', points: 400, class: 'name-skin-shine', desc: '찬란한 금빛 반사광 빔이 스쳐 지나가는 글자' },
  { id: 'name-skin-neon', name: '🎆 네온 사이버 스킨', points: 350, class: 'name-skin-neon', desc: '사이버 펑크풍 네온사인이 밝게 빛나는 이름' },
  { id: 'name-skin-fire', name: '🔥 불타는 문자 스킨', points: 450, class: 'name-skin-fire', desc: '정열의 불꽃 광채가 일렁이는 화염 문자' }
];

/* UNLOCKABLE CARD BACKGROUND SKINS */
const ALL_CARD_SKINS = [
  { id: 'card-skin-none', name: '기본 화이트 카드', points: 0, class: 'card-skin-none', desc: '깔끔한 흰색 기본 카드' },
  { id: 'card-skin-galaxy', name: '🌌 우주 갤럭시 카드', points: 500, class: 'card-skin-galaxy', desc: '은하수와 별빛이 쏟아지는 우주 아크릴 카드' },
  { id: 'card-skin-cyber', name: '👾 사이버펑크 그리드', points: 400, class: 'card-skin-cyber', desc: '미래형 홀로그램 도트 그리드 스킨' },
  { id: 'card-skin-gold', name: '🏆 황금 전설 카드', points: 700, class: 'card-skin-gold', desc: '금빛 가루와 골드 폰트의 전설적인 챔피언 카드' },
  { id: 'card-skin-sunset', name: '🌅 석양 선셋 카드', points: 300, class: 'card-skin-sunset', desc: '따뜻한 로즈-오렌지 그라데이션 석양 카드' }
];

/* UNLOCKABLE VICTORY / MISSION CEREMONIES */
const ALL_CEREMONIES = [
  { id: 'ceremony-default', name: '🎉 기본 폭죽 세레머니', points: 0, desc: '다채로운 컬러 폭죽 팡파르' },
  { id: 'ceremony-crowns', name: '👑 황금 왕관 샤워', points: 300, desc: '황금 왕관과 트로피 빛깔 폭죽이 가득 터지는 이펙트' },
  { id: 'ceremony-rockets', name: '🚀 연쇄 로켓 폭발', points: 450, desc: '화면 양쪽에서 연속으로 발사되는 로켓 세레머니' },
  { id: 'ceremony-pingpong', name: '🏓 핑퐁 스매시 파열', points: 500, desc: '강력한 스매시와 함께 탁구공 파티클이 퍼지는 축하' }
];

/* 10-WEEK TABLE TENNIS CURRICULUM DEFAULT MISSIONS */
const DEFAULT_MISSIONS = [
  { 
    id: 'm_w1_1', 
    week: 1, 
    title: '쉐이크핸드/펜홀더 라켓 올바른 그립 잡기', 
    category: 'personal', 
    difficulty: '쉬움', 
    points: 10, 
    completed: false, 
    pending: false,
    description: '라켓을 손에 쥐었을 때 악수하듯 자연스럽게 잡고, 검지와 엄지로 라켓 면을 살짝 지지합니다. 손목에 무리한 힘이 들어가지 않도록 편안한 각도를 유지해 보세요.' 
  },
  { 
    id: 'm_w1_2', 
    week: 1, 
    title: '포핸드 stroke 기본 랠리 20회 성공', 
    category: 'personal', 
    difficulty: '보통', 
    points: 20, 
    completed: false, 
    pending: false,
    description: '상대방과 부드럽게 포핸드로 공을 주고받으며 20회 연속 랠리를 달성합니다. 타구 시 라켓 면이 정면을 향하고 몸 앞쪽 타점에서 맞추는 것이 핵심입니다.' 
  },
  { 
    id: 'm_w2_1', 
    week: 2, 
    title: '백핸드 쇼트 기본자세 및 10회 리턴', 
    category: 'personal', 
    difficulty: '쉬움', 
    points: 10, 
    completed: false, 
    pending: false,
    description: '몸의 중심을 살짝 낮추고 라켓을 가슴 앞쪽에 둔 상태에서, 공이 바운드된 직후 가볍게 밀어주듯 쇼트 10회를 성공합니다.' 
  },
  { 
    id: 'm_w2_2', 
    week: 2, 
    title: '포핸드 & 백핸드 대각선 랠리 교대 성공', 
    category: 'personal', 
    difficulty: '보통', 
    points: 20, 
    completed: false, 
    pending: false,
    description: '포핸드 1번, 백핸드 1번 번갈아 치며 대각선 코스로 공을 컨트롤하는 감각과 라켓 전환 연습을 진행합니다.' 
  },
  { 
    id: 'm_w3_1', 
    week: 3, 
    title: '정확한 법규 대각선 서브 5회 성공', 
    category: 'personal', 
    difficulty: '보통', 
    points: 20, 
    completed: false, 
    pending: false,
    description: '손바닥 위에 공을 올려두고 16cm 이상 정직하게 띄운 뒤, 대각선 코스로 정확하게 바운드시키는 규정 서브를 5회 성공합니다.' 
  },
  { 
    id: 'm_w4_1', 
    week: 4, 
    title: '2보 풋워크 좌우 이동 포핸드 10회 랠리', 
    category: 'personal', 
    difficulty: '어려움', 
    points: 30, 
    completed: false, 
    pending: false,
    description: '제자리에서 치지 않고 좌우 2스텝으로 빠르게 발을 움직여 적절한 거리를 확보한 후 안정적인 포핸드 랠리를 이어갑니다.' 
  },
  { 
    id: 'm_w5_1', 
    week: 5, 
    title: '포핸드 드라이브 상회전 공 만들기', 
    category: 'personal', 
    difficulty: '어려움', 
    points: 30, 
    completed: false, 
    pending: false,
    description: '라켓을 아래에서 위로 회전시키듯 타구하여 공에 강한 전진 상회전(Top-spin)을 걸어 네트를 부드럽게 넘어 테이블에 꽂히도록 연습합니다.' 
  },
  { 
    id: 'm_w8_1', 
    week: 8, 
    title: '파트너와 함께 10구 복식 랠리 성공', 
    category: 'team', 
    difficulty: '보통', 
    points: 20, 
    completed: false, 
    pending: false,
    description: '복식 경기 규칙에 맞추어 짝과 번갈아 교대로 공을 치며, 서로 호흡을 맞추어 10구 이상 랠리를 달성합니다.' 
  },
  { 
    id: 'm_w10_1', 
    week: 10, 
    title: '학급 토너먼트 경기 심판 활동 성실 수행', 
    category: 'team', 
    difficulty: '보통', 
    points: 20, 
    completed: false, 
    pending: false,
    description: '학급 토너먼트 경기에서 공정하게 득점 및 서브권을 선언하고, 라이브 스코어보드를 성실하게 조작하여 원활한 경기 진행을 돕습니다.' 
  }
];

const DEFAULT_REWARDS = [
  { id: 'r1', title: '자유 복식 경기 진행권 🎟️', points: 50, icon: '🏓' },
  { id: 'r2', title: '탁구장 BGM 선곡권 🎵', points: 30, icon: '🎵' },
  { id: 'r3', title: '토너먼트 대진표 선택권 🏆', points: 100, icon: '🥇' },
  { id: 'r4', title: '시원한 음료 교환권 🥤', points: 40, icon: '🥤' }
];
