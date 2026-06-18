const deckBase = [
    "🧟 Zombi", "🧟 Zombi", "🧟 Zombi", "🧟 Zombi",
    "👹 Dev Zombi", "👹 Dev Zombi",
    "🔫 Tabanca", "🔫 Tabanca", "🔫 Tabanca",
    "💥 Silah", "💥 Silah",
    "🛡️ Barikat", "🛡️ Barikat", "🛡️ Barikat",
    "❤️ Tamir", "❤️ Tamir",
    "⚡ Elektrikli Tel", "⚡ Elektrikli Tel",
    "🏴 Yağma", "🛑 Blok", "✈️ Hava Saldırısı", "💉 Enjeksiyon"
];

let gameDeck = [...deckBase, ...deckBase];
let players = [];
let turnIdx = 0;
let gameMode = 'pvb';
let isAnimating = false;
let timerId = null;
let isAutoPlay = false;
let timeLeft = 30;
let currentRoomId = null;
let myPlayerId = null;
let isMultiplayer = false;

let currentUserProfile = {
    name: 'Oyuncu',
    loginType: 'Misafir',
    level: 1,
    rank: 'Başlangıç',
    wins: 0,
    games: 0,
    xp: 0,
    favorite: 'Savunma',
    bio: 'Yeni oyuncu.',
    recent: 'Henüz oynanmış maç yok.'
};

function loadProfile() {
    const raw = localStorage.getItem('barikat_profile');
    if (!raw) return;
    try { currentUserProfile = { ...currentUserProfile, ...JSON.parse(raw) }; }
    catch(e) {}
}

function saveProfile() {
    localStorage.setItem('barikat_profile', JSON.stringify(currentUserProfile));
}

function updateProfileUI() {
    const p = currentUserProfile;
    const el = id => document.getElementById(id);
    if (el('profileAvatar')) el('profileAvatar').textContent = (p.name||'U').charAt(0).toUpperCase();
    if (el('profileName')) el('profileName').textContent = p.name||'Oyuncu';
    if (el('profileLoginType')) el('profileLoginType').textContent = p.loginType||'Misafir';
    if (el('profileLevel')) el('profileLevel').textContent = `Seviye ${p.level||1}`;
    if (el('profileRank')) el('profileRank').textContent = p.rank||'Başlangıç';
    if (el('profileWins')) el('profileWins').textContent = p.wins||0;
    if (el('profileGames')) el('profileGames').textContent = p.games||0;
    if (el('profileXp')) el('profileXp').textContent = `${p.xp||0} XP`;
    if (el('profileFavorite')) el('profileFavorite').textContent = p.favorite||'Savunma';
    if (el('profileBio')) el('profileBio').textContent = p.bio||'';
    if (el('profileRecent')) el('profileRecent').textContent = p.recent||'Henüz oynanmış maç yok.';
    if (el('welcomeText')) el('welcomeText').textContent = `Hoş Geldin ${p.name||'Oyuncu'}`;
}

function showMainMenu() {
    ['loginScreen','profileScreen','gameContainer','settingsScreen','waitingRoom']
        .forEach(id => { const e=document.getElementById(id); if(e) e.style.display='none'; });
    document.getElementById('mainMenu').style.display='flex';
}

function openProfile() {
    updateProfileUI();
    ['loginScreen','mainMenu'].forEach(id=>{ const e=document.getElementById(id); if(e) e.style.display='none'; });
    document.getElementById('profileScreen').style.display='flex';
}

function openSettings() {
    ['loginScreen','mainMenu','profileScreen'].forEach(id=>{ const e=document.getElementById(id); if(e) e.style.display='none'; });
    document.getElementById('settingsScreen').style.display='flex';
}

function closeSettings() {
    document.getElementById('settingsScreen').style.display='none';
    document.getElementById('mainMenu').style.display='flex';
}

// FIX: Oyundan ana menüye çıkış
function exitGame() {
    if (!confirm("Ana menüye dönmek istiyor musun? Oyun sonlanacak.")) return;
    clearInterval(timerId);
    // Multiplayer dinleyiciyi durdur
    if (window._gameUnsubscribe) { window._gameUnsubscribe(); window._gameUnsubscribe = null; }
    isMultiplayer = false;
    currentRoomId = null;
    myPlayerId = null;
    players = [];
    document.getElementById('gameContainer').style.display='none';
    document.getElementById('winOverlay').style.display='none';
    document.getElementById('mainMenu').style.display='flex';
}

