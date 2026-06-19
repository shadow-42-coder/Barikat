// ===== APP.JS — Firebase window globals kullanır =====
// Firebase index.html'deki module script'te başlatıldı
// Burada sadece window._firebaseDb, window._firebaseAuth kullanıyoruz

// Kısayollar — window globals'dan al
function _getDb()   { return window._firebaseDb; }
function _getAuth() { return window._firebaseAuth; }

// Firestore fonksiyon kısayolları (window._fb'den)
function doc(...a)          { return window._fb.doc(...a); }
function setDoc(...a)       { return window._fb.setDoc(...a); }
function getDoc(...a)       { return window._fb.getDoc(...a); }
function updateDoc(...a)    { return window._fb.updateDoc(...a); }
function deleteDoc(...a)    { return window._fb.deleteDoc(...a); }
function onSnapshot(...a)   { return window._fb.onSnapshot(...a); }
function increment(n)       { return window._fb.increment(n); }
function collection(...a)   { return window._fb.collection(...a); }
function query(...a)        { return window._fb.query(...a); }
function orderBy(...a)      { return window._fb.orderBy(...a); }
function limit(n)           { return window._fb.limit(n); }
function getDocs(...a)      { return window._fb.getDocs(...a); }
function addDoc(...a)       { return window._fb.addDoc(...a); }
function arrayUnion(...a)   { return window._fb.arrayUnion(...a); }
function where(...a)        { return window._fb.where(...a); }

// db ve auth kısayolları
let db, auth, provider;

function initAppVars() {
  db      = window._firebaseDb;
  auth    = window._firebaseAuth;
  provider = window._firebaseProvider;
  window.db   = db;
  window.auth = auth;
}

// ===== XP SİSTEMİ =====
const XP_TABLE = [0,100,250,450,700,1000,1400,1900,2500,3200,4000,5000,6200,7600,9200,11000,13000,15500,18500,22000,26000];
const RANKS = [
  {min:1,max:5,name:"Çaylak",badge:"🥉"},
  {min:6,max:10,name:"Savaşçı",badge:"🥈"},
  {min:11,max:15,name:"Usta",badge:"🥇"},
  {min:16,max:20,name:"Efsane",badge:"🏆"},
  {min:21,max:99,name:"Zombi Kıyameti",badge:"💀"}
];

function getLevelFromXP(xp) {
  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= XP_TABLE[i]) return i + 1;
  }
  return 1;
}
function getXPForNextLevel(level) {
  return XP_TABLE[Math.min(level, XP_TABLE.length - 1)] || XP_TABLE[XP_TABLE.length - 1];
}
function getXPForCurrentLevel(level) {
  return XP_TABLE[Math.min(level - 1, XP_TABLE.length - 1)] || 0;
}
function getRank(level) {
  return RANKS.find(r => level >= r.min && level <= r.max) || RANKS[RANKS.length - 1];
}

window.getLevelFromXP = getLevelFromXP;
window.getRank = getRank;
window.getXPForNextLevel = getXPForNextLevel;
window.getXPForCurrentLevel = getXPForCurrentLevel;

// ===== KULLANICI PROFİLİ =====
let currentUser = null;
let userProfile = {};

window.userProfile = userProfile;

async function loadUserProfile(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  // DEV HESABI — sınırsız altın/elmas
  const DEV_UID = 'KkLuICZzRwcDSpCW0Zhf5D67JMq1';

  if (snap.exists()) {
    userProfile = snap.data();
    // Eksik alanları tamamla (eski hesaplar için)
    let needsUpdate = false;
    const defaults = { gold: 10000, gems: 100, vipLevel: 0, ownedEffects: [], activeEffect: null,
      questProgress: {}, questClaimed: {}, loginStreak: 0, recentGames: [], achievements: [],
      wins: 0, losses: 0, games: 0, winStreak: 0, bestStreak: 0, goldEarned: 0 };
    for (const [k, v] of Object.entries(defaults)) {
      if (userProfile[k] === undefined || userProfile[k] === null) {
        userProfile[k] = v;
        needsUpdate = true;
      }
    }
    // Google kullanıcısının ismini her zaman güncelle
    if (auth.currentUser?.displayName && userProfile.name !== auth.currentUser.displayName) {
      userProfile.name = auth.currentUser.displayName;
      needsUpdate = true;
    }
    if (needsUpdate) await updateDoc(ref, userProfile);
  } else {
    // Yeni kullanıcı — 10000 altın + 100 elmas ile başla
    // Misafir için rastgele ama tutarlı isim oluştur
    const guestNum = Math.floor(Math.random() * 9000) + 1000;
    const guestName = auth.currentUser?.displayName || `Misafir${guestNum}`;
    userProfile = {
      uid,
      name: guestName,
      avatar: '😎',
      gold: 10000, gems: 100,
      xp: 0, level: 1,
      wins: 0, losses: 0, games: 0,
      winStreak: 0, bestStreak: 0, goldEarned: 0,
      vipLevel: 0, ownedEffects: [], activeEffect: null,
      questProgress: {}, questClaimed: {}, loginStreak: 0,
      recentGames: [], achievements: [],
      createdAt: Date.now()
    };
    await setDoc(ref, userProfile);
  }

  // Dev hesabı kontrolü — sınırsız kaynak
  if (uid === DEV_UID) {
    userProfile.gold = 999999999;
    userProfile.gems = 999999999;
    userProfile._isDev = true;
    // Firestore'a her seferinde yaz — kaybolmasın
    updateDoc(ref, { gold: 999999999, gems: 999999999 }).catch(() => {});
  }

  window.userProfile = userProfile;
  updateAllUI();
  if (window.onProfileLoaded) window.onProfileLoaded();
  return userProfile;
}

