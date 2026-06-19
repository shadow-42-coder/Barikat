// ===== DESTEŞİ =====
const deckBase = [
    "🧟 Zombi","🧟 Zombi","🧟 Zombi","🧟 Zombi",
    "👹 Dev Zombi","👹 Dev Zombi",
    "🔫 Tabanca","🔫 Tabanca","🔫 Tabanca",
    "💥 Silah","💥 Silah",
    "🛡️ Barikat","🛡️ Barikat","🛡️ Barikat",
    "❤️ Tamir","❤️ Tamir",
    "⚡ Elektrikli Tel","⚡ Elektrikli Tel",
    "🏴 Yağma","🛑 Blok","✈️ Hava Saldırısı","💉 Enjeksiyon"
];
window.deckBase = deckBase;

// ===== GLOBAL DURUM =====
let gameDeck = [...deckBase,...deckBase];
let players = [];
let turnIdx = 0;
let gameMode = 'pvb';
let isAnimating = false;
let timerId = null;
let isAutoPlay = false;
let timeLeft = 30;
let isMultiplayer = false;
let currentRoomId = null;
let myPlayerId = null;

window.gameDeck = gameDeck;
window.players = players;
window.turnIdx = turnIdx;
window.gameMode = gameMode;
window.isMultiplayer = isMultiplayer;
window.currentRoomId = currentRoomId;
window.myPlayerId = myPlayerId;
window.timerId = timerId;
window.sfxEnabled = true;
window.timerDuration = 30;

// ===== KART ETKİSİ (hem local hem firestore için) =====
window.applyCardLogic = function(actor, target, card, allPlayers, gMode) {
    if (card==="🛡️ Barikat") {
        if (actor.barricade>=3) return false;
        actor.barricade++;
        playSound("kalkan");
    } else if (card==="❤️ Tamir") {
        if (actor.hp>=7) return false;
        actor.hp++;
        playSound("tamir");
    } else if (card==="🧟 Zombi") {
        actor.zombies.push({type:"🧟",hp:1,atk:1});
    } else if (card==="👹 Dev Zombi") {
        actor.zombies.push({type:"👹",hp:2,atk:2});
    } else if (card==="🔫 Tabanca"||card==="💥 Silah") {
        if (!target) return false;
        let d=card.includes("Tabanca")?1:2;
        if (target.zombies.length>0) {
            target.zombies[0].hp-=d;
            if (target.zombies[0].hp<=0) target.zombies.shift();
            playSound("kirilma");
        } else {
            applyDmg(target,d,`playerHp_${target.id}`);
        }
    } else if (card==="⚡ Elektrikli Tel") {
        if (!target) return false;
        target.zombies=target.zombies.filter(z=>{
            if (z.type==="🧟") return false;
            if (z.hp<=1) return false;
            z.hp=1; z.atk=1; return true;
        });
    } else if (card==="🏴 Yağma") {
        if (!target||target.hand.length===0) return false;
        const sI=Math.floor(Math.random()*target.hand.length);
        actor.hand.push(target.hand.splice(sI,1)[0]);
    } else if (card==="🛑 Blok") {
        if (!target) return false;
        target.blocked=true;
    } else if (card==="✈️ Hava Saldırısı") {
        allPlayers.forEach(p=>{
            if (p.id!==actor.id&&p.hp>0) applyDmg(p,1,`playerHp_${p.id}`);
        });
    } else if (card==="💉 Enjeksiyon") {
        allPlayers.forEach(p=>{
            p.zombies.forEach(z=>z.hp--);
            p.zombies=p.zombies.filter(z=>z.hp>0);
        });
    }
    return true;
};

// ===== YARDIMCI =====
window.findNextAliveOpponent = function(attackerId, currentPlayers, gMode) {
    const attacker = currentPlayers[attackerId];
    let si = (attackerId+1)%currentPlayers.length;
    let c=0;
    while (c<currentPlayers.length) {
        const p=currentPlayers[si];
        if (p.hp>0) {
            if (gMode.includes('ffa')||gMode==='pvb'||gMode==='1v1') {
                if (p.id!==attacker.id) return p.id;
            } else if (gMode==='2v2'||gMode==='2V2') {
                if (p.teamId!==attacker.teamId) return p.id;
            }
        }
        si=(si+1)%currentPlayers.length; c++;
    }
    return -1;
};

