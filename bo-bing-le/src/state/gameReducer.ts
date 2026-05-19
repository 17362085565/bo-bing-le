import type { GameState, GamePhase, GameResult } from '../types/game';
import type { GameAction } from '../types/actions';
import type { GrimoireInstance, Layer } from '../types/cards';
import { buildIdentityCards, buildGrimoireDeck, drawGrimoire } from '../data/deckBuilder';
import { calcFaction } from '../utils/faction';
import { checkDeath, checkWin, resolvePeace } from '../utils/winCheck';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': return initGame(state, action.playerNames);
    case 'END_GAME': return { ...state, gameResult: action.result, phase: 'gameover' };
    case 'RESET_GAME': return createInitialState();
    case 'CHOOSE_RESOURCE': return chooseResource(state, action.choice);
    case 'END_TURN': return endTurn(state);
    case 'INVESTIGATE': return doInvestigate(state, action.target, action.layer, action.isSelf);
    case 'REVEAL_DIRECT': return doRevealDirect(state, action.target, action.layer);
    case 'DECLARE': return doDeclare(state, action.layer, action.guessedType);
    case 'USE_GRIMOIRE': return useGrimoire(state, action.index);
    case 'CONSUME_GRIMOIRE': return consumeGrimoire(state, action.index);
    case 'PLACE_CONSPIRACY': return placeConspiracy(state, action.index);
    case 'DRAW_GRIMOIRE': return drawCards(state, action.count);
    case 'GRIMOIRE_SELECT_PLAYER': return grimoireSelectPlayer(state, action.index, action.target);
    case 'GRIMOIRE_SELECT_LAYER': return grimoireSelectLayer(state, action.index, action.layer);
    case 'GRIMOIRE_SELECT_PLAYER_LAYER': return grimoireSelectPlayerLayer(state, action.index, action.target, action.layer);
    case 'GRIMOIRE_SELECT_GRIMOIRE': return grimoireSelectGrimoire(state, action.index, action.targetUid);
    case 'GRIMOIRE_SWAP_STEP': return grimoireSwapStep(state, action.index, action.player1, action.layer1, action.player2, action.layer2);
    case 'INITIATE_PEACE': return initiatePeace(state);
    case 'RESPOND_PEACE': return respondPeace(state, action.accept);
    case 'EFFECT_REVEAL_ANY': return effectRevealAny(state, action.target, action.layer);
    case 'EFFECT_HIDE_ANY': return effectHideAny(state, action.target, action.layer);
    case 'EFFECT_DISABLE': return effectDisable(state, action.target, action.layer);
    case 'EFFECT_SKIP_PLAYER': return effectSkipPlayer(state, action.target);
    case 'EFFECT_REMOVE_IDENTITY': return effectRemoveIdentity(state, action.target, action.layer);
    case 'GAIN_COINS': return gainCoins(state, action.amount);
    case 'ADD_LOG': return { ...state, log: [{ id: state.logIdCounter, msg: action.msg, time: new Date().toLocaleTimeString() }, ...state.log].slice(0, 100), logIdCounter: state.logIdCounter + 1 };
    case 'SET_MODAL': return { ...state, pendingModal: action.modal };
    case 'CLEAR_MODAL': return { ...state, pendingModal: null };
    case 'RECALC_FACTIONS': return recalcFactions(state);
    case 'SET_INVESTIGATION_DISCOUNT': {
      const s2 = { ...state, players: state.players.map(p => p.index === state.currentPlayer ? { ...p, investigationDiscount: true } : p) };
      return s2;
    }
    case 'PROTECT_PLAYER': {
      return { ...state, players: state.players.map(p => p.index === action.target ? { ...p, protected: true } : p),
        pendingModal: null };
    }
    default: return state;
  }
}

function createInitialState(): GameState {
  return {
    players: [], playerCount: 0, currentPlayer: 0,
    phase: 'gameover', turnCount: 0,
    grimoireDeck: [], grimoireDiscard: [],
    knowledge: {}, selfKnowledge: {},
    peace: { initiator: null, responders: [], broken: false },
    killRecords: [], pendingDeathRevenge: null,
    lastGrimoireUsed: null, gameResult: null,
    log: [], logIdCounter: 0,
    pendingModal: null, lastActionWasGrimoire: false, alienFirstKilled: false,
  };
}

function initGame(_state: GameState, playerNames: string[]): GameState {
  const players = buildIdentityCards(playerNames.length);
  players.forEach((p, i) => { p.name = playerNames[i]; });
  const deck = buildGrimoireDeck();

  return {
    ...createInitialState(),
    players,
    playerCount: players.length,
    currentPlayer: 0,
    phase: 'resource',
    turnCount: 1,
    grimoireDeck: deck,
    log: [
      { id: 0, msg: '游戏开始！每位玩家获得3张身份牌。', time: new Date().toLocaleTimeString() },
      { id: 1, msg: playerNames.join('、') + ' 共' + playerNames.length + '人参与。', time: new Date().toLocaleTimeString() },
    ],
    logIdCounter: 2,
  };
}

function chooseResource(state: GameState, choice: 'coins' | 'coins_3' | 'grimoire'): GameState {
  let s = withLog(state, `${state.players[state.currentPlayer].name} 选择${choice === 'grimoire' ? '抽取魔典' : '获取星币'}。`);
  if (choice === 'coins') {
    s = gainCoins(s, 2);
  } else if (choice === 'coins_3') {
    s = gainCoins(s, 3);
  } else {
    s = drawCards(s, 1);
    if (s.phase === 'gameover') return s;
  }
  s = { ...s, phase: 'action' };
  return s;
}

