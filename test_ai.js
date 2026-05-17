// AI self-play test for 三层身份 board game
// Runs N games and reports bugs / anomalies
'use strict';

const GAME_COUNT = 100;
const MAX_TURNS = 200;
const PLAYER_COUNTS = [5, 6, 7, 8];

// ============ CARD DEFINITIONS ============
const L1_POOL = [
  {type:'l1_1',name:'先知',color:'blue',desc:'揭示场上任意一张身份'},
  {type:'l1_2',name:'隐者',color:'red',desc:'暗置场上任意一张已揭示身份'},
  {type:'l1_3',name:'商人',color:'blue',desc:'获得4枚星币'},
  {type:'l1_4',name:'密探',color:'red',desc:'调查至多两位玩家各一张身份'},
  {type:'l1_5',name:'术士',color:'blue',desc:'选择一名玩家跳过其下回合'},
  {type:'l1_6',name:'信使',color:'red',desc:'与一名玩家互相查看对方一张身份'},
];
const L2_POOL = [
  {type:'l2_1',name:'学者',color:'blue',desc:'抽取3张魔典'},
  {type:'l2_2',name:'陷阱师',color:'red',desc:'被非宣言揭示时揭示者失去所有星币'},
  {type:'l2_3',name:'策士',color:'blue',desc:'下回合可以宣言两次'},
  {type:'l2_4',name:'窥视者',color:'red',desc:'查看任意一张已被暗置的身份'},
  {type:'l2_5',name:'禁言者',color:'blue',desc:'指定一名玩家下回合不能宣言'},
  {type:'l2_6',name:'护卫',color:'red',desc:'被调查时可支付1星币使其无效'},
];
const L3_POOL = [
  {type:'l3_1',name:'异族',color:'alien',desc:'无视前两层强制归属异族阵营'},
  {type:'l3_2',name:'觉醒者',color:'blue',desc:'查看自己所有未揭示的身份'},
  {type:'l3_3',name:'复仇者',color:'red',desc:'死亡时选择一名玩家揭示其一张身份'},
  {type:'l3_4',name:'赌徒',color:'red',desc:'宣言此牌失败时不被揭示(限一次)'},
  {type:'l3_5',name:'炼金师',color:'blue',desc:'额外获得2星币'},
  {type:'l3_6',name:'影武者',color:'blue',desc:'与其他玩家交换一张已揭示身份'},
];
const GRIMOIRE_DEFS = [
  {type:'g1',name:'洞察',desc:'免费调查任意玩家任意一层',count:3},
  {type:'g2',name:'敛财',desc:'获得3枚星币',count:2},
  {type:'g3',name:'休战',desc:'跳过下一位玩家的回合',count:1},
  {type:'g4',name:'内省',desc:'查看自己一张未揭示身份',count:2},
  {type:'g5',name:'回收',desc:'从弃牌堆拿取一张魔典',count:1},
  {type:'g6',name:'折扣',desc:'本回合调查费用减半',count:1},
  {type:'g7',name:'隐遁',desc:'将自己一张已揭示身份暗置',count:1},
  {type:'g8',name:'偷换',desc:'交换两名玩家各一张未揭示身份',count:1},
  {type:'g9',name:'逼言',desc:'指定一名玩家下回合必须宣言',count:1},
  {type:'g10',name:'顿悟',desc:'额外抽取1张魔典',count:1},
  {type:'g11',name:'庇护',desc:'保护一名玩家本回合不被调查',count:1},
  {type:'g12',name:'翻旧账',desc:'查看弃牌堆选1张加入手牌',count:1},
  {type:'g13',name:'星图',desc:'查看任意两名其他玩家各一张身份',count:1},
];

function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function buildPool(pool){const d=[];pool.forEach(c=>{d.push({...c,uid:c.type+'_a'});d.push({...c,uid:c.type+'_b'});});return d;}
function buildGrimoireDeck(){const d=[];GRIMOIRE_DEFS.forEach(g=>{for(let i=0;i<g.count;i++)d.push({...g,uid:g.type+'_'+i});});return shuffle(d);}

// ============ UTILS ============
function randInt(n){return Math.floor(Math.random()*n);}
function randPick(arr){return arr[randInt(arr.length)];}
function clamp(v,lo,hi){return v<lo?lo:v>hi?hi:v;}

// ============ GAME STATE ============
let G;
let errorLog = [];
let turnCount = 0;

function initGame(playerNames){
  const n = playerNames.length;
  const l1Deck = shuffle(buildPool(L1_POOL));
  const l2Deck = shuffle(buildPool(L2_POOL));
  const l3Deck = shuffle(buildPool(L3_POOL));
  const players = playerNames.map((name,i)=>({
    name, index:i,
    identities:[
      {layer:1,card:l1Deck[i],revealed:false},
      {layer:2,card:l2Deck[i],revealed:false},
      {layer:3,card:l3Deck[i],revealed:false},
    ],
    coins:0, grimoires:[], alive:true,
    skipNext:false, mustDeclare:false, cannotDeclare:false,
    canDeclareTwice:false, declarationsThisTurn:0,
    protected:false, discountThisTurn:false,
    gamblerUsed:false,
  }));
  players.forEach(p=>{p.faction=calcFaction(p.identities.map(id=>id.card));});
  G = {
    players, playerCount:n, currentPlayer:0,
    phase:'resource', grimoireDeck:buildGrimoireDeck(), grimoireDiscard:[],
    log:[], peaceInitiator:null, peaceResponders:[], peaceBroken:false,
    gameOver:false, pendingAction:null, turnCount:1,
    knowledge:{}, selfKnowledge:{}, revealHistory:[],
    killTracker:{},
    pendingDeathRevenge:null,
  };
  turnCount = 0;
  errorLog = [];
}

