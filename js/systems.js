// ===== GÖREV SİSTEMİ, GÜNLİK GİRİŞ, MAĞAZA, HEDİYE, VIP =====
// Bu dosya app.js yüklendikten sonra çalışır

// ===== GÖREV VERİLERİ =====
const QUESTS = {
  daily: [
    { id: 'd1', icon: '🎮', title: '1 Oyun Oyna', desc: 'Herhangi bir oyunu bitir', target: 1, key: 'games', reward: { gold: 200, xp: 50 } },
    { id: 'd2', icon: '🏆', title: 'Galibiyet Kazan', desc: 'Bir oyunu kazanarak bitir', target: 1, key: 'wins', reward: { gold: 350, xp: 100 } },
    { id: 'd3', icon: '💬', title: 'Hediye Gönder', desc: 'Bir oyuncuya hediye gönder', target: 1, key: 'gifts', reward: { gold: 150, gem: 5 } },
  ],
  weekly: [
    { id: 'w1', icon: '🎯', title: '5 Oyun Oyna', desc: 'Bu hafta 5 oyun oyna', target: 5, key: 'games', reward: { gold: 800, xp: 300 } },
    { id: 'w2', icon: '⚔️', title: '3 Galibiyet', desc: 'Bu hafta 3 oyun kazan', target: 3, key: 'wins', reward: { gold: 1200, gem: 20 } },
    { id: 'w3', icon: '🃏', title: '50 Kart Oyna', desc: 'Toplam 50 kart oyna', target: 50, key: 'cardsPlayed', reward: { gold: 600, xp: 200 } },
    { id: 'w4', icon: '🤝', title: '3 Farklı Mod', desc: '3 farklı oyun modunda oyna', target: 3, key: 'modesPlayed', reward: { gem: 30, xp: 250 } },
  ],
  monthly: [
    { id: 'm1', icon: '🌟', title: '20 Oyun Oyna', desc: 'Bu ay 20 oyun oyna', target: 20, key: 'games', reward: { gold: 5000, gem: 100, xp: 1000 } },
    { id: 'm2', icon: '👑', title: 'İlk 10\'a Gir', desc: 'Aylık liderlikte ilk 10', target: 1, key: 'topTen', reward: { gem: 200, xp: 2000 } },
  ]
};

// ===== GÜNLİK GİRİŞ ÖDÜL TABLOSU =====
const DAILY_REWARDS = [
  { day: 1,  icon: '🪙', reward: '100 Altın',   gold: 100 },
  { day: 2,  icon: '💎', reward: '5 Elmas',     gem: 5 },
  { day: 3,  icon: '🪙', reward: '250 Altın',   gold: 250 },
  { day: 4,  icon: '⚡', reward: '100 XP',      xp: 100 },
  { day: 5,  icon: '🪙', reward: '500 Altın',   gold: 500 },
  { day: 6,  icon: '💎', reward: '15 Elmas',    gem: 15 },
  { day: 7,  icon: '🎁', reward: '1000 Altın + 50 Elmas', gold: 1000, gem: 50, special: true },
  { day: 8,  icon: '🪙', reward: '300 Altın',   gold: 300 },
  { day: 9,  icon: '💎', reward: '10 Elmas',    gem: 10 },
  { day: 10, icon: '⚡', reward: '200 XP',      xp: 200 },
  { day: 11, icon: '🪙', reward: '500 Altın',   gold: 500 },
  { day: 12, icon: '💎', reward: '20 Elmas',    gem: 20 },
  { day: 13, icon: '🪙', reward: '750 Altın',   gold: 750 },
  { day: 14, icon: '🌟', reward: '2000 Altın + 100 Elmas', gold: 2000, gem: 100, mega: true },
  { day: 15, icon: '🪙', reward: '400 Altın',   gold: 400 },
  { day: 16, icon: '💎', reward: '15 Elmas',    gem: 15 },
  { day: 17, icon: '⚡', reward: '300 XP',      xp: 300 },
  { day: 18, icon: '🪙', reward: '600 Altın',   gold: 600 },
  { day: 19, icon: '💎', reward: '25 Elmas',    gem: 25 },
  { day: 20, icon: '🪙', reward: '1000 Altın',  gold: 1000 },
  { day: 21, icon: '👑', reward: '500 XP + VIP 1 Gün', xp: 500, vipTemp: 1, special: true },
  { day: 22, icon: '🪙', reward: '500 Altın',   gold: 500 },
  { day: 23, icon: '💎', reward: '20 Elmas',    gem: 20 },
  { day: 24, icon: '⚡', reward: '400 XP',      xp: 400 },
  { day: 25, icon: '🪙', reward: '1500 Altın',  gold: 1500 },
  { day: 26, icon: '💎', reward: '30 Elmas',    gem: 30 },
  { day: 27, icon: '🪙', reward: '800 Altın',   gold: 800 },
  { day: 28, icon: '⚡', reward: '500 XP',      xp: 500 },
  { day: 29, icon: '💎', reward: '50 Elmas',    gem: 50 },
  { day: 30, icon: '🎊', reward: '5000 Altın + 200 Elmas + 1000 XP', gold: 5000, gem: 200, xp: 1000, mega: true },
];