function endTurn(state: GameState): GameState {
  if (state.peace.initiator !== null && !state.peace.broken) {
    return advancePeace(state);
  }
  return advanceTurn(state);
}

function advanceTurn(state: GameState): GameState {
  const next = nextAlive(state, state.currentPlayer);
  if (next === -1) return { ...state, gameResult: { winner: 'draw', msg: '无存活玩家！' }, phase: 'gameover' };

  const turnCount = next <= state.currentPlayer ? state.turnCount + 1 : state.turnCount;

  // Reset current player flags
  let s: GameState = { ...state, currentPlayer: next, phase: 'resource', turnCount, peace: { initiator: null, responders: [], broken: false } };
  s = { ...s, players: s.players.map((p) => {
    let updated = { ...p, declarationsThisTurn: 0, maxDeclarationsThisTurn: 1, protected: false, investigationDiscount: false, hasActedThisTurn: false, cannotDeclare: false };
    // 不倒翁: auto-hide at turn start
    const l2 = updated.identities[1];
    if (l2.def.type === 'l2_tumbler' && l2.revealed && !l2.effectDisabled) {
      l2.revealed = false;
    }
    return updated;
  }) };

  // Skip check: if next player has skipNext, advance again
  if (s.players[next].skipNext) {
    s = { ...s, players: s.players.map(p => p.index === next ? { ...p, skipNext: false } : p) };
    s = withLog(s, `⏭️ ${s.players[next].name} 被跳过！`);
    return advanceTurn(s);
  }

  // 奇货 passive: turn start, gain coins per revealed identity
  const cp = s.players[next];
  const curioCard = cp.identities.find(id => id.def.type === 'l1_curio');
  if (curioCard && curioCard.revealed && !curioCard.effectDisabled) {
    const revealedCount = cp.identities.filter(id => id.revealed).length;
    if (revealedCount > 0) {
      s = gainCoins(s, revealedCount);
      s = withLog(s, `${cp.name} 的【奇货】额外获得${revealedCount}枚星币。`);
    }
  }

  return s;
}

function advancePeace(state: GameState): GameState {
  const next = nextAlive(state, state.currentPlayer);
  if (next === -1) return { ...state, gameResult: { winner: 'draw', msg: '无存活玩家！' }, phase: 'gameover' };

  const allAlive = state.players.filter(p => p.alive).map(p => p.index);
  const allResponded = allAlive.every(i => state.peace.responders.includes(i));

  if (allResponded) {
    const result = resolvePeace(state);
    if (result) return { ...state, gameResult: result, phase: 'gameover' };
  }

  return { ...state, currentPlayer: next, phase: 'peace' };
}

function doInvestigate(state: GameState, target: number, layer: Layer, isSelf: boolean): GameState {
  const cp = state.players[state.currentPlayer];
  const tp = state.players[target];

  if (!tp.alive) return withLog(state, '目标已死亡！');

  // Protected check (servant effect)
  if (!isSelf && tp.protected) return withLog(state, `🛡️ ${tp.name} 受侍从保护，无法调查！`);

  let cost = isSelf ? layer * 2 : layer;
  if (cp.investigationDiscount && !isSelf) cost = 1;

  if (cp.coins < cost) return withLog(state, `星币不足！需要${cost}⭐`);

  if (tp.identities[layer - 1].revealed) return withLog(state, '该身份已揭示！');

  // 神权 check: if target has L3 神权 revealed
  const divine = tp.identities[2];
  if (!isSelf && divine.def.type === 'l3_divine' && divine.revealed && !divine.effectDisabled) {
    return withLog(state, '该玩家受神权保护，无法调查！');
  }

  // Conspiracy check: investigate block
  for (const cons of tp.playedConspiracies) {
    if (cons.def.type === 'conspiracy_investigate') {
      let s = consumeConspiracy(state, target, cons);
      s = withLog(s, `🛡️ ${tp.name}的阴谋触发：调查失效！`);
      s = deductCoins(s, cost);
      s = { ...s, players: s.players.map(p => p.index === state.currentPlayer ? { ...p, hasActedThisTurn: true } : p) };
      return s;
    }
  }

  let s = deductCoins(state, cost);
  const card = tp.identities[layer - 1].def;

  if (isSelf) {
    s = { ...s, selfKnowledge: { ...s.selfKnowledge, [`${state.currentPlayer}_${layer}`]: { type: card.type, name: card.name, color: card.color } } };
  } else {
    s = { ...s, knowledge: { ...s.knowledge, [`${state.currentPlayer}_${target}_${layer}`]: { type: card.type, name: card.name, color: card.color } } };
  }

  s = { ...s, players: s.players.map(p => p.index === state.currentPlayer ? { ...p, hasActedThisTurn: true } : p) };
  s = withLog(s, `🔍 ${cp.name} 调查了${isSelf ? '自己' : tp.name}的第${layer}层身份。`);
  return s;
}

