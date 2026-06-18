// ===== FIREBASE IMPORTS =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInAnonymously, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc,
  onSnapshot, increment, collection, query,
  orderBy, limit, getDocs, deleteDoc, arrayUnion, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7Y67tokOaN0OycxmRVBbSe0YWjDR7JX8",
  authDomain: "barikat-ad65e.firebaseapp.com",
  projectId: "barikat-ad65e",
  storageBucket: "barikat-ad65e.firebasestorage.app",
  messagingSenderId: "150032611668",
  appId: "1:150032611668:web:500dbedbb52597a14470c1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Globale expose
window.db = db;
window.auth = auth;
window._fb = { doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, increment, arrayUnion, serverTimestamp, collection, query, orderBy, limit, getDocs };

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
  if (snap.exists()) {
    userProfile = snap.data();
  } else {
    // Yeni kullanıcı
    userProfile = {
      uid,
      name: auth.currentUser?.displayName || 'Oyuncu' + Math.floor(Math.random()*9999),
      avatar: '😎',
      gold: 10000,
      xp: 0,
      level: 1,
      wins: 0,
      losses: 0,
      games: 0,
      winStreak: 0,
      bestStreak: 0,
      goldEarned: 0,
      recentGames: [],
      achievements: [],
      createdAt: Date.now()
    };
    await setDoc(ref, userProfile);
  }
  window.userProfile = userProfile;
  updateAllUI();
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

// ===== AUTH =====
document.getElementById('btnGoogle').onclick = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch(e) {
    showToast('Google giriş hatası: ' + e.message, 'error');
  }
};

document.getElementById('btnGuest').onclick = async () => {
  try {
    await signInAnonymously(auth);
  } catch(e) {
    showToast('Misafir giriş hatası', 'error');
  }
};

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    await loadUserProfile(user.uid);
    loadLeaderboard();
    showScreen('screen-menu');
  } else {
    showScreen('screen-login');
  }
});

window.doLogout = async function() {
  await signOut(auth);
  showScreen('screen-login');
};

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

// Avatar seçme
document.querySelectorAll('.avatar-opt').forEach(el => {
  el.onclick = () => {
    document.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
    el.classList.add('selected');
    const big = document.getElementById('profileAvatarBig');
    if (big) big.textContent = el.dataset.av;
  };
});

// ===== XP & ALTIN GÜNCELLE =====
window.awardMatchResult = async function(won, gameMode, opponent) {
  if (!currentUser) return;

  const baseXP = won ? 80 : 20;
  const bonusXP = won ? (gameMode === '2V2' || gameMode === 'FFA4' ? 50 : gameMode === 'FFA3' ? 30 : 0) : 0;
  const xpEarned = baseXP + bonusXP;

  const entryCost = { '1v1': 100, 'FFA3': 500, 'FFA4': 500, '2V2': 1000 };
  const goldWin = { '1v1': 180, 'FFA3': 900, 'FFA4': 900, '2V2': 1800 };
  const goldLoss = { '1v1': 0, 'FFA3': 0, 'FFA4': 0, '2V2': 0 };
  const goldChange = won ? (goldWin[gameMode] || 180) : (goldLoss[gameMode] || 0);

  const newXP = (userProfile.xp || 0) + xpEarned;
  const oldLevel = getLevelFromXP(userProfile.xp || 0);
  const newLevel = getLevelFromXP(newXP);
  const levelUp = newLevel > oldLevel;

  const newStreak = won ? (userProfile.winStreak || 0) + 1 : 0;
  const bestStreak = Math.max(newStreak, userProfile.bestStreak || 0);

  const gameRecord = {
    won,
    mode: gameMode,
    opponent: opponent || '—',
    xp: xpEarned,
    gold: goldChange,
    ts: Date.now()
  };

  const recentGames = [...(userProfile.recentGames || []), gameRecord].slice(-20);

  const updates = {
    xp: newXP,
    level: newLevel,
    wins: won ? increment(1) : (userProfile.wins || 0),
    losses: !won ? increment(1) : (userProfile.losses || 0),
    games: increment(1),
    winStreak: newStreak,
    bestStreak,
    gold: increment(goldChange),
    goldEarned: won ? increment(goldChange) : (userProfile.goldEarned || 0),
    recentGames
  };

  await updateDoc(doc(db,'users',currentUser.uid), updates);
  userProfile = { ...userProfile, xp: newXP, level: newLevel, recentGames,
    wins: (userProfile.wins||0) + (won?1:0),
    losses: (userProfile.losses||0) + (!won?1:0),
    games: (userProfile.games||0) + 1,
    winStreak: newStreak, bestStreak,
    gold: (userProfile.gold||0) + goldChange,
    goldEarned: (userProfile.goldEarned||0) + (won?goldChange:0)
  };
  window.userProfile = userProfile;
  updateAllUI();

  return { xpEarned, goldChange, levelUp, newLevel };
};

