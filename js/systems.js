// ===== SYSTEMS.JS — TAM YENİDEN YAZILDI =====
// Görev, günlük giriş, mağaza, hediye, VIP sistemleri

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
    { id: 'w4', icon: '🤝', title: 'Hediye Gönder', desc: '3 hediye gönder', target: 3, key: 'gifts', reward: { gem: 30, xp: 250 } },
  ],
  monthly: [
    { id: 'm1', icon: '🌟', title: '20 Oyun Oyna', desc: 'Bu ay 20 oyun oyna', target: 20, key: 'games', reward: { gold: 5000, gem: 100, xp: 1000 } },
    { id: 'm2', icon: '👑', title: '10 Galibiyet', desc: 'Bu ay 10 kez kazan', target: 10, key: 'wins', reward: { gem: 200, xp: 2000 } },
  ]
};

const DAILY_REWARDS = [
  { day:1,  icon:'🪙', reward:'100 Altın',  gold:100 },
  { day:2,  icon:'💎', reward:'5 Elmas',    gem:5 },
  { day:3,  icon:'🪙', reward:'250 Altın',  gold:250 },
  { day:4,  icon:'⚡', reward:'100 XP',     xp:100 },
  { day:5,  icon:'🪙', reward:'500 Altın',  gold:500 },
  { day:6,  icon:'💎', reward:'15 Elmas',   gem:15 },
  { day:7,  icon:'🎁', reward:'1000🪙+50💎', gold:1000, gem:50, special:true },
  { day:8,  icon:'🪙', reward:'300 Altın',  gold:300 },
  { day:9,  icon:'💎', reward:'10 Elmas',   gem:10 },
  { day:10, icon:'⚡', reward:'200 XP',     xp:200 },
  { day:11, icon:'🪙', reward:'500 Altın',  gold:500 },
  { day:12, icon:'💎', reward:'20 Elmas',   gem:20 },
  { day:13, icon:'🪙', reward:'750 Altın',  gold:750 },
  { day:14, icon:'🌟', reward:'2000🪙+100💎',gold:2000,gem:100,mega:true },
  { day:15, icon:'🪙', reward:'400 Altın',  gold:400 },
  { day:16, icon:'💎', reward:'15 Elmas',   gem:15 },
  { day:17, icon:'⚡', reward:'300 XP',     xp:300 },
  { day:18, icon:'🪙', reward:'600 Altın',  gold:600 },
  { day:19, icon:'💎', reward:'25 Elmas',   gem:25 },
  { day:20, icon:'🪙', reward:'1000 Altın', gold:1000 },
  { day:21, icon:'👑', reward:'500 XP',     xp:500, special:true },
  { day:22, icon:'🪙', reward:'500 Altın',  gold:500 },
  { day:23, icon:'💎', reward:'20 Elmas',   gem:20 },
  { day:24, icon:'⚡', reward:'400 XP',     xp:400 },
  { day:25, icon:'🪙', reward:'1500 Altın', gold:1500 },
  { day:26, icon:'💎', reward:'30 Elmas',   gem:30 },
  { day:27, icon:'🪙', reward:'800 Altın',  gold:800 },
  { day:28, icon:'⚡', reward:'500 XP',     xp:500 },
  { day:29, icon:'💎', reward:'50 Elmas',   gem:50 },
  { day:30, icon:'🎊', reward:'5000🪙+200💎+1000XP',gold:5000,gem:200,xp:1000,mega:true },
];

const SHOP_EFFECTS = {
  fire:      { name:'Ateş',          icon:'🔥', cost:50,  desc:'Kart oynarken alevler' },
  lightning: { name:'Şimşek',        icon:'⚡', cost:50,  desc:'Elektrik çakması' },
  gold_glow: { name:'Altın Parıltı', icon:'✨', cost:75,  desc:'Altın ışıltı' },
  dark:      { name:'Karanlık',      icon:'🌑', cost:75,  desc:'Duman efekti' },
  ice:       { name:'Buz',           icon:'❄️', cost:100, desc:'Buz parçaları' },
  zombie:    { name:'Zombi Ruhu',    icon:'🧟', cost:100, desc:'Yeşil buhar' },
  blood:     { name:'Kan',           icon:'🩸', cost:120, desc:'Kan damlacıkları' },
  star:      { name:'Yıldız Tozu',   icon:'💫', cost:120, desc:'Yıldızlar saçılır' },
  rainbow:   { name:'Gökkuşağı',     icon:'🌈', cost:150, desc:'Renk patlaması' },
  dragon:    { name:'Ejder',         icon:'🐉', cost:200, desc:'Ejder alevi' },
  nuke:      { name:'Nükleer',       icon:'☢️', cost:250, desc:'Patlama dalgası' },
  god:       { name:'Tanrı Modu',    icon:'⚜️', cost:500, desc:'Altın aura' },
};