function doRevealDirect(state: GameState, target: number, layer: Layer): GameState {
  const cp = state.players[state.currentPlayer];
  const tp = state.players[target];
  const cost = layer * 2;

  if (cp.coins < cost) return withLog(state, `星币不足！需要${cost}⭐`);
  if (!tp.alive) return withLog(state, '目标已死亡！');
  if (target === state.currentPlayer) return withLog(state, '不能揭示自己的身份！');
  if (tp.identities[layer - 1].revealed) return withLog(state, '该身份已揭示！');

  // Conspiracy: reveal block
  for (const cons of tp.playedConspiracies) {
    if (cons.def.type === 'conspiracy_reveal') {
      let s = consumeConspiracy(state, target, cons);
      s = withLog(s, `🛡️ ${tp.name}的阴谋触发：揭示失效！`);
      s = deductCoins(s, cost);
      return s;
    }
  }

  let s = deductCoins(state, cost);
  s = revealCard(s, target, layer);

  // 石人 L2: steal from revealer
  const card = tp.identities[layer - 1];
  if (card.def.type === 'l2_stone' && !card.effectDisabled) {
    s = withLog(s, `🗿 石人触发！${cp.name}的所有星币和魔典被${tp.name}夺取！`);
    s = { ...s, players: s.players.map(p => {
      if (p.index === state.currentPlayer) {
        return { ...p, coins: 0, grimoires: [] };
      }
      if (p.index === target) {
        return { ...p, coins: p.coins + cp.coins, grimoires: [...p.grimoires, ...cp.grimoires] };
      }
      return p;
    })};
  }

  const died = checkDeath(s, target);
  if (died) {
    s = killPlayer(s, target, state.currentPlayer);
  }

  const win = checkWin(s);
  if (win) return { ...s, gameResult: win, phase: 'gameover' };

  return s;
}

function doDeclare(state: GameState, layer: Layer, guessedType: string): GameState {
  const p = state.players[state.currentPlayer];
  if (!p.alive) return withLog(state, '你已死亡！');
  if (p.identities[layer - 1].revealed) return withLog(state, '该层已揭示！');
  if (p.maxDeclarationsThisTurn <= p.declarationsThisTurn) return withLog(state, '宣言次数已用完！');

  const actual = p.identities[layer - 1].def;
  const correct = actual.type === guessedType;

  let s = { ...state, players: state.players.map(pl => pl.index === state.currentPlayer ? { ...pl, declarationsThisTurn: pl.declarationsThisTurn + 1, hasActedThisTurn: true } : pl) };

  // Conspiracy declare block (check all players' conspiracies)
  // For simplicity, check if anyone has a declare-block conspiracy against this player
  for (const opponent of s.players) {
    for (const cons of opponent.playedConspiracies) {
      if (cons.def.type === 'conspiracy_declare') {
        s = consumeConspiracy(s, opponent.index, cons);
        s = withLog(s, `🛡️ ${opponent.name}的阴谋触发：${p.name}的宣言失效！`);
        return s;
      }
    }
  }

  if (correct) {
    s = revealCard(s, state.currentPlayer, layer);
    s = withLog(s, `✨ ${p.name} 宣言成功！第${layer}层是【${actual.name}】！`);

    const died = checkDeath(s, state.currentPlayer);
    if (died) s = killPlayer(s, state.currentPlayer, state.currentPlayer);
    const win = checkWin(s);
    if (win) return { ...s, gameResult: win, phase: 'gameover' };

    // Trigger card effect
    return resolveDeclareEffect(s, actual.type);
  } else {
    s = withLog(s, `❌ ${p.name} 宣言失败！第${layer}层实际是【${actual.name}】（无效果）`);
    s = revealCard(s, state.currentPlayer, layer);
    const died = checkDeath(s, state.currentPlayer);
    if (died) s = killPlayer(s, state.currentPlayer, state.currentPlayer);
    const win = checkWin(s);
    if (win) return { ...s, gameResult: win, phase: 'gameover' };
    return s;
  }
}

// ── Declaration effect resolution ──
function resolveDeclareEffect(state: GameState, cardType: string): GameState {
  const cp = state.players[state.currentPlayer];
  const name = cp.name;

  // L1 Effects
  switch (cardType) {
    case 'l1_hunter':
      return setEffectModal(state, 'select_player_layer', `【猎手】选择要揭示的目标和层数`,
        'effect_reveal_any', { excludePlayer: state.currentPlayer });
    case 'l1_merchant':
      return withLog(gainCoins(state, 4), `💰 ${name}的商贾效果：获得4星币。`);
    case 'l1_seer':
      return setEffectModal(state, 'select_player_layer', `【先知】调查第一个目标`,
        'effect_seer_1', { excludePlayer: state.currentPlayer, remaining: 2 });
    case 'l1_priest':
      return setEffectModal(state, 'select_player_layer', `【牧师】选择要暗置的身份`,
        'effect_hide_any');
    case 'l1_disciple':
      return setEffectModal(state, 'select_player_layer', `【教徒】选择要丧失效果的身份`,
        'effect_disable');
    case 'l1_poet':
      return setEffectModal(state, 'select_player', `【诗人】选择跳过下回合的玩家`,
        'effect_skip_player', { excludePlayer: state.currentPlayer });
    case 'l1_servant':
      return setEffectModal(state, 'select_player', `【侍从】选择要保护的玩家`,
        'effect_protect', { excludePlayer: state.currentPlayer });

    // L2 Effects
    case 'l2_mage':
      return withLog(drawCards(state, 3), `📜 ${name}的法师效果：抽取3张魔典。`);
    case 'l2_detective':
      return withLog(setDiscount(state), `🔍 ${name}的侦探效果：本回合调查其他玩家仅需1星币。`);
    case 'l2_bewitch':
      return setEffectModal(state, 'select_player_layer', `【蛊惑】选择同等级已揭示的身份交换`,
        'effect_swap_revealed_step1', { excludePlayer: state.currentPlayer });
    case 'l2_dreamthief':
      return setEffectModal(state, 'select_player_layer', `【窃梦】选择要猜测的目标和层数`,
        'effect_dreamthief_guess', { excludePlayer: state.currentPlayer });
    case 'l2_phantom':
      return setEffectModal(state, 'select_player_layer', `【幻梦】移出他人的一张身份（移出3张=直接死亡）`,
        'effect_remove_identity', { excludePlayer: state.currentPlayer });
    case 'l2_redmoon':
      return resolveRedMoon(state);
    case 'l2_awakened':
      return resolveAwakened(state);

    // L3 Effects
    case 'l3_diviner':
      return setEffectModal(state, 'select_player_layer', `【占卜师】猜他人身份（剩余3次）`,
        'effect_diviner_guess', { excludePlayer: state.currentPlayer, remaining: 3 });
    case 'l3_ghostking':
      return setEffectModal(state, 'select_card', `【鬼王】选择要模仿的L1/L2宣言效果`,
        'effect_ghostking_mimic', { context: { layer: 1 } });
    case 'l3_doom':
      return resolveDoom(state);
    case 'l3_dawn':
      return resolveDawn(state);
    case 'l3_pacifist':
      return resolvePacifist(state);

    // Passive effects — no action needed
    default:
      return state;
  }
}

