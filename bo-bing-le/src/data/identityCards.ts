import type { IdentityCardDef } from '../types/cards';
import { shuffle } from '../utils/shuffle';

// L1: 8 types × 2 colors = 16 cards
export const L1_CARD_DEFS: IdentityCardDef[] = [
  // Blue variants
  { type: 'l1_hunter',    name: '猎手', color: 'blue', desc: '宣言：揭示任意一张身份牌', isPassive: false },
  { type: 'l1_merchant',  name: '商贾', color: 'blue', desc: '宣言：获得4枚星币', isPassive: false },
  { type: 'l1_seer',      name: '先知', color: 'blue', desc: '宣言：调查至多两名玩家各一张身份牌', isPassive: false },
  { type: 'l1_priest',    name: '牧师', color: 'blue', desc: '宣言：暗置任意一张身份牌', isPassive: false },
  { type: 'l1_disciple',  name: '教徒', color: 'blue', desc: '宣言：使一张身份牌丧失效果', isPassive: false },
  { type: 'l1_poet',      name: '诗人', color: 'blue', desc: '宣言：指定一名玩家跳过下个回合', isPassive: false },
  { type: 'l1_servant',   name: '侍从', color: 'blue', desc: '宣言：指定一名其他玩家，直到下回合不能被调查', isPassive: false },
  { type: 'l1_curio',     name: '奇货', color: 'blue', desc: '揭示状态下，回合开始时每有1张已揭示身份额外获得1星币', isPassive: true },
  // Red variants
  { type: 'l1_hunter',    name: '猎手', color: 'red', desc: '宣言：揭示任意一张身份牌', isPassive: false },
  { type: 'l1_merchant',  name: '商贾', color: 'red', desc: '宣言：获得4枚星币', isPassive: false },
  { type: 'l1_seer',      name: '先知', color: 'red', desc: '宣言：调查至多两名玩家各一张身份牌', isPassive: false },
  { type: 'l1_priest',    name: '牧师', color: 'red', desc: '宣言：暗置任意一张身份牌', isPassive: false },
  { type: 'l1_disciple',  name: '教徒', color: 'red', desc: '宣言：使一张身份牌丧失效果', isPassive: false },
  { type: 'l1_poet',      name: '诗人', color: 'red', desc: '宣言：指定一名玩家跳过下个回合', isPassive: false },
  { type: 'l1_servant',   name: '侍从', color: 'red', desc: '宣言：指定一名其他玩家，直到下回合不能被调查', isPassive: false },
  { type: 'l1_curio',     name: '奇货', color: 'red', desc: '揭示状态下，回合开始时每有1张已揭示身份额外获得1星币', isPassive: true },
];

// L2 Blue: 4 types
export const L2_BLUE_DEFS: IdentityCardDef[] = [
  { type: 'l2_mage',         name: '法师',   color: 'blue', desc: '宣言：抽取3张魔典', isPassive: false },
  { type: 'l2_detective',    name: '侦探',   color: 'blue', desc: '宣言：本回合调查其他玩家仅需1星币', isPassive: false },
  { type: 'l2_philosopher',  name: '哲学家', color: 'blue', desc: '揭示状态下视为红色阵营', isPassive: true },
  { type: 'l2_tumbler',      name: '不倒翁', color: 'blue', desc: '回合开始时若揭示则暗置', isPassive: true },
];

// L2 Red: 4 types
export const L2_RED_DEFS: IdentityCardDef[] = [
  { type: 'l2_bewitch',     name: '蛊惑', color: 'red', desc: '宣言：交换同等级的已揭示身份', isPassive: false },
  { type: 'l2_dreamthief',  name: '窃梦', color: 'red', desc: '宣言：猜测并揭示他人身份，正确则发动其宣言效果', isPassive: false },
  { type: 'l2_phantom',     name: '幻梦', color: 'red', desc: '宣言：移出他人一张身份', isPassive: false },
  { type: 'l2_redmoon',     name: '红月', color: 'red', desc: '宣言：揭示自己L3，若为破晓则红方直接胜利', isPassive: false },
];