// Altın düşür (oyuna giriş)
window.deductGold = async function(amount) {
  if (!currentUser) return false;
  if ((userProfile.gold || 0) < amount) {
    showToast('❌ Yeterli altın yok!');
    return false;
  }
  await updateDoc(doc(db,'users',currentUser.uid), { gold: increment(-amount) });
  userProfile.gold = (userProfile.gold || 0) - amount;
  window.userProfile = userProfile;
  setEl('goldAmount', userProfile.gold.toLocaleString('tr-TR'));
  return true;
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
    document.getElementById('pinField').style.display = radio.value === 'pin' ? 'block' : 'none';
  };
});

// Menü butonları
document.getElementById('btnCreateRoom').onclick = () => openModal('modal-create');
document.getElementById('btnJoinRoom').onclick = () => openModal('modal-join');
document.getElementById('btnOpenProfile').onclick = () => showScreen('screen-profile');
document.getElementById('btnOpenSettings').onclick = () => showScreen('screen-settings');
document.getElementById('btnVsBot').onclick = () => { window.initGame('pvb'); showScreen('screen-game'); };
document.getElementById('btnQuickMatch').onclick = quickMatch;

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
    renderLobbySlots(gd.players, gd.maxPlayers, gd.readyPlayers || []);

    // Host için "Başlat" butonu: tüm oyuncular hazır mı?
    const allReady = gd.players.length === gd.maxPlayers &&
      gd.players.every(p => (gd.readyPlayers||[]).includes(p.id) || p.isBot);
    const btnStart = document.getElementById('btnStartGame');
    if (btnStart) btnStart.style.display = (isHost && allReady) ? 'block' : 'none';

    if (gd.gameStarted) {
      clearLobbyTimer();
      if (lobbyUnsubscribe) { lobbyUnsubscribe(); lobbyUnsubscribe = null; }
      window.startGameMultiplayer(roomId, gd.gameMode, myPlayerId);
    }
  });
}

function renderLobbySlots(players, maxPlayers, readyPlayers) {
  const container = document.getElementById('lobbySlots');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < maxPlayers; i++) {
    const p = players[i];
    const isReady = p && (readyPlayers.includes(p.id) || p.isBot);
    const isMe = p && p.id === myPlayerId;
    const div = document.createElement('div');
    div.className = `lobby-slot ${p ? 'filled' : 'empty-slot'} ${isReady ? 'ready-slot' : ''}`;

    if (p) {
      div.innerHTML = `
        <div class="slot-avatar">${p.avatar || '👤'}</div>
        <div class="slot-info">
          <div class="slot-name">${p.name} ${isMe ? '<span style="color:var(--gold)">(Sen)</span>' : ''}</div>
          <div class="slot-status">${p.isBot ? '🤖 Bot' : isHost && i===0 ? '👑 Host' : 'Oyuncu'}</div>
        </div>
        ${isReady ? '<span class="slot-ready-badge">✅ Hazır</span>' : '<span style="color:var(--text2);font-size:12px">Bekliyor...</span>'}
      `;
    } else {
      div.innerHTML = `
        <div class="slot-avatar" style="opacity:0.3">?</div>
        <div class="slot-info"><div class="slot-empty-label">Bekleniyor...</div></div>
      `;
    }
    container.appendChild(div);
  }
}