function setEffectModal(state: GameState, type: string, title: string, resolveAction: string, extra?: Record<string, unknown>): GameState {
  const modal: import('../types/game').PendingModal = {
    type: type as import('../types/game').ModalType,
    title, resolveAction,
    context: extra?.context as Record<string, unknown> || {},
    excludePlayer: extra?.excludePlayer as number | undefined,
    layers: extra?.layers as number[] | undefined,
  };
  // merge extra fields
  if (extra) Object.assign(modal, extra);
  return { ...state, pendingModal: modal };
}

function setDiscount(state: GameState): GameState {
  return { ...state, players: state.players.map(p =>
    p.index === state.currentPlayer ? { ...p, investigationDiscount: true } : p) };
}

function resolveRedMoon(state: GameState): GameState {
  const cp = state.players[state.currentPlayer];
  const l3 = cp.identities[2];
  let s = revealCard(state, state.currentPlayer, 3);
  s = withLog(s, `🌕 ${cp.name}的红月效果：揭示了自己的第3层！`);
  if (l3.def.type === 'l3_dawn' && !l3.effectDisabled) {
    s = withLog(s, `☀️ 红月揭示破晓！红方直接胜利！`);
    return { ...s, gameResult: { winner: 'red', msg: '红月揭示了破晓，红色阵营胜利！' }, phase: 'gameover' };
  }
  const died = checkDeath(s, state.currentPlayer);
  if (died) s = killPlayer(s, state.currentPlayer, state.currentPlayer);
  const win = checkWin(s);
  if (win) return { ...s, gameResult: win, phase: 'gameover' };
  return s;
}

function resolveAwakened(state: GameState): GameState {
  const cp = state.players[state.currentPlayer];
  let s = state;
  for (const id of cp.identities) {
    if (!id.revealed) {
      s = { ...s, selfKnowledge: { ...s.selfKnowledge,
        [`${state.currentPlayer}_${id.layer}`]: { type: id.def.type, name: id.def.name, color: id.def.color } } };
    }
  }
  return withLog(s, `🧠 ${cp.name}的觉醒者效果：知道了自己全部身份。`);
}

function resolveDoom(state: GameState): GameState {
  const cp = state.players[state.currentPlayer];
  let s = state;
  s = withLog(s, `💀 ${cp.name}的天煞效果：依次揭示直到出现非蓝色！`);
  // Reveal identities of other players one by one until non-blue found
  for (const p of s.players) {
    if (p.index === state.currentPlayer || !p.alive) continue;
    for (const id of p.identities) {
      if (id.revealed) continue;
      s = revealCard(s, p.index, id.layer as Layer);
      s = withLog(s, `天煞揭示了${p.name}的第${id.layer}层：${id.def.name}`);
      if (id.def.color !== 'blue') {
        s = withLog(s, `天煞遇到非蓝色，停止。`);
        const died = checkDeath(s, p.index);
        if (died) s = killPlayer(s, p.index, state.currentPlayer);
        const win = checkWin(s);
        if (win) return { ...s, gameResult: win, phase: 'gameover' };
        return s;
      }
      const died = checkDeath(s, p.index);
      if (died) s = killPlayer(s, p.index, state.currentPlayer);
      const win = checkWin(s);
      if (win) return { ...s, gameResult: win, phase: 'gameover' };
    }
  }
  return s;
}

function resolveDawn(state: GameState): GameState {
  const cp = state.players[state.currentPlayer];
  let s = state;
  s = withLog(s, `☀️ ${cp.name}的破晓效果：揭示所有玩家第3层！`);
  for (const p of s.players) {
    const l3 = p.identities[2];
    if (!l3.revealed && !l3.removed) {
      s = revealCard(s, p.index, 3);
      s = withLog(s, `破晓揭示了${p.name}的第3层：${l3.def.name}`);
      const died = checkDeath(s, p.index);
      if (died) s = killPlayer(s, p.index, state.currentPlayer);
    }
  }
  const win = checkWin(s);
  if (win) return { ...s, gameResult: win, phase: 'gameover' };
  return s;
}

function resolvePacifist(state: GameState): GameState {
  let s = state;
  s = withLog(s, `🕊️ 和平主义者效果：暗置场上所有身份牌！`);
  s = { ...s, players: s.players.map(p => ({
    ...p,
    identities: p.identities.map(id => ({ ...id, revealed: false })),
  })) };
  return s;
}

// Grimoire effects

