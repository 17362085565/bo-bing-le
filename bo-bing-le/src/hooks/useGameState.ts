import { useContext, useCallback } from 'react';
import { GameStateContext, GameDispatchContext } from '../state/GameProvider';
import type { GameAction } from '../types/actions';
import type { Layer } from '../types/cards';
import type { PendingModal } from '../types/game';

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be inside GameProvider');
  return ctx;
}

export function useGameDispatch() {
  const ctx = useContext(GameDispatchContext);
  if (!ctx) throw new Error('useGameDispatch must be inside GameProvider');
  return ctx;
}

export function useGameActions() {
  const dispatch = useGameDispatch();

  return {
    initGame: useCallback((names: string[]) => dispatch({ type: 'INIT_GAME', playerNames: names }), [dispatch]),
    chooseResource: useCallback((choice: 'coins' | 'coins_3' | 'grimoire') => dispatch({ type: 'CHOOSE_RESOURCE', choice }), [dispatch]),
    endTurn: useCallback(() => dispatch({ type: 'END_TURN' }), [dispatch]),
    investigate: useCallback((target: number, layer: Layer, isSelf: boolean) => dispatch({ type: 'INVESTIGATE', target, layer, isSelf }), [dispatch]),
    revealDirect: useCallback((target: number, layer: Layer) => dispatch({ type: 'REVEAL_DIRECT', target, layer }), [dispatch]),
    declare: useCallback((layer: Layer, guessedType: string) => dispatch({ type: 'DECLARE', layer, guessedType }), [dispatch]),
    useGrimoire: useCallback((index: number) => dispatch({ type: 'USE_GRIMOIRE', index }), [dispatch]),
    grimoireSelectPlayer: useCallback((index: number, target: number) => dispatch({ type: 'GRIMOIRE_SELECT_PLAYER', index, target }), [dispatch]),
    grimoireSelectLayer: useCallback((index: number, layer: Layer) => dispatch({ type: 'GRIMOIRE_SELECT_LAYER', index, layer }), [dispatch]),
    grimoireSelectPlayerLayer: useCallback((index: number, target: number, layer: Layer) => dispatch({ type: 'GRIMOIRE_SELECT_PLAYER_LAYER', index, target, layer }), [dispatch]),
    grimoireSelectGrimoire: useCallback((index: number, targetUid: string) => dispatch({ type: 'GRIMOIRE_SELECT_GRIMOIRE', index, targetUid }), [dispatch]),
    grimoireSwap: useCallback((index: number, p1: number, l1: number, p2: number, l2: number) => dispatch({ type: 'GRIMOIRE_SWAP_STEP', index, player1: p1, layer1: l1 as Layer, player2: p2, layer2: l2 as Layer }), [dispatch]),
    initiatePeace: useCallback(() => dispatch({ type: 'INITIATE_PEACE' }), [dispatch]),
    respondPeace: useCallback((accept: boolean) => dispatch({ type: 'RESPOND_PEACE', accept }), [dispatch]),
    effectRevealAny: useCallback((target: number, layer: Layer) => dispatch({ type: 'EFFECT_REVEAL_ANY', target, layer }), [dispatch]),
    effectHideAny: useCallback((target: number, layer: Layer) => dispatch({ type: 'EFFECT_HIDE_ANY', target, layer }), [dispatch]),
    effectDisable: useCallback((target: number, layer: Layer) => dispatch({ type: 'EFFECT_DISABLE', target, layer }), [dispatch]),
    effectRemoveIdentity: useCallback((target: number, layer: Layer) => dispatch({ type: 'EFFECT_REMOVE_IDENTITY', target, layer }), [dispatch]),
    effectSkipPlayer: useCallback((target: number) => dispatch({ type: 'EFFECT_SKIP_PLAYER', target }), [dispatch]),
    effectProtect: useCallback((target: number) => dispatch({ type: 'PROTECT_PLAYER', target }), [dispatch]),
    gainCoins: useCallback((amount: number) => dispatch({ type: 'GAIN_COINS', amount }), [dispatch]),
    setModal: useCallback((modal: PendingModal) => dispatch({ type: 'SET_MODAL', modal }), [dispatch]),
    clearModal: useCallback(() => dispatch({ type: 'CLEAR_MODAL' }), [dispatch]),
    addLog: useCallback((msg: string) => dispatch({ type: 'ADD_LOG', msg }), [dispatch]),
    recalcFactions: useCallback(() => dispatch({ type: 'RECALC_FACTIONS' }), [dispatch]),
    setDiscount: useCallback(() => dispatch({ type: 'SET_INVESTIGATION_DISCOUNT' }), [dispatch]),
    resetGame: useCallback(() => dispatch({ type: 'RESET_GAME' }), [dispatch]),
  };
}