function calcFaction(identities){
  if(identities[2]&&identities[2].type==='l3_1') return 'alien';
  const w=[3,2,1]; let b=0,r=0;
  identities.forEach((id,i)=>{if(!id)return;if(id.color==='blue')b+=w[i];else if(id.color==='red')r+=w[i];});
  if(b>r)return'blue';if(r>b)return'red';return'hybrid';
}

function getPlayerKnowledge(observer,target,layer){
  const t=G.players[target];
  if(t.identities[layer-1].revealed) return t.identities[layer-1].card;
  if(observer===target){const k=G.selfKnowledge[observer+'_'+layer];if(k)return k;}
  return G.knowledge[observer+'_'+target+'_'+layer]||null;
}
function setPlayerKnowledge(observer,target,layer,card){
  if(observer===target) G.selfKnowledge[observer+'_'+layer]=card;
  else G.knowledge[observer+'_'+target+'_'+layer]=card;
}
function revealedCount(pi){return G.players[pi].identities.filter(id=>id.revealed).length;}
function nextAlive(from){
  for(let i=1;i<=G.playerCount;i++){const idx=(from+i)%G.playerCount;if(G.players[idx].alive)return idx;}
  return -1;
}

// ============ GAME LOGIC ============
function giveCoins(pi,amt){G.players[pi].coins=Math.max(0,G.players[pi].coins+amt);}
function drawGrimoire(pi,count){
  const p=G.players[pi];
  for(let i=0;i<count;i++){
    if(G.grimoireDeck.length===0){
      const alive=G.players.filter(pl=>pl.alive);
      G.peaceResponders=alive.map(pl=>pl.index);
      G.peaceInitiator=-1;
      resolvePeace();
      return;
    }
    p.grimoires.push(G.grimoireDeck.pop());
  }
}

function checkDeath(pi){
  if(revealedCount(pi)>=3){
    G.players[pi].alive=false;
    const l3=G.players[pi].identities[2];
    if(l3.card.type==='l3_3' && l3.revealed){
      G.pendingDeathRevenge=pi;
    }
    return true;
  }
  return false;
}

function checkWin(){
  for(const[killer,victims] of Object.entries(G.killTracker)){
    for(const v of victims){
      const vp=G.players[v]; const kp=G.players[parseInt(killer)];
      if(!vp||!kp)continue;
      if(kp.faction==='hybrid'&&(vp.faction==='blue'||vp.faction==='red'))
        return {winner:'hybrid',msg:'混血儿'+kp.name+'杀死'+vp.name+'，混血儿胜利！'};
      if(kp.faction==='blue'&&vp.faction==='red')
        return {winner:'blue',msg:'蓝色'+kp.name+'杀死红色'+vp.name+'，蓝色胜利！'};
      if(kp.faction==='red'&&vp.faction==='blue')
        return {winner:'red',msg:'红色'+kp.name+'杀死蓝色'+vp.name+'，红色胜利！'};
    }
  }
  const alive=G.players.filter(p=>p.alive);
  const aliens=alive.filter(p=>p.faction==='alien');
  const hybrids=alive.filter(p=>p.faction==='hybrid');
  const blues=alive.filter(p=>p.faction==='blue');
  const reds=alive.filter(p=>p.faction==='red');
  if(aliens.length===0&&hybrids.length===0){
    if(blues.length===0&&reds.length===0)return null;
    if(reds.length===0&&blues.length>0)return {winner:'blue',msg:'红色全灭，蓝色胜利！'};
    if(blues.length===0&&reds.length>0)return {winner:'red',msg:'蓝色全灭，红色胜利！'};
  }
  return null;
}

function endGame(result){
  G.gameOver=true; G.gameResult=result;
}

function resolvePeace(){
  const alive=G.players.filter(p=>p.alive);
  const factions=alive.map(p=>p.faction);
  const allSame=factions.every(f=>f===factions[0]);
  if(allSame){endGame({winner:factions[0],msg:'鸣金成功！共同胜利！'});return;}
  const ac=factions.filter(f=>f==='alien').length;
  const hc=factions.filter(f=>f==='hybrid').length;
  const bc=factions.filter(f=>f==='blue').length;
  const rc=factions.filter(f=>f==='red').length;
  if(ac>0) endGame({winner:'alien',msg:'异族在场优先胜利！'});
  else if(hc>0) endGame({winner:'hybrid',msg:'混血儿优先胜利！'});
  else if(rc<bc) endGame({winner:'red',msg:'少数红色阵营胜利！'});
  else if(bc<rc) endGame({winner:'blue',msg:'少数蓝色阵营胜利！'});
  else endGame({winner:'draw',msg:'红蓝平局！'});
}