// Grimoire effects
function useGrimoire(state: GameState, index: number): GameState {
  const p = state.players[state.currentPlayer];
  if (index < 0 || index >= p.grimoires.length) return state;
  const g = p.grimoires[index];
  const def = g.def;

  // Check for grimoire-block conspiracy from any opponent
  for (const opponent of state.players) {
    if (opponent.index === state.currentPlayer) continue;
    for (const cons of opponent.playedConspiracies) {
      if (cons.def.type === 'conspiracy_grimoire') {
        let s = consumeConspiracy(state, opponent.index, cons);
        s = withLog(s, `🛡️ ${opponent.name}的阴谋触发：${p.name}的魔典【${def.name}】失效！`);
        s = consumeGrimoire(s, index);
        s = { ...s, players: s.players.map(pl => pl.index === state.currentPlayer ? { ...pl, hasActedThisTurn: true } : pl) };
        return s;
      }
    }
  }

  let s = state;

  // Direct-effect cards: consume immediately, mark turn at end
  // Modal / conspiracy cards: set pendingModal, return early (no turn mark yet)
  switch (def.type) {
    case 'wealth_1': s = consumeGrimoire(s, index); s = gainCoins(s, 1); break;
    case 'wealth_2': s = consumeGrimoire(s, index); s = gainCoins(s, 2); break;
    case 'wealth_3': s = consumeGrimoire(s, index); s = gainCoins(s, 3); break;
    case 'wealth_4': s = consumeGrimoire(s, index); s = gainCoins(s, 4); break;
    case 'bluff_1':
    case 'bluff_2':
      s = placeConspiracy(s, index);
      s = withLog(s, `${p.name} 打出一张阴谋。`);
      break;
    case 'copy': {
      const last = state.lastGrimoireUsed;
      if (!last) return withLog(state, '无上一张使用的魔典，复制无效！');

      // Conspiracy / bluff → place copy with the ORIGINAL card's def (so conspiracy checks match)
      if (last.def.isConspiracy || last.def.isBluff) {
        const g = p.grimoires[index];
        s = {
          ...s,
          players: s.players.map(pl => {
            if (pl.index !== state.currentPlayer) return pl;
            return {
              ...pl,
              grimoires: pl.grimoires.filter((_, i) => i !== index),
              playedConspiracies: [...pl.playedConspiracies, { ...g, def: last.def }],
            };
          }),
          lastGrimoireUsed: { ...g, def: last.def },
        };
        s = withLog(s, `📋 ${p.name}使用复制魔典，复制了阴谋效果！`);
        break;
      }

      // Modal-based: re-open modal for user to choose targets (grimoireSelect* will consume)
      switch (last.def.type) {
        case 'introspect': {
          const urev = p.identities.filter(id => !id.revealed).map(id => id.layer);
          if (urev.length === 0) return withLog(state, '没有未揭示的身份可内省！');
          s = { ...s, pendingModal: { type: 'select_layer_list', title: '自省（复制）：查看自己哪一层？', layers: urev, resolveAction: 'grimoire_introspect', context: { grimoireIndex: index } } };
          return s;
        }
        case 'foresight':
          s = { ...s, pendingModal: { type: 'select_player_layer', title: '预知（复制）：选择目标和层数', excludePlayer: state.currentPlayer, resolveAction: 'grimoire_foresight', context: { grimoireIndex: index } } };
          return s;
        case 'recycle': {
          const disc = state.grimoireDiscard;
          if (disc.length === 0) return withLog(state, '弃牌堆为空，回收无效！');
          s = { ...s, pendingModal: { type: 'select_grimoire_from_list', title: '回收（复制）：选择一张魔典', grimoireList: [...disc].slice(-5), resolveAction: 'grimoire_recycle', context: { grimoireIndex: index } } };
          return s;
        }
        case 'forced_trade':
          s = { ...s, pendingModal: { type: 'select_player', title: '强买强卖（复制）：选择第一位玩家', excludePlayer: state.currentPlayer, resolveAction: 'grimoire_forced_trade_p1', context: { grimoireIndex: index, step: 1 } } };
          return s;
        case 'compel_declare':
          s = { ...s, pendingModal: { type: 'select_player', title: '逼言（复制）：选择下回合必须宣言的玩家', excludePlayer: state.currentPlayer, resolveAction: 'grimoire_compel', context: { grimoireIndex: index } } };
          return s;
        case 'copy':
          return withLog(state, '无法复制复制魔典！');
        default:
          // Direct-effect cards (wealth_*): consume & apply immediately
          s = consumeGrimoire(s, index);
          s = withLog(s, `📋 ${p.name}使用复制魔典，复制了【${last.def.name}】的效果！`);
          return applyGrimoireEffect(s, last.def);
      }
    }
    // Real conspiracy cards: place face-up as conspiracy
    case 'conspiracy_investigate':
    case 'conspiracy_reveal':
    case 'conspiracy_grimoire':
    case 'conspiracy_declare':
    case 'conspiracy_death':
    case 'conspiracy_hybrid_death':
      s = placeConspiracy(s, index);
      s = withLog(s, `${p.name} 打出一张阴谋。`);
      break;
    // Modal-based: set pendingModal, return early (grimoireSelect* will consume & mark turn)
    case 'introspect': {
      const urev = p.identities.filter(id => !id.revealed).map(id => id.layer);
      if (urev.length === 0) return withLog(state, '没有未揭示的身份可内省！');
      s = { ...s, pendingModal: { type: 'select_layer_list', title: '自省：查看自己哪一层？', layers: urev, resolveAction: 'grimoire_introspect', context: { grimoireIndex: index } } };
      return s;
    }
    case 'foresight':
      s = { ...s, pendingModal: { type: 'select_player_layer', title: '预知：选择目标和层数', excludePlayer: state.currentPlayer, resolveAction: 'grimoire_foresight', context: { grimoireIndex: index } } };
      return s;
    case 'recycle': {
      const disc = state.grimoireDiscard;
      if (disc.length === 0) return withLog(state, '弃牌堆为空，回收无效！');
      s = { ...s, pendingModal: { type: 'select_grimoire_from_list', title: '回收：选择一张魔典', grimoireList: [...disc].slice(-5), resolveAction: 'grimoire_recycle', context: { grimoireIndex: index } } };
      return s;
    }
    case 'forced_trade':
      s = { ...s, pendingModal: { type: 'select_player', title: '强买强卖：选择第一位玩家', excludePlayer: state.currentPlayer, resolveAction: 'grimoire_forced_trade_p1', context: { grimoireIndex: index, step: 1 } } };
      return s;
    case 'compel_declare':
      s = { ...s, pendingModal: { type: 'select_player', title: '逼言：选择下回合必须宣言的玩家', excludePlayer: state.currentPlayer, resolveAction: 'grimoire_compel', context: { grimoireIndex: index } } };
      return s;
    default:
      s = withLog(s, `📜 ${p.name}使用了魔典【${def.name}】。`);
      s = { ...s, lastActionWasGrimoire: true };
      break;
  }

  return { ...s, players: s.players.map(pl => pl.index === state.currentPlayer ? { ...pl, hasActedThisTurn: true } : pl) };
}