// Kazanma ekranından ana menüye dön
function goToMainMenuFromWin() {
    clearInterval(timerId);
    if (window._gameUnsubscribe) { window._gameUnsubscribe(); window._gameUnsubscribe = null; }
    isMultiplayer = false;
    currentRoomId = null;
    myPlayerId = null;
    players = [];
    document.getElementById('winOverlay').style.display='none';
    document.getElementById('gameContainer').style.display='none';
    document.getElementById('mainMenu').style.display='flex';
}

function getCardImage(cardName) {
    const mapping = {
        "🧟 Zombi":"zombi.png","👹 Dev Zombi":"dev_zombi.png",
        "🔫 Tabanca":"tabanca.png","💥 Silah":"silah.png",
        "🛡️ Barikat":"barikat.png","❤️ Tamir":"tamir.png",
        "⚡ Elektrikli Tel":"elektrik.png","🏴 Yağma":"yagma.png",
        "🛑 Blok":"blok.png","✈️ Hava Saldırısı":"hava_saldirisi.png",
        "💉 Enjeksiyon":"enjeksiyon.png"
    };
    return mapping[cardName]||"";
}

function findNextAliveOpponent(attackerId, currentPlayers, gMode) {
    const attacker = currentPlayers[attackerId];
    let startIndex = (attackerId+1)%currentPlayers.length;
    let count = 0;
    while (count < currentPlayers.length) {
        const p = currentPlayers[startIndex];
        if (p.hp > 0) {
            if (gMode.includes('ffa')||gMode==='pvb'||gMode==='1v1') {
                if (p.id !== attacker.id) return p.id;
            } else if (gMode==='2v2'||gMode==='2V2') {
                if (p.teamId !== attacker.teamId) return p.id;
            }
        }
        startIndex = (startIndex+1)%currentPlayers.length;
        count++;
    }
    return -1;
}

function log(text) {
    const area = document.getElementById("log");
    if (!area) return;
    area.innerHTML += text + "<br>";
    area.scrollTop = area.scrollHeight;
}

// FIX: Müzik toggle - başlangıçta kapalı, doğru şekilde açılıp kapanıyor
function toggleAmbient() {
    const ambient = document.getElementById("snd_ambient");
    const btn = document.getElementById("musicBtn");
    if (!ambient) return;
    // src yoksa çalamaz - bildir
    if (!ambient.src || ambient.src === window.location.href) {
        if (btn) btn.innerText = "🎵 Müzik Dosyası Yok";
        return;
    }
    if (ambient.paused) {
        ambient.play().then(()=>{
            if (btn) btn.innerText = "🔊 MÜZİĞİ KAPAT";
        }).catch(()=>{
            if (btn) btn.innerText = "❌ Müzik Çalınamadı";
        });
    } else {
        ambient.pause();
        ambient.currentTime = 0;
        if (btn) btn.innerText = "🔇 MÜZİĞİ AÇ";
    }
}

function exitAutoPlay() {
    isAutoPlay = false;
    const banner = document.getElementById("autoPlayBanner");
    if (banner) banner.style.display="none";
    log("Kontrolü geri aldın!");
    if (players[turnIdx] && !players[turnIdx].isBot) startTimer();
}

function startTimer() {
    clearInterval(timerId);
    timeLeft = window.timerDuration || 30;
    updateTimerDisplay();
    timerId = setInterval(()=>{
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft<=0) {
            clearInterval(timerId);
            if (players[turnIdx]&&players[turnIdx].isBot) {
                endTurn();
            } else {
                log("⏰ Süre doldu, otomatik mod devrede!");
                isAutoPlay = true;
                const banner = document.getElementById("autoPlayBanner");
                if (banner) banner.style.display="block";
                playAutoTurn();
            }
        }
    },1000);
}

function updateTimerDisplay() {
    players.forEach((p,index)=>{
        const ts = document.getElementById(`playerTimer_${index}`);
        const tb = document.getElementById(`playerTimerBar_${index}`);
        if (ts&&tb) {
            if (index===turnIdx) {
                ts.textContent = timeLeft;
                tb.style.width = (timeLeft/(window.timerDuration||30))*100+"%";
            } else {
                ts.textContent = window.timerDuration||30;
                tb.style.width = "100%";
            }
        }
    });
}