// ===== MAĞAZA ÜRÜNLERİ =====
const SHOP_EFFECTS = {
  fire:      { name: 'Ateş Efekti',    icon: '🔥', cost: 50,  currency: 'gem' },
  lightning: { name: 'Şimşek Efekti',  icon: '⚡', cost: 50,  currency: 'gem' },
  gold:      { name: 'Altın Parıltı',  icon: '✨', cost: 75,  currency: 'gem' },
  dark:      { name: 'Karanlık Güç',   icon: '🌑', cost: 75,  currency: 'gem' },
  ice:       { name: 'Buz Efekti',     icon: '❄️', cost: 100, currency: 'gem' },
  zombie:    { name: 'Zombi Dönüşümü', icon: '🧟', cost: 150, currency: 'gem' },
};

// ===== HEDİYELER =====
const GIFTS = [
  { id: 'heart',    emoji: '❤️',  name: 'Kalp',    cost: 0,   currency: 'free' },
  { id: 'clap',     emoji: '👏',  name: 'Alkış',   cost: 0,   currency: 'free' },
  { id: 'flower',   emoji: '🌸',  name: 'Çiçek',   cost: 50,  currency: 'gold' },
  { id: 'tea',      emoji: '☕',  name: 'Çay',     cost: 100, currency: 'gold' },
  { id: 'fire',     emoji: '🔥',  name: 'Ateş',    cost: 200, currency: 'gold' },
  { id: 'kiss',     emoji: '💋',  name: 'Öpücük',  cost: 30,  currency: 'gem' },
  { id: 'crown',    emoji: '👑',  name: 'Taç',     cost: 50,  currency: 'gem' },
  { id: 'diamond',  emoji: '💎',  name: 'Elmas',   cost: 100, currency: 'gem' },
  { id: 'star',     emoji: '⭐',  name: 'Yıldız',  cost: 150, currency: 'gem' },
  { id: 'trophy',   emoji: '🏆',  name: 'Kupa',    cost: 200, currency: 'gem' },
];

// ===== VIP SEVİYELERİ — 0'dan 10'a ===== */
const VIP_LEVELS = [
  { level: 0,  name: 'Standart',       xpBonus: 0,   cost: 0,     perks: [] },
  { level: 1,  name: 'VIP I',          xpBonus: 10,  cost: 200,   perks: ['%10 XP bonus', 'Mavi isim'] },
  { level: 2,  name: 'VIP II',         xpBonus: 15,  cost: 400,   perks: ['%15 XP bonus', 'Yeşil isim'] },
  { level: 3,  name: 'VIP III',        xpBonus: 20,  cost: 700,   perks: ['%20 XP bonus', 'Mor çerçeve'] },
  { level: 4,  name: 'VIP IV',         xpBonus: 25,  cost: 1100,  perks: ['%25 XP bonus', 'Özel efekt'] },
  { level: 5,  name: 'VIP V',          xpBonus: 30,  cost: 1600,  perks: ['%30 XP bonus', 'Altın çerçeve'] },
  { level: 6,  name: 'VIP VI',         xpBonus: 40,  cost: 2500,  perks: ['%40 XP bonus', 'Kırmızı aura'] },
  { level: 7,  name: 'VIP VII',        xpBonus: 50,  cost: 3500,  perks: ['%50 XP bonus', 'Elmas çerçeve'] },
  { level: 8,  name: 'VIP VIII',       xpBonus: 60,  cost: 5000,  perks: ['%60 XP bonus', 'Siyah altın efekt'] },
  { level: 9,  name: 'VIP IX',         xpBonus: 75,  cost: 7500,  perks: ['%75 XP bonus', 'Ejder efekti'] },
  { level: 10, name: 'VIP X — EFSANEVİ', xpBonus: 100, cost: 10000, perks: ['%100 XP (2x)', 'Benzersiz rozet', 'Tüm efektler'] },
];