// Apply a grimoire effect by type (used for copy and re-application)
function applyGrimoireEffect(state: GameState, def: import('../types/cards').GrimoireDef): GameState {
  const p = state.players[state.currentPlayer];
  let s = state;

  switch (def.type) {
    case 'wealth_1': s = gainCoins(s, 1); break;
    case 'wealth_2': s = gainCoins(s, 2); break;
    case 'wealth_3': s = gainCoins(s, 3); break;
    case 'wealth_4': s = gainCoins(s, 4); break;
    case 'introspect': {
      const urev = p.identities.filter(id => !id.revealed).map(id => id.layer);
      if (urev.length > 0) {
        s = { ...s, selfKnowledge: { ...s.selfKnowledge, [`${state.currentPlayer}_${urev[0]}`]: { type: p.identities[urev[0] - 1].def.type, name: p.identities[urev[0] - 1].def.name, color: p.identities[urev[0] - 1].def.color } } };
        s = withLog(s, `🔍 ${p.name} 通过复制内省了自己。`);
      }
      break;
    }
    default:
      s = withLog(s, `📋 复制效果已应用。`);
      break;
  }

  return { ...s, players: s.players.map(pl => pl.index === state.currentPlayer ? { ...pl, hasActedThisTurn: true } : pl) };
}

function consumeGrimoire(state: GameState, index: number): GameState {
  const p = state.players[state.currentPlayer];
  const g = p.grimoires[index];
  return {
    ...state,
    players: state.players.map(pl => {
      if (pl.index !== state.currentPlayer) return pl;
      return { ...pl, grimoires: pl.grimoires.filter((_, i) => i !== index) };
    }),
    grimoireDiscard: [...state.grimoireDiscard, g],
    lastGrimoireUsed: g,
    lastActionWasGrimoire: true,
  };
}

function placeConspiracy(state: GameState, index: number): GameState {
  const p = state.players[state.currentPlayer];
  const g = p.grimoires[index];
  return {
    ...state,
    players: state.players.map(pl => {
      if (pl.index !== state.currentPlayer) return pl;
      return {
        ...pl,
        grimoires: pl.grimoires.filter((_, i) => i !== index),
        playedConspiracies: [...pl.playedConspiracies, g],
      };
    }),
    lastGrimoireUsed: g,
  };
}

function grimoireSelectPlayer(state: GameState, index: number, target: number): GameState {
  let s = consumeGrimoire(state, index);
  const g = state.players[state.currentPlayer].grimoires[index];

  switch (g.def.type) {
    case 'compel_declare':
      s = { ...s, players: s.players.map(p => p.index === target ? { ...p, mustDeclare: true } : p) };
      s = withLog(s, `📢 ${s.players[target].name} 下回合必须宣言。`);
      break;
  }
  return { ...s, players: s.players.map(pl => pl.index === state.currentPlayer ? { ...pl, hasActedThisTurn: true } : pl) };
}

function grimoireSelectLayer(state: GameState, index: number, layer: Layer): GameState {
  const g = state.players[state.currentPlayer].grimoires[index];
  let s = consumeGrimoire(state, index);
  const cp = s.players[state.currentPlayer];

  switch (g?.def.type) {
    case 'introspect':
      const card = cp.identities[layer - 1].def;
      s = { ...s, selfKnowledge: { ...s.selfKnowledge, [`${state.currentPlayer}_${layer}`]: { type: card.type, name: card.name, color: card.color } } };
      s = withLog(s, `🔍 ${cp.name} 内省了自己第${layer}层。`);
      break;
  }
  return { ...s, players: s.players.map(pl => pl.index === state.currentPlayer ? { ...pl, hasActedThisTurn: true } : pl) };
}

function grimoireSelectPlayerLayer(state: GameState, index: number, target: number, layer: Layer): GameState {
  let s = consumeGrimoire(state, index);
  const cp = s.players[state.currentPlayer];
  const tp = s.players[target];

  const card = tp.identities[layer - 1].def;
  s = { ...s, knowledge: { ...s.knowledge, [`${state.currentPlayer}_${target}_${layer}`]: { type: card.type, name: card.name, color: card.color } } };
  s = withLog(s, `🔍 ${cp.name} 通过预知查看了${tp.name}的第${layer}层。`);
  return { ...s, players: s.players.map(pl => pl.index === state.currentPlayer ? { ...pl, hasActedThisTurn: true } : pl) };
}