function investigate(observer,target,layer){
  const cost=layer; const isSelf=observer===target;
  let ac=isSelf?cost*2:cost;
  if(G.players[observer].discountThisTurn) ac=Math.max(0,Math.floor(ac/2));
  if(G.players[observer].coins<ac) return {err:'coins'};
  if(!G.players[target].alive) return {err:'dead'};
  if(G.players[target].identities[layer-1].revealed) return {err:'revealed'};
  if(G.players[target].protected) return {err:'protected'};
  const tl2=G.players[target].identities[1];
  if(!isSelf&&!tl2.revealed&&tl2.card.type==='l2_6'&&G.players[target].coins>=1){
    G.players[target].coins-=1; G.players[observer].coins-=ac;
    return {err:'guarded'};
  }
  G.players[observer].coins-=ac;
  const card=G.players[target].identities[layer-1].card;
  setPlayerKnowledge(observer,target,layer,card);
  return {success:true,card};
}

function revealIdentity(actor,target,layer){
  const cost=layer*2;
  if(G.players[actor].coins<cost) return {err:'coins'};
  if(!G.players[target].alive) return {err:'dead'};
  if(actor===target) return {err:'self'};
  if(G.players[target].identities[layer-1].revealed) return {err:'revealed'};
  if(!getPlayerKnowledge(actor,target,layer)) return {err:'not_investigated'};
  G.players[actor].coins-=cost;
  const card=G.players[target].identities[layer-1].card;
  G.players[target].identities[layer-1].revealed=true;
  G.revealHistory.push({player:target,layer,card});
  if(card.type==='l2_2') G.players[actor].coins=0;
  const died=checkDeath(target);
  if(died){
    if(!G.killTracker[actor]) G.killTracker[actor]=[];
    G.killTracker[actor].push(target);
  }
  const win=checkWin(); if(win) endGame(win);
  return {success:true,card,died};
}

function declareIdentity(pi,layer,guessedType){
  const p=G.players[pi];
  if(!p.alive) return {err:'dead'};
  if(p.identities[layer-1].revealed) return {err:'revealed'};
  const maxD=p.canDeclareTwice?2:1;
  if(p.declarationsThisTurn>=maxD) return {err:'max_declares'};
  const actual=p.identities[layer-1].card;
  const correct=actual.type===guessedType;
  p.declarationsThisTurn++;
  if(correct){
    p.identities[layer-1].revealed=true;
    G.revealHistory.push({player:pi,layer,card:actual});
    checkDeath(pi);
    const win=checkWin(); if(win) endGame(win);
    return {success:true,correct:true,card:actual,layer};
  }else{
    const l3=p.identities[2];
    if(l3.card.type==='l3_4'&&!p.gamblerUsed&&!l3.revealed&&layer===3){
      p.gamblerUsed=true;
      return {success:true,correct:false,notRevealed:true,card:actual};
    }
    p.identities[layer-1].revealed=true;
    G.revealHistory.push({player:pi,layer,card:actual});
    const died=checkDeath(pi);
    const win=checkWin(); if(win) endGame(win);
    return {success:true,correct:false,card:actual,died};
  }
}

function callForPeace(pi){
  G.peaceInitiator=pi; G.peaceResponders=[pi]; G.peaceBroken=false;
  endCurrentTurn();
}

function respondToPeace(pi,accept){
  if(accept){
    G.peaceResponders.push(pi);
    const allAlive=G.players.filter(p=>p.alive).map(p=>p.index);
    if(allAlive.every(i=>G.peaceResponders.includes(i))) resolvePeace();
    else endCurrentTurn();
  }else{
    G.peaceBroken=true; G.peaceInitiator=null; G.peaceResponders=[];
    endCurrentTurn();
  }
}

// ============ AI RESOLVE PENDING ACTION ============
function aiResolvePending(){
  if(!G.pendingAction) return;
  const a=G.pendingAction;
  const p=G.players[a.player];
  const aliveOthers = G.players.filter(pl=>pl.alive && pl.index!==a.player);

  // Helper: pick a random valid target+layer
  function randTargetLayer(filterFn){
    const opts=[];
    aliveOthers.forEach(t=>{
      [1,2,3].forEach(l=>{
        if(filterFn(t,l)) opts.push({target:t.index,layer:l});
      });
    });
    return opts.length>0 ? randPick(opts) : null;
  }

  function randTarget(){
    return aliveOthers.length>0 ? {target:randPick(aliveOthers).index} : null;
  }

  let choice=null;
  switch(a.type){
    case 'eff_reveal_any': // 先知: reveal any non-revealed identity
      choice=randTargetLayer((t,l)=>!t.identities[l-1].revealed);
      break;
    case 'eff_hide_any': // 隐者: hide any revealed identity
      choice=randTargetLayer((t,l)=>t.identities[l-1].revealed);
      break;
    case 'eff_inv_two': // 密探: investigate two
      choice=randTargetLayer((t,l)=>!t.identities[l-1].revealed);
      break;
    case 'eff_skip': // 术士: skip a player
      choice=randTarget();
      break;
    case 'eff_mutual': // 信使: mutual view
      choice=randTargetLayer((t,l)=>!t.identities[l-1].revealed);
      break;
    case 'eff_mutual2': // 信使 step 2
      { const myLayers=[1,2,3].filter(l=>!p.identities[l-1].revealed);
        if(myLayers.length>0) choice={layer:randPick(myLayers)};
        else choice={layer:1}; }
      break;
    case 'eff_view_hidden': // 窥视者: view non-revealed
      choice=randTargetLayer((t,l)=>!t.identities[l-1].revealed);
      break;
    case 'eff_silence': // 禁言者
      choice=randTarget();
      break;
    case 'eff_swap_rev': // 影武者: swap revealed
      choice=randTargetLayer((t,l)=>t.identities[l-1].revealed);
      break;
    case 'eff_swap_rev2': // 影武者 step 2
      { const myRev=p.identities.filter(id=>id.revealed).map(id=>id.layer);
        if(myRev.length>0) choice={layer:randPick(myRev)}; }
      break;
    case 'revenge': // 复仇者 death trigger
      choice=randTarget();
      break;
    // Grimoire effects
    case 'grim_inv': case 'grim_star':
      choice=randTargetLayer((t,l)=>!t.identities[l-1].revealed);
      break;
    case 'grim_skip': case 'grim_force': case 'grim_protect':
      choice=randTarget();
      break;
    case 'grim_self': case 'grim_hide':
      { const layers=(a.type==='grim_self')
          ?[1,2,3].filter(l=>!p.identities[l-1].revealed)
          :p.identities.filter(id=>id.revealed).map(id=>id.layer);
        if(layers.length>0) choice={layer:randPick(layers)}; }
      break;
    case 'grim_recycle': case 'grim_pick':
      { const gs=G.grimoireDiscard.filter(gg=>gg.uid!==(a.exclude||''));
        if(gs.length>0) choice={uid:randPick(gs).uid}; }
      break;
    case 'grim_swap':
      // Complex multi-step, just skip
      break;
  }

  if(choice) resolvePendingDirect(choice);
  else G.pendingAction=null; // Couldn't find valid choice, give up
}