function playSound(id) {
    if (!window.sfxEnabled && id!=="win") return;
    const s = document.getElementById("snd_"+id);
    if (s) { s.currentTime=0; s.play().catch(()=>{}); }
}

function applyDamage(target, amount, targetElId) {
    let left = amount;
    if (target.barricade>0) {
        let absorb=Math.min(target.barricade,left);
        target.barricade-=absorb; left-=absorb;
        if (absorb>0) playSound("kalkan");
    }
    target.hp -= left;
    if (left>0) playSound("hasar");
    updateStats();

    if (left>0) {
        const el = document.getElementById(targetElId);
        if (el) {
            const panel = el.closest('.panel');
            if (panel) {
                const s=document.createElement('div');
                s.className='splatter';
                const size=Math.random()*50+30;
                s.style.cssText=`width:${size}px;height:${size}px;top:${Math.random()*(panel.clientHeight-size)}px;left:${Math.random()*(panel.clientWidth-size)}px;`;
                panel.appendChild(s);
                setTimeout(()=>s.remove(),500);
                panel.classList.add('shake');
                setTimeout(()=>panel.classList.remove('shake'),300);
            }
        }
    }
    if (target.hp<=0) { target.hp=0; checkWinner(); }
}

function checkWinner() {
    const alive = players.filter(p=>p.hp>0);
    if (isMultiplayer) return; // Multiplayer'da Firestore'dan gelir

    const overlay = document.getElementById("winOverlay");
    const msg = document.getElementById("winMessage");
    if (!overlay||!msg) return;

    if (gameMode.includes('ffa')||gameMode==='1v1') {
        if (alive.length<=1) {
            clearInterval(timerId);
            overlay.style.display="flex";
            msg.innerText = alive.length===1 ? `🏆 ${alive[0].name} KAZANDI!` : "🤝 BERABERE!";
            msg.style.color = alive.length===1 ? "#27ae60" : "#f39c12";
            playSound("win");
        }
    } else if (gameMode==='pvb'||gameMode==='2v2') {
        const aliveTeams = new Set(alive.map(p=>p.teamId));
        if (aliveTeams.size<=1) {
            clearInterval(timerId);
            overlay.style.display="flex";
            if (alive.length===0 || players[0].hp<=0) {
                msg.innerText="💀 KAYBETTİN!"; msg.style.color="#c0392b";
            } else {
                msg.innerText="🏆 KAZANDIN!"; msg.style.color="#27ae60";
            }
            playSound("win");
        }
    }
}

function drawCard(target) {
    if (target.hand.length<7) {
        if (gameDeck.length===0) gameDeck=[...deckBase,...deckBase];
        const idx=Math.floor(Math.random()*gameDeck.length);
        target.hand.push(gameDeck.splice(idx,1)[0]);
    }
}

function updateFieldDisplay() {
    const zStyle="background:rgba(68,34,34,0.8);border:1px solid #ff4444;border-radius:8px;padding:5px;font-size:12px;display:inline-block;text-align:center;min-width:60px;";
    players.forEach((p,index)=>{
        const field=document.getElementById(`playerField_${index}`);
        if (field) field.innerHTML=p.zombies.map(z=>{
            const img=z.type==="🧟"?"img/zombi.png":"img/dev_zombi.png";
            return `<div style='${zStyle}'><img src="${img}" style="width:30px;height:30px;display:block;margin:0 auto 2px;">❤️${z.hp} ⚔️${z.atk}</div>`;
        }).join("");
    });
}

function updateStats() {
    players.forEach((p,index)=>{
        const hp=document.getElementById(`playerHp_${index}`);
        const bar=document.getElementById(`playerBarricade_${index}`);
        const hc=document.getElementById(`playerHandCount_${index}`);
        const panel=document.getElementById(`panel_${index}`);
        if(hp) hp.textContent=p.hp;
        if(bar) bar.textContent=p.barricade;
        if(hc) hc.textContent=p.hand.length;
        if(panel) {
            panel.classList.toggle('active-turn',index===turnIdx);
            // Ölü oyuncu paneli soluklaştır
            panel.style.opacity = p.hp<=0 ? '0.4' : '1';
        }
    });
    updateFieldDisplay();
}