const CARD_SKINS = {
  default:  { name:'Standart',     preview:'🃏', cost:0 },
  dark:     { name:'Karanlık',     preview:'🖤', cost:100, desc:'Siyah arka plan' },
  gold:     { name:'Altın',        preview:'🟡', cost:150, desc:'Altın kenarlı' },
  hologram: { name:'Hologram',     preview:'💠', cost:200, desc:'Işıl ışıl' },
  blood:    { name:'Kan Kırmızı',  preview:'🔴', cost:180, desc:'Kırmızı derin' },
  galaxy:   { name:'Galaksi',      preview:'🌌', cost:250, desc:'Uzay teması' },
  dragon:   { name:'Ejder Ateşi',  preview:'🐉', cost:350, desc:'Alevli ejder' },
  legendary:{ name:'Efsanevi',     preview:'👑', cost:500, desc:'Altın + parlaklık' },
};

const BG_THEMES = {
  default:   { name:'Klasik',        preview:'🏚️', cost:0 },
  dungeon:   { name:'Zindan',        preview:'🏰', cost:80,  desc:'Karanlık zindan' },
  graveyard: { name:'Mezarlık',      preview:'⚰️', cost:100, desc:'Gece mezarlığı' },
  wasteland: { name:'Çorak Alan',    preview:'🌵', cost:120, desc:'Kıyamet sonrası' },
  city:      { name:'Çökmüş Şehir', preview:'🏙️', cost:150, desc:'Zombi istilası' },
  forest:    { name:'Lanetli Orman', preview:'🌲', cost:200, desc:'Gece ormanı' },
};

const FRAMES = {
  none:    { name:'Yok',        preview:'⬜', cost:0 },
  blue:    { name:'Mavi',       preview:'🔵', cost:50 },
  green:   { name:'Yeşil',      preview:'🟢', cost:50 },
  purple:  { name:'Mor',        preview:'🟣', cost:75 },
  red:     { name:'Kırmızı',    preview:'🔴', cost:75 },
  gold:    { name:'Altın',      preview:'🟡', cost:100 },
  diamond: { name:'Elmas',      preview:'💎', cost:200 },
  flame:   { name:'Alev',       preview:'🔥', cost:300 },
  rainbow: { name:'Gökkuşağı',  preview:'🌈', cost:500 },
};

const VIP_LEVELS = [
  { level:0,  name:'Standart',         xpBonus:0,   cost:0     },
  { level:1,  name:'VIP I',            xpBonus:10,  cost:200,  perks:['%10 XP bonus','Mavi isim'] },
  { level:2,  name:'VIP II',           xpBonus:15,  cost:400,  perks:['%15 XP bonus','Yeşil isim'] },
  { level:3,  name:'VIP III',          xpBonus:20,  cost:700,  perks:['%20 XP bonus','Mor çerçeve'] },
  { level:4,  name:'VIP IV',           xpBonus:25,  cost:1100, perks:['%25 XP bonus','Özel efekt'] },
  { level:5,  name:'VIP V',            xpBonus:30,  cost:1600, perks:['%30 XP bonus','Altın çerçeve'] },
  { level:6,  name:'VIP VI',           xpBonus:40,  cost:2500, perks:['%40 XP bonus','Kırmızı aura'] },
  { level:7,  name:'VIP VII',          xpBonus:50,  cost:3500, perks:['%50 XP bonus','Elmas çerçeve'] },
  { level:8,  name:'VIP VIII',         xpBonus:60,  cost:5000, perks:['%60 XP bonus','Siyah altın'] },
  { level:9,  name:'VIP IX',           xpBonus:75,  cost:7500, perks:['%75 XP bonus','Ejder efekti'] },
  { level:10, name:'VIP X — EFSANEVİ',xpBonus:100, cost:10000,perks:['2x XP','Benzersiz rozet','Tüm efektler'] },
];