function log(text) {
    const a=document.getElementById("log");
    if (!a) return;
    a.innerHTML+=text+"<br>";
    a.scrollTop=a.scrollHeight;
}

function playSound(id) {
    if (!window.sfxEnabled) return;
    const s=document.getElementById("snd_"+id);
    if (s){s.currentTime=0;s.play().catch(()=>{});}
}

function applyDmg(target, amount, elId) {
    let left=amount;
    if (target.barricade>0){let abs=Math.min(target.barricade,left);target.barricade-=abs;left-=abs;if(abs>0)playSound("kalkan");}
    target.hp-=left;
    if (left>0) playSound("hasar");
    window.updateStats?.();

    if (left>0&&window.sfxEnabled) {
        const el=document.getElementById(elId);
        if (el){
            const panel=el.closest('.panel');
            if (panel){
                const s=document.createElement('div');s.className='splatter';
                const sz=Math.random()*40+20;
                s.style.cssText=`width:${sz}px;height:${sz}px;top:${Math.random()*(panel.clientHeight-sz)}px;left:${Math.random()*(panel.clientWidth-sz)}px;`;
                panel.appendChild(s);setTimeout(()=>s.remove(),500);
                panel.classList.add('shake');setTimeout(()=>panel.classList.remove('shake'),300);
            }
        }
    }
    if (target.hp<=0) target.hp=0;
}

// ===== ZAMANLAYICI =====
window.startTimer = function() {
    clearInterval(window.timerId);
    timeLeft=window.timerDuration||30;
    updateTimerDisplay();
    window.timerId=setInterval(()=>{
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft<=0){
            clearInterval(window.timerId);
            if (players[turnIdx]?.isBot) endTurn();
            else {
                log("⏰ Süre doldu!");
                isAutoPlay=true;
                const b=document.getElementById("autoPlayBanner");
                if(b)b.style.display="block";
                playAutoTurn();
            }
        }
    },1000);
};

function updateTimerDisplay() {
    players.forEach((_,i)=>{
        const ts=document.getElementById(`playerTimer_${i}`);
        const tb=document.getElementById(`playerTimerBar_${i}`);
        if(ts&&tb){
            if(i===turnIdx){ts.textContent=timeLeft;tb.style.width=(timeLeft/(window.timerDuration||30)*100)+"%";}
            else{ts.textContent=window.timerDuration||30;tb.style.width="100%";}
        }
    });
}

// ===== UI GÜNCELLE =====
window.updateStats = function() {
    players.forEach((p,i)=>{
        const hp=document.getElementById(`playerHp_${i}`);
        const bar=document.getElementById(`playerBarricade_${i}`);
        const hc=document.getElementById(`playerHandCount_${i}`);
        const panel=document.getElementById(`panel_${i}`);
        if(hp) hp.textContent=p.hp;
        if(bar) bar.textContent=p.barricade;
        if(hc) hc.textContent=p.hand.length;
        if(panel){
            panel.classList.toggle('active-turn',i===turnIdx);
            panel.classList.toggle('dead',p.hp<=0);
        }
    });
    updateFieldDisplay();
};

function updateFieldDisplay() {
    const zStyle="background:rgba(68,34,34,0.8);border:1px solid #ff4444;border-radius:6px;padding:4px;font-size:11px;display:inline-block;text-align:center;min-width:48px;";
    players.forEach((p,i)=>{
        const f=document.getElementById(`playerField_${i}`);
        if(f) f.innerHTML=p.zombies.map(z=>{
            const img=z.type==="🧟"?"img/zombi.png":"img/dev_zombi.png";
            return `<div style='${zStyle}'><img src="${img}" style="width:24px;height:24px;display:block;margin:0 auto;">❤️${z.hp}⚔️${z.atk}</div>`;
        }).join("");
    });
}