function renderHand() {
    const hand = document.getElementById("hand");
    if (!hand) return;
    hand.innerHTML="";

    const currentActor = players[turnIdx];
    if (!currentActor) return;

    const activeNameEl = document.getElementById("activePlayerName");
    if (activeNameEl) activeNameEl.textContent=currentActor.name;

    // Multiplayer: sadece kendi sıramda, sadece kendi elimi göster
    if (isMultiplayer) {
        if (turnIdx !== myPlayerId) return; // Sıra bende değil
        const me = players[myPlayerId];
        if (!me || me.hp<=0) return;
        renderHandCards(me);
        return;
    }

    // Tek oyunculu / yerel mod
    const humanPlayer = currentActor.isBot ? null : currentActor;
    if (!humanPlayer || isAutoPlay) return;
    renderHandCards(humanPlayer);
}

function renderHandCards(humanPlayer) {
    const hand = document.getElementById("hand");
    humanPlayer.hand.forEach((card,index)=>{
        const div=document.createElement("div");
        div.className="card";
        if(card.includes("Zombi")) div.classList.add("card-summon");
        else if(card.includes("Tabanca")||card.includes("Silah")||card.includes("Saldırı")) div.classList.add("card-attack");
        else if(card.includes("Barikat")) div.classList.add("card-defense");
        else div.classList.add("card-special");

        div.innerHTML=`<img src="img/${getCardImage(card)}" style="width:100%;height:100%;object-fit:contain;" alt="${card}" title="${card}">`;

        div.onclick = async ()=>{
            if (isAnimating) return;
            if (humanPlayer.cardsPlayed >= humanPlayer.maxPlays) {
                log("Bu turda daha fazla kart oynayamazsın!");
                return;
            }

            // Multiplayer: sıra bende mi?
            if (isMultiplayer && turnIdx !== myPlayerId) {
                log("Şu an sıra sende değil!");
                return;
            }

            isAnimating=true;
            div.classList.add("card-playing");

            setTimeout(async ()=>{
                let targetId=-1;
                if(["🛡️ Barikat","❤️ Tamir","🧟 Zombi","👹 Dev Zombi"].includes(card)){
                    targetId=turnIdx;
                } else if(card==="✈️ Hava Saldırısı"||card==="💉 Enjeksiyon"){
                    targetId=-1;
                } else {
                    targetId=findNextAliveOpponent(turnIdx,players,gameMode);
                }

                let ok=false;
                if (isMultiplayer) {
                    // Multiplayer: Firestore'a yaz
                    ok = await window.playCardMultiplayer(turnIdx, targetId, index);
                } else {
                    // Yerel mod
                    if(targetId!==-1||(card==="✈️ Hava Saldırısı"||card==="💉 Enjeksiyon")){
                        ok=executeCardAction(turnIdx,targetId,index);
                        if(ok){
                            humanPlayer.cardsPlayed++;
                            renderHand();
                            updateStats();
                            if(humanPlayer.cardsPlayed>=humanPlayer.maxPlays) endTurn();
                        }
                    } else {
                        log("Bu kart için uygun hedef bulunamadı!");
                    }
                }
                isAnimating=false;
            },400);
        };
        hand.appendChild(div);
    });
}

function playAutoTurn() {
    if (!isAutoPlay||players[turnIdx].isBot) return;
    const actor=players[turnIdx];
    let playsAllowed=actor.blocked?1:2;

    function autoStep() {
        if(actor.cardsPlayed<playsAllowed&&actor.hand.length>0&&isAutoPlay){
            let cardIdx=-1,targetId=-1;
            cardIdx=actor.hand.findIndex(c=>actor.hp<4&&c==="❤️ Tamir");
            if(cardIdx!==-1) targetId=actor.id;
            if(cardIdx===-1){
                targetId=findNextAliveOpponent(actor.id,players,gameMode);
                if(targetId!==-1){
                    const tp=players[targetId];
                    cardIdx=actor.hand.findIndex(c=>tp.zombies.length>0&&(c.includes("Silah")||c.includes("Tabanca")||c.includes("Tel")));
                    if(cardIdx===-1) cardIdx=actor.hand.findIndex(c=>["🔫 Tabanca","💥 Silah"].includes(c));
                }
            }
            if(cardIdx===-1&&actor.barricade<3){cardIdx=actor.hand.findIndex(c=>c==="🛡️ Barikat");if(cardIdx!==-1)targetId=actor.id;}
            if(cardIdx===-1){cardIdx=actor.hand.findIndex(c=>["🧟 Zombi","👹 Dev Zombi"].includes(c));if(cardIdx!==-1)targetId=actor.id;}
            if(cardIdx===-1){cardIdx=actor.hand.findIndex(c=>["✈️ Hava Saldırısı","💉 Enjeksiyon"].includes(c));if(cardIdx!==-1)targetId=-1;}
            if(cardIdx===-1){targetId=findNextAliveOpponent(actor.id,players,gameMode);if(targetId!==-1)cardIdx=actor.hand.findIndex(c=>["🛑 Blok","🏴 Yağma"].includes(c));}
            if(cardIdx===-1&&actor.hand.length>0){
                cardIdx=Math.floor(Math.random()*actor.hand.length);
                const rc=actor.hand[cardIdx];
                if(["🛡️ Barikat","❤️ Tamir","🧟 Zombi","👹 Dev Zombi"].includes(rc)) targetId=actor.id;
                else if(rc==="✈️ Hava Saldırısı"||rc==="💉 Enjeksiyon") targetId=-1;
                else targetId=findNextAliveOpponent(actor.id,players,gameMode);
            }
            setTimeout(()=>{
                let ok=false;
                const ctp=actor.hand[cardIdx];
                if(targetId!==-1) ok=executeCardAction(actor.id,targetId,cardIdx);
                else if(ctp==="✈️ Hava Saldırısı"||ctp==="💉 Enjeksiyon") ok=executeCardAction(actor.id,-1,cardIdx);
                if(ok) actor.cardsPlayed++;
                renderHand(); updateStats();
                setTimeout(autoStep,1000);
            },400);
        } else {
            if(isAutoPlay) setTimeout(endTurn,500);
        }
    }
    autoStep();
}