function grimoireSelectGrimoire(state: GameState, index: number, targetUid: string): GameState {
  let s = consumeGrimoire(state, index);
  const idx = s.grimoireDiscard.findIndex(g => g.uid === targetUid);
  if (idx >= 0) {
    const g = s.grimoireDiscard[idx];
    s = { ...s, grimoireDiscard: s.grimoireDiscard.filter((_, i) => i !== idx) };
    s = { ...s, players: s.players.map(p => p.index === state.currentPlayer ? { ...p, grimoires: [...p.grimoires, g] } : p) };
    s = withLog(s, `♻️ 回收了【${g.def.name}】。`);
  }
  return { ...s, players: s.players.map(pl => pl.index === state.currentPlayer ? { ...pl, hasActedThisTurn: true } : pl) };
}

function grimoireSwapStep(state: GameState, index: number, player1: number, layer1: number, player2: number, layer2: number): GameState {
  let s = consumeGrimoire(state, index);
  s = swapCards(s, player1, layer1 as Layer, player2, layer2 as Layer);
  s = withLog(s, `🔄 ${s.players[player1].name}与${s.players[player2].name}的身份被交换。`);
  return { ...s, players: s.players.map(pl => pl.index === state.currentPlayer ? { ...pl, hasActedThisTurn: true } : pl) };
}

// Peace
function initiatePeace(state: GameState): GameState {
  const p = state.players[state.currentPlayer];
  if (p.hasActedThisTurn) return withLog(state, '已进行过操作，无法鸣金！');
  let s = withLog(state, `🕊️ ${p.name} 发起鸣金！认为场上所有人均为队友。`);
  s = { ...s, peace: { initiator: state.currentPlayer, responders: [state.currentPlayer], broken: false } };
  return advancePeace(s);
}

function respondPeace(state: GameState, accept: boolean): GameState {
  if (accept) {
    let s = { ...state, peace: { ...state.peace, responders: [...state.peace.responders, state.currentPlayer] } };
    s = withLog(s, `🕊️ ${s.players[state.currentPlayer].name} 响应鸣金。`);
    const allAlive = state.players.filter(p => p.alive).map(p => p.index);
    if (allAlive.every(i => s.peace.responders.includes(i))) {
      const result = resolvePeace(s);
      if (result) return { ...s, gameResult: result, phase: 'gameover' };
      // All responded but no consensus - broken
      s = withLog(s, '鸣金未达成共识，和平投票失败。');
      s = { ...s, peace: { ...s.peace, broken: true, initiator: null, responders: [] } };
      return advanceTurn(s);
    }
    return advancePeace(s);
  } else {
    let s = withLog(state, `💔 ${state.players[state.currentPlayer].name} 拒绝鸣金！`);
    s = { ...s, peace: { ...s.peace, broken: true, initiator: null, responders: [] }, phase: 'resource' as GamePhase };
    return s;
  }
}

// Card effect actions
function effectRevealAny(state: GameState, target: number, layer: Layer): GameState {
  let s = revealCard(state, target, layer);
  s = withLog(s, `📢 ${s.players[state.currentPlayer].name}揭示了${s.players[target].name}的第${layer}层！`);
  // 石人 check
  const card = state.players[target].identities[layer - 1];
  if (card.def.type === 'l2_stone' && !card.effectDisabled) {
    const revealer = s.players[state.currentPlayer];
    s = withLog(s, `🗿 石人触发！${revealer.name}的所有星币和魔典被${s.players[target].name}夺取！`);
    s = { ...s, players: s.players.map(p => {
      if (p.index === state.currentPlayer) return { ...p, coins: 0, grimoires: [] };
      if (p.index === target) return { ...p, coins: p.coins + revealer.coins, grimoires: [...p.grimoires, ...revealer.grimoires] };
      return p;
    })};
  }
  const died = checkDeath(s, target);
  if (died) s = killPlayer(s, target, state.currentPlayer);
  const win = checkWin(s);
  if (win) return { ...s, gameResult: win, phase: 'gameover' };
  return s;
}

function effectHideAny(state: GameState, target: number, layer: Layer): GameState {
  return {
    ...state,
    players: state.players.map(p => {
      if (p.index !== target) return p;
      return { ...p, identities: p.identities.map(id => id.layer === layer ? { ...id, revealed: false } : id) };
    }),
  };
}

function effectDisable(state: GameState, target: number, layer: Layer): GameState {
  let s = { ...state, players: state.players.map(p => {
    if (p.index !== target) return p;
    return { ...p, identities: p.identities.map(id => id.layer === layer ? { ...id, effectDisabled: true } : id) };
  }) };
  s = withLog(s, `🚫 ${s.players[target].name}的第${layer}层身份效果被丧失！`);
  // Recalc factions for all players
  return recalcFactions(s);
}

function effectSkipPlayer(state: GameState, target: number): GameState {
  let s = { ...state, players: state.players.map(p => p.index === target ? { ...p, skipNext: true } : p) };
  s = withLog(s, `⏭️ ${s.players[target].name}下回合被跳过。`);
  return s;
}

function effectRemoveIdentity(state: GameState, target: number, layer: Layer): GameState {
  let s = { ...state, players: state.players.map(p => {
    if (p.index !== target) return p;
    return { ...p, identities: p.identities.map(id => id.layer === layer ? { ...id, removed: true, revealed: true } : id) };
  }) };
  s = withLog(s, `💀 ${s.players[target].name}的第${layer}层身份被移出！`);
  const died = checkDeath(s, target);
  if (died) s = killPlayer(s, target, state.currentPlayer);
  const win = checkWin(s);
  if (win) return { ...s, gameResult: win, phase: 'gameover' };
  return s;
}