function updateAllUI() {
  const p = userProfile;
  const level = getLevelFromXP(p.xp || 0);
  const rank = getRank(level);
  const xpCurrent = getXPForCurrentLevel(level);
  const xpNext = getXPForNextLevel(level);
  const xpProgress = xpNext > xpCurrent ? ((p.xp - xpCurrent) / (xpNext - xpCurrent)) * 100 : 100;

  // Menü
  setEl('menuName', p.name || 'Oyuncu');
  setEl('menuAvatar', p.avatar || '😎');
  setEl('menuLevel', `Lv.${level}`);
  setEl('menuXpText', `${p.xp||0} / ${xpNext} XP`);
  styleEl('menuXpBar', 'width', `${Math.min(xpProgress,100)}%`);
  setEl('goldAmount', (p.gold||0).toLocaleString('tr-TR'));

  // Profil
  setEl('profileAvatarBig', p.avatar || '😎');
  setEl('profileGoldDisplay', (p.gold||0).toLocaleString('tr-TR'));
  setEl('profileRankName', rank.name);
  setEl('profileRankBadge', rank.badge);
  setEl('profileLevelBig', `Seviye ${level}`);
  setEl('profileXpText', `${p.xp||0} / ${xpNext} XP`);
  styleEl('profileXpFill', 'width', `${Math.min(xpProgress,100)}%`);
  const nameInput = document.getElementById('profileNameInput');
  if (nameInput) nameInput.value = p.name || '';
  const welcomeAvatar = document.getElementById('menuAvatar');
  if (welcomeAvatar) welcomeAvatar.textContent = p.avatar || '😎';

  // Stat kartları
  const winrate = p.games > 0 ? Math.round((p.wins/p.games)*100) : 0;
  setEl('pStat-games', p.games||0);
  setEl('pStat-wins', p.wins||0);
  setEl('pStat-winrate', winrate+'%');
  setEl('pStat-xp', p.xp||0);
  setEl('pStat-streak', p.bestStreak||0);
  setEl('pStat-gold', (p.goldEarned||0).toLocaleString('tr-TR'));

  // Son oyunlar
  const recentList = document.getElementById('recentGamesList');
  if (recentList) {
    if (!p.recentGames || p.recentGames.length === 0) {
      recentList.innerHTML = '<p class="empty-msg">Henüz oyun oynanmadı</p>';
    } else {
      recentList.innerHTML = [...p.recentGames].reverse().slice(0,10).map(g => `
        <div class="recent-item">
          <span class="recent-result ${g.won ? 'result-win' : 'result-loss'}">${g.won ? '🏆 GALİP' : '💀 MAĞLUBİYET'}</span>
          <span class="recent-detail">${g.mode} · ${g.opponent || '—'}</span>
          <span class="recent-xp">+${g.xp} XP</span>
          <span style="color:var(--gold);font-size:12px">+${g.gold}🪙</span>
        </div>
      `).join('');
    }
  }

  // Rozetler
  const achList = document.getElementById('achievementsList');
  if (achList) {
    const badges = getAchievements(p);
    achList.innerHTML = badges.length ? badges.map(b =>
      `<div class="badge-item">${b.icon} ${b.name}</div>`
    ).join('') : '<p class="empty-msg">Henüz rozet yok</p>';
  }

  // Ayarlar
  setEl('stgAccountName', p.name + (auth.currentUser?.isAnonymous ? ' (Misafir)' : ' (Google)'));

  // Avatar seçici
  document.querySelectorAll('.avatar-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.av === p.avatar);
  });
}

function getAchievements(p) {
  const badges = [];
  if (p.games >= 1) badges.push({icon:'🎮', name:'İlk Oyun'});
  if (p.wins >= 1) badges.push({icon:'🏆', name:'İlk Galibiyet'});
  if (p.wins >= 10) badges.push({icon:'⚔️', name:'Savaşçı'});
  if (p.wins >= 50) badges.push({icon:'👑', name:'Kral'});
  if (p.winStreak >= 3) badges.push({icon:'🔥', name:'3 Seri'});
  if (p.winStreak >= 5) badges.push({icon:'💥', name:'5 Seri'});
  if (p.games >= 100) badges.push({icon:'🎯', name:'100 Maç'});
  if (p.gold >= 50000) badges.push({icon:'💰', name:'Zengin'});
  if (getLevelFromXP(p.xp||0) >= 10) badges.push({icon:'⚡', name:'Seviye 10'});
  return badges;
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function styleEl(id, prop, val) {
  const el = document.getElementById(id);
  if (el) el.style[prop] = val;
}

// ===== AUTH - DOMContentLoaded bekle =====
document.addEventListener('DOMContentLoaded', function() {
  // Firebase hazır olana kadar bekle
  function waitForFirebase(cb, attempts=0) {
    if (window._firebaseAuth && window._firebaseDb) {
      initAppVars();
      cb();
    } else if (attempts < 50) {
      setTimeout(() => waitForFirebase(cb, attempts+1), 100);
    } else {
      console.error('Firebase yüklenemedi!');
    }
  }

  waitForFirebase(function() {
    // Buton bağlantıları
    const btnG = document.getElementById('btnGoogle');
    const btnGuest = document.getElementById('btnGuest');

    if (btnG) btnG.onclick = async () => {
      try {
        const { signInWithPopup } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js");
        await signInWithPopup(auth, provider);
      } catch(e) {
        showToast('Google giriş hatası: ' + e.message, 'error');
      }
    };

    if (btnGuest) btnGuest.onclick = async () => {
      try {
        const { signInAnonymously } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js");
        await signInAnonymously(auth);
      } catch(e) {
        showToast('Misafir giriş hatası', 'error');
      }
    };

    // Auth state değişince burası çalışır (index.html'de tanımlı)
    window._onAuthChange = async (user) => {
      currentUser = user;
      if (user) {
        await loadUserProfile(user.uid);
        loadLeaderboard();
        showScreen('screen-menu');
      } else {
        showScreen('screen-login');
      }
    };

    window.doLogout = async function() {
      const { signOut } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js");
      await signOut(auth);
      showScreen('screen-login');
    };
  });
});

// ===== PROFİL KAYDET =====
window.saveProfileChanges = async function() {
  if (!currentUser) return;
  const nameInput = document.getElementById('profileNameInput');
  const newName = nameInput?.value?.trim();
  if (!newName) { showToast('İsim boş olamaz!'); return; }

  const selectedAvatar = document.querySelector('.avatar-opt.selected')?.dataset?.av || userProfile.avatar;

  userProfile.name = newName;
  userProfile.avatar = selectedAvatar;

  await updateDoc(doc(db,'users',currentUser.uid), { name: newName, avatar: selectedAvatar });
  updateAllUI();
  showToast('✅ Profil kaydedildi!');
};

// Avatar seçme - DOMContentLoaded'da bağla
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.avatar-opt').forEach(el => {
    el.onclick = () => {
      document.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
      el.classList.add('selected');
      const big = document.getElementById('profileAvatarBig');
      if (big) big.textContent = el.dataset.av;
    };
  });
});