function resolvePendingDirect(choice){
  if(!G.pendingAction) return;
  const a=G.pendingAction, p=G.players[a.player];
  switch(a.type){
    case 'eff_reveal_any':{
      const t=G.players[choice.target];
      if(t.identities[choice.layer-1].revealed) break;
      t.identities[choice.layer-1].revealed=true;
      G.revealHistory.push({player:choice.target,layer:choice.layer,card:t.identities[choice.layer-1].card});
      if(t.identities[choice.layer-1].card.type==='l2_2') p.coins=0;
      checkDeath(choice.target); const win=checkWin(); if(win) endGame(win);
      break;
    }
    case 'eff_hide_any':{
      const t=G.players[choice.target];
      if(!t.identities[choice.layer-1].revealed) break;
      t.identities[choice.layer-1].revealed=false;
      break;
    }
    case 'eff_inv_two':{
      const t=G.players[choice.target];
      if(!t.identities[choice.layer-1].revealed)
        setPlayerKnowledge(a.player,choice.target,choice.layer,t.identities[choice.layer-1].card);
      a.done++;
      if(a.done>=2){G.pendingAction=null;}
      else{G.pendingAction=a; return;} // wait for next aiResolvePending call
      break;
    }
    case 'eff_skip':{
      if(choice.target!=null) G.players[choice.target].skipNext=true;
      break;
    }
    case 'eff_mutual':{
      const t=G.players[choice.target];
      a.target=choice.target; a.blayer=choice.layer;
      G.pendingAction={type:'eff_mutual2',player:a.player,target:choice.target,blayer:choice.layer};
      aiResolvePending(); return;
    }
    case 'eff_mutual2':{
      const t=G.players[a.target];
      setPlayerKnowledge(a.player,a.target,a.blayer,t.identities[a.blayer-1].card);
      setPlayerKnowledge(a.target,a.player,choice.layer,p.identities[choice.layer-1].card);
      break;
    }
    case 'eff_view_hidden':{
      if(choice.target!=null&&choice.layer)
        setPlayerKnowledge(a.player,choice.target,choice.layer,G.players[choice.target].identities[choice.layer-1].card);
      break;
    }
    case 'eff_silence':{
      if(choice.target!=null) G.players[choice.target].cannotDeclare=true;
      break;
    }
    case 'eff_swap_rev':{
      const t=G.players[choice.target];
      const tid=t.identities[choice.layer-1];
      if(!tid.revealed) break;
      const prev=p.identities.filter(id=>id.revealed);
      if(prev.length===0) break;
      if(prev.length===1){
        const tmp={...prev[0].card};
        p.identities[prev[0].layer-1].card={...tid.card};
        t.identities[choice.layer-1].card=tmp;
        p.faction=calcFaction(p.identities.map(id=>id.card));
        t.faction=calcFaction(t.identities.map(id=>id.card));
        break;
      }
      // Multi: set up step 2
      G.pendingAction={type:'eff_swap_rev2',player:a.player,target:choice.target,tlayer:choice.layer};
      aiResolvePending(); return;
    }
    case 'eff_swap_rev2':{
      const t=G.players[a.target];
      const tmp={...p.identities[choice.layer-1].card};
      p.identities[choice.layer-1].card={...t.identities[a.tlayer-1].card};
      t.identities[a.tlayer-1].card=tmp;
      p.faction=calcFaction(p.identities.map(id=>id.card));
      t.faction=calcFaction(t.identities.map(id=>id.card));
      break;
    }
    case 'revenge':{
      const t=G.players[choice.target];
      const urev=[1,2,3].filter(l=>!t.identities[l-1].revealed);
      if(urev.length>0){
        const l=randPick(urev);
        t.identities[l-1].revealed=true;
        G.revealHistory.push({player:choice.target,layer:l,card:t.identities[l-1].card});
        checkDeath(choice.target);
        const win=checkWin(); if(win) endGame(win);
      }
      break;
    }
    // Grimoire effects
    case 'grim_inv':{
      investigate(a.player,choice.target,choice.layer);
      break;
    }
    case 'grim_skip':{
      if(choice.target!=null) G.players[choice.target].skipNext=true;
      break;
    }
    case 'grim_self':{
      if(choice.layer) setPlayerKnowledge(a.player,a.player,choice.layer,p.identities[choice.layer-1].card);
      break;
    }
    case 'grim_recycle': case 'grim_pick':{
      const idx=G.grimoireDiscard.findIndex(gg=>gg.uid===choice.uid);
      if(idx>=0){const[gg]=G.grimoireDiscard.splice(idx,1); p.grimoires.push(gg);}
      break;
    }
    case 'grim_hide':{
      if(choice.layer) p.identities[choice.layer-1].revealed=false;
      break;
    }
    case 'grim_force':{
      if(choice.target!=null) G.players[choice.target].mustDeclare=true;
      break;
    }
    case 'grim_protect':{
      if(choice.target!=null) G.players[choice.target].protected=true;
      break;
    }
    case 'grim_star':{
      if(!a.star1){
        if(!G.players[choice.target].identities[choice.layer-1].revealed)
          setPlayerKnowledge(a.player,choice.target,choice.layer,G.players[choice.target].identities[choice.layer-1].card);
        a.star1=choice;
        G.pendingAction=a;
        aiResolvePending(); return;
      }else{
        if(!G.players[choice.target].identities[choice.layer-1].revealed)
          setPlayerKnowledge(a.player,choice.target,choice.layer,G.players[choice.target].identities[choice.layer-1].card);
      }
      break;
    }
  }
  G.pendingAction=null;
}