const GIFTS = [
  { id:'heart',   emoji:'❤️',  name:'Kalp',    cost:0,   currency:'free' },
  { id:'clap',    emoji:'👏',  name:'Alkış',   cost:0,   currency:'free' },
  { id:'flower',  emoji:'🌸',  name:'Çiçek',   cost:50,  currency:'gold' },
  { id:'tea',     emoji:'☕',  name:'Çay',     cost:100, currency:'gold' },
  { id:'fire',    emoji:'🔥',  name:'Ateş',    cost:200, currency:'gold' },
  { id:'kiss',    emoji:'💋',  name:'Öpücük',  cost:30,  currency:'gem'  },
  { id:'crown',   emoji:'👑',  name:'Taç',     cost:50,  currency:'gem'  },
  { id:'diamond', emoji:'💎',  name:'Elmas',   cost:100, currency:'gem'  },
  { id:'star',    emoji:'⭐',  name:'Yıldız',  cost:150, currency:'gem'  },
  { id:'trophy',  emoji:'🏆',  name:'Kupa',    cost:200, currency:'gem'  },
];
window._GIFTS = GIFTS; // social.js için global yap

// ===== GÖREV EKRANI =====
let currentQuestTab = 'daily';

window.switchQuestTab = function(tab, btn) {
  currentQuestTab = tab;
  document.querySelectorAll('.quest-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
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
    const prog = Math.min(progress[q.id] || progress[q.key] || 0, q.target);
    const done = prog >= q.target;
    const isClaimed = !!claimed[q.id];
    const pct = (prog / q.target) * 100;

    return `<div class="quest-item">
      <div class="quest-icon">${q.icon}</div>
      <div class="quest-info">
        <div class="quest-title">${q.title}</div>
        <div class="quest-desc">${q.desc}</div>
        <div class="quest-progress-bar"><div class="quest-fill" style="width:${pct}%"></div></div>
        <div style="font-size:11px;color:var(--text2);margin-top:3px">${prog} / ${q.target}</div>
      </div>
      <div class="quest-rewards">
        ${q.reward.gold ? `<span class="quest-reward-pill gold">+${q.reward.gold}🪙</span>` : ''}
        ${q.reward.gem  ? `<span class="quest-reward-pill gem">+${q.reward.gem}💎</span>` : ''}
        ${q.reward.xp   ? `<span class="quest-reward-pill xp">+${q.reward.xp}XP</span>` : ''}
        ${isClaimed
          ? '<span class="quest-claimed">✅</span>'
          : `<button class="btn-claim" ${!done?'disabled':''} onclick="claimQuest('${q.id}','${currentQuestTab}')">Al</button>`}
      </div>
    </div>`;
  }).join('');
}
window.renderQuests = renderQuests;

window.claimQuest = async function(questId, tab) {
  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;
  const p = window.userProfile || {};
  if ((p.questClaimed||{})[questId]) return;
  const q = QUESTS[tab]?.find(x => x.id === questId);
  if (!q) return;

  const fb = window._fb;
  const updates = { [`questClaimed.${questId}`]: true };
  let gd=0, gm=0, xp=0;
  if (q.reward.gold) { gd=q.reward.gold; updates['gold'] = fb.increment(gd); }
  if (q.reward.gem)  { gm=q.reward.gem;  updates['gems'] = fb.increment(gm); }
  if (q.reward.xp)   { xp=q.reward.xp;   updates['xp']  = fb.increment(xp); }

  await fb.updateDoc(fb.doc(window.db,'users',uid), updates);
  window.userProfile = { ...p,
    questClaimed: {...(p.questClaimed||{}), [questId]:true},
    gold:(p.gold||0)+gd, gems:(p.gems||0)+gm, xp:(p.xp||0)+xp
  };
  if (gd) window.showGoldFloat?.(gd);
  if (xp) window.showXPFloat?.(xp);
  if (gm) _toast(`💎 +${gm} Elmas!`);
  renderQuests();
  updateGemDisplays();
};

// ===== GÜNLİK GİRİŞ =====
window.checkDailyLogin = async function() {
  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;
  const p = window.userProfile || {};
  const today = new Date().toDateString();
  if (p.lastLoginDate === today) return;

  const now = Date.now();
  const daysSince = Math.floor((now - (p.lastLoginTs||0)) / 86400000);
  let streak = (p.loginStreak || 0);
  if (daysSince > 1) streak = 0;
  streak = (streak % 30) + 1;

  const thisMonth = new Date().getMonth();
  if (p.loginMonth !== thisMonth) streak = 1;

  const fb = window._fb;
  await fb.updateDoc(fb.doc(window.db,'users',uid), {
    lastLoginDate: today, lastLoginTs: now, loginStreak: streak, loginMonth: thisMonth
  });
  window.userProfile = { ...p, lastLoginDate:today, lastLoginTs:now, loginStreak:streak, loginMonth:thisMonth };

  _openModal('modal-daily');
  renderDailyCalendar(streak);
};