// ===== EL KARTI RENDER =====
window.renderHand = function() {
    const hand=document.getElementById("hand");
    if (!hand) return;
    hand.innerHTML="";

    // Sıra bilgisi güncelle
    const actor=players[turnIdx];
    if (!actor) return;
    const anEl=document.getElementById("activePlayerName");
    if(anEl) anEl.textContent=actor.name;
    const ci=document.getElementById("cardsPlayedInfo");
    if(ci) ci.textContent=`${actor.cardsPlayed||0}/${actor.maxPlays||2} oynandı`;

    // Multiplayer: sadece sıram gelince kendi kartlarımı göster
    if (isMultiplayer) {
        if (turnIdx!==myPlayerId) {
            hand.innerHTML='<div style="color:var(--text2);font-size:14px;text-align:center;width:100%;padding:12px">⏳ Rakibin oynuyor...</div>';
            return;
        }
        const me=players[myPlayerId];
        if (!me||me.hp<=0||me.isBot) return;
        renderCards(me);
        return;
    }

    // Bot'un sırası — el gösterme ama mesaj yaz
    if (actor.isBot) {
        hand.innerHTML='<div style="color:var(--text2);font-size:14px;text-align:center;width:100%;padding:12px">🤖 Bot oynuyor...</div>';
        return;
    }

    // Autoplay modunda — banner var ama el de görünür (kullanıcı çıkabilir)
    if (isAutoPlay) {
        hand.innerHTML='<div style="color:var(--text2);font-size:13px;text-align:center;width:100%;padding:8px">🤖 Otomatik mod aktif — yukarıdaki kırmızı butona tıkla</div>';
        return;
    }

    renderCards(actor);
};

function renderCards(player) {
    const hand=document.getElementById("hand");
    player.hand.forEach((card,index)=>{
        const div = buildCardElement(card, index, player);

        div.onclick=async()=>{
            if(isAnimating) return;
            if(player.cardsPlayed>=player.maxPlays){window.showToast?.("Bu turda daha fazla kart oynayamazsın!");return;}
            if(isMultiplayer&&turnIdx!==myPlayerId) return;

            isAnimating=true;
            div.classList.add("card-playing");

            setTimeout(async()=>{
                let targetId=-1;
                if(["🛡️ Barikat","❤️ Tamir","🧟 Zombi","👹 Dev Zombi"].includes(card)) targetId=turnIdx;
                else if(card==="✈️ Hava Saldırısı"||card==="💉 Enjeksiyon") targetId=-1;
                else targetId=window.findNextAliveOpponent(turnIdx,players,gameMode);

                if(isMultiplayer) {
                    await window.playCardMultiplayer(turnIdx,targetId,index);
                } else {
                    const ok=executeCardAction(turnIdx,targetId,index);
                    if(ok){
                        player.cardsPlayed++;
                        window.renderHand();
                        window.updateStats();
                        if(player.cardsPlayed>=player.maxPlays) endTurn();
                    }
                }
                isAnimating=false;
            },400);
        };
        hand.appendChild(div);
    });
}

const CARD_META = {
  "🧟 Zombi":       { emoji:"🧟", shortName:"Zombi",      type:"summon",  pip:"⚔️" },
  "👹 Dev Zombi":   { emoji:"👹", shortName:"Dev Zombi",  type:"summon",  pip:"⚔️" },
  "🔫 Tabanca":     { emoji:"🔫", shortName:"Tabanca",    type:"attack",  pip:"💥" },
  "💥 Silah":       { emoji:"💥", shortName:"Silah",      type:"attack",  pip:"💥" },
  "🛡️ Barikat":    { emoji:"🛡️", shortName:"Barikat",    type:"defense", pip:"🛡️" },
  "❤️ Tamir":       { emoji:"❤️", shortName:"Tamir",      type:"defense", pip:"❤️" },
  "⚡ Elektrikli Tel":{ emoji:"⚡", shortName:"Elektrik",  type:"special", pip:"⚡" },
  "🏴 Yağma":       { emoji:"🏴", shortName:"Yağma",      type:"special", pip:"🏴" },
  "🛑 Blok":        { emoji:"🛑", shortName:"Blok",       type:"special", pip:"🛑" },
  "✈️ Hava Saldırısı":{ emoji:"✈️", shortName:"Hava",    type:"attack",  pip:"💣" },
  "💉 Enjeksiyon":  { emoji:"💉", shortName:"Enjeksiyon", type:"special", pip:"💉" },
};