// ============ EFFECT APPLICATION (AI version) ============
function applyDeclareEffect(pi,card,layer){
  const p=G.players[pi];
  switch(card.type){
    case 'l1_1':G.pendingAction={type:'eff_reveal_any',player:pi};break;
    case 'l1_2':G.pendingAction={type:'eff_hide_any',player:pi};break;
    case 'l1_3':giveCoins(pi,4);break;
    case 'l1_4':G.pendingAction={type:'eff_inv_two',player:pi,done:0};break;
    case 'l1_5':G.pendingAction={type:'eff_skip',player:pi};break;
    case 'l1_6':G.pendingAction={type:'eff_mutual',player:pi};break;
    case 'l2_1':drawGrimoire(pi,3);break;
    case 'l2_3':p.canDeclareTwice=true;break;
    case 'l2_4':G.pendingAction={type:'eff_view_hidden',player:pi};break;
    case 'l2_5':G.pendingAction={type:'eff_silence',player:pi};break;
    case 'l3_2':
      for(let i=1;i<=3;i++){if(!p.identities[i-1].revealed)setPlayerKnowledge(pi,pi,i,p.identities[i-1].card);}
      break;
    case 'l3_5':giveCoins(pi,2);break;
    case 'l3_6':G.pendingAction={type:'eff_swap_rev',player:pi};break;
  }
  // Resolve pending immediately in AI mode
  if(G.pendingAction) aiResolvePending();
}

function playGrimoire(pi,gi){
  const p=G.players[pi];
  if(gi<0||gi>=p.grimoires.length) return;
  const g=p.grimoires[gi];
  p.grimoires.splice(gi,1); G.grimoireDiscard.push(g);
  switch(g.type){
    case 'g1':G.pendingAction={type:'grim_inv',player:pi};break;
    case 'g2':giveCoins(pi,3);return;
    case 'g3':G.pendingAction={type:'grim_skip',player:pi};break;
    case 'g4':
      if(!p.identities.some(id=>!id.revealed)) return;
      G.pendingAction={type:'grim_self',player:pi};break;
    case 'g5':
      if(G.grimoireDiscard.filter(gg=>gg.uid!==g.uid).length===0) return;
      G.pendingAction={type:'grim_recycle',player:pi,exclude:g.uid};break;
    case 'g6':p.discountThisTurn=true;return;
    case 'g7':
      if(!p.identities.some(id=>id.revealed)) return;
      G.pendingAction={type:'grim_hide',player:pi};break;
    case 'g8': // 偷换 too complex for AI, skip
      return;
    case 'g9':G.pendingAction={type:'grim_force',player:pi};break;
    case 'g10':drawGrimoire(pi,1);return;
    case 'g11':G.pendingAction={type:'grim_protect',player:pi};break;
    case 'g12':
      if(G.grimoireDiscard.filter(gg=>gg.uid!==g.uid).length===0) return;
      G.pendingAction={type:'grim_pick',player:pi,exclude:g.uid};break;
    case 'g13':G.pendingAction={type:'grim_star',player:pi};break;
  }
  if(G.pendingAction) aiResolvePending();
}