// ===== GENİŞLETİLMİŞ MAĞAZA EFEKTLERİ =====
const SHOP_EFFECTS = {
  fire:      { name: 'Ateş',         icon: '🔥', cost: 50,  currency: 'gem', desc: 'Kart oynarken alevler' },
  lightning: { name: 'Şimşek',       icon: '⚡', cost: 50,  currency: 'gem', desc: 'Elektrik çakması' },
  gold_glow: { name: 'Altın Parıltı',icon: '✨', cost: 75,  currency: 'gem', desc: 'Altın ışıltı' },
  dark:      { name: 'Karanlık',     icon: '🌑', cost: 75,  currency: 'gem', desc: 'Duman efekti' },
  ice:       { name: 'Buz',          icon: '❄️', cost: 100, currency: 'gem', desc: 'Buz parçaları' },
  zombie:    { name: 'Zombi Ruhu',   icon: '🧟', cost: 100, currency: 'gem', desc: 'Yeşil buhar' },
  blood:     { name: 'Kan',          icon: '🩸', cost: 120, currency: 'gem', desc: 'Kan damlacıkları' },
  star:      { name: 'Yıldız Tozu',  icon: '💫', cost: 120, currency: 'gem', desc: 'Yıldızlar saçılır' },
  rainbow:   { name: 'Gökkuşağı',    icon: '🌈', cost: 150, currency: 'gem', desc: 'Renk patlaması' },
  dragon:    { name: 'Ejder',        icon: '🐉', cost: 200, currency: 'gem', desc: 'Ejder alevi' },
  nuke:      { name: 'Nükleer',      icon: '☢️', cost: 250, currency: 'gem', desc: 'Patlama dalgası' },
  god:       { name: 'Tanrı Modu',   icon: '⚜️', cost: 500, currency: 'gem', desc: 'Altın aura + tüm efektler' },
};

// ===== KART GÖRÜNÜMLERİ (Skin) =====
const CARD_SKINS = {
  default:   { name: 'Standart',    preview: '🃏', cost: 0,   currency: 'free' },
  dark:      { name: 'Karanlık',    preview: '🖤', cost: 100, currency: 'gem', desc: 'Siyah kart arka planı' },
  gold:      { name: 'Altın',       preview: '🟡', cost: 150, currency: 'gem', desc: 'Altın kenarlı kartlar' },
  hologram:  { name: 'Hologram',    preview: '💠', cost: 200, currency: 'gem', desc: 'Işıl ışıl hologram' },
  blood:     { name: 'Kan Kırmızı', preview: '🔴', cost: 180, currency: 'gem', desc: 'Kırmızı derin arka plan' },
  galaxy:    { name: 'Galaksi',     preview: '🌌', cost: 250, currency: 'gem', desc: 'Uzay teması' },
  dragon:    { name: 'Ejder Ateşi', preview: '🐉', cost: 350, currency: 'gem', desc: 'Alevli ejder teması' },
  legendary: { name: 'Efsanevi',    preview: '👑', cost: 500, currency: 'gem', desc: 'Altın + parlaklık' },
};

// ===== ARKA PLAN TEMAları =====
const BG_THEMES = {
  default:   { name: 'Klasik Sahne', preview: '🏚️', cost: 0,   currency: 'free' },
  dungeon:   { name: 'Zindan',       preview: '🏰', cost: 80,  currency: 'gem', desc: 'Karanlık zindan' },
  graveyard: { name: 'Mezarlık',     preview: '⚰️', cost: 100, currency: 'gem', desc: 'Gece mezarlığı' },
  wasteland: { name: 'Çorak Alan',   preview: '🌵', cost: 120, currency: 'gem', desc: 'Kıyamet sonrası' },
  city:      { name: 'Çökmüş Şehir',preview: '🏙️', cost: 150, currency: 'gem', desc: 'Zombi istilası' },
  forest:    { name: 'Lanetli Orman',preview: '🌲', cost: 200, currency: 'gem', desc: 'Gece ormanı' },
};

