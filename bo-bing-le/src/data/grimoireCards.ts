import type { GrimoireDef } from '../types/cards';

export const GRIMOIRE_DEFS: GrimoireDef[] = [
  // Wealth (4)
  { type: 'wealth_1', name: '财富', desc: '获得1枚星币', isConspiracy: false, isBluff: false },
  { type: 'wealth_2', name: '财富', desc: '获得2枚星币', isConspiracy: false, isBluff: false },
  { type: 'wealth_3', name: '财富', desc: '获得3枚星币', isConspiracy: false, isBluff: false },
  { type: 'wealth_4', name: '财富', desc: '获得4枚星币', isConspiracy: false, isBluff: false },
  // Bluff (2)
  { type: 'bluff_1', name: '矫饰', desc: '装作阴谋牌打出（无效果）', isConspiracy: false, isBluff: true },
  { type: 'bluff_2', name: '矫饰', desc: '装作阴谋牌打出（无效果）', isConspiracy: false, isBluff: true },
  // Functional (7)
  { type: 'introspect',     name: '自省',     desc: '查看自己的一张身份牌', isConspiracy: false, isBluff: false },
  { type: 'foresight',      name: '预知',     desc: '查看其他玩家的一张身份牌', isConspiracy: false, isBluff: false },
  { type: 'recycle',        name: '回收',     desc: '从弃牌堆中获得一张魔典', isConspiracy: false, isBluff: false },
  { type: 'forced_trade',   name: '强买强卖', desc: '交换两名玩家同等级的身份', isConspiracy: false, isBluff: false },
  { type: 'compel_declare', name: '逼言',     desc: '选择一名玩家，其下回合必须宣言', isConspiracy: false, isBluff: false },
  { type: 'copy',           name: '复制',     desc: '效果为你使用的上一张魔典的效果', isConspiracy: false, isBluff: false },
  // Conspiracy (6)
  { type: 'conspiracy_investigate', name: '阴谋', desc: '他人调查你时使其失效', isConspiracy: true, isBluff: false, conspiracyCondition: 'investigate' },
  { type: 'conspiracy_reveal',      name: '阴谋', desc: '他人揭示你的身份时使其失效', isConspiracy: true, isBluff: false, conspiracyCondition: 'reveal' },
  { type: 'conspiracy_grimoire',    name: '阴谋', desc: '他人使用魔典时使其失效', isConspiracy: true, isBluff: false, conspiracyCondition: 'grimoire' },
  { type: 'conspiracy_declare',     name: '阴谋', desc: '他人宣言时使其失效', isConspiracy: true, isBluff: false, conspiracyCondition: 'declare' },
  { type: 'conspiracy_death',       name: '阴谋', desc: '即将死亡时暗置L3', isConspiracy: true, isBluff: false, conspiracyCondition: 'death' },
  { type: 'conspiracy_hybrid_death', name: '阴谋', desc: '若你是一名混血儿，当你死亡时，你的阵营胜利', isConspiracy: true, isBluff: false, conspiracyCondition: 'death' },
];