function renderDailyCalendar(currentDay) {
  const cal = document.getElementById('dailyCalendar');
  const claimBox = document.getElementById('dailyClaimBox');
  if (!cal) return;

  cal.innerHTML = DAILY_REWARDS.map(r => {
    let cls = r.day < currentDay ? 'claimed' : r.day === currentDay ? 'today' : 'locked';
    if (r.mega) cls += ' mega';
    else if (r.special) cls += ' special';
    return `<div class="cal-day ${cls}" title="${r.reward}">
      <div class="cal-reward">${r.icon}</div>
      <div class="cal-num">${r.day}</div>
    </div>`;
  }).join('');

  const todayR = DAILY_REWARDS[currentDay-1];
  if (todayR && claimBox) {
    claimBox.innerHTML = `<div style="background:rgba(245,201,77,0.1);border:1px solid rgba(245,201,77,0.25);border-radius:14px;padding:16px;display:inline-block;text-align:center">
      <div style="font-size:32px;margin-bottom:6px">${todayR.icon}</div>
      <div style="font-weight:700;color:var(--gold);margin-bottom:8px">Gün ${currentDay} Ödülü</div>
      <div style="font-size:14px;margin-bottom:12px">${todayR.reward}</div>
      <button class="btn-primary" onclick="claimDailyReward(${currentDay})" style="min-width:160px">🎁 Al!</button>
    </div>`;
  }
}

window.claimDailyReward = async function(day) {
  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;
  const r = DAILY_REWARDS[day-1];
  if (!r) return;
  const fb = window._fb;
  const updates = { dailyRewardClaimed: true };
  if (r.gold) updates['gold'] = fb.increment(r.gold);
  if (r.gem)  updates['gems'] = fb.increment(r.gem);
  if (r.xp)   updates['xp']  = fb.increment(r.xp);
  await fb.updateDoc(fb.doc(window.db,'users',uid), updates);
  window.userProfile = { ...window.userProfile,
    gold:(window.userProfile.gold||0)+(r.gold||0),
    gems:(window.userProfile.gems||0)+(r.gem||0),
    xp:  (window.userProfile.xp  ||0)+(r.xp ||0),
  };
  if (r.gold) window.showGoldFloat?.(r.gold);
  if (r.xp)  window.showXPFloat?.(r.xp);
  if (r.gem) _toast(`💎 +${r.gem} Elmas!`);
  updateGemDisplays();
  _closeModal('modal-daily');
};

// ===== MAĞAZA =====
window.buyGems = async function(amount, goldCost) {
  const p = window.userProfile||{};
  if (!window.userProfile?._isDev && (p.gold||0) < goldCost) { _toast('❌ Yeterli altın yok!'); return; }
  if (!confirm(`${goldCost.toLocaleString('tr-TR')} 🪙 karşılığında ${amount} 💎 al?`)) return;
  const uid = window.auth?.currentUser?.uid; if (!uid) return;
  const fb = window._fb;
  if (!window.userProfile?._isDev) {
    await fb.updateDoc(fb.doc(window.db,'users',uid), { gold:fb.increment(-goldCost), gems:fb.increment(amount) });
    window.userProfile = { ...p, gold:p.gold-goldCost, gems:(p.gems||0)+amount };
  } else {
    window.userProfile = { ...p, gems:999999999 };
  }
  _toast(`✅ ${amount} 💎 satın alındı!`);
  updateGemDisplays();
};

window.buyEffect = async function(effectId) {
  const e = SHOP_EFFECTS[effectId]; if (!e) return;
  const p = window.userProfile||{};
  if ((p.ownedEffects||[]).includes(effectId)) { _toast('Zaten sahipsin!'); return; }
  const uid = window.auth?.currentUser?.uid; if (!uid) return;
  if (!window.userProfile?._isDev && (p.gems||0) < e.cost) { _toast(`❌ Yeterli elmas yok! (${e.cost}💎)`); return; }
  if (!confirm(`${e.name} için ${e.cost}💎 harcansın?`)) return;
  const fb = window._fb;
  const newOwned = [...(p.ownedEffects||[]), effectId];
  if (!window.userProfile?._isDev) {
    await fb.updateDoc(fb.doc(window.db,'users',uid), { gems:fb.increment(-e.cost), ownedEffects:newOwned, activeEffect:effectId });
    window.userProfile = { ...p, gems:(p.gems||0)-e.cost, ownedEffects:newOwned, activeEffect:effectId };
  } else {
    await fb.updateDoc(fb.doc(window.db,'users',uid), { ownedEffects:newOwned, activeEffect:effectId });
    window.userProfile = { ...p, ownedEffects:newOwned, activeEffect:effectId };
  }
  _toast(`✅ ${e.icon} ${e.name} satın alındı!`);
  updateGemDisplays(); renderShopTab('effects');
};