// ===== OYUNCU ÇERÇEVE=====
const FRAMES = {
  none:     { name: 'Yok',         preview: '⬜', cost: 0,   currency: 'free' },
  blue:     { name: 'Mavi',        preview: '🔵', cost: 50,  currency: 'gem' },
  green:    { name: 'Yeşil',       preview: '🟢', cost: 50,  currency: 'gem' },
  purple:   { name: 'Mor',         preview: '🟣', cost: 75,  currency: 'gem' },
  red:      { name: 'Kırmızı',     preview: '🔴', cost: 75,  currency: 'gem' },
  gold:     { name: 'Altın',       preview: '🟡', cost: 100, currency: 'gem' },
  diamond:  { name: 'Elmas',       preview: '💎', cost: 200, currency: 'gem' },
  flame:    { name: 'Alev',        preview: '🔥', cost: 300, currency: 'gem' },
  rainbow:  { name: 'Gökkuşağı',   preview: '🌈', cost: 500, currency: 'gem' },
};

// ===== GÖREV EKRANI =====
let currentQuestTab = 'daily';
let questProgress = {};

window.switchQuestTab = function(tab, btn) {
  currentQuestTab = tab;
  document.querySelectorAll('.quest-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderQuests();
};

function renderQuests() {
  const list = document.getElementById('questList');
  if (!list) return;
  const quests = QUESTS[currentQuestTab] || [];
  const p = window.userProfile || {};
  const progress = p.questProgress || {};
  const claimed = p.questClaimed || {};

  list.innerHTML = quests.map(q => {
    const prog = progress[q.id] || 0;
    const done = prog >= q.target;
    const isClaimed = claimed[q.id];
    const pct = Math.min((prog / q.target) * 100, 100);

    return `<div class="quest-item">
      <div class="quest-icon">${q.icon}</div>
      <div class="quest-info">
        <div class="quest-title">${q.title}</div>
        <div class="quest-desc">${q.desc}</div>
        <div class="quest-progress-bar"><div class="quest-fill" style="width:${pct}%"></div></div>
        <div style="font-size:11px;color:var(--text2);margin-top:3px">${prog}/${q.target}</div>
      </div>
      <div class="quest-rewards">
        ${q.reward.gold ? `<span class="quest-reward-pill gold">+${q.reward.gold}🪙</span>` : ''}
        ${q.reward.gem ? `<span class="quest-reward-pill gem">+${q.reward.gem}💎</span>` : ''}
        ${q.reward.xp ? `<span class="quest-reward-pill xp">+${q.reward.xp}XP</span>` : ''}
        ${isClaimed
          ? '<span class="quest-claimed">✅</span>'
          : `<button class="btn-claim" ${!done ? 'disabled' : ''} onclick="claimQuest('${q.id}','${currentQuestTab}')">Al</button>`
        }
      </div>
    </div>`;
  }).join('');
}

window.claimQuest = async function(questId, tab) {
  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;
  const p = window.userProfile || {};
  const claimed = p.questClaimed || {};
  if (claimed[questId]) return;

  const q = QUESTS[tab]?.find(x => x.id === questId);
  if (!q) return;

  const updates = { [`questClaimed.${questId}`]: true };
  let goldDelta = 0, gemDelta = 0, xpDelta = 0;
  if (q.reward.gold) { goldDelta = q.reward.gold; updates['gold'] = (window._fb.increment)(goldDelta); }
  if (q.reward.gem) { gemDelta = q.reward.gem; updates['gems'] = (window._fb.increment)(gemDelta); }
  if (q.reward.xp) { xpDelta = q.reward.xp; updates['xp'] = (window._fb.increment)(xpDelta); }

  await (window._fb.updateDoc)((window._fb.doc)(window.db,'users',uid), updates);

  window.userProfile = {
    ...p,
    questClaimed: { ...claimed, [questId]: true },
    gold: (p.gold||0) + goldDelta,
    gems: (p.gems||0) + gemDelta,
    xp: (p.xp||0) + xpDelta,
  };

  if (goldDelta) window.showGoldFloat?.(goldDelta);
  if (xpDelta) window.showXPFloat?.(xpDelta);
  if (gemDelta) showToast(`💎 +${gemDelta} Elmas kazandın!`);

  renderQuests();
  updateGemDisplays();
};

// ===== GÜNLİK GİRİŞ =====
window.checkDailyLogin = async function() {
  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;
  const p = window.userProfile || {};
  const today = new Date().toDateString();
  if (p.lastLoginDate === today) return; // Bugün zaten giriş yaptı

  // Mevcut gün sayısını hesapla
  const now = Date.now();
  const lastLogin = p.lastLoginTs || 0;
  const daysSince = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));

  // Seri kırıldıysa sıfırla
  let loginStreak = p.loginStreak || 0;
  if (daysSince > 1) loginStreak = 0;
  loginStreak = (loginStreak % 30) + 1;

  // Ay kontrolü
  const thisMonth = new Date().getMonth();
  if (p.loginMonth !== thisMonth) loginStreak = 1; // Ay değişti, sıfırla

  await (window._fb.updateDoc)((window._fb.doc)(window.db,'users',uid), {
    lastLoginDate: today,
    lastLoginTs: now,
    loginStreak,
    loginMonth: thisMonth,
  });
  window.userProfile = { ...p, lastLoginDate: today, lastLoginTs: now, loginStreak, loginMonth: thisMonth };

  // Popup göster
  openModal('modal-daily');
  renderDailyCalendar(loginStreak);
};