function buildCardElement(card, index) {
  const meta = CARD_META[card] || { emoji:card.split(' ')[0], shortName:card, type:'special', pip:'?' };
  const img = getCardImage(card);
  const bgColors = {
    attack:  ['#2a0808','#150202'],
    defense: ['#0a1a2a','#020810'],
    summon:  ['#0a2a0a','#020e02'],
    special: ['#18082a','#0a0212'],
  };
  const borderColors = {
    attack: '#ff4444', defense: '#4488ff', summon: '#44ff44', special: '#aa44ff'
  };
  const [bgA, bgB] = bgColors[meta.type] || bgColors.special;
  const borderC = borderColors[meta.type] || '#aa44ff';
  const uid = `c${Date.now()}_${index}`;

  const div = document.createElement("div");
  div.className = `card card-${meta.type}`;
  div.classList.add('card-deal');
  div.style.animationDelay = (index * 0.07) + 's';
  // Animasyon bitince class'ı kaldır — bir daha oynamasın
  div.addEventListener('animationend', () => {
    div.classList.remove('card-deal');
    div.style.animationDelay = '';
  }, { once: true });

  div.innerHTML = `
    <svg class="card-svg-bg" viewBox="0 0 85 118" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="rg${uid}" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="${bgA}"/>
          <stop offset="100%" stop-color="${bgB}"/>
        </radialGradient>
      </defs>
      <rect width="85" height="118" rx="10" fill="url(#rg${uid})"/>
      <rect x="3" y="3" width="79" height="112" rx="8" fill="none" stroke="${borderC}" stroke-width="0.4" opacity="0.4"/>
      <path d="M8 8 Q42 3 77 10 L77 25 Q42 15 8 22 Z" fill="rgba(255,255,255,0.04)"/>
      <text x="6" y="16" font-size="9" fill="${borderC}" opacity="0.7">${meta.pip}</text>
      <text x="79" y="114" font-size="9" fill="${borderC}" opacity="0.7" text-anchor="end" transform="rotate(180 42 107)">${meta.pip}</text>
    </svg>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:4px;z-index:2">
      ${img
        ? `<img src="img/${img}" alt="${card}" title="${card}" style="width:72%;height:62%;object-fit:contain;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.8))">`
        : `<span style="font-size:26px">${meta.emoji}</span>`
      }
      <div style="font-size:8px;font-weight:700;text-align:center;color:${borderC};text-transform:uppercase;letter-spacing:0.4px;line-height:1.1;max-width:78px;text-shadow:0 1px 3px rgba(0,0,0,0.9)">${meta.shortName}</div>
    </div>`;

  return div;
}

function getCardImage(card) {
  const m={"🧟 Zombi":"zombi.png","👹 Dev Zombi":"dev_zombi.png","🔫 Tabanca":"tabanca.png",
    "💥 Silah":"silah.png","🛡️ Barikat":"barikat.png","❤️ Tamir":"tamir.png",
    "⚡ Elektrikli Tel":"elektrik.png","🏴 Yağma":"yagma.png","🛑 Blok":"blok.png",
    "✈️ Hava Saldırısı":"hava_saldirisi.png","💉 Enjeksiyon":"enjeksiyon.png"};
  return m[card]||"";
}
window.showGoldFloat = function(amount, positive=true) {
    const el = document.createElement('div');
    el.className = 'gold-float';
    el.textContent = (positive?'+':'-') + amount + ' 🪙';
    el.style.left = (40 + Math.random()*20) + '%';
    el.style.top = '60%';
    el.style.color = positive ? 'var(--gold)' : 'var(--red)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
};