window.activateEffect = async function(id) {
  const uid = window.auth?.currentUser?.uid; if (!uid) return;
  await window._fb.updateDoc(window._fb.doc(window.db,'users',uid), { activeEffect:id });
  window.userProfile = { ...window.userProfile, activeEffect:id };
  _toast('✅ Efekt aktif!'); renderShopTab('effects');
};

window.buyVIP = async function(vipLevel) {
  const v = VIP_LEVELS[vipLevel]; if (!v) return;
  const p = window.userProfile||{};
  const currentVip = p.vipLevel||0;
  if (currentVip >= vipLevel) { _toast('Bu VIP seviyesin var!'); return; }
  // Kademeli satın alma — bir üst seviyeye atlamadan önce sıradaki seviye alınmalı
  if (vipLevel > currentVip + 1) { _toast(`❌ Önce VIP ${currentVip + 1} seviyesini almalısın!`); return; }
  const uid = window.auth?.currentUser?.uid; if (!uid) return;
  if (!window.userProfile?._isDev && (p.gems||0) < v.cost) { _toast(`❌ Yeterli elmas yok! (${v.cost}💎)`); return; }
  if (!confirm(`${v.name} için ${v.cost}💎?`)) return;
  const fb = window._fb;
  if (!window.userProfile?._isDev) {
    await fb.updateDoc(fb.doc(window.db,'users',uid), { gems:fb.increment(-v.cost), vipLevel });
    window.userProfile = { ...p, gems:(p.gems||0)-v.cost, vipLevel };
  } else {
    await fb.updateDoc(fb.doc(window.db,'users',uid), { vipLevel });
    window.userProfile = { ...p, vipLevel };
  }
  _toast(`👑 ${v.name} aktif!`); updateGemDisplays(); renderShopTab('vip'); window.updateAllUI?.();
};

// Generic skin/bg/frame buy
function _buyCosmetic(type, id, itemMap, ownedKey, activeKey) {
  return async function() {
    const item = itemMap[id]; if (!item) return;
    const p = window.userProfile||{};
    const owned = p[ownedKey] || [];
    if (id==='default'||id==='none'||owned.includes(id)) {
      // Sadece aktifleştir
      const uid = window.auth?.currentUser?.uid; if (!uid) return;
      await window._fb.updateDoc(window._fb.doc(window.db,'users',uid), { [activeKey]:id });
      window.userProfile = { ...p, [activeKey]:id };
      _toast('✅ Aktif edildi!');
      window.updateAllUI?.();
      if (type==='skin') renderShopTab('skins');
      else if (type==='bg') renderShopTab('bg');
      else renderShopTab('frames');
      return;
    }
    const uid = window.auth?.currentUser?.uid; if (!uid) return;
    if (!window.userProfile?._isDev && (p.gems||0) < item.cost) { _toast(`❌ Yeterli elmas yok! (${item.cost}💎)`); return; }
    if (!confirm(`${item.name} için ${item.cost}💎?`)) return;
    const fb = window._fb;
    const newOwned = [...owned, id];
    if (!window.userProfile?._isDev) {
      await fb.updateDoc(fb.doc(window.db,'users',uid), { gems:fb.increment(-item.cost), [ownedKey]:newOwned, [activeKey]:id });
      window.userProfile = { ...p, gems:(p.gems||0)-item.cost, [ownedKey]:newOwned, [activeKey]:id };
    } else {
      await fb.updateDoc(fb.doc(window.db,'users',uid), { [ownedKey]:newOwned, [activeKey]:id });
      window.userProfile = { ...p, [ownedKey]:newOwned, [activeKey]:id };
    }
    _toast(`✅ ${item.name} satın alındı!`);
    updateGemDisplays();
    window.updateAllUI?.();
    if (type==='skin') renderShopTab('skins');
    else if (type==='bg') renderShopTab('bg');
    else renderShopTab('frames');
  };
}

