import type { Player } from '../../types/game';
import { useGameState } from '../../hooks/useGameState';

interface Props {
  player: Player;
  isCurrent: boolean;
}

const FACTION_GLOW: Record<string, string> = {
  blue: 'shadow-[0_0_12px_rgba(74,144,217,0.25)]',
  red: 'shadow-[0_0_12px_rgba(217,74,74,0.25)]',
  alien: 'shadow-[0_0_12px_rgba(155,89,182,0.25)]',
  neutral: '',
};

const FACTION_BORDER: Record<string, string> = {
  blue: 'border-faction-blue/50',
  red: 'border-faction-red/50',
  alien: 'border-faction-alien/50',
  neutral: 'border-bg-tertiary',
};

const FACTION_TEXT: Record<string, string> = {
  blue: 'text-faction-blue',
  red: 'text-faction-red',
  alien: 'text-faction-alien',
};

export function PlayerCard({ player, isCurrent }: Props) {
  const state = useGameState();
  const alive = player.alive;
  const currentClass = isCurrent
    ? 'border-faction-hybrid shadow-[0_0_20px_rgba(241,196,15,0.3)] scale-105'
    : alive
      ? 'border-bg-tertiary'
      : 'border-bg-tertiary/50 opacity-40';

  return (
    <div className={`bg-bg-primary/80 backdrop-blur rounded-2xl p-3.5 min-w-[120px] text-center border-2 transition-all duration-500 ${currentClass}`}>
      {/* Name */}
      <div className="font-bold text-sm mb-2.5 flex items-center justify-center gap-1">
        {isCurrent && <span className="text-faction-hybrid text-xs">▶</span>}
        <span className={!alive ? 'text-text-muted line-through' : ''}>{player.name}</span>
        {!alive && <span className="text-xs">💀</span>}
      </div>

      {/* Identity slots */}
      <div className="flex gap-1.5 justify-center mb-2">
        {player.identities.map(id => {
          const knowledgeKey = `${state.currentPlayer}_${player.index}_${id.layer}`;
          const known = id.revealed ? { type: id.def.type, name: id.def.name, color: id.def.color } : state.knowledge[knowledgeKey];
          const color = known?.color ?? id.def.color;
          const baseBg = known
            ? color === 'blue' ? 'rgba(74,144,217,0.25)' : color === 'red' ? 'rgba(217,74,74,0.25)' : 'rgba(155,89,182,0.25)'
            : 'transparent';
          const textColor = known
            ? FACTION_TEXT[color] || 'text-text-muted'
            : 'text-text-muted';
          const label = known ? (known.name?.[0] ?? '?') : '?';
          return (
            <div key={id.layer}
              className="w-10 h-[54px] rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background: baseBg,
                borderColor: known ? undefined : undefined,
              }}
            >
              <span className="text-[0.55em] text-text-muted mb-0.5">L{id.layer}</span>
              <span className={textColor}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Resources */}
      <div className="flex items-center justify-center gap-2 text-xs text-text-dim">
        <span className="flex items-center gap-0.5">
          <span className="text-sm">⭐</span>{player.coins}
        </span>
        <span className="text-bg-tertiary">|</span>
        <span className="flex items-center gap-0.5">
          <span className="text-sm">📜</span>{player.grimoires.length}
        </span>
      </div>

      {/* Conspiracy badge */}
      {player.playedConspiracies.length > 0 && (
        <div className="mt-1.5 flex justify-center gap-0.5">
          {player.playedConspiracies.map((_, i) => (
            <span key={i} className="text-xs opacity-70">🕵️</span>
          ))}
        </div>
      )}
    </div>
  );
}