function endTurn() {
    if (isMultiplayer) { window.endTurnMultiplayer(); return; }

    const actor=players[turnIdx];
    clearInterval(timerId);
    log(`${actor.name} turunu bitirdi.`);
    actor.cardsPlayed=0;
    actor.maxPlays=actor.blocked?1:2;
    actor.blocked=false;

    for(let i=0;i<2;i++) drawCard(actor);

    const tgtId=findNextAliveOpponent(actor.id,players,gameMode);
    if(tgtId!==-1){
        const tgt=players[tgtId];
        actor.zombies.forEach(z=>{
            if(actor.hp>0&&tgt.hp>0) applyDamage(tgt,z.atk,`playerHp_${tgt.id}`);
        });
    }

    playSound("draw");
    renderHand();
    updateStats();

    turnIdx=(turnIdx+1)%players.length;
    let guard=0;
    while(players[turnIdx].hp<=0&&guard<players.length){turnIdx=(turnIdx+1)%players.length;guard++;}
    startTurn();
}

function startTurn() {
    if (isMultiplayer) return; // Multiplayer'da Firestore yönetir
    const actor=players[turnIdx];
    log(`--- ${actor.name}'in TURU ---`);
    startTimer();
    if(actor.isBot){
        setTimeout(botTurn,1000);
    } else {
        if(isAutoPlay) setTimeout(playAutoTurn,1000);
        renderHand();
    }
    updateStats();
}

function executeCardAction(actorIdx, targetIdx, idx) {
    const actor=players[actorIdx];
    const card=actor.hand[idx];
    const target=targetIdx>=0?players[targetIdx]:null;

    if(card==="🛡️ Barikat"){if(actor.barricade>=3){log("Barikat zaten maksimum!");return false;}actor.barricade++;playSound("kalkan");}
    else if(card==="❤️ Tamir"){if(actor.hp>=7){log("Can zaten maksimum!");return false;}actor.hp++;playSound("tamir");}
    else if(card==="🧟 Zombi"){actor.zombies.push({type:"🧟",hp:1,atk:1});}
    else if(card==="👹 Dev Zombi"){actor.zombies.push({type:"👹",hp:2,atk:2});}
    else if(card==="🔫 Tabanca"||card==="💥 Silah"){
        if(!target) return false;
        let d=card.includes("Tabanca")?1:2;
        if(target.zombies.length>0){
            target.zombies[0].hp-=d;
            if(target.zombies[0].hp<=0) target.zombies.shift();
            playSound("kirilma");
        } else applyDamage(target,d,`playerHp_${target.id}`);
    }
    else if(card==="⚡ Elektrikli Tel"){
        if(!target) return false;
        target.zombies=target.zombies.filter(z=>{
            if(z.type==="🧟") return false;
            if(z.hp<=1) return false;
            z.hp=1; z.atk=1; return true;
        });
    }
    else if(card==="🏴 Yağma"){
        if(!target) return false;
        if(target.hand.length>0){const sI=Math.floor(Math.random()*target.hand.length);actor.hand.push(target.hand.splice(sI,1)[0]);}
    }
    else if(card==="🛑 Blok"){if(!target) return false;target.blocked=true;}
    else if(card==="✈️ Hava Saldırısı"){
        players.forEach(p=>{
            if(p.id!==actor.id&&p.hp>0) applyDamage(p,1,`playerHp_${p.id}`);
        });
    }
    else if(card==="💉 Enjeksiyon"){
        players.forEach(p=>{p.zombies.forEach(z=>z.hp--);p.zombies=p.zombies.filter(z=>z.hp>0);});
    }

    actor.hand.splice(idx,1);
    log(`${actor.name} oynadı: ${card}`);
    return true;
}