function startLobbyTimer(roomId, maxPlayers) {
  let t = 30;
  const timerWrap = document.getElementById('lobbyTimerWrap');
  const timerEl = document.getElementById('lobbyTimer');
  const timerFill = document.getElementById('lobbyTimerFill');
  if (timerWrap) timerWrap.style.display = 'block';

  lobbyTimerInterval = setInterval(async () => {
    t--;
    if (timerEl) timerEl.textContent = t;
    if (timerFill) timerFill.style.width = (t/30*100) + '%';

    if (t <= 0) {
      clearLobbyTimer();
      // Boş yerlere bot ekle (sadece host yapar)
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
      newPlayers.filter(p=>p.isBot).forEach(p=>{ if(!newReady.includes(p.id)) newReady.push(p.id); });
      await updateDoc(gameRef, { players: newPlayers, readyPlayers: newReady });
      // host da hazır say
      if (!newReady.includes(myPlayerId)) newReady.push(myPlayerId);
      await updateDoc(gameRef, { readyPlayers: newReady });
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
  const gd = snap.data();

  // Başlangıç ellerini dağıt
  let up = JSON.parse(JSON.stringify(gd.players));
  let ud = [...gd.deck];
  up.forEach(p => {
    for (let i = 0; i < 5; i++) {
      if (ud.length === 0) ud = [...window.deckBase, ...window.deckBase];
      const idx = Math.floor(Math.random()*ud.length);
      p.hand.push(ud.splice(idx,1)[0]);
    }
  });

  await updateDoc(gameRef, {
    players: up, deck: ud, gameStarted: true, turnIdx: 0,
    log: [...gd.log, `--- ${up[0].name}'in TURU ---`]
  });
  await updateDoc(roomRef, { gameStarted: true });
};

// Lobiden ayrıl
window.leaveLobby = function() {
  clearLobbyTimer();
  if (lobbyUnsubscribe) { lobbyUnsubscribe(); lobbyUnsubscribe = null; }
  currentRoomId = null;
  myPlayerId = null;
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
document.getElementById('joinCodeInput')?.addEventListener('input', async (e) => {
  const code = e.target.value.trim().toUpperCase();
  if (code.length !== 6) return;
  const roomRef = doc(db,'rooms',code);
  const snap = await getDoc(roomRef);
  const pinField = document.getElementById('joinPinField');
  const pinHint = document.getElementById('joinPinHint');
  if (snap.exists() && snap.data().hasPIN) {
    if (pinField) pinField.style.display = 'block';
    if (pinHint) pinHint.style.display = 'block';
  } else {
    if (pinField) pinField.style.display = 'none';
    if (pinHint) pinHint.style.display = 'none';
  }
});

// ===== MULTİPLAYER OYUN =====
window.startGameMultiplayer = function(gameId, gameType, assignedPlayerId) {
  currentRoomId = gameId;
  myPlayerId = assignedPlayerId;
  window.isMultiplayer = true;

  const modeMap = {"1v1":"1v1","FFA3":"3ffa","FFA4":"4ffa","2V2":"2v2"};
  window.gameMode = modeMap[gameType] || '1v1';
  window.currentRoomId = gameId;
  window.myPlayerId = assignedPlayerId;

  showScreen('screen-game');
  setEl('gameModeLabel', gameType);

  const gameRef = doc(db,'games',gameId);
  window._gameUnsubscribe = onSnapshot(gameRef, (snap) => {
    if (!snap.exists()) return;
    const gd = snap.data();
    window.players = gd.players;
    window.turnIdx = gd.turnIdx;
    window.gameDeck = gd.deck;

    const la = document.getElementById('log');
    if (la) { la.innerHTML = gd.log.map(m=>m+'<br>').join(''); la.scrollTop = la.scrollHeight; }

    if (!document.getElementById('panel_0')) window.renderGameLayout();
    window.updateStats();
    window.renderHand();
    window.checkWinner();

    const actor = gd.players[gd.turnIdx];
    setEl('gameTurnName', actor?.name || '...');
    const ti = document.getElementById('gameTurnIndicator');
    if (ti) {
      ti.textContent = gd.turnIdx === myPlayerId ? '⚡ SENİN SIRAN' : 'Bekliyor';
      ti.style.color = gd.turnIdx === myPlayerId ? 'var(--gold)' : 'var(--text2)';
    }

    if (gd.turnIdx === myPlayerId) {
      clearInterval(window.timerId);
      window.startTimer();
    } else {
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