// ===== XP & ALTIN GÜNCELLE =====
window.awardMatchResult = async function(won, gameMode, opponent) {
  if (!currentUser) return;

  const baseXP = won ? 80 : 20;
  const bonusXP = won ? ({'2V2':50,'FFA4':50,'FFA3':30}[gameMode] || 0) : 0;
  const xpEarned = baseXP + bonusXP;

  // pvb (bot modu) da altın kazanılır
  const goldWin  = { '1v1':180, 'FFA3':900, 'FFA4':900, '2V2':1800, 'pvb':150, '3ffa':600, '4ffa':600 };
  const goldLoss = { '1v1':0,   'FFA3':0,   'FFA4':0,   '2V2':0,    'pvb':0,   '3ffa':0,   '4ffa':0   };
  const goldChange = won ? (goldWin[gameMode] || 150) : (goldLoss[gameMode] || 0);

  // ① ANINDA yerel state'i güncelle — UI gecikme olmadan yansır
  const oldGold = userProfile.gold || 0;
  const oldXP   = userProfile.xp   || 0;
  const newXP   = oldXP + xpEarned;
  const newLevel = getLevelFromXP(newXP);
  const levelUp  = newLevel > getLevelFromXP(oldXP);
  const newStreak  = won ? (userProfile.winStreak || 0) + 1 : 0;
  const bestStreak = Math.max(newStreak, userProfile.bestStreak || 0);

  const gameRecord = { won, mode: gameMode, opponent: opponent||'—', xp: xpEarned, gold: goldChange, ts: Date.now() };
  const recentGames = [...(userProfile.recentGames || []), gameRecord].slice(-20);

  // Dev hesabı — altın sınırsız, sadece XP/istatistik güncelle
  const isDev = userProfile._isDev;

  userProfile = {
    ...userProfile,
    xp:        newXP,
    level:     newLevel,
    wins:      (userProfile.wins  || 0) + (won  ? 1 : 0),
    losses:    (userProfile.losses|| 0) + (!won ? 1 : 0),
    games:     (userProfile.games || 0) + 1,
    winStreak: newStreak,
    bestStreak,
    gold:      isDev ? 999999999 : oldGold + goldChange,
    goldEarned:(userProfile.goldEarned || 0) + (won ? goldChange : 0),
    recentGames,
  };
  window.userProfile = userProfile;

  // ② UI'ı anında güncelle (Firestore beklemeden)
  updateAllUI();
  if (window.updateGemDisplays) window.updateGemDisplays();

  // Float efektleri anında göster
  if (goldChange > 0) window.showGoldFloat?.(goldChange);
  window.showXPFloat?.(xpEarned);
  if (levelUp) {
    setTimeout(() => window.showToast?.(`🎉 SEVİYE ATLADIN! Lv.${newLevel}`), 800);
  }

  // ③ Firestore'a arka planda yaz (UI'ı bloklamaz)
  if (!isDev) {
    const updates = {
      xp: newXP, level: newLevel,
      wins:   won  ? increment(1) : (userProfile.wins||0),
      losses: !won ? increment(1) : (userProfile.losses||0),
      games:  increment(1),
      winStreak: newStreak, bestStreak,
      gold: increment(goldChange),
      goldEarned: won ? increment(goldChange) : (userProfile.goldEarned||0),
      recentGames,
    };
    updateDoc(doc(db,'users',currentUser.uid), updates).catch(e => console.error('Firestore yazma hatası:', e));
  } else {
    // Dev: sadece istatistikleri yaz, para yazma
    const updates = {
      xp: newXP, level: newLevel,
      wins:   won  ? increment(1) : (userProfile.wins||0),
      losses: !won ? increment(1) : (userProfile.losses||0),
      games:  increment(1),
      winStreak: newStreak, bestStreak,
      recentGames,
    };
    updateDoc(doc(db,'users',currentUser.uid), updates).catch(() => {});
  }

  // Görev ilerlemesini güncelle
  if (window.updateQuestProgress) {
    window.updateQuestProgress('games', 1);
    if (won) window.updateQuestProgress('wins', 1);
  }

  return { xpEarned, goldChange, levelUp, newLevel };
};

// Altın düşür (oyuna giriş)
// Altın sadece oyun BAŞLAYINCA kesilir, lobide beklerken kesilmez
// Bu değişken lobi terk edilince iade için tutulur
let pendingGoldCost = 0;
let goldAlreadyDeducted = false;

window.deductGold = async function(amount) {
  if (!currentUser) return false;
  // Dev hesabı — her zaman geçer, para kesilmez
  if (userProfile._isDev) return true;
  const currentGold = userProfile.gold ?? 0;
  if (currentGold < amount) {
    showToast('❌ Yeterli altın yok! (Gerekli: ' + amount.toLocaleString('tr-TR') + ' 🪙)');
    return false;
  }
  pendingGoldCost = amount;
  goldAlreadyDeducted = false;
  return true;
};

// Oyun gerçekten başlayınca altını kes
async function finalizeGoldDeduction() {
  if (!currentUser || goldAlreadyDeducted || pendingGoldCost === 0) return;
  if (userProfile._isDev) { pendingGoldCost = 0; return; } // Dev — para kesilmez
  goldAlreadyDeducted = true;
  await updateDoc(doc(db,'users',currentUser.uid), { gold: increment(-pendingGoldCost) });
  userProfile.gold = (userProfile.gold || 0) - pendingGoldCost;
  window.userProfile = userProfile;
  setEl('goldAmount', userProfile.gold.toLocaleString('tr-TR'));
  showToast('💸 ' + pendingGoldCost.toLocaleString('tr-TR') + ' 🪙 giriş ücreti alındı');
  pendingGoldCost = 0;
};

// ===== LEADERBOARD =====
async function loadLeaderboard() {
  const lb = document.getElementById('leaderboardList');
  if (!lb) return;
  try {
    const q = query(collection(db,'users'), orderBy('xp','desc'), limit(5));
    const snap = await getDocs(q);
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
    lb.innerHTML = snap.docs.map((d,i) => {
      const u = d.data();
      const lv = getLevelFromXP(u.xp||0);
      return `<div class="lb-row">
        <span class="lb-rank">${medals[i]||''}</span>
        <span class="lb-name">${u.avatar||'👤'} ${u.name||'?'} <small style="color:var(--text2)">Lv.${lv}</small></span>
        <span class="lb-score">${(u.xp||0).toLocaleString('tr-TR')} XP</span>
      </div>`;
    }).join('') || '<p class="lb-loading">Henüz oyuncu yok</p>';
  } catch(e) {
    lb.innerHTML = '<p class="lb-loading">Yüklenemedi</p>';
  }
}

// ===== ODA SİSTEMİ =====
const GAME_COSTS = { '1v1': 100, 'FFA3': 500, 'FFA4': 500, '2V2': 1000 };
const GAME_MAX = { '1v1': 2, 'FFA3': 3, 'FFA4': 4, '2V2': 4 };

// Sahte bot isimleri
const BOT_NAMES = [
  'Kara Kurt','Demir Yumruk','Ölüm Yılan','Gece Gölge','Ateş Toprak',
  'Kızıl Kaplan','Sessiz Fırtına','Çelik Pençe','Karanlık Rüzgar','Zehirli Ok',
  'Kan Kartalı','Duman Bıçak','Demir Kalkan','Gece Avcısı','Ölü Toprak'
];
const BOT_AVATARS = ['🤺','👿','💀','🔥','⚡','🌑','🗡️','🏹','☠️','🧿'];

let selectedMode = '1v1';
let selectedRoomType = 'open';
let currentRoomId = null;
let myPlayerId = null;
let lobbyTimerInterval = null;
let lobbyUnsubscribe = null;
let isHost = false;
let myReady = false;

