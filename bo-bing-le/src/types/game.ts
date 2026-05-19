import type { Faction, IdentityCardInstance, GrimoireInstance } from './cards';

export interface Player {
  index: number;
  name: string;
  identities: IdentityCardInstance[];
  coins: number;
  grimoires: GrimoireInstance[];
  playedConspiracies: GrimoireInstance[];
  alive: boolean;
  faction: Faction;
  skipNext: boolean;
  mustDeclare: boolean;
  cannotDeclare: boolean;
  declarationsThisTurn: number;
  maxDeclarationsThisTurn: number;
  protected: boolean;
  investigationDiscount: boolean;
  hasActedThisTurn: boolean;
}

export interface KnowledgeMap {
  [key: string]: KnowledgeEntry;
}

export interface KnowledgeEntry {
  type: string;
  name: string;
  color: string;
}

export type GamePhase = 'resource' | 'action' | 'peace' | 'gameover';

export interface PeaceState {
  initiator: number | null;
  responders: number[];
  broken: boolean;
}

export interface KillRecord {
  killer: number;
  victim: number;
}

export interface LogEntry {
  id: number;
  msg: string;
  time: string;
}

export interface GameResult {
  winner: Faction | 'draw';
  msg: string;
}

export interface PlayerResult {
  name: string;
  cards: string;
  faction: Faction;
  alive: boolean;
}

export type ModalType =
  | 'select_player'
  | 'select_layer'
  | 'select_player_layer'
  | 'select_card'
  | 'select_layer_list'
  | 'select_grimoire'
  | 'select_grimoire_from_list'
  | 'confirm_peace'
  | 'confirm_continue';

export interface PendingModal {
  type: ModalType;
  title: string;
  excludePlayer?: number;
  layer?: number;
  layers?: number[];
  cardPool?: string[];
  grimoireList?: GrimoireInstance[];
  resolveAction: string; // key for resolving
  context?: Record<string, unknown>;
  step?: number;
  player1?: number;
  layer1?: number;
}

export interface GameState {
  players: Player[];
  playerCount: number;
  currentPlayer: number;
  phase: GamePhase;
  turnCount: number;
  grimoireDeck: GrimoireInstance[];
  grimoireDiscard: GrimoireInstance[];
  knowledge: KnowledgeMap;
  selfKnowledge: KnowledgeMap;
  peace: PeaceState;
  killRecords: KillRecord[];
  pendingDeathRevenge: number | null;
  lastGrimoireUsed: GrimoireInstance | null;
  gameResult: GameResult | null;
  log: LogEntry[];
  logIdCounter: number;
  pendingModal: PendingModal | null;
  lastActionWasGrimoire: boolean;
  alienFirstKilled: boolean;
}