function renderDailyCalendar(currentDay) {
  const cal = document.getElementById('dailyCalendar');
  const claimBox = document.getElementById('dailyClaimBox');
  if (!cal) return;

  const p = window.userProfile || {};

  cal.innerHTML = DAILY_REWARDS.map(r => {
    let cls = 'locked';
    if (r.day < currentDay) cls = 'claimed';
    else if (r.day === currentDay) cls = 'today';
    if (r.mega) cls += ' mega';
    else if (r.special) cls += ' special';

    return `<div class="cal-day ${cls}" title="${r.reward}">
      <div class="cal-reward">${r.icon}</div>
      <div class="cal-num">${r.day}</div>
    </div>`;
  }).join('');

  const todayReward = DAILY_REWARDS[currentDay - 1];
  if (todayReward && claimBox) {
    claimBox.innerHTML = `
      <div style="background:rgba(245,201,77,0.1);border:1px solid rgba(245,201,77,0.25);border-radius:14px;padding:16px;display:inline-block">
        <div style="font-size:32px;margin-bottom:6px">${todayReward.icon}</div>
        <div style="font-weight:700;color:var(--gold);margin-bottom:8px">Gün ${currentDay} Ödülü</div>
        <div style="font-size:14px;margin-bottom:12px">${todayReward.reward}</div>
        <button class="btn-primary" onclick="claimDailyReward(${currentDay})" style="min-width:160px">🎁 Al!</button>
      </div>`;
  }
}

window.claimDailyReward = async function(day) {
  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;
  const r = DAILY_REWARDS[day - 1];
  if (!r) return;

  const updates = { dailyRewardClaimed: true };
  if (r.gold) { updates['gold'] = (window._fb.increment)(r.gold); }
  if (r.gem) { updates['gems'] = (window._fb.increment)(r.gem); }
  if (r.xp) { updates['xp'] = (window._fb.increment)(r.xp); }

  await (window._fb.updateDoc)((window._fb.doc)(window.db,'users',uid), updates);
  window.userProfile = {
    ...window.userProfile,
    gold: (window.userProfile.gold||0) + (r.gold||0),
    gems: (window.userProfile.gems||0) + (r.gem||0),
    xp: (window.userProfile.xp||0) + (r.xp||0),
  };

  if (r.gold) window.showGoldFloat?.(r.gold);
  if (r.xp) window.showXPFloat?.(r.xp);
  if (r.gem) showToast(`💎 +${r.gem} Elmas!`);

  updateGemDisplays();
  closeModal('modal-daily');
};

// ===== MAĞAZA =====
window.buyGems = async function(amount, goldCost) {
  const p = window.userProfile || {};
  if ((p.gold||0) < goldCost) { showToast('❌ Yeterli altın yok!'); return; }
  if (!confirm(`${goldCost} 🪙 karşılığında ${amount} 💎 almak istiyor musun?`)) return;

  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;
  await (window._fb.updateDoc)((window._fb.doc)(window.db,'users',uid), {
    gold: (window._fb.increment)(-goldCost),
    gems: (window._fb.increment)(amount),
  });
  window.userProfile = { ...p, gold: p.gold-goldCost, gems: (p.gems||0)+amount };
  showToast(`✅ ${amount} 💎 satın alındı!`);
  updateGemDisplays();
};