function botTurn() {
    const actor=players[turnIdx];
    log(`--- ${actor.name}'in TURU ---`);
    let playsAllowed=actor.blocked?1:2;
    actor.blocked=false;

    function playNext(){
        if(actor.cardsPlayed<playsAllowed&&actor.hand.length>0&&actor.hp>0){
            let cardIdx=-1,targetId=-1;
            cardIdx=actor.hand.findIndex(c=>actor.hp<4&&c==="❤️ Tamir");
            if(cardIdx!==-1) targetId=actor.id;
            if(cardIdx===-1){
                targetId=findNextAliveOpponent(actor.id,players,gameMode);
                if(targetId!==-1){
                    const tp=players[targetId];
                    cardIdx=actor.hand.findIndex(c=>tp.zombies.length>0&&(c.includes("Silah")||c.includes("Tabanca")||c.includes("Tel")));
                    if(cardIdx===-1) cardIdx=actor.hand.findIndex(c=>["🔫 Tabanca","💥 Silah"].includes(c));
                }
            }
            if(cardIdx===-1&&actor.barricade<3){cardIdx=actor.hand.findIndex(c=>c==="🛡️ Barikat");if(cardIdx!==-1)targetId=actor.id;}
            if(cardIdx===-1){cardIdx=actor.hand.findIndex(c=>["🧟 Zombi","👹 Dev Zombi"].includes(c));if(cardIdx!==-1)targetId=actor.id;}
            if(cardIdx===-1){cardIdx=actor.hand.findIndex(c=>["✈️ Hava Saldırısı","💉 Enjeksiyon"].includes(c));if(cardIdx!==-1)targetId=-1;}
            if(cardIdx===-1){targetId=findNextAliveOpponent(actor.id,players,gameMode);if(targetId!==-1)cardIdx=actor.hand.findIndex(c=>["🛑 Blok","🏴 Yağma"].includes(c));}
            if(cardIdx===-1&&actor.hand.length>0){
                cardIdx=Math.floor(Math.random()*actor.hand.length);
                const rc=actor.hand[cardIdx];
                if(["🛡️ Barikat","❤️ Tamir","🧟 Zombi","👹 Dev Zombi"].includes(rc)) targetId=actor.id;
                else if(rc==="✈️ Hava Saldırısı"||rc==="💉 Enjeksiyon") targetId=-1;
                else targetId=findNextAliveOpponent(actor.id,players,gameMode);
            }
            if(cardIdx!==-1){
                let ok=false;
                const ctp=actor.hand[cardIdx];
                if(targetId!==-1) ok=executeCardAction(actor.id,targetId,cardIdx);
                else if(ctp==="✈️ Hava Saldırısı"||ctp==="💉 Enjeksiyon") ok=executeCardAction(actor.id,-1,cardIdx);
                if(ok) actor.cardsPlayed++;
            }
            updateStats();
            setTimeout(playNext,1000);
        } else { setTimeout(endTurn,500); }
    }
    setTimeout(playNext,1000);
}

function drawStartingHand() {
    players.forEach(p=>{ for(let i=0;i<5;i++) drawCard(p); });
    setTimeout(()=>playSound("draw"),500);
    renderHand();
}