// ============ END CURRENT TURN ============
function endCurrentTurn(){
  if(G.gameOver) return;
  const p=G.players[G.currentPlayer];
  p.protected=false; p.discountThisTurn=false; p.declarationsThisTurn=0;

  // 复仇者 death revenge
  if(G.pendingDeathRevenge!==null&&G.pendingDeathRevenge!==undefined){
    const deadIdx=G.pendingDeathRevenge;
    G.pendingDeathRevenge=null;
    G.pendingAction={type:'revenge',player:deadIdx};
    aiResolvePending();
  }

  if(G.peaceInitiator!==null&&!G.peaceBroken){
    let next=nextAlive(G.currentPlayer);
    if(next===-1){endGame({winner:'draw',msg:'无存活玩家！'});return;}
    G.currentPlayer=next; G.phase='peace';
    return;
  }

  let next=nextAlive(G.currentPlayer);
  if(next===-1){endGame({winner:'draw',msg:'无存活玩家！'});return;}
  if(next<=G.currentPlayer) G.turnCount++;
  G.currentPlayer=next; G.phase='resource';
  G.peaceInitiator=null; G.peaceResponders=[];

  const np=G.players[next];
  if(np.skipNext){np.skipNext=false; endCurrentTurn(); return;}
  np.cannotDeclare=false;
}

// ============ AI DECISION MAKING ============
function aiTakeTurn(pi){
  const p=G.players[pi];
  if(!p.alive||G.gameOver) return;

  // --- Resource phase ---
  if(G.phase==='resource'){
    // Prefer grimoire early, coins later
    if(p.grimoires.length<2 && G.grimoireDeck.length>3 && Math.random()<0.6){
      drawGrimoire(pi,1);
      if(G.gameOver) return;
    }else{
      giveCoins(pi,2);
    }
    G.phase='action';
  }

  // --- Action phase ---
  if(G.phase==='action'){
    // Must declare if forced
    if(p.mustDeclare){
      aiDoDeclare(pi);
      if(G.gameOver) return;
    }

    // 1. Try to declare known identities (or guess if desperate)
    if(aiTryDeclare(pi)){ if(G.gameOver) return; }

    // 2. Play useful grimoires
    if(p.grimoires.length>0 && Math.random()<0.5){
      aiPlayBestGrimoire(pi);
      if(G.gameOver) return;
    }

    // 3. Investigate (focus fire on partially-revealed targets)
    aiInvestigate(pi);
    if(G.gameOver) return;

    // 4. Reveal enemies if we have knowledge and coins (focus fire)
    aiRevealIfPossible(pi);
    if(G.gameOver) return;

    // 5. Maybe declare again if canDeclareTwice
    if(p.canDeclareTwice && p.declarationsThisTurn<2){
      aiTryDeclare(pi);
      if(G.gameOver) return;
    }

    // 6. Consider calling for peace if game is stalling
    aiConsiderPeace(pi);
    if(G.gameOver) return;
  }

  // Don't auto-end turn in peace phase - handled by respondToPeace
}

function aiDoDeclare(pi){
  const p=G.players[pi];
  const urev = [1,2,3].filter(l=>!p.identities[l-1].revealed);
  if(urev.length===0) return;
  const layer = randPick(urev);
  const card = p.identities[layer-1].card;
  const result = declareIdentity(pi, layer, card.type);
  if(result.success && result.correct){
    applyDeclareEffect(pi, result.card, result.layer);
  }
}

function aiTryDeclare(pi){
  const p=G.players[pi];
  if(p.cannotDeclare&&p.declarationsThisTurn>= (p.canDeclareTwice?2:1)) return false;
  const maxD=p.canDeclareTwice?2:1;
  if(p.declarationsThisTurn>=maxD) return false;

  // Find layers where we know our card
  const knownLayers = [1,2,3].filter(l=>{
    if(p.identities[l-1].revealed) return false;
    const k=getPlayerKnowledge(pi,pi,l);
    return k!==null;
  });

  // Try known identities (70% chance)
  if(knownLayers.length>0 && Math.random()<0.7){
    const layer = randPick(knownLayers);
    const card = p.identities[layer-1].card;
    const result = declareIdentity(pi, layer, card.type);
    if(result.success && result.correct){
      applyDeclareEffect(pi, result.card, result.layer);
      return true;
    }
    // Even wrong declaration reveals the layer — that's progress
    return true;
  }

  // Guess! Even without knowing, declare random type (it reveals the layer regardless)
  if(p.coins>=3 && Math.random()<0.2){
    const urev=[1,2,3].filter(l=>!p.identities[l-1].revealed);
    if(urev.length>0){
      const layer=randPick(urev);
      // Pick a random card type from the appropriate pool
      const pool=layer===1?L1_POOL:layer===2?L2_POOL:L3_POOL;
      const guess=randPick(pool).type;
      const result=declareIdentity(pi,layer,guess);
      return true;
    }
  }
  return false;
}