window.buyEffect = async function(effectId) {
  const effect = SHOP_EFFECTS[effectId];
  if (!effect) return;
  const p = window.userProfile || {};
  const owned = p.ownedEffects || [];
  if (owned.includes(effectId)) { showToast('Bu efekte zaten sahipsin!'); return; }

  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;
  const gems = p.gems || 0;
  if (gems < effect.cost) { showToast(`❌ Yeterli elmas yok! (${effect.cost} 💎 gerekli)`); return; }

  if (!confirm(`${effect.name} için ${effect.cost} 💎 harcansın mı?`)) return;
  await (window._fb.updateDoc)((window._fb.doc)(window.db,'users',uid), {
    gems: (window._fb.increment)(-effect.cost),
    ownedEffects: [...owned, effectId],
    activeEffect: effectId,
  });
  window.userProfile = { ...p, gems: gems-effect.cost, ownedEffects: [...owned, effectId], activeEffect: effectId };
  showToast(`✅ ${effect.icon} ${effect.name} satın alındı!`);
  updateGemDisplays();
};

window.buyVIP = async function(vipLevel) {
  const vip = VIP_LEVELS[vipLevel];
  if (!vip) return;
  const p = window.userProfile || {};
  if ((p.vipLevel||0) >= vipLevel) { showToast('Bu VIP seviyesine veya üstüne sahipsin!'); return; }

  const uid = window.auth?.currentUser?.uid;
  const gems = p.gems || 0;
  if (gems < vip.cost) { showToast(`❌ Yeterli elmas yok! (${vip.cost} 💎 gerekli)`); return; }

  if (!confirm(`${vip.name} için ${vip.cost} 💎 harcansın mı?`)) return;
  await (window._fb.updateDoc)((window._fb.doc)(window.db,'users',uid), {
    gems: (window._fb.increment)(-vip.cost),
    vipLevel,
  });
  window.userProfile = { ...p, gems: gems-vip.cost, vipLevel };
  showToast(`👑 ${vip.name} aktif!`);
  updateGemDisplays();
};

// ===== HEDİYE SİSTEMİ =====
let giftTargetId = null;
let giftTargetName = '';

window.openGiftPanel = function(targetId, targetName) {
  // Oyun içinde çağrılırsa hedef belirlenir
  giftTargetId = targetId || null;
  giftTargetName = targetName || 'Rakip';
  const el = document.getElementById('giftPanel');
  const tn = document.getElementById('giftTarget');
  if (tn) tn.textContent = giftTargetName;
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  renderGiftGrid();
};

function renderGiftGrid() {
  const grid = document.getElementById('giftGrid');
  if (!grid) return;
  const p = window.userProfile || {};

  grid.innerHTML = GIFTS.map(g => {
    let costLabel = '';
    if (g.currency === 'free') costLabel = '<span class="gift-cost" style="color:var(--green)">Ücretsiz</span>';
    else if (g.currency === 'gold') costLabel = `<span class="gift-cost">${g.cost}🪙</span>`;
    else costLabel = `<span class="gift-cost gem">${g.cost}💎</span>`;

    return `<div class="gift-item" onclick="sendGift('${g.id}')">
      <div class="gift-emoji">${g.emoji}</div>
      ${costLabel}
    </div>`;
  }).join('');
}

window.sendGift = async function(giftId) {
  const gift = GIFTS.find(g => g.id === giftId);
  if (!gift) return;
  const p = window.userProfile || {};
  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;

  // Ücret kontrolü
  if (gift.currency === 'gold' && (p.gold||0) < gift.cost) { showToast('❌ Yeterli altın yok!'); return; }
  if (gift.currency === 'gem' && (p.gems||0) < gift.cost) { showToast('❌ Yeterli elmas yok!'); return; }

  // Ücret düş
  if (gift.currency === 'gold') {
    await (window._fb.updateDoc)((window._fb.doc)(window.db,'users',uid), { gold: (window._fb.increment)(-gift.cost) });
    window.userProfile = { ...p, gold: p.gold-gift.cost };
  } else if (gift.currency === 'gem') {
    await (window._fb.updateDoc)((window._fb.doc)(window.db,'users',uid), { gems: (window._fb.increment)(-gift.cost) });
    window.userProfile = { ...p, gems: (p.gems||0)-gift.cost };
  }

  // Animasyon
  const panel = document.getElementById('giftPanel');
  if (panel) panel.style.display = 'none';

  const fly = document.createElement('div');
  fly.className = 'gift-fly';
  fly.textContent = gift.emoji;
  fly.style.cssText = 'left:50%;top:70%;--fx:-20vw;--fy:-30vh;transform:translate(-50%,-50%)';
  document.body.appendChild(fly);
  setTimeout(() => fly.remove(), 900);

  showToast(`${gift.emoji} ${gift.name} gönderildi!`);

  // Görev güncelle
  updateQuestProgress('gifts', 1);
  updateGemDisplays();
};

