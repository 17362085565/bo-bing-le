import { useGameState, useGameActions } from '../../hooks/useGameState';

export function GrimoireArea() {
  const state = useGameState();
  const actions = useGameActions();
  const cp = state.players[state.currentPlayer];
  if (!cp || cp.grimoires.length === 0) return null;

  return (
    <div className="bg-bg-secondary/70 backdrop-blur rounded-2xl p-5 mt-4 border border-bg-tertiary/30">
      <h3 className="mb-3 text-text-dim text-sm font-medium tracking-wide uppercase">魔典手牌</h3>
      <div className="flex gap-3 flex-wrap">
        {cp.grimoires.map((g, i) => {
          const def = g.def;
          const canUse = !(def.type === 'copy' && !state.lastGrimoireUsed);

          let borderColor: string;
          let glowClass: string;
          if (def.isConspiracy) {
            borderColor = 'border-faction-alien/60';
            glowClass = 'hover:shadow-[0_0_16px_rgba(155,89,182,0.3)]';
          } else if (def.isBluff) {
            borderColor = 'border-faction-hybrid/60';
            glowClass = 'hover:shadow-[0_0_16px_rgba(241,196,15,0.3)]';
          } else {
            borderColor = 'border-bg-tertiary';
            glowClass = 'hover:shadow-[0_0_12px_rgba(236,240,241,0.15)]';
          }

          return (
            <div
              key={i}
              onClick={() => canUse && actions.useGrimoire(i)}
              className={`bg-gradient-to-br from-bg-tertiary/80 via-bg-tertiary/60 to-bg-primary/80 border-2 rounded-2xl px-4 py-3 cursor-pointer text-sm min-w-[90px] max-w-[130px] text-center transition-all duration-300
                ${borderColor} ${glowClass}
                hover:-translate-y-1 hover:border-faction-hybrid/70
                ${!canUse ? 'opacity-30 cursor-not-allowed grayscale' : ''}
                card-deal`}
              title={def.desc}
              style={{ animationDelay: `${i * 80}ms`, minHeight: '56px' }}
            >
              <div className={`font-bold text-sm mb-1 ${
                def.isConspiracy ? 'text-faction-alien' :
                def.isBluff ? 'text-faction-hybrid' : 'text-text-primary'
              }`}>
                {def.name}
              </div>
              <div className="text-xs text-text-dim leading-snug">{def.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