// XP float efekti
window.showXPFloat = function(amount) {
    const el = document.createElement('div');
    el.className = 'xp-float';
    el.textContent = '+' + amount + ' XP';
    el.style.left = (45 + Math.random()*15) + '%';
    el.style.top = '55%';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
};

// Konfeti efekti (kazanınca)
window.showConfetti = function() {
    const colors = ['#f5c94d','#f1a21a','#2ecc71','#3498db','#e74c3c','#9b59b6'];
    for (let i=0; i<40; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'win-confetti';
            el.style.left = Math.random()*100+'%';
            el.style.top = '-10px';
            el.style.background = colors[Math.floor(Math.random()*colors.length)];
            el.style.animationDuration = (1.5+Math.random()*2)+'s';
            el.style.animationDelay = (Math.random()*0.5)+'s';
            el.style.width = el.style.height = (6+Math.random()*8)+'px';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 3500);
        }, i * 40);
    }
};

function getCardImage(card) {
    const m={"🧟 Zombi":"zombi.png","👹 Dev Zombi":"dev_zombi.png","🔫 Tabanca":"tabanca.png",
        "💥 Silah":"silah.png","🛡️ Barikat":"barikat.png","❤️ Tamir":"tamir.png",
        "⚡ Elektrikli Tel":"elektrik.png","🏴 Yağma":"yagma.png","🛑 Blok":"blok.png",
        "✈️ Hava Saldırısı":"hava_saldirisi.png","💉 Enjeksiyon":"enjeksiyon.png"};
    return m[card]||"";
}

// ===== OYUN LAYOUT =====
window.renderGameLayout = function() {
    const container=document.getElementById("playerPanelsContainer");
    const table=document.getElementById("mainTable");
    if(!container||!table) return;
    container.innerHTML='';
    container.appendChild(table);
    container.classList.remove('layout-2-players','layout-3-players','layout-4-players');
    if(players.length===2) container.classList.add('layout-2-players');
    else if(players.length===3) container.classList.add('layout-3-players');
    else if(players.length===4) container.classList.add('layout-4-players');

    // Benim pozisyonum her zaman alt (bottom)
    // Diğerleri benim etrafımda döndürülür
    const myIdx = (isMultiplayer && myPlayerId !== null) ? myPlayerId : 0;
    const n = players.length;

    // Pozisyon şemaları: [benim_pozisyon, saat_yonunde_diger_pozisyonlar]
    // myIdx her zaman 'pos-bottom' alır, diğerleri rotate
    const POS_2 = ['pos-bottom','pos-top'];
    const POS_3 = ['pos-bottom','pos-3-left','pos-3-right'];
    const POS_4 = ['pos-bottom','pos-right','pos-top','pos-left'];
    const posMap = n===2?POS_2 : n===3?POS_3 : POS_4;

    players.forEach((p,i)=>{
        const div=document.createElement('div');
        div.className='panel';
        div.id=`panel_${p.id}`;

        // Benden göreceli offset hesapla
        const offset = (i - myIdx + n) % n;
        const pos = posMap[offset] || 'pos-top';
        div.classList.add(pos);

        const isMe = p.id === myIdx;
        const vipBadge = window.getVipBadge ? window.getVipBadge(p.vipLevel||0) : '';
        div.innerHTML=`
            <div class="panel-header">
              <div class="panel-avatar">${p.avatar||'👤'}</div>
              <div>
                <div class="panel-name">${p.name} ${isMe?'<span style="color:var(--gold);font-size:9px">(SEN)</span>':''} ${vipBadge}</div>
              </div>
            </div>
            <div class="stats">
                <div class="stat">❤️<span id="playerHp_${p.id}">${p.hp}</span></div>
                <div class="stat">🛡️<span id="playerBarricade_${p.id}">${p.barricade}</span></div>
                <div class="stat">🎴<span id="playerHandCount_${p.id}">${p.hand.length}</span></div>
                <div class="stat">⏳<span id="playerTimer_${p.id}">30</span>
                    <div class="timer-wrap"><div id="playerTimerBar_${p.id}" class="timer-bar"></div></div>
                </div>
            </div>
            <div id="playerField_${p.id}" class="field"></div>
        `;
        container.appendChild(div);
    });
};