// ===== GÖREV İLERLEME =====
window.updateQuestProgress = async function(key, amount) {
  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;
  const p = window.userProfile || {};
  const currentProg = p.questProgress || {};
  const newVal = (currentProg[key] || 0) + amount;
  const updates = { [`questProgress.${key}`]: newVal };
  await (window._fb.updateDoc)((window._fb.doc)(window.db,'users',uid), updates);
  window.userProfile = { ...p, questProgress: { ...currentProg, [key]: newVal } };
};

// ===== GEM/GOLD DISPLAY GÜNCELLE =====
function updateGemDisplays() {
  const p = window.userProfile || {};
  const gems = p.gems || 0;
  const gold = p.gold || 0;

  // Her yerdeki elmas göstergelerini güncelle
  document.querySelectorAll('[id$="Gem"],[id*="gem"]').forEach(el => {
    if (el.id.includes('gem') || el.id.includes('Gem')) el.textContent = gems.toLocaleString('tr-TR');
  });
  document.querySelectorAll('[id$="Gold"],[id*="gold"]').forEach(el => {
    if (el.id !== 'entryCostDisplay') el.textContent = gold.toLocaleString('tr-TR');
  });
  // Topbar altın
  const ga = document.getElementById('goldAmount');
  if (ga) ga.textContent = gold.toLocaleString('tr-TR');
  // Profil sayfası
  const pd = document.getElementById('profileGoldDisplay');
  if (pd) pd.textContent = gold.toLocaleString('tr-TR');

  // Elmas topbar göstergesi (varsa)
  const gd = document.getElementById('gemDisplay');
  if (gd) gd.textContent = gems;
}
window.updateGemDisplays = updateGemDisplays;

// ===== VIP BADGE =====
window.getVipBadge = function(vipLevel) {
  if (!vipLevel) return '';
  const names = ['','I','II','III','IV','V','VI','VII','VIII','IX','X'];
  return `<span class="vip-badge vip-${Math.min(vipLevel,5)}">VIP ${names[vipLevel]||vipLevel}</span>`;
};

// ===== TOPBAR ELMAS GÖSTERGESİ =====
function injectGemToTopbar() {
  const topbarRight = document.querySelector('.topbar-right');
  if (topbarRight && !document.getElementById('gemTopbar')) {
    const gemEl = document.createElement('div');
    gemEl.id = 'gemTopbar';
    gemEl.className = 'gold-display';
    gemEl.style.cssText = 'color:#87ceeb;border-color:rgba(52,152,219,0.25);background:rgba(52,152,219,0.08)';
    gemEl.innerHTML = '<span>💎</span><span id="gemDisplay">0</span>';
    topbarRight.insertBefore(gemEl, topbarRight.children[1]);
  }
}

// ===== MENü BUTONLARI BAĞLA =====
function bindExtraMenuButtons() {
  const btnQ = document.getElementById('btnQuests');
  const btnS = document.getElementById('btnShop');
  if (btnQ) btnQ.onclick = () => { renderQuests(); showScreen('screen-quests'); };
  if (btnS) btnS.onclick = () => showScreen('screen-shop');
}

// ===== İLK YÜKLEME =====
document.addEventListener('DOMContentLoaded', () => {
  bindExtraMenuButtons();
});

// app.js'in onAuthStateChanged'i bittikten sonra çalışır
// userProfile yüklendikten sonra çağrılacak
window.onProfileLoaded = function() {
  injectGemToTopbar();
  updateGemDisplays();
  checkDailyLogin();
  bindExtraMenuButtons();
};

// showToast global olarak kullanılabilmesi için
function showToast(msg) {
  if (window.showToast && window.showToast !== showToast) {
    window.showToast(msg);
    return;
  }
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._toastTimer2);
  window._toastTimer2 = setTimeout(() => t.style.display='none', 3000);
}
function closeModal(id) { const el=document.getElementById(id); if(el) el.style.display='none'; }
function openModal(id) { const el=document.getElementById(id); if(el) el.style.display='flex'; }
