// ── Faction ──
export type Faction = 'blue' | 'red' | 'alien' | 'hybrid';

// ── Layer ──
export type Layer = 1 | 2 | 3;

// ── Card color ──
export type CardColor = 'blue' | 'red' | 'neutral';

// ── Identity card definition (static, from rules) ──
export interface IdentityCardDef {
  type: string;
  name: string;
  color: CardColor;
  desc: string;
  isPassive: boolean;
}

// ── Identity card instance (during game) ──
export interface IdentityCardInstance {
  uid: string;
  def: IdentityCardDef;
  layer: Layer;
  revealed: boolean;
  effectDisabled: boolean;
  removed: boolean;
}

// ── Grimoire type ──
export type GrimoireType =
  | 'wealth_1' | 'wealth_2' | 'wealth_3' | 'wealth_4'
  | 'bluff_1' | 'bluff_2'
  | 'introspect'
  | 'foresight'
  | 'recycle'
  | 'forced_trade'
  | 'compel_declare'
  | 'copy'
  | 'conspiracy_investigate'
  | 'conspiracy_reveal'
  | 'conspiracy_grimoire'
  | 'conspiracy_declare'
  | 'conspiracy_death'
  | 'conspiracy_hybrid_death';

export interface GrimoireDef {
  type: GrimoireType;
  name: string;
  desc: string;
  isConspiracy: boolean;
  isBluff: boolean;
  conspiracyCondition?: string;
}

export interface GrimoireInstance {
  uid: string;
  def: GrimoireDef;
}