// ===== KAZANAN KONTROL =====
window.checkWinner = function() {
    const alive=players.filter(p=>p.hp>0);
    const overlay=document.getElementById("winOverlay");
    const msg=document.getElementById("winMessage");
    const emoji=document.getElementById("winEmoji");
    const rewards=document.getElementById("winRewards");
    if(!overlay||!msg) return;

    let winner=null, loser=null;

    if(gameMode.includes('ffa')||gameMode==='1v1') {
        if(alive.length<=1){
            winner=alive[0]||null;
        }
    } else {
        const aliveTeams=new Set(alive.map(p=>p.teamId));
        if(aliveTeams.size<=1){
            winner=alive[0]||null;
        }
    }
    if(alive.length===0) winner=null;

    if(winner!==undefined&&(alive.length<=1||(gameMode!=='ffa'&&gameMode!=='1v1'&&new Set(alive.map(p=>p.teamId)).size<=1))){
        clearInterval(window.timerId);
        overlay.style.display='flex';
        playSound("win");

        const iWon=winner&&(winner.id===0||(isMultiplayer&&winner.id===myPlayerId));
        if(iWon){
            emoji.textContent='🏆';msg.textContent='KAZANDIN!';msg.style.color='var(--gold)';
            window.showConfetti?.();
        } else if(!winner){
            emoji.textContent='🤝';msg.textContent='BERABERE!';msg.style.color='#f39c12';
        } else {
            emoji.textContent='💀';msg.textContent='MAĞLUBİYET';msg.style.color='var(--red)';
        }

        // Ödüller
        const xpGain=iWon?80:20;
        const goldGain=iWon?(gameMode==='2V2'?1800:gameMode.includes('ffa')?900:180):0;
        if(rewards) rewards.innerHTML=`+${xpGain} XP &nbsp;·&nbsp; +${goldGain} 🪙`;

        // Float efektleri
        setTimeout(()=>window.showXPFloat?.(xpGain), 600);
        if(goldGain>0) setTimeout(()=>window.showGoldFloat?.(goldGain), 900);

        // İstatistik güncelle
        if(window.awardMatchResult){
            const opponent=players.find(p=>p.id!==0)?.name||'Bot';
            window.awardMatchResult(iWon, gameMode, opponent);
        }
    }
};

// ===== TUR YÖNETİMİ =====
function drawCard(target) {
    if(target.hand.length<7){
        if(gameDeck.length===0) gameDeck=[...deckBase,...deckBase];
        const idx=Math.floor(Math.random()*gameDeck.length);
        target.hand.push(gameDeck.splice(idx,1)[0]);
    }
}

function endTurn() {
    if(isMultiplayer){window.endTurnMultiplayer?.();return;}
    const actor=players[turnIdx];
    clearInterval(window.timerId);
    log(`${actor.name} turunu bitirdi.`);
    actor.cardsPlayed=0;actor.maxPlays=actor.blocked?1:2;actor.blocked=false;
    for(let i=0;i<2;i++) drawCard(actor);

    const tgtId=window.findNextAliveOpponent(actor.id,players,gameMode);
    if(tgtId!==-1){
        const tgt=players[tgtId];
        actor.zombies.forEach(z=>{if(actor.hp>0&&tgt.hp>0)applyDmg(tgt,z.atk,`playerHp_${tgt.id}`);});
    }

    playSound("draw");
    window.renderHand();
    window.updateStats();
    window.checkWinner();

    turnIdx=(turnIdx+1)%players.length;
    let g=0;
    while(players[turnIdx].hp<=0&&g++<players.length) turnIdx=(turnIdx+1)%players.length;
    startTurn();
}

function startTurn() {
    if(isMultiplayer) return;
    const actor=players[turnIdx];
    log(`--- ${actor.name}'in TURU ---`);
    window.startTimer();
    if(actor.isBot) setTimeout(botTurn,1000);
    else{if(isAutoPlay)setTimeout(playAutoTurn,1000);window.renderHand();}
    window.updateStats();
}

