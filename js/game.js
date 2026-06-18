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

    // Multiplayer: sadece sıram gelince ve ben oyuncuysam
    if (isMultiplayer) {
        if (turnIdx!==myPlayerId) return;
        const me=players[myPlayerId];
        if (!me||me.hp<=0||me.isBot) return;
        renderCards(me);
        return;
    }
    const human=actor.isBot?null:actor;
    if (!human||isAutoPlay) return;
    renderCards(human);
};

function renderCards(player) {
    const hand=document.getElementById("hand");
    player.hand.forEach((card,index)=>{
        const div=document.createElement("div");
        div.className="card";
        if(card.includes("Zombi")) div.classList.add("card-summon");
        else if(card.includes("Tabanca")||card.includes("Silah")||card.includes("Saldırı")) div.classList.add("card-attack");
        else if(card.includes("Barikat")) div.classList.add("card-defense");
        else div.classList.add("card-special");

        const img=getCardImage(card);
        div.innerHTML=img
            ?`<img src="img/${img}" alt="${card}" title="${card}">`
            :`<span style="font-size:28px">${card.split(' ')[0]}</span>`;

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

    players.forEach((p,i)=>{
        const div=document.createElement('div');
        div.className='panel';
        div.id=`panel_${i}`;
        let pos='';
        if(players.length===2) pos=i===0?'pos-bottom':'pos-top';
        else if(players.length===3){if(i===0)pos='pos-bottom';else if(i===1)pos='pos-3-left';else pos='pos-3-right';}
        else if(players.length===4){if(i===0)pos='pos-bottom';else if(i===1)pos='pos-right';else if(i===2)pos='pos-top';else pos='pos-left';}
        div.classList.add(pos);

        const isMe=isMultiplayer&&p.id===myPlayerId;
        div.innerHTML=`
            <h2>${p.avatar||''} ${p.name} ${isMe?'<span style="color:var(--gold)">(Sen)</span>':''}</h2>
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
        } else if(!winner){
            emoji.textContent='🤝';msg.textContent='BERABERE!';msg.style.color='#f39c12';
        } else {
            emoji.textContent='💀';msg.textContent='MAĞLUBİYET';msg.style.color='var(--red)';
        }

        // Ödüller
        const xpGain=iWon?80:20;
        const goldGain=iWon?(gameMode==='2V2'?1800:gameMode.includes('ffa')?900:180):0;
        if(rewards) rewards.innerHTML=`+${xpGain} XP &nbsp;·&nbsp; +${goldGain} 🪙`;

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
    const b=document.getElementById("autoPlayBanner");if(b)b.style.display="none";
    log("Kontrolü geri aldın!");
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

// Proxy: multiplayer'dan players/turnIdx güncellenince sync et
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
