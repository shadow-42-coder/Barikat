// ===== SOSYAL SİSTEM: ARKADAŞ, CHAT, PROFİL GÖRÜNTÜLEME, HEDİYE =====
// Firestore koleksiyonları:
//   users/{uid}                    — kullanıcı profili
//   friends/{uid}/list/{friendUid} — arkadaşlık listesi
//   friendRequests/{uid}/incoming/{fromUid} — gelen istekler
//   chats/{chatId}/messages/{msgId} — mesajlar (chatId = küçük uid + büyük uid)

// ===== YARDIMCILAR =====
function _fb() { return window._fb; }
function _db() { return window.db; }
function _uid() { return window.auth?.currentUser?.uid; }
function _profile() { return window.userProfile || {}; }
function _toast(msg) { window.showToast?.(msg); }
function chatId(a, b) { return [a,b].sort().join('_'); }

// ===== OYUNCU TIKLAMA MENÜSÜ (oyun içi) =====
let _clickedPlayer = null;

window.showPlayerContextMenu = function(playerId, playerName, playerAvatar, event) {
  if (!playerId || playerId === _uid()) return;
  _clickedPlayer = { id: playerId, name: playerName, avatar: playerAvatar };

  // Mevcut menüyü kaldır
  document.getElementById('playerContextMenu')?.remove();

  const menu = document.createElement('div');
  menu.id = 'playerContextMenu';
  menu.className = 'player-ctx-menu';

  const isFriend = (_profile().friendsList || []).includes(playerId);

  menu.innerHTML = `
    <div class="ctx-header">
      <span class="ctx-avatar">${playerAvatar || '👤'}</span>
      <span class="ctx-name">${playerName}</span>
    </div>
    <button class="ctx-btn" onclick="viewPlayerProfile('${playerId}')">👤 Profilini Gör</button>
    <button class="ctx-btn" onclick="openGiftToPlayer('${playerId}','${playerName}')">🎁 Hediye Gönder</button>
    <button class="ctx-btn" onclick="openChatWith('${playerId}','${playerName}','${playerAvatar}')">💬 Mesaj Gönder</button>
    ${isFriend
      ? `<button class="ctx-btn ctx-danger" onclick="removeFriend('${playerId}','${playerName}')">❌ Arkadaşlıktan Çıkar</button>`
      : `<button class="ctx-btn ctx-add" onclick="sendFriendRequest('${playerId}','${playerName}')">➕ Arkadaş Ekle</button>`
    }
    <button class="ctx-close" onclick="document.getElementById('playerContextMenu')?.remove()">✕</button>
  `;

  // Pozisyon
  const x = event?.clientX || window.innerWidth/2;
  const y = event?.clientY || window.innerHeight/2;
  menu.style.left = Math.min(x, window.innerWidth - 220) + 'px';
  menu.style.top  = Math.min(y, window.innerHeight - 280) + 'px';

  document.body.appendChild(menu);

  // Dışarıya tıklayınca kapat
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', handler); }
    });
  }, 100);
};

// Panel'e tıklama ekle (renderGameLayout'tan sonra çağrılır)
window.attachPanelClickListeners = function() {
  window.players?.forEach(p => {
    if (!p || p.id === (window.myPlayerId ?? 0)) return;
    const panel = document.getElementById(`panel_${p.id}`);
    if (!panel) return;
    const header = panel.querySelector('.panel-header');
    if (!header) return;
    header.style.cursor = 'pointer';
    header.onclick = (e) => {
      e.stopPropagation();
      window.showPlayerContextMenu(p.uid || p.id, p.name, p.avatar, e);
    };
  });
};