function aiInvestigate(pi){
  const p=G.players[pi];
  const targets=[];

  // Self-investigation priority
  const selfUrev=[1,2,3].filter(l=>!p.identities[l-1].revealed&&!getPlayerKnowledge(pi,pi,l));
  selfUrev.forEach(l=>{
    const cost=l*2*(p.discountThisTurn?0.5:1);
    const actualCost=Math.max(0,Math.floor(cost));
    if(p.coins>=actualCost) targets.push({target:pi,layer:l,cost:actualCost,priority:3});
  });

  // Others — focus fire: higher priority for targets with more already-revealed layers
  const others=G.players.filter(pl=>pl.alive&&pl.index!==pi);
  others.forEach(t=>{
    const revCount=revealedCount(t.index);
    const focusBonus=revCount*2; // +2 priority per revealed layer
    [1,2,3].forEach(l=>{
      if(t.identities[l-1].revealed) return;
      if(getPlayerKnowledge(pi,t.index,l)) return;
      const ac=p.discountThisTurn?Math.max(0,Math.floor(l/2)):l;
      if(p.coins>=ac) targets.push({target:t.index,layer:l,cost:ac,priority:1+focusBonus});
    });
  });

  if(targets.length===0) return;
  // Sort by priority desc, cost asc
  targets.sort((a,b)=>b.priority-a.priority||a.cost-b.cost);
  // Pick from top candidates
  const top=targets.filter(t=>t.priority===targets[0].priority);
  const pick=randPick(top);
  investigate(pi,pick.target,pick.layer);
}

function aiRevealIfPossible(pi){
  const p=G.players[pi];
  const opts=[];
  for(let t=0;t<G.playerCount;t++){
    if(t===pi||!G.players[t].alive) continue;
    const revCount=revealedCount(t);
    for(let l=1;l<=3;l++){
      if(G.players[t].identities[l-1].revealed) continue;
      const k=getPlayerKnowledge(pi,t,l);
      if(k){
        const cost=l*2;
        if(p.coins>=cost){
          // Priority: finish off targets with 2 revealed, or reveal known enemies
          let prio=1;
          if(revCount>=2) prio=5; // Kill shot!
          else if(revCount>=1) prio=4; // Target already wounded
          else if(k.color!==p.identities[0].card.color) prio=3; // Known enemy
          opts.push({target:t,layer:l,cost,card:k,prio});
        }
      }
    }
  }
  if(opts.length===0) return;
  // Sort by priority desc, then cheapest first
  opts.sort((a,b)=>b.prio-a.prio||a.cost-b.cost);
  const top=opts.filter(o=>o.prio===opts[0].prio);
  const pick=randPick(top);
  revealIdentity(pi,pick.target,pick.layer);
}

function aiPlayBestGrimoire(pi){
  const p=G.players[pi];
  // Prioritize useful grimoires
  const prio={g4:5,g10:5,g1:4,g2:4,g5:3,g12:3,g6:2,g13:2,g11:2,g9:1,g3:1,g7:1,g8:0};
  const sorted=p.grimoires.map((g,i)=>({g,i,prio:prio[g.type]||0}));
  sorted.sort((a,b)=>b.prio-a.prio);
  if(sorted.length>0 && sorted[0].prio>0){
    playGrimoire(pi,sorted[0].i);
  }
}

function aiPeaceDecision(pi){
  const p=G.players[pi];
  const alive=G.players.filter(pl=>pl.alive);
  const knownEnemies=alive.some(pl=>{
    if(pl.index===pi) return false;
    for(let l=1;l<=3;l++){
      if(pl.identities[l-1].revealed){
        if(pl.faction!==p.faction) return true;
      }
    }
    return false;
  });
  if(knownEnemies) return false;
  // As turns increase, more likely to accept peace
  const baseChance=0.7+Math.min(G.turnCount*0.02,0.3);
  return Math.random()<baseChance;
}

function aiConsiderPeace(pi){
  const p=G.players[pi];
  // Don't call peace if already in peace or dead
  if(G.peaceInitiator!==null) return;
  // Call peace when: many turns passed OR can't afford anything useful
  const canAfford=[1,2,3].some(l=>{
    const sc=l*2; const oc=l;
    return (p.coins>=sc && [1,2,3].filter(ll=>!p.identities[ll-1].revealed&&!getPlayerKnowledge(pi,pi,ll)).length>0)
        || (p.coins>=oc);
  });
  // Call peace if >15 rounds passed (playerCount*15 iterations)
  if(G.turnCount>G.playerCount*15 && Math.random()<0.3){
    callForPeace(pi);
    return;
  }
  // Also call if can't afford anything and very few unrevealed identities
  if(!canAfford && p.grimoires.length===0 && Math.random()<0.4){
    callForPeace(pi);
  }
}

