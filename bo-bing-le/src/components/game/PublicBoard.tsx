import { useGameState } from '../../hooks/useGameState';
import { PlayerCard } from './PlayerCard';
import { ConspiracyZone } from './ConspiracyZone';

export function PublicBoard() {
  const state = useGameState();

  return (
    <div className="bg-bg-secondary/70 backdrop-blur rounded-2xl p-5 border border-bg-tertiary/30">
      <h3 className="text-center mb-4 text-text-dim text-sm font-medium tracking-wide uppercase">场上局势</h3>
      <div className="flex flex-wrap gap-3 justify-center">
        {state.players.map((p, i) => (
          <div key={p.index} className="flex flex-col items-center gap-2 slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <PlayerCard player={p} isCurrent={p.index === state.currentPlayer} />
            <ConspiracyZone player={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
