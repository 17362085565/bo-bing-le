import { useGameState } from '../../hooks/useGameState';
import type { Layer } from '../../types/cards';

const FACTION_COLORS: Record<string, { bg: string; border: string; dot: string; glow: string }> = {
  blue:    { bg: 'rgba(74,144,217,0.12)', border: 'border-faction-blue',   dot: '#4a90d9', glow: 'shadow-[0_0_15px_rgba(74,144,217,0.3)]' },
  red:     { bg: 'rgba(217,74,74,0.12)',  border: 'border-faction-red',    dot: '#d94a4a', glow: 'shadow-[0_0_15px_rgba(217,74,74,0.3)]' },
  alien:   { bg: 'rgba(155,89,182,0.12)', border: 'border-faction-alien',  dot: '#9b59b6', glow: 'shadow-[0_0_15px_rgba(155,89,182,0.3)]' },
  neutral: { bg: 'rgba(155,89,182,0.08)', border: 'border-faction-alien',  dot: '#9b59b6', glow: '' },
  unknown: { bg: 'transparent',           border: 'border-bg-tertiary',    dot: '#7f8c8d', glow: '' },
};

export function PlayerIdentityCards() {
  const state = useGameState();
  const cp = state.players[state.currentPlayer];
  if (!cp) return null;

  return (
    <div className="bg-bg-secondary/70 backdrop-blur rounded-2xl p-5 border border-bg-tertiary/30">
      <h3 className="text-center mb-4 text-text-dim text-sm font-medium tracking-wide uppercase">我的身份</h3>
      <div className="space-y-3">
        {cp.identities.map((id, i) => {
          const layer = (i + 1) as Layer;
          let displayName: string;
          let displayColor: string;
          let showColorDot = false;
          let known = false;

          if (id.revealed) {
            displayName = id.def.name;
            displayColor = id.def.color;
            showColorDot = true;
          } else {
            const key = `${state.currentPlayer}_${layer}`;
            const selfKnow = state.selfKnowledge[key];
            if (selfKnow) {
              displayName = selfKnow.name;
              displayColor = selfKnow.color;
              showColorDot = true;
              known = true;
            } else {
              displayName = '???';
              displayColor = 'unknown';
            }
          }

          const fc = FACTION_COLORS[displayColor] || FACTION_COLORS.unknown;
          const borderClass = id.revealed ? fc.border : known ? 'border-accent-gold' : 'border-bg-tertiary';
          const bgStyle = id.revealed ? fc.bg : '';

          return (
            <div
              key={layer}
              className={`relative border-2 rounded-2xl p-4 text-center transition-all duration-300 min-h-[90px] flex flex-col justify-center card-deal ${borderClass} ${fc.glow}`}
              style={{ background: bgStyle, animationDelay: `${i * 100}ms` }}
            >
              <span className="absolute top-2 right-3 text-xs text-text-muted font-mono">L{layer}</span>
              {known && !id.revealed && (
                <span className="absolute top-2 left-3 text-xs bg-accent-gold/20 text-accent-gold border border-accent-gold/30 px-2 py-0.5 rounded-full font-medium">
                  已知
                </span>
              )}
              {id.effectDisabled && (
                <span className="absolute top-2 left-3 text-xs bg-faction-red/20 text-faction-red border border-faction-red/30 px-2 py-0.5 rounded-full font-medium">
                  效果丧失
                </span>
              )}
              <span className="text-lg font-bold flex items-center justify-center gap-2">
                {showColorDot && (
                  <span className="inline-block w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-bg-primary" style={{ background: fc.dot }} />
                )}
                <span className={displayName === '???' ? 'text-text-muted text-2xl tracking-wider' : ''}>
                  {displayName}
                </span>
              </span>
              {showColorDot && displayName !== '???' && (
                <span className="text-xs text-text-dim mt-1.5 leading-relaxed">{id.def.desc}</span>
              )}
              {id.revealed && (
                <span className="text-faction-hybrid text-xs mt-1 font-medium">✦ 已揭示</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