// Tüm menü butonlarını DOMContentLoaded'da bağla
document.addEventListener('DOMContentLoaded', function() {
  // Mod seçici
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.dataset.mode;
      const cost = GAME_COSTS[selectedMode] || 100;
      setEl('entryCostDisplay', cost.toLocaleString('tr-TR') + ' 🪙');
    };
  });

  // Oda tipi seçici
  document.querySelectorAll('input[name="roomType"]').forEach(radio => {
    radio.onchange = () => {
      selectedRoomType = radio.value;
      const pf = document.getElementById('pinField');
      if (pf) pf.style.display = radio.value === 'pin' ? 'block' : 'none';
    };
  });

  // Menü butonları
  const b = id => document.getElementById(id);
  if (b('btnCreateRoom'))   b('btnCreateRoom').onclick = () => openModal('modal-create');
  if (b('btnJoinRoom'))     b('btnJoinRoom').onclick   = () => openModal('modal-join');
  if (b('btnOpenProfile'))  b('btnOpenProfile').onclick = () => showScreen('screen-profile');
  if (b('btnOpenSettings')) b('btnOpenSettings').onclick = () => showScreen('screen-settings');
  if (b('btnVsBot'))        b('btnVsBot').onclick = () => { window.initGame('pvb'); showScreen('screen-game'); };
  if (b('btnQuickMatch'))   b('btnQuickMatch').onclick  = quickMatch;
  if (b('btnSocial'))       b('btnSocial').onclick = () => { showScreen('screen-social'); window.renderFriendsList?.(); };
  if (b('btnQuests'))       b('btnQuests').onclick = () => { window.renderQuests?.(); showScreen('screen-quests'); };
  if (b('btnShop'))         b('btnShop').onclick = () => { window.renderShopTab?.('gems'); showScreen('screen-shop'); };

  // Join kodu girilince PIN kontrolü
  const joinCode = b('joinCodeInput');
  if (joinCode) joinCode.addEventListener('input', async (e) => {
    const code = e.target.value.trim().toUpperCase();
    if (code.length !== 6 || !db) return;
    try {
      const roomRef = doc(db,'rooms',code);
      const snap = await getDoc(roomRef);
      const pinField = b('joinPinField');
      const pinHint  = b('joinPinHint');
      if (snap.exists() && snap.data().hasPIN) {
        if (pinField) pinField.style.display = 'block';
        if (pinHint)  pinHint.style.display  = 'block';
      } else {
        if (pinField) pinField.style.display = 'none';
        if (pinHint)  pinHint.style.display  = 'none';
      }
    } catch(e) {}
  });
});

// ODA OLUŞTUR
window.doCreateRoom = async function() {
  if (!currentUser) { showToast('Giriş gerekli!'); return; }
  const cost = GAME_COSTS[selectedMode] || 100;
  const ok = await window.deductGold(cost);
  if (!ok) return;

  const hasPIN = selectedRoomType === 'pin';
  let pin = null;
  if (hasPIN) {
    pin = document.getElementById('createPinInput').value.padStart(4,'0');
    if (pin.length !== 4 || isNaN(pin)) { showToast('Geçerli bir PIN gir!'); return; }
  }

  const roomId = Math.random().toString(36).substring(2,8).toUpperCase();
  currentRoomId = roomId;
  myPlayerId = 0;
  isHost = true;
  myReady = false;

  const maxP = GAME_MAX[selectedMode] || 2;
  const initialPlayers = [makePlayerObj(0, userProfile.name, userProfile.avatar, false)];

  const gameRef = doc(db,'games',roomId);
  await setDoc(gameRef, {
    players: initialPlayers,
    turnIdx: 0,
    gameMode: selectedMode,
    deck: [...window.deckBase, ...window.deckBase],
    log: [`${userProfile.name} odayı kurdu.`],
    gameStarted: false,
    maxPlayers: maxP,
    hostId: currentUser.uid,
    pin: pin,
    hasPIN,
    readyPlayers: [],
    createdAt: Date.now()
  });

  const roomRef = doc(db,'rooms',roomId);
  await setDoc(roomRef, {
    code: roomId, gameType: selectedMode,
    playersJoined: 1, maxPlayers: maxP,
    gameId: roomId, hasPIN, pin,
    gameStarted: false, createdAt: Date.now()
  });

  closeModal('modal-create');
  showLobby(roomId, pin, maxP, initialPlayers);
};

// ODAYA KATIL
window.doJoinRoom = async function() {
  if (!currentUser) return;
  const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
  if (!code || code.length !== 6) { showToast('Geçerli oda kodu gir!'); return; }

  const roomRef = doc(db,'rooms',code);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) { showToast('Oda bulunamadı!'); return; }
  const rd = roomSnap.data();
  if (rd.playersJoined >= rd.maxPlayers) { showToast('Oda dolu!'); return; }
  if (rd.gameStarted) { showToast('Oyun başladı!'); return; }

  if (rd.hasPIN) {
    document.getElementById('joinPinField').style.display = 'block';
    document.getElementById('joinPinHint').style.display = 'block';
    const enteredPin = document.getElementById('joinPinInput').value;
    if (!enteredPin) { showToast('PIN gerekli!'); return; }
    if (enteredPin.padStart(4,'0') !== rd.pin) { showToast('Yanlış PIN!'); return; }
  }

  const cost = GAME_COSTS[rd.gameType] || 100;
  const ok = await window.deductGold(cost);
  if (!ok) return;

  currentRoomId = code;
  myPlayerId = rd.playersJoined;
  isHost = false;
  myReady = false;

  const gameRef = doc(db,'games',code);
  const gameSnap = await getDoc(gameRef);
  const gd = gameSnap.data();

  const newPlayer = makePlayerObj(myPlayerId, userProfile.name, userProfile.avatar, false);
  await updateDoc(gameRef, { players: [...gd.players, newPlayer] });
  await updateDoc(roomRef, { playersJoined: increment(1) });

  closeModal('modal-join');
  showLobby(code, rd.pin, rd.maxPlayers, [...gd.players, newPlayer]);
};

// Hızlı eşleşme
async function quickMatch() {
  if (!currentUser) return;
  showToast('🔍 Açık oda aranıyor...');
  try {
    const q = query(collection(db,'rooms'), orderBy('createdAt','desc'), limit(10));
    const snap = await getDocs(q);
    let found = null;
    snap.docs.forEach(d => {
      const r = d.data();
      if (!r.gameStarted && !r.hasPIN && r.playersJoined < r.maxPlayers) found = r;
    });
    if (found) {
      document.getElementById('joinCodeInput').value = found.code;
      await window.doJoinRoom();
    } else {
      showToast('Açık oda yok, yeni oda oluşturuluyor...');
      setTimeout(() => openModal('modal-create'), 1000);
    }
  } catch(e) {
    showToast('Eşleşme hatası');
  }
}

function makePlayerObj(id, name, avatar, isBot) {
  return {
    id, name: isBot ? botName() : name,
    avatar: isBot ? botAvatar() : (avatar || '😎'),
    hp: 7, barricade: 0, hand: [], zombies: [],
    cardsPlayed: 0, maxPlays: 2, blocked: false,
    teamId: id, isBot,
    ready: isBot // Botlar hazır gelir
  };
}