// FIX: 3 kişilik mod düzgün çalışıyor, gameContainer görünür yapılıyor
function initGame(mode) {
    gameMode=mode;
    players=[];
    turnIdx=0;
    isAutoPlay=false;
    isMultiplayer=false;
    gameDeck=[...deckBase,...deckBase];
    let playerNames=[];

    ['profileScreen','mainMenu','waitingRoom','settingsScreen','loginScreen']
        .forEach(id=>{ const e=document.getElementById(id); if(e) e.style.display='none'; });
    document.getElementById("gameContainer").style.display="block";
    document.getElementById("winOverlay").style.display="none";

    if(mode==='pvb'){
        playerNames.push(currentUserProfile.name||"Oyuncu");
        playerNames.push("BOT");
    } else if(mode==='2v2'){
        playerNames.push(prompt("1. Oyuncu (Takım A)",currentUserProfile.name||"Oy1")||"Oy1");
        playerNames.push(prompt("2. Oyuncu (Takım B)","Oyuncu 2")||"Oy2");
        playerNames.push(prompt("3. Oyuncu (Takım A)","Oyuncu 3")||"Oy3");
        playerNames.push(prompt("4. Oyuncu (Takım B)","Oyuncu 4")||"Oy4");
    } else if(mode==='3ffa'){
        playerNames.push(prompt("1. Oyuncu",currentUserProfile.name||"Oy1")||"Oy1");
        playerNames.push(prompt("2. Oyuncu","Oyuncu 2")||"Oy2");
        playerNames.push(prompt("3. Oyuncu","Oyuncu 3")||"Oy3");
    } else if(mode==='4ffa'){
        playerNames.push(prompt("1. Oyuncu",currentUserProfile.name||"Oy1")||"Oy1");
        playerNames.push(prompt("2. Oyuncu","Oyuncu 2")||"Oy2");
        playerNames.push(prompt("3. Oyuncu","Oyuncu 3")||"Oy3");
        playerNames.push(prompt("4. Oyuncu","Oyuncu 4")||"Oy4");
    }

    playerNames.forEach((name,index)=>{
        players.push({
            id:index, name, hp:7, barricade:0,
            hand:[], zombies:[], cardsPlayed:0, maxPlays:2, blocked:false,
            teamId:(mode==='2v2')?(index%2):index,
            isBot:(mode==='pvb'&&index===1)
        });
    });

    renderGameLayout();
    drawStartingHand();
    updateStats();
    startTurn();
}

// FIX: 3 kişilik paneller doğru pozisyonlarda
function renderGameLayout() {
    const container=document.getElementById("playerPanelsContainer");
    const table=document.getElementById("mainTable");
    container.innerHTML='';
    container.appendChild(table);

    container.classList.remove('layout-2-players','layout-3-players','layout-4-players');
    if(players.length===2) container.classList.add('layout-2-players');
    else if(players.length===3) container.classList.add('layout-3-players');
    else if(players.length===4) container.classList.add('layout-4-players');

    players.forEach((p,index)=>{
        const panelDiv=document.createElement('div');
        panelDiv.className='panel';
        panelDiv.id=`panel_${index}`;

        let posClass='';
        if(players.length===2){
            posClass=index===0?'pos-bottom':'pos-top';
        } else if(players.length===3){
            // FIX: 3 kişilik doğru dizilim
            if(index===0) posClass='pos-bottom';
            else if(index===1) posClass='pos-3-left';
            else posClass='pos-3-right';
        } else if(players.length===4){
            if(index===0) posClass='pos-bottom';
            else if(index===1) posClass='pos-right';
            else if(index===2) posClass='pos-top';
            else posClass='pos-left';
        }
        panelDiv.classList.add(posClass);

        // Multiplayer: hangi panel benim?
        const isMe = isMultiplayer && p.id===myPlayerId;

        panelDiv.innerHTML=`
            <h2>${p.name} ${p.isBot?'🤖':''} ${isMe?'<span style="color:#f5c94d;">(SEN)</span>':''}</h2>
            <div class="stats">
                <div class="stat">❤️ <span id="playerHp_${p.id}">${p.hp}</span>/7</div>
                <div class="stat">🛡️ <span id="playerBarricade_${p.id}">${p.barricade}</span>/3</div>
                <div class="stat">🎴 <span id="playerHandCount_${p.id}">${p.hand.length}</span></div>
                <div class="stat">⏳ <span id="playerTimer_${p.id}">30</span>
                    <div class="timer-wrap"><div id="playerTimerBar_${p.id}" class="timer-bar"></div></div>
                </div>
            </div>
            <div id="playerField_${p.id}" class="field"></div>
        `;
        container.appendChild(panelDiv);
    });
}

// Sayfa yüklenince ana menü göster
document.getElementById("mainMenu").style.display="flex";
document.getElementById("gameContainer").style.display="none";