// ===== PROFİL GÖRÜNTÜLEME (başka oyuncu) =====
window.viewPlayerProfile = async function(targetUid) {
  document.getElementById('playerContextMenu')?.remove();
  if (!targetUid) return;

  // Firestore'dan profil çek (uid string'se doğrudan, number ise oyun verisiyle)
  let profile = null;
  if (typeof targetUid === 'string' && targetUid.length > 10) {
    try {
      const snap = await _fb().getDoc(_fb().doc(_db(),'users',targetUid));
      if (snap.exists()) profile = { ...snap.data(), uid: targetUid };
    } catch(e) {}
  }

  // Oyun içindeyse players dizisinden bul
  if (!profile) {
    const gp = window.players?.find(p => p.id === targetUid || p.uid === targetUid);
    if (gp) profile = gp;
  }

  if (!profile) { _toast('Profil yüklenemedi'); return; }

  const level = window.getLevelFromXP?.(profile.xp||0) || 1;
  const rank  = window.getRank?.(level) || { name:'?', badge:'?' };
  const wins  = profile.wins  || 0;
  const games = profile.games || 0;
  const wr    = games > 0 ? Math.round(wins/games*100) : 0;

  const modal = document.getElementById('viewProfileModal');
  if (!modal) return;

  modal.querySelector('#vpAvatar').textContent  = profile.avatar || '👤';
  modal.querySelector('#vpName').textContent    = profile.name   || '?';
  modal.querySelector('#vpLevel').textContent   = `Lv.${level} · ${rank.badge} ${rank.name}`;
  modal.querySelector('#vpWins').textContent    = wins;
  modal.querySelector('#vpGames').textContent   = games;
  modal.querySelector('#vpWR').textContent      = wr + '%';
  modal.querySelector('#vpXP').textContent      = (profile.xp||0).toLocaleString('tr-TR') + ' XP';
  modal.querySelector('#vpVip').textContent     = profile.vipLevel ? `VIP ${profile.vipLevel}` : 'Standart';

  const isFriend = (_profile().friendsList||[]).includes(profile.uid || targetUid);
  const addBtn = modal.querySelector('#vpAddFriend');
  if (addBtn) {
    addBtn.textContent = isFriend ? '✅ Arkadaşsınız' : '➕ Arkadaş Ekle';
    addBtn.onclick = isFriend ? null : () => sendFriendRequest(profile.uid || targetUid, profile.name);
    addBtn.disabled = isFriend;
  }
  const msgBtn = modal.querySelector('#vpMessage');
  if (msgBtn) msgBtn.onclick = () => {
    openChatWith(profile.uid || targetUid, profile.name, profile.avatar);
    modal.style.display = 'none';
  };
  const giftBtn = modal.querySelector('#vpGift');
  if (giftBtn) giftBtn.onclick = () => {
    openGiftToPlayer(profile.uid || targetUid, profile.name);
    modal.style.display = 'none';
  };

  modal.style.display = 'flex';
};

// ===== ARKADAŞ SİSTEMİ =====
window.sendFriendRequest = async function(toUid, toName) {
  document.getElementById('playerContextMenu')?.remove();
  const uid = _uid(); if (!uid) return;
  const fb = _fb();
  const me = _profile();

  if ((me.friendsList||[]).includes(toUid)) { _toast('Zaten arkadaşsınız!'); return; }

  // İsteği karşı tarafa yaz
  await fb.setDoc(fb.doc(_db(), `friendRequests/${toUid}/incoming/${uid}`), {
    fromUid: uid, fromName: me.name||'?', fromAvatar: me.avatar||'😎',
    ts: Date.now(), status: 'pending'
  });
  _toast(`✅ ${toName}'e arkadaşlık isteği gönderildi!`);
};

window.removeFriend = async function(friendUid, friendName) {
  document.getElementById('playerContextMenu')?.remove();
  const uid = _uid(); if (!uid) return;
  if (!confirm(`${friendName}'i arkadaşlıktan çıkar?`)) return;
  const fb = _fb();
  const newList = (_profile().friendsList||[]).filter(f => f !== friendUid);
  await fb.updateDoc(fb.doc(_db(),'users',uid), { friendsList: newList });
  window.userProfile = { ..._profile(), friendsList: newList };
  _toast('Arkadaşlıktan çıkarıldı.');
  renderFriendsList();
};

async function acceptFriendRequest(fromUid, fromName, fromAvatar) {
  const uid = _uid(); if (!uid) return;
  const fb = _fb();

  // Her iki tarafın listesine ekle
  const myList = [...(_profile().friendsList||[])];
  if (!myList.includes(fromUid)) myList.push(fromUid);
  await fb.updateDoc(fb.doc(_db(),'users',uid), { friendsList: myList });
  window.userProfile = { ..._profile(), friendsList: myList };

  // Karşı tarafın listesine de ekle
  const theirSnap = await fb.getDoc(fb.doc(_db(),'users',fromUid));
  if (theirSnap.exists()) {
    const theirList = [...(theirSnap.data().friendsList||[])];
    if (!theirList.includes(uid)) theirList.push(uid);
    await fb.updateDoc(fb.doc(_db(),'users',fromUid), { friendsList: theirList });
  }

  // İsteği sil
  await fb.deleteDoc(fb.doc(_db(), `friendRequests/${uid}/incoming/${fromUid}`));
  _toast(`✅ ${fromName} artık arkadaşın!`);
  renderFriendsList();
  loadFriendRequests();
}