function botName() { return BOT_NAMES[Math.floor(Math.random()*BOT_NAMES.length)]; }
function botAvatar() { return BOT_AVATARS[Math.floor(Math.random()*BOT_AVATARS.length)]; }

// LOBİ GÖSTER
function showLobby(roomId, pin, maxPlayers, players) {
  showScreen('screen-lobby');
  setEl('lobbyCode', roomId);

  const pinDisplay = document.getElementById('lobbyPinDisplay');
  if (pin && pinDisplay) {
    pinDisplay.style.display = 'block';
    setEl('lobbyPin', pin);
  }

  renderLobbySlots(players, maxPlayers, []);

  // Bekleme timer'ı başlat
  startLobbyTimer(roomId, maxPlayers);

  // Firestore dinle
  if (lobbyUnsubscribe) lobbyUnsubscribe();
  const gameRef = doc(db,'games',roomId);
  lobbyUnsubscribe = onSnapshot(gameRef, (snap) => {
    if (!snap.exists()) return;
    const gd = snap.data();
    const readyList = gd.readyPlayers || [];
    renderLobbySlots(gd.players, gd.maxPlayers, readyList);

    // Yer değiştirme isteği
    if (gd.swapRequest && gd.swapRequest.toId === myPlayerId && gd.swapRequest.fromId !== myPlayerId) {
      const req = gd.swapRequest;
      if (!pendingSwap || pendingSwap.ts !== req.ts) showSwapRequest(req);
    } else if (!gd.swapRequest) {
      const swapModal = document.getElementById('swapRequestModal');
      if (swapModal && swapModal.style.display !== 'none') {
        swapModal.style.display = 'none';
        clearInterval(swapCountdownTimer);
      }
    }

    // Herkes hazır mı? — Host otomatik başlat
    const filledPlayers = gd.players.filter(p => p != null);
    const allReady = filledPlayers.length === gd.maxPlayers &&
      filledPlayers.every(p => readyList.includes(p.id) || p.isBot);

    if (allReady && isHost && !gd.gameStarted) {
      // Küçük gecikme — UI güncellensin
      setTimeout(() => window.startLobbyGame(), 800);
    }

    if (gd.gameStarted) {
      clearLobbyTimer();
      if (lobbyUnsubscribe) { lobbyUnsubscribe(); lobbyUnsubscribe = null; }
      finalizeGoldDeduction();
      window.startGameMultiplayer(roomId, gd.gameMode, myPlayerId);
    }
  });
}

function renderLobbySlots(lobbyPlayers, maxPlayers, readyPlayers) {
  const table = document.getElementById('lobbyTable');
  if (!table) return;

  // Masa modunu güncelle
  const modeLabels = {'1v1':'1v1','FFA3':'3\'lü FFA','FFA4':'4\'lü FFA','2V2':'2v2'};
  setEl('lobbyModeLabel', modeLabels[selectedMode] || selectedMode);

  // Mevcut koltukları kaldır
  table.querySelectorAll('.seat').forEach(s => s.remove());

  // Her slot için koltuk oluştur
  for (let i = 0; i < maxPlayers; i++) {
    const p = lobbyPlayers[i];
    const isReady = p && (readyPlayers.includes(p.id) || p.isBot);
    const isMe = p && p.id === myPlayerId;
    const isHostSeat = i === 0;

    const seat = document.createElement('div');
    seat.className = 'seat';
    seat.dataset.seatIdx = i;

    // Pozisyon sınıfı
    let posClass = '';
    if (maxPlayers === 2) posClass = `seat-pos-${i}`;
    else if (maxPlayers === 3) posClass = `seat-pos-3-${i}`;
    else posClass = `seat-pos-4-${i}`;
    seat.classList.add(posClass);

    if (p) {
      seat.classList.add('filled');
      if (isMe) seat.classList.add('mine');
      if (isReady) seat.classList.add('ready');
      if (isHostSeat && !p.isBot) seat.classList.add('host');

      seat.innerHTML = `
        <div class="seat-circle">${p.avatar || '👤'}</div>
        <div class="seat-name">${p.name}${isMe ? ' 🟡' : ''}</div>
        <div class="seat-sub">${isReady ? '✅ Hazır' : (p.isBot ? '🤖' : '⏳')}</div>
      `;

      // Dolu koltuğa tıklayınca yer değiştirme teklifi
      if (!isMe && !p.isBot) {
        seat.style.cursor = 'pointer';
        seat.onclick = () => requestSwap(i, p);
      } else if (isMe) {
        seat.style.cursor = 'default';
      }
    } else {
      // Boş koltuk
      seat.classList.add('empty');
      seat.innerHTML = `
        <div class="seat-circle"></div>
        <div class="seat-name" style="color:rgba(255,255,255,0.3)">Boş</div>
        <div class="seat-sub" style="color:rgba(255,255,255,0.2)">Bekliyor</div>
      `;
      // Boş koltuğa otur
      seat.onclick = () => sitOnSeat(i);
    }

    table.appendChild(seat);
  }

  // Başlat butonu
  const allReady = lobbyPlayers.length === maxPlayers &&
    lobbyPlayers.every(p => (readyPlayers.includes(p.id) || p.isBot));
  const btnStart = document.getElementById('btnStartGame');
  if (btnStart) btnStart.style.display = (isHost && allReady) ? 'flex' : 'none';
}

