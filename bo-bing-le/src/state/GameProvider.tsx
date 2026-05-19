import { createContext, useReducer, useMemo, type ReactNode } from 'react';
import type { GameState, Player, GamePhase } from '../types/game';
import type { GameAction } from '../types/actions';
import { gameReducer } from './gameReducer';

// ── Contexts ──
export const GameStateContext = createContext<GameState | null>(null);
export const GameDispatchContext = createContext<React.Dispatch<GameAction> | null>(null);
export const GameDerivedContext = createContext<GameDerived | null>(null);

// ── Derived state ──
export interface GameDerived {
  currentPlayer: Player;
  alivePlayers: Player[];
  isGameOver: boolean;
  canDeclare: boolean;
  canPeace: boolean;
  canEndTurn: boolean;
  unrevealedLayers: number[];
  myKnownCards: Record<number, { type: string; name: string; color: string } | null>;
  grimoireCount: number;
}

function createDerived(state: GameState): GameDerived {
  const cp = state.players[state.currentPlayer];
  if (!cp) {
    return {
      currentPlayer: null!, alivePlayers: [], isGameOver: true,
      canDeclare: false, canPeace: false, canEndTurn: false,
      unrevealedLayers: [], myKnownCards: {}, grimoireCount: 0,
    };
  }

  const unrevealedLayers = cp.identities
    .filter(id => !id.revealed && !id.removed)
    .map(id => id.layer);

  const myKnownCards: Record<number, { type: string; name: string; color: string } | null> = {};
  for (const id of cp.identities) {
    if (id.revealed) {
      myKnownCards[id.layer] = { type: id.def.type, name: id.def.name, color: id.def.color };
    } else {
      const key = `${state.currentPlayer}_${id.layer}`;
      myKnownCards[id.layer] = state.selfKnowledge[key] || null;
    }
  }

  return {
    currentPlayer: cp,
    alivePlayers: state.players.filter(p => p.alive),
    isGameOver: state.gameResult !== null,
    canDeclare: cp.alive && unrevealedLayers.length > 0 && cp.declarationsThisTurn < cp.maxDeclarationsThisTurn,
    canPeace: state.phase === 'action' && !cp.hasActedThisTurn && state.peace.initiator === null,
    canEndTurn: state.phase === 'action' && (!cp.mustDeclare || cp.declarationsThisTurn > 0),
    unrevealedLayers,
    myKnownCards,
    grimoireCount: state.grimoireDeck.length,
  };
}

// ── Provider ──
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, () => {
    return {
      players: [], playerCount: 0, currentPlayer: 0,
      phase: 'gameover' as GamePhase, turnCount: 0,
      grimoireDeck: [], grimoireDiscard: [],
      knowledge: {}, selfKnowledge: {},
      peace: { initiator: null, responders: [], broken: false },
      killRecords: [], pendingDeathRevenge: null,
      lastGrimoireUsed: null, gameResult: null,
      log: [], logIdCounter: 0,
      pendingModal: null, lastActionWasGrimoire: false, alienFirstKilled: false,
    };
  });

  const derived = useMemo(() => createDerived(state), [state]);

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        <GameDerivedContext.Provider value={derived}>
          {children}
        </GameDerivedContext.Provider>
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}