async function declineFriendRequest(fromUid) {
  const uid = _uid(); if (!uid) return;
  await _fb().deleteDoc(_fb().doc(_db(), `friendRequests/${uid}/incoming/${fromUid}`));
  loadFriendRequests();
}

// Arkadaş isteklerini dinle (gerçek zamanlı)
let _friendReqUnsub = null;
function listenFriendRequests() {
  const uid = _uid(); if (!uid) return;
  if (_friendReqUnsub) _friendReqUnsub();
  const fb = _fb();
  const q = fb.collection(_db(), `friendRequests/${uid}/incoming`);
  _friendReqUnsub = fb.onSnapshot(q, snap => {
    const badge = document.getElementById('friendReqBadge');
    const count = snap.docs.length;
    if (badge) badge.textContent = count > 0 ? count : '';
    if (badge) badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

async function loadFriendRequests() {
  const uid = _uid(); if (!uid) return;
  const fb = _fb();
  const snap = await fb.getDocs(fb.collection(_db(), `friendRequests/${uid}/incoming`));
  const list = document.getElementById('friendReqList');
  if (!list) return;

  if (snap.empty) { list.innerHTML = '<p class="empty-msg">Bekleyen istek yok</p>'; return; }

  list.innerHTML = snap.docs.map(d => {
    const r = d.data();
    return `<div class="friend-req-item">
      <div class="friend-avatar">${r.fromAvatar||'👤'}</div>
      <div class="friend-info">
        <div class="friend-name">${r.fromName||'?'}</div>
        <div class="friend-sub">Arkadaşlık isteği gönderdi</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn-accept-req" onclick="acceptFriendRequest('${r.fromUid}','${r.fromName}','${r.fromAvatar}')">✅</button>
        <button class="btn-decline-req" onclick="declineFriendRequest('${r.fromUid}')">❌</button>
      </div>
    </div>`;
  }).join('');
}
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;

async function renderFriendsList() {
  const uid = _uid(); if (!uid) return;
  const list = document.getElementById('friendListItems');
  if (!list) return;

  const friendIds = _profile().friendsList || [];
  if (friendIds.length === 0) { list.innerHTML = '<p class="empty-msg">Henüz arkadaşın yok</p>'; return; }

  list.innerHTML = '<div class="friend-loading">Yükleniyor...</div>';

  const fb = _fb();
  const profiles = await Promise.all(friendIds.slice(0,30).map(async fid => {
    try {
      const s = await fb.getDoc(fb.doc(_db(),'users',fid));
      return s.exists() ? { ...s.data(), uid: fid } : null;
    } catch { return null; }
  }));

  const valid = profiles.filter(Boolean);
  if (valid.length === 0) { list.innerHTML = '<p class="empty-msg">Arkadaş bulunamadı</p>'; return; }

  list.innerHTML = valid.map(f => `
    <div class="friend-item" onclick="openChatWith('${f.uid}','${f.name}','${f.avatar||'👤'}')">
      <div class="friend-avatar">${f.avatar||'👤'}</div>
      <div class="friend-info">
        <div class="friend-name">${f.name||'?'}</div>
        <div class="friend-sub">Lv.${window.getLevelFromXP?.(f.xp||0)||1} · ${f.wins||0} galibiyet</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="ctx-btn" style="padding:5px 8px;font-size:12px" onclick="event.stopPropagation();openGiftToPlayer('${f.uid}','${f.name}')">🎁</button>
        <button class="ctx-btn" style="padding:5px 8px;font-size:12px" onclick="event.stopPropagation();viewPlayerProfile('${f.uid}')">👤</button>
      </div>
    </div>
  `).join('');
}
window.renderFriendsList = renderFriendsList;

// ===== CHAT SİSTEMİ =====
let _currentChatUid  = null;
let _currentChatName = null;
let _chatUnsub = null;

window.openChatWith = function(targetUid, targetName, targetAvatar) {
  document.getElementById('playerContextMenu')?.remove();
  _currentChatUid  = targetUid;
  _currentChatName = targetName;

  const modal = document.getElementById('chatModal');
  if (!modal) return;

  modal.querySelector('#chatTargetName').textContent   = targetName || '?';
  modal.querySelector('#chatTargetAvatar').textContent = targetAvatar || '👤';
  modal.querySelector('#chatMessages').innerHTML = '<div class="chat-loading">Mesajlar yükleniyor...</div>';
  modal.querySelector('#chatInput').value = '';

  modal.style.display = 'flex';
  listenChat(targetUid);
};

function listenChat(targetUid) {
  const uid = _uid(); if (!uid) return;
  if (_chatUnsub) { _chatUnsub(); _chatUnsub = null; }

  const fb = _fb();
  const cid = chatId(uid, targetUid);
  const q = fb.query(
    fb.collection(_db(), `chats/${cid}/messages`),
    fb.orderBy('ts','asc'),
    fb.limit(50)
  );

  _chatUnsub = fb.onSnapshot(q, snap => {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    container.innerHTML = snap.docs.map(d => {
      const m = d.data();
      const isMe = m.fromUid === uid;
      return `<div class="chat-msg ${isMe?'chat-me':'chat-them'}">
        ${!isMe ? `<div class="chat-avatar">${m.fromAvatar||'👤'}</div>` : ''}
        <div class="chat-bubble">
          ${m.type==='gift' ? `<span style="font-size:28px">${m.emoji}</span><div style="font-size:11px;opacity:0.7">Hediye gönderdi</div>` : m.text}
        </div>
      </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  });
}

window.sendChatMessage = async function() {
  const uid = _uid(); if (!uid || !_currentChatUid) return;
  const input = document.getElementById('chatInput');
  const text = input?.value?.trim();
  if (!text) return;

  const fb = _fb();
  const cid = chatId(uid, _currentChatUid);
  const me = _profile();

  await fb.addDoc(fb.collection(_db(), `chats/${cid}/messages`), {
    fromUid: uid, fromName: me.name||'?', fromAvatar: me.avatar||'😎',
    text, type: 'text', ts: Date.now()
  });
  if (input) input.value = '';
};

window.closeChatModal = function() {
  if (_chatUnsub) { _chatUnsub(); _chatUnsub = null; }
  const modal = document.getElementById('chatModal');
  if (modal) modal.style.display = 'none';
};

// Chat'te Enter tuşu
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('chatModal')?.style.display === 'flex') {
    window.sendChatMessage();
  }
});

// ===== HEDİYE GÖNDERME (oyuncu hedefli) =====
window.openGiftToPlayer = function(targetUid, targetName) {
  document.getElementById('playerContextMenu')?.remove();
  _currentChatUid  = targetUid; // hediye gönderirken de aynı hedef
  _currentChatName = targetName;

  const panel = document.getElementById('giftPanel');
  const tn = document.getElementById('giftTarget');
  if (tn) tn.textContent = targetName;

  // Render gift grid
  const GIFTS = window._GIFTS || [];
  const grid = document.getElementById('giftGrid');
  if (grid) {
    grid.innerHTML = GIFTS.map(g => {
      let costLabel = g.currency==='free'
        ? '<span class="gift-cost" style="color:var(--green)">Ücretsiz</span>'
        : g.currency==='gold'
          ? `<span class="gift-cost">${g.cost}🪙</span>`
          : `<span class="gift-cost gem">${g.cost}💎</span>`;
      return `<div class="gift-item" onclick="sendGiftToPlayer('${g.id}','${targetUid}','${targetName}')">
        <div class="gift-emoji">${g.emoji}</div>
        ${costLabel}
      </div>`;
    }).join('');
  }

  if (panel) panel.style.display = panel.style.display==='none' ? 'block' : 'none';
};

window.sendGiftToPlayer = async function(giftId, targetUid, targetName) {
  const uid = _uid(); if (!uid) return;
  const GIFTS = window._GIFTS || [];
  const gift = GIFTS.find(g => g.id === giftId);
  if (!gift) return;

  const p = _profile();
  const fb = _fb();
  const isDev = p._isDev;

  // Ücret kontrolü
  if (!isDev) {
    if (gift.currency==='gold' && (p.gold||0) < gift.cost) { _toast('❌ Yeterli altın yok!'); return; }
    if (gift.currency==='gem'  && (p.gems||0) < gift.cost) { _toast('❌ Yeterli elmas yok!'); return; }
    // Düş
    if (gift.currency==='gold') {
      await fb.updateDoc(fb.doc(_db(),'users',uid), { gold: fb.increment(-gift.cost) });
      window.userProfile = { ...p, gold: p.gold - gift.cost };
    } else if (gift.currency==='gem') {
      await fb.updateDoc(fb.doc(_db(),'users',uid), { gems: fb.increment(-gift.cost) });
      window.userProfile = { ...p, gems: (p.gems||0) - gift.cost };
    }
  }

  // Chat'e hediye mesajı yaz
  const cid = chatId(uid, targetUid);
  await fb.addDoc(fb.collection(_db(), `chats/${cid}/messages`), {
    fromUid: uid, fromName: p.name||'?', fromAvatar: p.avatar||'😎',
    text: `${gift.emoji} ${gift.name} hediye gönderdi!`,
    type: 'gift', emoji: gift.emoji, giftName: gift.name, ts: Date.now()
  });

  // Karşı tarafa bildirim yaz
  const cid2 = `gifts_${targetUid}`;
  await fb.setDoc(fb.doc(_db(), `notifications/${targetUid}/items/${Date.now()}`), {
    type: 'gift', fromName: p.name||'?', fromAvatar: p.avatar||'😎',
    emoji: gift.emoji, giftName: gift.name, ts: Date.now()
  });

  // Animasyon
  const panel = document.getElementById('giftPanel');
  if (panel) panel.style.display = 'none';
  const fly = document.createElement('div');
  fly.className = 'gift-fly';
  fly.textContent = gift.emoji;
  fly.style.cssText = 'position:fixed;left:50%;top:60%;font-size:48px;z-index:9999;pointer-events:none;animation:giftFly 1s ease-out forwards;transform:translate(-50%,-50%)';
  document.body.appendChild(fly);
  setTimeout(() => fly.remove(), 1000);

  _toast(`${gift.emoji} ${gift.name} → ${targetName}`);
  if (window.updateGemDisplays) window.updateGemDisplays();
  window.updateQuestProgress?.('gifts', 1);
};

// Gelen hediye bildirimlerini dinle
let _notifUnsub = null;
function listenNotifications() {
  const uid = _uid(); if (!uid) return;
  if (_notifUnsub) _notifUnsub();
  const fb = _fb();

  // Yeni bildirimler için dinle
  const now = Date.now();
  const q = fb.query(
    fb.collection(_db(), `notifications/${uid}/items`),
    fb.orderBy('ts','desc'),
    fb.limit(10)
  );

  _notifUnsub = fb.onSnapshot(q, snap => {
    snap.docChanges().forEach(change => {
      if (change.type === 'added') {
        const d = change.doc.data();
        if (d.ts > now - 5000) { // Son 5 saniye içindeyse göster
          showReceivedGift(d);
        }
      }
    });
  });
}

function showReceivedGift(data) {
  const el = document.createElement('div');
  el.className = 'gift-received';
  el.innerHTML = `
    <div class="gift-recv-emoji">${data.emoji}</div>
    <div class="gift-recv-text">
      <div class="gift-recv-from">${data.fromAvatar||'👤'} ${data.fromName}</div>
      <div>${data.giftName} gönderdi!</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ===== SOSYAL EKRAN SEKME YÖNETİMİ =====
window.switchSocialTab = function(tab, btn) {
  document.querySelectorAll('#socialTabs .quest-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  document.getElementById('tabFriends').style.display  = tab==='friends'  ? 'block' : 'none';
  document.getElementById('tabRequests').style.display = tab==='requests' ? 'block' : 'none';

  if (tab==='friends')  renderFriendsList();
  if (tab==='requests') loadFriendRequests();
};

// ===== BAŞLATMA =====
window.initSocialSystem = function() {
  listenFriendRequests();
  listenNotifications();

  // Firestore import'larını _fb'ye ekle (onSnapshot, addDoc, query, orderBy, limit, collection)
  // app.js'de zaten var, burada sadece erişiyoruz
};

// app.js onProfileLoaded'dan sonra çağrılır
const _origOnProfileLoaded = window.onProfileLoaded;
window.onProfileLoaded = function() {
  _origOnProfileLoaded?.();
  window.initSocialSystem();
};