// ============ GAME LOOP ============
function runOneGame(playerCount){
  const names = Array.from({length:playerCount},(_,i)=>'P'+(i+1));
  initGame(names);

  let safety=0;
  let stallCounter=0;
  let lastRevealCount=0;
  while(!G.gameOver && safety<MAX_TURNS){
    safety++;
    turnCount++;

    const pi=G.currentPlayer;
    const p=G.players[pi];
    if(!p.alive){endCurrentTurn();continue;}

    if(G.phase==='peace'){
      if(G.peaceResponders.includes(pi)){
        endCurrentTurn();
        continue;
      }
      const accept=aiPeaceDecision(pi);
      respondToPeace(pi,accept);
      continue;
    }

    // Normal turn
    aiTakeTurn(pi);
    if(G.gameOver) break;

    // End turn (only if not in peace and phase is action)
    if(G.phase==='action'&&!G.pendingAction){
      endCurrentTurn();
    }

    // Stall detection: if nothing revealed for many rounds, force resolution
    const totalReveals=G.players.reduce((s,pl)=>s+revealedCount(pl.index),0);
    if(totalReveals===lastRevealCount){
      stallCounter++;
    } else {
      stallCounter=0; lastRevealCount=totalReveals;
    }
    // Force peace resolve if stalled >2 full rounds (skip consensus, just end)
    if(stallCounter>G.playerCount*2 && G.peaceInitiator===null){
      G.peaceInitiator=-1;
      const alive=G.players.filter(pl=>pl.alive);
      G.peaceResponders=alive.map(pl=>pl.index);
      resolvePeace();
    }
    // Auto-end: all alive players have all identities revealed — nothing left to do
    const allRevealed=G.players.filter(pl=>pl.alive).every(pl=>revealedCount(pl.index)>=3);
    if(allRevealed && !G.gameOver){
      const alive=G.players.filter(pl=>pl.alive);
      const ac=alive.filter(pl=>pl.faction==='alien').length;
      const hc=alive.filter(pl=>pl.faction==='hybrid').length;
      if(ac>0) endGame({winner:'alien',msg:'异族存活，异族胜利！'});
      else if(hc>0) endGame({winner:'hybrid',msg:'混血儿存活，混血儿胜利！'});
      else resolvePeace();
    }
  }

  // Collect results
  const result = {
    playerCount,
    turns: G.turnCount,
    gameOver: G.gameOver,
    winner: G.gameResult?.winner||'none',
    msg: G.gameResult?.msg||'',
    safetyTripped: safety>=MAX_TURNS,
    aliveCount: G.players.filter(p=>p.alive).length,
    deadCount: G.players.filter(p=>!p.alive).length,
    factions: G.players.map(p=>({name:p.name,faction:p.faction,alive:p.alive,coins:p.coins,revealed:revealedCount(p.index)})),
    errors: [],
  };

  // Validation checks
  G.players.forEach(p=>{
    if(p.coins<0) result.errors.push(`${p.name} has negative coins: ${p.coins}`);
    if(p.grimoires.length<0) result.errors.push(`${p.name} has negative grimoires`);
    // Validate faction
    const expectedFaction=calcFaction(p.identities.map(id=>id.card));
    if(p.faction!==expectedFaction) result.errors.push(`${p.name} faction mismatch: ${p.faction} vs ${expectedFaction}`);
  });

  if(safety>=MAX_TURNS) result.errors.push(`Hit max turns (${MAX_TURNS}) - possible infinite loop`);
  if(!G.gameOver && safety<MAX_TURNS) result.errors.push('Game ended without being marked over');

  return result;
}

// ============ TEST HARNESS ============
function runTests(){
  console.log('=== AI Self-Play Test ===');
  console.log(`Running ${GAME_COUNT} games with player counts: ${PLAYER_COUNTS.join(',')}\n`);

  const allResults=[];
  const bugs=[];
  const stats={};

  for(let count of PLAYER_COUNTS){
    stats[count]={games:0,wins:{},avgTurns:0,totalTurns:0,infiniteLoops:0,errors:0};
  }

  for(let i=0;i<GAME_COUNT;i++){
    const pc=PLAYER_COUNTS[i%PLAYER_COUNTS.length];
    const r=runOneGame(pc);
    allResults.push(r);

    const s=stats[pc];
    s.games++;
    s.totalTurns+=r.turns;
    s.wins[r.winner]=(s.wins[r.winner]||0)+1;
    if(r.safetyTripped) s.infiniteLoops++;
    if(r.errors.length>0){s.errors+=r.errors.length;bugs.push({game:i+1,count:pc,errors:r.errors});}

    if((i+1)%20===0) process.stdout.write('.');
  }

  // Report
  console.log('\n\n=== RESULTS ===');
  for(let pc of PLAYER_COUNTS){
    const s=stats[pc];
    if(s.games===0) continue;
    console.log(`\n--- ${pc} Players (${s.games} games) ---`);
    console.log(`  Avg turns: ${(s.totalTurns/s.games).toFixed(1)}`);
    console.log(`  Win distribution: ${JSON.stringify(s.wins)}`);
    console.log(`  Infinite loops: ${s.infiniteLoops}`);
    console.log(`  Errors: ${s.errors}`);
  }

  if(bugs.length>0){
    console.log(`\n=== BUGS FOUND (${bugs.length} games with errors) ===`);
    // Show unique error types
    const errorTypes={};
    bugs.forEach(b=>{b.errors.forEach(e=>{errorTypes[e]= (errorTypes[e]||0)+1;});});
    Object.entries(errorTypes).sort((a,b)=>b[1]-a[1]).forEach(([msg,count])=>{
      console.log(`  [${count}x] ${msg}`);
    });
    // Show first few detailed
    console.log('\n--- First 3 buggy games detail ---');
    bugs.slice(0,3).forEach(b=>{
      console.log(`Game #${b.game} (${b.count}p):`);
      b.errors.forEach(e=>console.log(`  - ${e}`));
    });
  }else{
    console.log('\n=== NO BUGS FOUND ===');
  }

  // Summary stats
  const totalGames=allResults.length;
  const completedGames=allResults.filter(r=>r.gameOver&&!r.safetyTripped);
  console.log(`\n=== OVERALL ===`);
  console.log(`Total games: ${totalGames}`);
  console.log(`Completed normally: ${completedGames.length}/${totalGames}`);
  console.log(`Win dist overall: ${JSON.stringify(completedGames.reduce((acc,r)=>{acc[r.winner]=(acc[r.winner]||0)+1;return acc;},{}))}`);

  return {allResults,bugs,stats};
}

runTests();