// Boş koltuğa otur — seat pozisyonunu değiştir
async function sitOnSeat(targetSeatIdx) {
  if (!currentRoomId) return;
  const gameRef = doc(db,'games',currentRoomId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;
  const gd = snap.data();

  // Zaten o slottaysa bir şey yapma
  if (myPlayerId === targetSeatIdx) return;
  // O slot doluysa
  if (gd.players[targetSeatIdx]) {
    showToast('Bu yer dolu!');
    return;
  }

  // Mevcut pozisyonumu serbest bırak, yeni yere geç
  const newPlayers = [...gd.players];
  const me = newPlayers[myPlayerId];
  if (!me) return;

  newPlayers[targetSeatIdx] = { ...me, id: targetSeatIdx };
  newPlayers[myPlayerId] = null; // eski yeri boşalt
  // null elemanları temizle (sona boş bırakmak yerine)
  // Sadece id'yi güncelle, diziyi sıkıştırma

  const oldId = myPlayerId;
  myPlayerId = targetSeatIdx;
  window.myPlayerId = targetSeatIdx;

  await updateDoc(gameRef, { players: newPlayers });
  showToast('🪑 Koltuğa oturdun!');
}

// YER DEĞİŞTİRME TEKLİFİ GÖNDERMEi
async function requestSwap(targetSeatIdx, targetPlayer) {
  if (!currentRoomId) return;
  showToast(`↔️ ${targetPlayer.name}'e yer değişimi teklif edildi...`);

  const gameRef = doc(db,'games',currentRoomId);
  // Swap isteğini Firestore'a yaz
  await updateDoc(gameRef, {
    swapRequest: {
      fromId: myPlayerId,
      fromName: userProfile.name,
      fromAvatar: userProfile.avatar || '😎',
      toId: targetSeatIdx,
      ts: Date.now()
    }
  });
}

// YER DEĞİŞTİRME POPUP KABUL/RET
let swapCountdownTimer = null;
let pendingSwap = null;

function showSwapRequest(req) {
  pendingSwap = req;
  setEl('swapFromAvatar', req.fromAvatar || '😎');
  setEl('swapFromName', req.fromName || 'Oyuncu');
  document.getElementById('swapRequestModal').style.display = 'flex';

  // 10 sn geri sayım
  let t = 10;
  setEl('swapCountdown', t);
  clearInterval(swapCountdownTimer);
  swapCountdownTimer = setInterval(() => {
    t--;
    setEl('swapCountdown', t);
    if (t <= 0) {
      clearInterval(swapCountdownTimer);
      respondSwap(false); // Süre doldu, ret
    }
  }, 1000);
}

window.respondSwap = async function(accepted) {
  clearInterval(swapCountdownTimer);
  document.getElementById('swapRequestModal').style.display = 'none';

  if (!currentRoomId || !pendingSwap) return;
  const gameRef = doc(db,'games',currentRoomId);

  if (accepted) {
    // Yerleri değiştir
    const snap = await getDoc(gameRef);
    if (!snap.exists()) return;
    const gd = snap.data();
    const newPlayers = JSON.parse(JSON.stringify(gd.players));
    const fromIdx = pendingSwap.fromId;
    const toIdx = myPlayerId;

    if (newPlayers[fromIdx] && newPlayers[toIdx]) {
      const tmp = { ...newPlayers[fromIdx], id: toIdx };
      newPlayers[toIdx] = { ...newPlayers[toIdx], id: fromIdx };
      newPlayers[fromIdx] = tmp;

      // Benim ID'mi güncelle
      myPlayerId = fromIdx;
      window.myPlayerId = fromIdx;

      await updateDoc(gameRef, { players: newPlayers, swapRequest: null });
      showToast('↔️ Yer değiştirildi!');
    }
  } else {
    // Reddet
    await updateDoc(gameRef, { swapRequest: null });
    showToast('❌ Yer değişimi reddedildi');
  }
  pendingSwap = null;
};

function startLobbyTimer(roomId, maxPlayers) {
  let t = 30;
  const timerWrap = document.getElementById('lobbyTimerCompact');
  const timerEl = document.getElementById('lobbyTimer');
  const timerFill = document.getElementById('lobbyTimerFill');
  if (timerWrap) timerWrap.style.display = 'flex';

  lobbyTimerInterval = setInterval(async () => {
    t--;
    if (timerEl) timerEl.textContent = t;
    if (timerFill) timerFill.style.width = (t/30*100) + '%';

    if (t <= 0) {
      clearLobbyTimer();
      if (!isHost) return;
      const gameRef = doc(db,'games',roomId);
      const snap = await getDoc(gameRef);
      if (!snap.exists()) return;
      const gd = snap.data();
      if (gd.gameStarted) return;
      const newPlayers = [...gd.players];
      while (newPlayers.length < maxPlayers) {
        const botId = newPlayers.length;
        newPlayers.push(makePlayerObj(botId, botName(), botAvatar(), true));
      }
      const newReady = [...(gd.readyPlayers||[])];
      newPlayers.filter(p=>p&&p.isBot).forEach(p=>{ if(!newReady.includes(p.id)) newReady.push(p.id); });
      if (!newReady.includes(myPlayerId)) newReady.push(myPlayerId);
      await updateDoc(gameRef, { players: newPlayers, readyPlayers: newReady });
    }
  }, 1000);
}

function clearLobbyTimer() {
  if (lobbyTimerInterval) { clearInterval(lobbyTimerInterval); lobbyTimerInterval = null; }
}

// Hazır butonu
window.toggleReady = async function() {
  if (!currentRoomId) return;
  myReady = !myReady;
  const btn = document.getElementById('btnReady');
  if (btn) {
    btn.classList.toggle('is-ready', myReady);
    btn.textContent = myReady ? '✅ Hazır (Geri Al)' : '✅ Hazır';
  }
  const gameRef = doc(db,'games',currentRoomId);
  const snap = await getDoc(gameRef);
  let readyList = snap.data()?.readyPlayers || [];
  if (myReady) { if (!readyList.includes(myPlayerId)) readyList.push(myPlayerId); }
  else { readyList = readyList.filter(id => id !== myPlayerId); }
  await updateDoc(gameRef, { readyPlayers: readyList });
};

// Oyunu başlat (sadece host)
window.startLobbyGame = async function() {
  if (!isHost || !currentRoomId) return;
  const gameRef = doc(db,'games',currentRoomId);
  const roomRef = doc(db,'rooms',currentRoomId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;
  const gd = snap.data();
  if (gd.gameStarted) return; // Zaten başladı

  // Tüm oyuncular mevcut mu kontrol et
  const filledPlayers = gd.players.filter(p => p != null);
  if (filledPlayers.length < gd.maxPlayers) {
    showToast('Tüm oyuncular katılmadı!');
    return;
  }

  // Başlangıç ellerini dağıt — null olmayan oyunculara
  let up = JSON.parse(JSON.stringify(gd.players));
  let ud = [...(gd.deck || [...window.deckBase, ...window.deckBase])];
  if (ud.length < 20) ud = [...window.deckBase, ...window.deckBase];

  up.forEach(p => {
    if (!p) return;
    p.hand = p.hand || [];
    for (let i = 0; i < 5; i++) {
      if (ud.length === 0) ud = [...window.deckBase, ...window.deckBase];
      const idx = Math.floor(Math.random() * ud.length);
      p.hand.push(ud.splice(idx, 1)[0]);
    }
  });

  const firstPlayer = up.find(p => p != null);
  await updateDoc(gameRef, {
    players: up, deck: ud, gameStarted: true, turnIdx: firstPlayer?.id || 0,
    log: [`Oyun başladı!`, `--- ${firstPlayer?.name || '?'}'in TURU ---`]
  });
  await updateDoc(roomRef, { gameStarted: true });
  await finalizeGoldDeduction();
};

// Lobiden ayrıl - oyun başlamadıysa ücret kesilmez
window.leaveLobby = async function() {
  clearLobbyTimer();
  if (lobbyUnsubscribe) { lobbyUnsubscribe(); lobbyUnsubscribe = null; }

  // Oyun başlamadıysa altın kesilmemişti zaten, sıfırla
  if (!goldAlreadyDeducted) {
    pendingGoldCost = 0;
    showToast('↩️ Lobiden çıkıldı. Ücret alınmadı.');
  }

  // Eğer host ise odayı sil
  if (isHost && currentRoomId) {
    try {
      const gameRef = doc(db,'games',currentRoomId);
      const snap = await getDoc(gameRef);
      if (snap.exists() && !snap.data().gameStarted) {
        await deleteDoc(gameRef);
        await deleteDoc(doc(db,'rooms',currentRoomId));
      }
    } catch(e) {}
  }

  currentRoomId = null;
  myPlayerId = null;
  isHost = false;
  pendingGoldCost = 0;
  goldAlreadyDeducted = false;
  showScreen('screen-menu');
};

// Oda kodunu kopyala
window.copyRoomCode = function() {
  const code = document.getElementById('lobbyCode')?.textContent;
  if (code) {
    navigator.clipboard.writeText(code).then(() => showToast('📋 Kod kopyalandı: ' + code));
  }
};

// Join modal PIN check

// ===== MULTİPLAYER OYUN =====
window.startGameMultiplayer = function(gameId, gameType, assignedPlayerId) {
  currentRoomId = gameId;
  myPlayerId = assignedPlayerId;
  window.isMultiplayer = true;
  window.isMultiplayer = true;

  const modeMap = {"1v1":"1v1","FFA3":"3ffa","FFA4":"4ffa","2V2":"2v2"};
  window.gameMode = modeMap[gameType] || '1v1';
  window.currentRoomId = gameId;
  window.myPlayerId = assignedPlayerId;

  showScreen('screen-game');
  setEl('gameModeLabel', gameType);

  let layoutDone = false;

  const gameRef = doc(db,'games',gameId);
  window._gameUnsubscribe = onSnapshot(gameRef, (snap) => {
    if (!snap.exists()) return;
    const gd = snap.data();

    // Oyuncu listesi değiştiyse veya ilk gelişse layout'u yeniden çiz
    const playersChanged = JSON.stringify(gd.players.map(p=>p?.id)) !== window._lastPlayerIds;
    window._lastPlayerIds = JSON.stringify(gd.players.map(p=>p?.id));

    window.players = gd.players.filter(p => p != null); // null slotları temizle
    window.turnIdx = gd.turnIdx;
    window.gameDeck = gd.deck || [];

    if (!layoutDone || playersChanged) {
      window.renderGameLayout();
      // Panel başlıklarına tıklama ekle
      setTimeout(() => window.attachPanelClickListeners?.(), 100);
      layoutDone = true;
    }

    window.updateStats();
    window.renderHand();

    // Kazanan kontrolü — oyun gerçekten başladıktan sonra kontrol et
    const activePlayers = gd.players.filter(p => p != null);
    const alive = activePlayers.filter(p => p.hp > 0);

    // Log — her zaman güncelle
    const la = document.getElementById('log');
    if (la) {
      const logs = (gd.log||[]).slice(-30);
      la.innerHTML = logs.map(m=>`<div style="padding:1px 0;border-bottom:1px solid rgba(255,255,255,0.04)">${m}</div>`).join('');
      la.scrollTop = la.scrollHeight;
    }

    // Oyun yeni başladıysa (herkes tam HP) kazanan kontrolü yapma
    const allFullHp = activePlayers.every(p => p.hp >= 7);
    if (!allFullHp && alive.length <= 1 && activePlayers.length > 1) {
      const overlay = document.getElementById('winOverlay');
      const msg = document.getElementById('winMessage');
      const emoji = document.getElementById('winEmoji');
      const rewards = document.getElementById('winRewards');
      if (overlay && overlay.style.display !== 'flex') {
        clearInterval(window.timerId);
        overlay.style.display = 'flex';
        const winner = alive[0];
        const iWon = winner && winner.id === myPlayerId;
        if (emoji) emoji.textContent = iWon ? '🏆' : (alive.length===0 ? '🤝' : '💀');
        if (msg) {
          msg.textContent = iWon ? 'KAZANDIN!' : (alive.length===0 ? 'BERABERE!' : 'MAĞLUBİYET');
          msg.style.color = iWon ? 'var(--gold)' : (alive.length===0 ? '#f39c12' : 'var(--red)');
        }
        const xpGain = iWon ? 80 : 20;
        const goldGain = iWon ? ({'2V2':1800,'FFA3':900,'FFA4':900}[gameType]||180) : 0;
        if (rewards) rewards.innerHTML = `+${xpGain} XP &nbsp;·&nbsp; +${goldGain} 🪙`;
        window.showConfetti?.();
        setTimeout(()=>window.showXPFloat?.(xpGain), 500);
        if (goldGain) setTimeout(()=>window.showGoldFloat?.(goldGain), 800);
        const opp = gd.players.find(p=>p&&p.id!==myPlayerId)?.name||'Rakip';
        window.awardMatchResult?.(iWon, gameType, opp);
      }
      return;
    }

    // Tur göstergesi
    const actor = gd.players[gd.turnIdx];
    setEl('gameTurnName', actor?.name || '...');
    const ti = document.getElementById('gameTurnIndicator');
    if (ti) {
      ti.textContent = gd.turnIdx === myPlayerId ? '⚡ SENİN SIRAN' : `⏳ ${actor?.name||''}`;
      ti.style.color = gd.turnIdx === myPlayerId ? 'var(--gold)' : 'var(--text2)';
    }

    if (gd.turnIdx === myPlayerId) {
      if (!window._myTurnActive) {
        window._myTurnActive = true;
        clearInterval(window.timerId);
        window.startTimer();
      }
    } else {
      window._myTurnActive = false;
      clearInterval(window.timerId);
    }
  });
};

window.playCardMultiplayer = async function(actorIdx, targetIdx, cardIdx) {
  if (!currentRoomId) return false;
  const gameRef = doc(db,'games',currentRoomId);
  const gs = await getDoc(gameRef);
  if (!gs.exists()) return false;
  const gd = gs.data();
  let up = JSON.parse(JSON.stringify(gd.players));
  const actor = up[actorIdx];
  const card = actor.hand[cardIdx];
  const target = targetIdx >= 0 ? up[targetIdx] : null;
  let newLog = [...gd.log];

  // Kart mantığı
  const result = window.applyCardLogic(actor, target, card, up, window.gameMode);
  if (!result) return false;

  actor.hand.splice(cardIdx,1);
  actor.cardsPlayed++;
  newLog.push(`${actor.name} oynadı: ${card}`);

  let nextTurnIdx = window.turnIdx;
  if (actor.cardsPlayed >= actor.maxPlays) {
    // Tur bitişi
    actor.cardsPlayed = 0;
    actor.maxPlays = actor.blocked ? 1 : 2;
    actor.blocked = false;
    for (let i=0;i<2;i++) {
      if (actor.hand.length < 7) {
        if (gd.deck.length === 0) gd.deck = [...window.deckBase,...window.deckBase];
        const idx = Math.floor(Math.random()*gd.deck.length);
        actor.hand.push(gd.deck.splice(idx,1)[0]);
      }
    }
    // Zombi saldırısı
    const tgtId = window.findNextAliveOpponent(actor.id, up, window.gameMode);
    if (tgtId !== -1) {
      const tgt = up[tgtId];
      actor.zombies.forEach(z => {
        if (actor.hp>0 && tgt.hp>0) {
          let dmg = z.atk;
          if (tgt.barricade>0) { const abs=Math.min(tgt.barricade,dmg); tgt.barricade-=abs; dmg-=abs; }
          tgt.hp = Math.max(0, tgt.hp-dmg);
        }
      });
    }
    newLog.push(`${actor.name} turunu bitirdi.`);
    nextTurnIdx = (window.turnIdx+1) % up.length;
    let g=0;
    while (up[nextTurnIdx].hp<=0 && g++<up.length) nextTurnIdx=(nextTurnIdx+1)%up.length;
    newLog.push(`--- ${up[nextTurnIdx].name}'in TURU ---`);

    // Bot sırası gelince otomatik oyna (host yapar)
    if (isHost && up[nextTurnIdx].isBot) {
      setTimeout(() => window.playBotTurnFirestore(nextTurnIdx, up, gd.deck, newLog, currentRoomId), 1200);
    }
  }

  await updateDoc(gameRef, { players: up, deck: gd.deck, turnIdx: nextTurnIdx, log: newLog });
  return true;
};

window.playBotTurnFirestore = async function(botIdx, players, deck, log, roomId) {
  // Basit bot AI - iki kart oynar
  const gameRef = doc(db,'games',roomId);
  const snap = await getDoc(gameRef);
  if (!snap.exists() || snap.data().gameStarted === false) return;
  let gd = snap.data();
  let up = JSON.parse(JSON.stringify(gd.players));
  let ud = [...gd.deck];
  let newLog = [...gd.log];
  const actor = up[botIdx];

  let plays = actor.blocked ? 1 : 2;
  actor.blocked = false;

  for (let play=0; play<plays && actor.hand.length>0; play++) {
    // AI karar
    let cardIdx = -1, targetId = -1;
    cardIdx = actor.hand.findIndex(c=>actor.hp<4&&c==="❤️ Tamir");
    if (cardIdx!==-1) targetId=actor.id;
    if (cardIdx===-1) {
      targetId = window.findNextAliveOpponent(actor.id,up,window.gameMode);
      if (targetId!==-1) {
        const tp=up[targetId];
        cardIdx=actor.hand.findIndex(c=>tp.zombies.length>0&&(c.includes("Silah")||c.includes("Tabanca")));
        if (cardIdx===-1) cardIdx=actor.hand.findIndex(c=>["🔫 Tabanca","💥 Silah"].includes(c));
      }
    }
    if (cardIdx===-1&&actor.barricade<3){cardIdx=actor.hand.findIndex(c=>c==="🛡️ Barikat");if(cardIdx!==-1)targetId=actor.id;}
    if (cardIdx===-1){cardIdx=actor.hand.findIndex(c=>["🧟 Zombi","👹 Dev Zombi"].includes(c));if(cardIdx!==-1)targetId=actor.id;}
    if (cardIdx===-1&&actor.hand.length>0){
      cardIdx=Math.floor(Math.random()*actor.hand.length);
      const rc=actor.hand[cardIdx];
      targetId=["🛡️ Barikat","❤️ Tamir","🧟 Zombi","👹 Dev Zombi"].includes(rc)?actor.id:window.findNextAliveOpponent(actor.id,up,window.gameMode);
    }
    if (cardIdx===-1) break;
    const card=actor.hand[cardIdx];
    const target=targetId>=0?up[targetId]:null;
    window.applyCardLogic(actor,target,card,up,window.gameMode);
    actor.hand.splice(cardIdx,1);
    newLog.push(`${actor.name} oynadı: ${card}`);
  }

  // Tur bitir
  actor.cardsPlayed=0;
  for(let i=0;i<2;i++){if(actor.hand.length<7){if(ud.length===0)ud=[...window.deckBase,...window.deckBase];const idx=Math.floor(Math.random()*ud.length);actor.hand.push(ud.splice(idx,1)[0]);}}
  const tgtId=window.findNextAliveOpponent(actor.id,up,window.gameMode);
  if(tgtId!==-1){const tgt=up[tgtId];actor.zombies.forEach(z=>{if(actor.hp>0&&tgt.hp>0){let d=z.atk;if(tgt.barricade>0){const a=Math.min(tgt.barricade,d);tgt.barricade-=a;d-=a;}tgt.hp=Math.max(0,tgt.hp-d);}});}
  newLog.push(`${actor.name} turunu bitirdi.`);
  let next=(botIdx+1)%up.length;
  let g=0;
  while(up[next].hp<=0&&g++<up.length)next=(next+1)%up.length;
  newLog.push(`--- ${up[next].name}'in TURU ---`);

  await updateDoc(gameRef,{players:up,deck:ud,turnIdx:next,log:newLog});

  if(up[next].isBot) setTimeout(()=>window.playBotTurnFirestore(next,up,ud,newLog,roomId),1200);
};

// ===== YARDIMCI =====
window.showScreen = showScreen;
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const el = document.getElementById(id);
  if (el) { el.style.display = 'flex'; el.classList.add('active'); }
}

window.openModal = function(id) { const el=document.getElementById(id); if(el) el.style.display='flex'; };
window.closeModal = function(id) { const el=document.getElementById(id); if(el) el.style.display='none'; };

window.showToast = showToast;
function showToast(msg, type='info') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  t.style.borderColor = type==='error' ? 'rgba(231,76,60,0.4)' : 'rgba(245,201,77,0.2)';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>{ t.style.display='none'; }, 3000);
}

