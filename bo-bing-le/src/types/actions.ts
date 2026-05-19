import type { Layer, GrimoireInstance } from './cards';
import type { GameResult, PendingModal } from './game';

export type GameAction =
  // Lifecycle
  | { type: 'INIT_GAME'; playerNames: string[] }
  | { type: 'END_GAME'; result: GameResult }
  | { type: 'RESET_GAME' }
  // Turn flow
  | { type: 'CHOOSE_RESOURCE'; choice: 'coins' | 'coins_3' | 'grimoire' }
  | { type: 'END_TURN' }
  // Actions
  | { type: 'INVESTIGATE'; target: number; layer: Layer; isSelf: boolean }
  | { type: 'REVEAL_DIRECT'; target: number; layer: Layer }
  | { type: 'DECLARE'; layer: Layer; guessedType: string }
  // Grimoire
  | { type: 'USE_GRIMOIRE'; index: number }
  | { type: 'CONSUME_GRIMOIRE'; index: number }
  | { type: 'PLACE_CONSPIRACY'; index: number }
  | { type: 'DRAW_GRIMOIRE'; count: number }
  | { type: 'GRIMOIRE_SELECT_PLAYER'; index: number; target: number }
  | { type: 'GRIMOIRE_SELECT_LAYER'; index: number; layer: Layer }
  | { type: 'GRIMOIRE_SELECT_PLAYER_LAYER'; index: number; target: number; layer: Layer }
  | { type: 'GRIMOIRE_SELECT_GRIMOIRE'; index: number; targetUid: string }
  | { type: 'GRIMOIRE_SWAP_STEP'; index: number; player1: number; layer1: number; player2: number; layer2: number }
  // Peace
  | { type: 'INITIATE_PEACE' }
  | { type: 'RESPOND_PEACE'; accept: boolean }
  // Card effects
  | { type: 'EFFECT_REVEAL_ANY'; target: number; layer: Layer }
  | { type: 'EFFECT_HIDE_ANY'; target: number; layer: Layer }
  | { type: 'EFFECT_DISABLE'; target: number; layer: Layer }
  | { type: 'EFFECT_SKIP_PLAYER'; target: number }
  | { type: 'EFFECT_REMOVE_IDENTITY'; target: number; layer: Layer }
  | { type: 'GAIN_COINS'; amount: number }
  // Modifiers
  | { type: 'SET_INVESTIGATION_DISCOUNT' }
  | { type: 'PROTECT_PLAYER'; target: number }
  // Modal
  | { type: 'SET_MODAL'; modal: PendingModal }
  | { type: 'CLEAR_MODAL' }
  // Log
  | { type: 'ADD_LOG'; msg: string }
  // Recalculate
  | { type: 'RECALC_FACTIONS' };