// Helpers
function gainCoins(state: GameState, amount: number): GameState {
  return { ...state, players: state.players.map(p => p.index === state.currentPlayer ? { ...p, coins: p.coins + amount } : p) };
}

function deductCoins(state: GameState, amount: number): GameState {
  return { ...state, players: state.players.map(p => p.index === state.currentPlayer ? { ...p, coins: p.coins - amount } : p) };
}

function drawCards(state: GameState, count: number): GameState {
  const { drawn, deck, empty } = drawGrimoire(state.grimoireDeck, state.grimoireDiscard, count);
  if (empty) {
    // Deck empty = auto peace
    let s = withLog(state, '📜 魔典牌堆已空，自动鸣金！');
    const alive = s.players.filter(p => p.alive);
    s = { ...s, peace: { initiator: -1, responders: alive.map(p => p.index), broken: false },
      grimoireDeck: deck, grimoireDiscard: [...state.grimoireDiscard] };
    const result = resolvePeace(s);
    if (result) return { ...s, gameResult: result, phase: 'gameover' };
    return s;
  }
  return {
    ...state,
    grimoireDeck: deck,
    players: state.players.map(p => p.index === state.currentPlayer
      ? { ...p, grimoires: [...p.grimoires, ...drawn] } : p),
  };
}

function revealCard(state: GameState, target: number, layer: Layer) {
  return { ...state, players: state.players.map(p => {
    if (p.index !== target) return p;
    return { ...p, identities: p.identities.map(id => id.layer === layer ? { ...id, revealed: true } : id) };
  }) };
}

function killPlayer(state: GameState, victim: number, killer: number) {
  let s = state;

  // Hybrid-death conspiracy: if victim is hybrid with this conspiracy, hybrid wins
  if (state.players[victim].faction === 'hybrid') {
    for (const cons of s.players[victim].playedConspiracies) {
      if (cons.def.type === 'conspiracy_hybrid_death') {
        s = consumeConspiracy(s, victim, cons);
        s = withLog(s, `👑 ${s.players[victim].name}是混血儿，死亡时阴谋触发！`);
        s = {
          ...s,
          players: s.players.map(p => p.index === victim ? { ...p, alive: false } : p),
          killRecords: [...state.killRecords, { killer, victim }],
        };
        const hybridWinResult: GameResult = { winner: 'hybrid', msg: `混血儿${s.players[victim].name}死亡，混血儿阵营胜利！` };
        return { ...s, gameResult: hybridWinResult, phase: 'gameover' as GamePhase };
      }
    }
  }

  // Death conspiracy: if victim has death conspiracy, consume it and hide L3
  for (const cons of s.players[victim].playedConspiracies) {
    if (cons.def.type === 'conspiracy_death') {
      s = consumeConspiracy(s, victim, cons);
      s = withLog(s, `🛡️ ${s.players[victim].name}的死亡阴谋触发：暗置第3层身份！`);
      s = { ...s, players: s.players.map(p => {
        if (p.index !== victim) return p;
        return { ...p, identities: p.identities.map(id => id.layer === 3 ? { ...id, revealed: false } : id) };
      })};
      return s; // Survive this death
    }
  }

  const isFirstKill = state.killRecords.length === 0;
  s = withLog(s, `💀 ${state.players[victim].name} 死亡！`);
  s = { ...s, players: s.players.map(p => p.index === victim ? { ...p, alive: false } : p),
    killRecords: [...state.killRecords, { killer, victim }] };

  // 异族不被首杀: if first kill is alien, mark alien priority lost
  if (isFirstKill && state.players[victim].faction === 'alien') {
    s = { ...s, alienFirstKilled: true };
    s = withLog(s, `👽 异族被首杀！异族特殊胜利条件失效。`);
  }

  // 败类 check: if victim had L3 败类 revealed, recalc
  const l3 = state.players[victim].identities[2];
  if (l3.def.type === 'l3_scum' && l3.revealed && !l3.effectDisabled) {
    s = recalcFactions(s);
  }

  return s;
}

function swapCards(state: GameState, p1: number, l1: Layer, p2: number, l2: Layer) {
  const player1 = state.players[p1];
  const player2 = state.players[p2];
  const card1 = { ...player1.identities[l1 - 1] };
  const card2 = { ...player2.identities[l2 - 1] };

  let s = { ...state, players: state.players.map(p => {
    if (p.index === p1) return { ...p, identities: p.identities.map(id => id.layer === l1 ? { ...card2, layer: l1 } : id) };
    if (p.index === p2) return { ...p, identities: p.identities.map(id => id.layer === l2 ? { ...card1, layer: l2 } : id) };
    return p;
  }) };
  return recalcFactions(s);
}

function consumeConspiracy(state: GameState, player: number, conspiracy: GrimoireInstance) {
  return {
    ...state,
    players: state.players.map(p => {
      if (p.index !== player) return p;
      return { ...p, playedConspiracies: p.playedConspiracies.filter(c => c.uid !== conspiracy.uid) };
    }),
    grimoireDiscard: [...state.grimoireDiscard, conspiracy],
  };
}

function recalcFactions(state: GameState): GameState {
  return { ...state, players: state.players.map(p => ({ ...p, faction: calcFaction(p.identities) })) };
}

function nextAlive(state: GameState, from: number): number {
  const n = state.playerCount;
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n;
    if (state.players[idx].alive) return idx;
  }
  return -1;
}

function withLog(state: GameState, msg: string): GameState {
  return { ...state, log: [{ id: state.logIdCounter, msg, time: new Date().toLocaleTimeString() }, ...state.log].slice(0, 100), logIdCounter: state.logIdCounter + 1 };
}