// L2 Neutral: 2 types
export const L2_NEUTRAL_DEFS: IdentityCardDef[] = [
  { type: 'l2_awakened',    name: '觉醒者', color: 'neutral', desc: '宣言：查看自己所有身份', isPassive: false },
  { type: 'l2_stone',       name: '石人',   color: 'neutral', desc: '被动：被揭示时夺取揭示者所有星币和魔典', isPassive: true },
];

// L3 Blue: 3 types
export const L3_BLUE_DEFS: IdentityCardDef[] = [
  { type: 'l3_scum',        name: '败类',   color: 'blue', desc: '被揭示后视为异族阵营', isPassive: true },
  { type: 'l3_divine',      name: '神权',   color: 'blue', desc: '揭示状态下其他玩家不能调查你', isPassive: true },
  { type: 'l3_diviner',     name: '占卜师', color: 'blue', desc: '宣言：猜中他人身份可继续发动（至多3次）', isPassive: false },
];

// L3 Red: 3 types
export const L3_RED_DEFS: IdentityCardDef[] = [
  { type: 'l3_ghostking',   name: '鬼王', color: 'red', desc: '宣言：视为任意L1/L2主动宣言效果发动', isPassive: false },
  { type: 'l3_doom',        name: '天煞', color: 'red', desc: '宣言：依次揭示他人身份直到出现非蓝色', isPassive: false },
  { type: 'l3_dawn',        name: '破晓', color: 'red', desc: '宣言：揭示所有玩家的第三层身份', isPassive: false },
];

// L3 Neutral: 3 types
export const L3_NEUTRAL_DEFS: IdentityCardDef[] = [
  { type: 'l3_alien',       name: '异族',     color: 'neutral', desc: '无视前两层，强制成为异族阵营', isPassive: true },
  { type: 'l3_traitor',     name: '叛徒',     color: 'neutral', desc: '颠倒前两层身份的红蓝浓度', isPassive: true },
  { type: 'l3_pacifist',    name: '和平主义者', color: 'neutral', desc: '宣言：暗置场上所有身份牌', isPassive: false },
];

// Build decks
export function buildL1Deck(): IdentityCardDef[] {
  return shuffle([...L1_CARD_DEFS]);
}

export function buildL2Deck(): IdentityCardDef[] {
  return shuffle([...L2_BLUE_DEFS, ...L2_RED_DEFS, ...L2_NEUTRAL_DEFS]);
}

export function buildL3Deck(): IdentityCardDef[] {
  return shuffle([...L3_BLUE_DEFS, ...L3_RED_DEFS, ...L3_NEUTRAL_DEFS]);
}

// Get card pool for declaration guessing
export function getL1Pool(): IdentityCardDef[] {
  // Return unique types for guessing (only need one color variant of each)
  const seen = new Set<string>();
  return L1_CARD_DEFS.filter(c => {
    if (seen.has(c.type)) return false;
    seen.add(c.type);
    return true;
  });
}

export function getL2Pool(): IdentityCardDef[] {
  // All L2 types are unique already
  return [...L2_BLUE_DEFS, ...L2_RED_DEFS, ...L2_NEUTRAL_DEFS];
}

export function getL3Pool(): IdentityCardDef[] {
  return [...L3_BLUE_DEFS, ...L3_RED_DEFS, ...L3_NEUTRAL_DEFS];
}

// Get card definitions that can be mimicked by 鬼王 (active L1/L2 effects only)
export function getGhostKingPool(): IdentityCardDef[] {
  return [...L1_CARD_DEFS.filter(c => !c.isPassive), ...L2_BLUE_DEFS.filter(c => !c.isPassive), ...L2_RED_DEFS.filter(c => !c.isPassive), ...L2_NEUTRAL_DEFS.filter(c => !c.isPassive)]
    .filter((c, i, arr) => arr.findIndex(x => x.type === c.type) === i); // unique by type
}