window.applySetting = function(key, val) {
  if (key==='sfx') window.sfxEnabled=val;
  if (key==='music') {
    const a=document.getElementById('snd_ambient');
    if(a){ val?a.play().catch(()=>{}):a.pause(); }
  }
  if (key==='volume') {
    const sounds=['hasar','kalkan','tamir','win','kirilma','ambient'];
    sounds.forEach(id=>{const el=document.getElementById('snd_'+id);if(el)el.volume=val/100;});
  }
  if (key==='timer') window.timerDuration=parseInt(val);
};

window.exitToMenu = function() {
  clearInterval(window.timerId);
  if (window._gameUnsubscribe) { window._gameUnsubscribe(); window._gameUnsubscribe=null; }
  window.isMultiplayer=false;
  window.players=[];
  showScreen('screen-menu');
  loadLeaderboard();
};

window.playAgain = function() {
  window.exitToMenu();
};

window.toggleGameMenu = function() {
  const m=document.getElementById('gameMenu');
  if(m) m.style.display=m.style.display==='none'?'block':'none';
};

// Lobi particle efekti
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i=0; i<25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random()*100+'%';
    p.style.top = Math.random()*100+'%';
    p.style.animationDuration = (3+Math.random()*5)+'s';
    p.style.animationDelay = (Math.random()*5)+'s';
    p.style.width = p.style.height = (1+Math.random()*3)+'px';
    container.appendChild(p);
  }
}
createParticles();

console.log('BARİKAT V2 hazır! 🎮');