// MAĞAZA SEKME RENDER
window.switchShopTab = function(tab, btn) {
  document.querySelectorAll('#shopTabs .quest-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderShopTab(tab);
};

function renderShopTab(tab) {
  const content = document.getElementById('shopContent');
  if (!content) return;
  const p = window.userProfile||{};

  if (tab==='gems') {
    content.innerHTML = `<div class="settings-group"><h3>💎 Elmas Al</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        ${[[80,1500],[200,3500,'%17'],[500,8000,'%25'],[1000,14000,'%33'],[2500,30000,'%50',true],[5000,50000,'%67',true]]
          .map(([g,c,bonus,hot])=>`<div class="shop-item" onclick="buyGems(${g},${c})">
            ${hot?'<div class="shop-badge" style="background:#e74c3c">🔥 HOT</div>':''}
            ${bonus?`<div class="shop-badge" style="background:var(--green)">${bonus}</div>`:''}
            <div class="shop-gem-icon">💎×${g}</div>
            <div class="shop-price">🪙 ${c.toLocaleString('tr-TR')}</div>
          </div>`).join('')}
      </div></div>`;
  }
  else if (tab==='effects') {
    const owned = p.ownedEffects||[];
    const active = p.activeEffect;
    content.innerHTML = `<div class="settings-group"><h3>✨ Kart Efektleri</h3>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        ${Object.entries(SHOP_EFFECTS).map(([id,e])=>{
          const isOwned = owned.includes(id);
          const isActive = active===id;
          return `<div class="shop-item${isActive?' shop-item-active':''}" onclick="${isOwned?`activateEffect('${id}')`:`buyEffect('${id}')`}">
            <div class="shop-icon">${e.icon}</div>
            <div class="shop-name">${e.name}</div>
            <div class="shop-desc">${e.desc||''}</div>
            ${isOwned?`<div class="shop-price" style="color:${isActive?'var(--green)':'var(--text2)'}"> ${isActive?'✅ Aktif':'▶ Kullan'}</div>`
              :`<div class="shop-price gem">💎 ${e.cost}</div>`}
          </div>`;
        }).join('')}
      </div></div>`;
  }
  else if (tab==='skins') {
    const owned = p.ownedSkins||[];
    const active = p.activeSkin||'default';
    content.innerHTML = `<div class="settings-group"><h3>🃏 Kart Skin</h3>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        ${Object.entries(CARD_SKINS).map(([id,s])=>{
          const isOwned = id==='default'||owned.includes(id);
          const isActive = active===id;
          return `<div class="shop-item${isActive?' shop-item-active':''}" onclick="handleCosmeticClick('skin','${id}')">
            <div class="shop-icon">${s.preview}</div>
            <div class="shop-name">${s.name}</div>
            <div class="shop-desc">${s.desc||''}</div>
            ${isOwned?`<div class="shop-price" style="color:${isActive?'var(--green)':'var(--text2)'}"> ${isActive?'✅ Aktif':'▶ Seç'}</div>`
              :`<div class="shop-price gem">💎 ${s.cost}</div>`}
          </div>`;
        }).join('')}
      </div></div>`;
  }
  else if (tab==='bg') {
    const owned = p.ownedBgs||[];
    const active = p.activeBg||'default';
    content.innerHTML = `<div class="settings-group"><h3>🎨 Masa Teması</h3>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        ${Object.entries(BG_THEMES).map(([id,s])=>{
          const isOwned = id==='default'||owned.includes(id);
          const isActive = active===id;
          return `<div class="shop-item${isActive?' shop-item-active':''}" onclick="handleCosmeticClick('bg','${id}')">
            <div class="shop-icon">${s.preview}</div>
            <div class="shop-name">${s.name}</div>
            <div class="shop-desc">${s.desc||''}</div>
            ${isOwned?`<div class="shop-price" style="color:${isActive?'var(--green)':'var(--text2)'}"> ${isActive?'✅ Aktif':'▶ Seç'}</div>`
              :`<div class="shop-price gem">💎 ${s.cost}</div>`}
          </div>`;
        }).join('')}
      </div></div>`;
  }
  else if (tab==='frames') {
    const owned = p.ownedFrames||[];
    const active = p.activeFrame||'none';
    content.innerHTML = `<div class="settings-group"><h3>🖼️ Profil Çerçevesi</h3>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        ${Object.entries(FRAMES).map(([id,f])=>{
          const isOwned = id==='none'||owned.includes(id);
          const isActive = active===id;
          return `<div class="shop-item${isActive?' shop-item-active':''}" onclick="handleCosmeticClick('frame','${id}')">
            <div class="shop-icon">${f.preview}</div>
            <div class="shop-name">${f.name}</div>
            ${isOwned?`<div class="shop-price" style="color:${isActive?'var(--green)':'var(--text2)'}"> ${isActive?'✅ Aktif':'▶ Seç'}</div>`
              :`<div class="shop-price gem">💎 ${f.cost}</div>`}
          </div>`;
        }).join('')}
      </div></div>`;
  }
  else if (tab==='vip') {
    const currentVip = p.vipLevel||0;
    content.innerHTML = `<div class="settings-group"><h3>👑 VIP Seviyeleri</h3>
      <p style="color:var(--text2);font-size:13px;margin-bottom:12px">Mevcut: <strong style="color:var(--gold)">VIP ${currentVip}</strong></p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${VIP_LEVELS.filter(v=>v.level>0).map(v=>{
          const isOwned = currentVip>=v.level;
          const isNext = v.level === currentVip+1;
          const isLocked = !isOwned && !isNext;
          return `<div class="shop-item${isOwned?' shop-item-active':''}" style="display:flex;align-items:center;gap:12px;text-align:left;${isLocked?'opacity:0.45;cursor:not-allowed':''}" onclick="${isNext?`buyVIP(${v.level})`:(isLocked?`_toast('🔒 Önce VIP ${currentVip+1} seviyesini al!')`:'')}">
            <div class="vip-badge vip-${Math.min(v.level,5)}" style="min-width:60px;text-align:center;font-size:13px">VIP ${v.level}</div>
            <div style="flex:1">
              <div class="shop-name">${isLocked?'🔒 ':''}${v.name}</div>
              <div class="shop-desc">${(v.perks||[]).join(' · ')}</div>
            </div>
            ${isOwned?'<div style="color:var(--green);font-weight:700">✅</div>'
              :`<div class="shop-price gem" style="white-space:nowrap">💎 ${v.cost.toLocaleString('tr-TR')}</div>`}
          </div>`;
        }).join('')}
      </div></div>`;
  }
}
window.renderShopTab = renderShopTab;

window.handleCosmeticClick = async function(type, id) {
  const maps = { skin:[CARD_SKINS,'ownedSkins','activeSkin'], bg:[BG_THEMES,'ownedBgs','activeBg'], frame:[FRAMES,'ownedFrames','activeFrame'] };
  const [itemMap, ownedKey, activeKey] = maps[type]||[];
  if (!itemMap) return;
  await _buyCosmetic(type, id, itemMap, ownedKey, activeKey)();
};

// ===== HEDİYE SİSTEMİ =====
let giftTargetName = '';

window.openGiftPanel = function(targetName) {
  giftTargetName = targetName || 'Rakip';
  const el = document.getElementById('giftPanel');
  const tn = document.getElementById('giftTarget');
  if (tn) tn.textContent = giftTargetName;
  if (el) el.style.display = el.style.display==='none' ? 'block' : 'none';
  renderGiftGrid();
};

function renderGiftGrid() {
  const grid = document.getElementById('giftGrid');
  if (!grid) return;
  grid.innerHTML = GIFTS.map(g => {
    let costLabel = g.currency==='free'
      ? '<span class="gift-cost" style="color:var(--green)">Ücretsiz</span>'
      : g.currency==='gold'
        ? `<span class="gift-cost">${g.cost}🪙</span>`
        : `<span class="gift-cost gem">${g.cost}💎</span>`;
    return `<div class="gift-item" onclick="sendGift('${g.id}')">
      <div class="gift-emoji">${g.emoji}</div>
      ${costLabel}
    </div>`;
  }).join('');
}

window.sendGift = async function(giftId) {
  const gift = GIFTS.find(g=>g.id===giftId); if (!gift) return;
  const p = window.userProfile||{};
  const uid = window.auth?.currentUser?.uid; if (!uid) return;
  const fb = window._fb;

  if (gift.currency==='gold' && !window.userProfile?._isDev && (p.gold||0)<gift.cost) { _toast('❌ Yeterli altın yok!'); return; }
  if (gift.currency==='gem'  && !window.userProfile?._isDev && (p.gems||0)<gift.cost) { _toast('❌ Yeterli elmas yok!'); return; }

  if (gift.currency==='gold' && !window.userProfile?._isDev) {
    await fb.updateDoc(fb.doc(window.db,'users',uid), { gold:fb.increment(-gift.cost) });
    window.userProfile = { ...p, gold:p.gold-gift.cost };
  } else if (gift.currency==='gem' && !window.userProfile?._isDev) {
    await fb.updateDoc(fb.doc(window.db,'users',uid), { gems:fb.increment(-gift.cost) });
    window.userProfile = { ...p, gems:(p.gems||0)-gift.cost };
  }

  document.getElementById('giftPanel').style.display='none';
  // Rakip paneline doğru uçur (oyun içindeyse)
  const oppPanel = document.querySelector('.panel:not(.mine)');
  const targetPoint = oppPanel
    ? (() => { const r = oppPanel.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()
    : { x: window.innerWidth/2, y: 90 };
  window.flyGiftEmoji?.(gift.emoji, targetPoint);
  _toast(`${gift.emoji} ${gift.name} gönderildi!`);
  window.updateQuestProgress?.('gifts', 1);
  updateGemDisplays();
};

// ===== GÖREV İLERLEMESİ =====
window.updateQuestProgress = async function(key, amount) {
  const uid = window.auth?.currentUser?.uid; if (!uid) return;
  const p = window.userProfile||{};
  const cur = (p.questProgress||{})[key]||0;
  const newVal = cur + amount;
  await window._fb.updateDoc(window._fb.doc(window.db,'users',uid), { [`questProgress.${key}`]:newVal });
  window.userProfile = { ...p, questProgress:{...(p.questProgress||{}), [key]:newVal} };
};

// ===== ELMAS & ALTIN GÜNCELLE =====
function updateGemDisplays() {
  const p = window.userProfile||{};
  const gems = p._isDev ? 999999999 : (p.gems||0);
  const gold = p._isDev ? 999999999 : (p.gold||0);
  const fmt = n => n>=999999000 ? '∞' : n.toLocaleString('tr-TR');

  // Topbar
  const ga = document.getElementById('goldAmount'); if (ga) ga.textContent = fmt(gold);
  const gd = document.getElementById('gemDisplay');  if (gd) gd.textContent = fmt(gems);
  // Mağaza
  const sg = document.getElementById('shopGold');    if (sg) sg.textContent = fmt(gold);
  const sm = document.getElementById('shopGem');     if (sm) sm.textContent = fmt(gems);
  // Görevler
  const qg = document.getElementById('questGold');   if (qg) qg.textContent = fmt(gold);
  const qm = document.getElementById('questGem');    if (qm) qm.textContent = fmt(gems);
  // Profil
  const pd = document.getElementById('profileGoldDisplay'); if (pd) pd.textContent = fmt(gold);
}
window.updateGemDisplays = updateGemDisplays;

// ===== TOPBAR ELMAS GÖSTERGESİ =====
function injectGemToTopbar() {
  const topbarRight = document.querySelector('.topbar-right');
  if (topbarRight && !document.getElementById('gemTopbar')) {
    const gemEl = document.createElement('div');
    gemEl.id = 'gemTopbar';
    gemEl.className = 'gold-display';
    gemEl.style.cssText = 'color:#87ceeb;border-color:rgba(52,152,219,0.25);background:rgba(52,152,219,0.08)';
    gemEl.innerHTML = '<span>💎</span><span id="gemDisplay">0</span>';
    // Altın göstergesinin hemen yanına ekle
    const goldEl = document.getElementById('goldDisplay') || topbarRight.children[0];
    if (goldEl && goldEl.nextSibling) topbarRight.insertBefore(gemEl, goldEl.nextSibling);
    else topbarRight.appendChild(gemEl);
  }
}

// ===== VIP BADGE =====
window.getVipBadge = function(vipLevel) {
  if (!vipLevel) return '';
  const names=['','I','II','III','IV','V','VI','VII','VIII','IX','X'];
  return `<span class="vip-badge vip-${Math.min(vipLevel,5)}">VIP ${names[vipLevel]||vipLevel}</span>`;
};

// ===== MENÜ BUTONLARI =====
function bindExtraMenuButtons() {
  const btnQ = document.getElementById('btnQuests');
  const btnS = document.getElementById('btnShop');
  if (btnQ) btnQ.onclick = () => {
    renderQuests();
    _goScreen('screen-quests');
  };
  if (btnS) btnS.onclick = () => {
    renderShopTab('gems');
    _goScreen('screen-shop');
  };
}

function _goScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>{ s.classList.remove('active'); s.style.display='none'; });
  const el = document.getElementById(id);
  if (el) { el.style.display='flex'; el.classList.add('active'); }
}

// ===== YARDIMCI =====
function _toast(msg) { if(window.showToast) window.showToast(msg); }
function _openModal(id) { const el=document.getElementById(id); if(el) el.style.display='flex'; }
function _closeModal(id) { const el=document.getElementById(id); if(el) el.style.display='none'; }
window.closeModal = _closeModal;
window.openModal = _openModal;

// ===== BAŞLATMA =====
window.onProfileLoaded = function() {
  injectGemToTopbar();
  updateGemDisplays();
  checkDailyLogin();
  bindExtraMenuButtons();
  // shop-item-active stili ekle
  if (!document.getElementById('shopActiveStyle')) {
    const s = document.createElement('style');
    s.id = 'shopActiveStyle';
    s.textContent = '.shop-item-active{border-color:rgba(46,204,113,0.5)!important;background:rgba(46,204,113,0.06)!important}';
    document.head.appendChild(s);
  }
};

document.addEventListener('DOMContentLoaded', bindExtraMenuButtons);
