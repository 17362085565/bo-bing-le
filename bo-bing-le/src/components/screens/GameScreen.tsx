import { useState, useRef, useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { HandoffOverlay } from '../game/HandoffOverlay';
import { TopBar } from '../game/TopBar';
import { PlayerIdentityCards } from '../game/PlayerIdentityCards';
import { PublicBoard } from '../game/PublicBoard';
import { ActionPanel } from '../game/ActionPanel';
import { GrimoireArea } from '../game/GrimoireArea';
import { LogArea } from '../game/LogArea';
import { Modal } from '../ui/Modal';
import { ToastContainer } from '../ui/ToastContainer';
import { RulebookModal } from '../ui/RulebookModal';

export function GameScreen() {
  const state = useGameState();
  const lastTurnKey = useRef<string | null>(null);
  const turnKey = `${state.currentPlayer}-${state.turnCount}-${state.phase}`;

  const [showHandoff, setShowHandoff] = useState(true);
  const [showRulebook, setShowRulebook] = useState(false);

  useEffect(() => {
    if (lastTurnKey.current !== null && lastTurnKey.current !== turnKey) {
      if (state.phase === 'resource' || state.phase === 'peace') {
        setShowHandoff(true);
      }
    }
    lastTurnKey.current = turnKey;
  }, [turnKey]);

  return (
    <div className="relative max-w-[1200px] mx-auto p-4" style={{ zIndex: 1 }}>
      {showHandoff && <HandoffOverlay onReady={() => setShowHandoff(false)} />}

      <TopBar onRulebook={() => setShowRulebook(true)} />

      <div className="grid grid-cols-[280px_1fr_280px] gap-4 max-lg:grid-cols-1 mt-4">
        <div className="slide-up" style={{ animationDelay: '100ms' }}>
          <PlayerIdentityCards />
        </div>
        <div className="slide-up" style={{ animationDelay: '200ms' }}>
          <PublicBoard />
        </div>
        <div className="slide-up" style={{ animationDelay: '300ms' }}>
          <ActionPanel />
        </div>
      </div>

      <GrimoireArea />
      <LogArea />
      <Modal />
      <ToastContainer />
      {showRulebook && <RulebookModal onClose={() => setShowRulebook(false)} />}
    </div>
  );
}