function executeCardAction(actorIdx,targetIdx,idx) {
    const actor=players[actorIdx];
    const card=actor.hand[idx];
    const target=targetIdx>=0?players[targetIdx]:null;
    const ok=window.applyCardLogic(actor,target,card,players,gameMode);
    if(!ok) return false;
    actor.hand.splice(idx,1);
    log(`${actor.name} oynadı: ${card}`);
    // Masanın ortasında göster
    const meta = CARD_META[card];
    window.showCenterCard?.(meta?.emoji || card.split(' ')[0]);
    return true;
}

// ===== BOT AI =====
function botTurn() {
    const actor=players[turnIdx];
    log(`--- ${actor.name}'in TURU ---`);
    let plays=actor.blocked?1:2;actor.blocked=false;

    function step(){
        if(actor.cardsPlayed<plays&&actor.hand.length>0&&actor.hp>0){
            let ci=-1,ti=-1;
            ci=actor.hand.findIndex(c=>actor.hp<4&&c==="❤️ Tamir");if(ci!==-1)ti=actor.id;
            if(ci===-1){ti=window.findNextAliveOpponent(actor.id,players,gameMode);if(ti!==-1){const tp=players[ti];ci=actor.hand.findIndex(c=>tp.zombies.length>0&&(c.includes("Silah")||c.includes("Tabanca")||c.includes("Tel")));if(ci===-1)ci=actor.hand.findIndex(c=>["🔫 Tabanca","💥 Silah"].includes(c));}}
            if(ci===-1&&actor.barricade<3){ci=actor.hand.findIndex(c=>c==="🛡️ Barikat");if(ci!==-1)ti=actor.id;}
            if(ci===-1){ci=actor.hand.findIndex(c=>["🧟 Zombi","👹 Dev Zombi"].includes(c));if(ci!==-1)ti=actor.id;}
            if(ci===-1){ci=actor.hand.findIndex(c=>["✈️ Hava Saldırısı","💉 Enjeksiyon"].includes(c));if(ci!==-1)ti=-1;}
            if(ci===-1&&actor.hand.length>0){ci=Math.floor(Math.random()*actor.hand.length);const rc=actor.hand[ci];ti=["🛡️ Barikat","❤️ Tamir","🧟 Zombi","👹 Dev Zombi"].includes(rc)?actor.id:window.findNextAliveOpponent(actor.id,players,gameMode);}
            if(ci!==-1){if(executeCardAction(actor.id,ti,ci))actor.cardsPlayed++;}
            window.updateStats();
            setTimeout(step,800);
        } else setTimeout(endTurn,400);
    }
    setTimeout(step,800);
}

// Otomatik oynama
function playAutoTurn() {
    if(!isAutoPlay||players[turnIdx]?.isBot) return;
    const actor=players[turnIdx];let plays=actor.blocked?1:2;
    function autoStep(){
        if(actor.cardsPlayed<plays&&actor.hand.length>0&&isAutoPlay){
            let ci=-1,ti=-1;
            ci=actor.hand.findIndex(c=>actor.hp<4&&c==="❤️ Tamir");if(ci!==-1)ti=actor.id;
            if(ci===-1){ti=window.findNextAliveOpponent(actor.id,players,gameMode);if(ti!==-1){ci=actor.hand.findIndex(c=>["🔫 Tabanca","💥 Silah"].includes(c));}}
            if(ci===-1&&actor.hand.length>0){ci=0;ti=["🛡️ Barikat","❤️ Tamir","🧟 Zombi","👹 Dev Zombi"].includes(actor.hand[0])?actor.id:window.findNextAliveOpponent(actor.id,players,gameMode);}
            if(ci!==-1){if(executeCardAction(actor.id,ti,ci))actor.cardsPlayed++;}
            window.renderHand();window.updateStats();setTimeout(autoStep,900);
        } else if(isAutoPlay) setTimeout(endTurn,400);
    }
    autoStep();
}

window.exitAutoPlay = function() {
    isAutoPlay=false;
    const b=document.getElementById("autoPlayBanner");
    if(b) b.style.display="none";
    log("Kontrolü geri aldın!");
    // El kartlarını hemen yeniden render et
    window.renderHand();
    // Timer'ı sıfırla
    if(players[turnIdx]&&!players[turnIdx].isBot) window.startTimer();
};

// ===== OYUN BAŞLAT (Bot modu) =====
window.initGame = function(mode) {
    gameMode=mode;players=[];turnIdx=0;isAutoPlay=false;isMultiplayer=false;
    gameDeck=[...deckBase,...deckBase];
    window.gameMode=gameMode;window.players=players;window.turnIdx=turnIdx;
    window.isMultiplayer=false;

    const overlay=document.getElementById('winOverlay');
    if(overlay) overlay.style.display='none';

    if(mode==='pvb'){
        players.push(makeLocal(0,window.userProfile?.name||"Oyuncu",window.userProfile?.avatar||"😎",false));
        players.push(makeLocal(1,botN(),botAv(),true));
    }

    window.renderGameLayout();
    players.forEach(p=>{for(let i=0;i<5;i++) drawCard(p);});
    setTimeout(()=>playSound("draw"),400);
    window.renderHand();
    window.updateStats();
    const ml=document.getElementById('gameModeLabel');if(ml)ml.textContent='vs Bot';
    startTurn();
};

function makeLocal(id,name,avatar,isBot){
    return{id,name,avatar:avatar||'',hp:7,barricade:0,hand:[],zombies:[],cardsPlayed:0,maxPlays:2,blocked:false,teamId:id,isBot};
}

function botN(){const n=["Kara Kurt","Demir Yumruk","Gece Gölge","Ateş Toprak","Kızıl Kaplan","Sessiz Fırtına","Çelik Pençe"];return n[Math.floor(Math.random()*n.length)];}
function botAv(){const a=["🤺","👿","💀","🔥","⚡","🌑","🗡️"];return a[Math.floor(Math.random()*a.length)];}

window.toggleLogPanel = function() {
  const panel = document.getElementById('logPanel');
  if (panel) panel.classList.toggle('open');
};

// Masanın ortasında oynanan kartı göster
window.showCenterCard = function(cardEmoji, duration=1200) {
  const area = document.getElementById('centerPlayArea');
  if (!area) return;
  const el = document.createElement('div');
  el.className = 'center-played-card';
  el.textContent = cardEmoji;
  area.appendChild(el);
  setTimeout(() => { el.style.transition='opacity 0.3s'; el.style.opacity='0'; setTimeout(()=>el.remove(), 300); }, duration);
};

// executeCardAction'dan sonra merkeze kart göster
const origExecute = window.executeCardAction;

const handler={set(t,k,v){t[k]=v;if(k==='players')players=v;if(k==='turnIdx')turnIdx=v;if(k==='gameMode')gameMode=v;if(k==='isMultiplayer')isMultiplayer=v;if(k==='myPlayerId')myPlayerId=v;if(k==='currentRoomId')currentRoomId=v;return true;}};
// Basit sync - window değişkenlerini takip et
Object.defineProperty(window,'players',{get:()=>players,set:(v)=>{players=v;},configurable:true});
Object.defineProperty(window,'turnIdx',{get:()=>turnIdx,set:(v)=>{turnIdx=v;},configurable:true});
Object.defineProperty(window,'gameMode',{get:()=>gameMode,set:(v)=>{gameMode=v;},configurable:true});
Object.defineProperty(window,'isMultiplayer',{get:()=>isMultiplayer,set:(v)=>{isMultiplayer=v;},configurable:true});
Object.defineProperty(window,'myPlayerId',{get:()=>myPlayerId,set:(v)=>{myPlayerId=v;},configurable:true});
Object.defineProperty(window,'currentRoomId',{get:()=>currentRoomId,set:(v)=>{currentRoomId=v;},configurable:true});
Object.defineProperty(window,'timerId',{get:()=>timerId,set:(v)=>{timerId=v;},configurable:true});
Object.defineProperty(window,'gameDeck',{get:()=>gameDeck,set:(v)=>{gameDeck=v;},configurable:true});
