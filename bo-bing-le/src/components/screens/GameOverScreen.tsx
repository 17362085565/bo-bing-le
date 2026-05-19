import { useGameState, useGameActions } from '../../hooks/useGameState';

interface Props {
  onRestart: () => void;
}

const CONFETTI_COLORS = ['#4a90d9', '#d94a4a', '#9b59b6', '#f1c40f', '#27ae60', '#f39c12', '#ecf0f1'];

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {Array.from({ length: 40 }).map((_, i) => {
        const size = 6 + Math.random() * 10;
        const left = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = 3 + Math.random() * 4;
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const shape = Math.random() > 0.5 ? '50%' : '2px';
        return (
          <div
            key={i}
            className="absolute"
            style={{
              width: size, height: size,
              left: `${left}%`, top: '-30px',
              background: color,
              borderRadius: shape,
              opacity: 0.8,
              animation: `confettiFall ${duration}s ${delay}s linear infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export function GameOverScreen({ onRestart }: Props) {
  const state = useGameState();
  const { resetGame } = useGameActions();
  const result = state.gameResult;
  if (!result) return null;

  const factionLabel: Record<string, string> = { blue: '蓝', red: '红', alien: '异族', hybrid: '混血儿' };
  const factionTextColor: Record<string, string> = {
    blue: 'text-faction-blue', red: 'text-faction-red', alien: 'text-faction-alien', hybrid: 'text-faction-hybrid',
  };

  const winnerColor = result.winner
    ? result.winner === 'blue' ? '#4a90d9' : result.winner === 'red' ? '#d94a4a' : result.winner === 'alien' ? '#9b59b6' : '#f1c40f'
    : '#ecf0f1';

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-5 p-4"
      style={{ background: 'radial-gradient(ellipse at center, rgba(26,26,46,0.95) 0%, rgba(22,33,62,0.98) 100%)' }}>
      <Confetti />

      <div className="relative text-center scale-in">
        <h1 className="text-6xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: winnerColor }}>
          游戏结束
        </h1>
        <p className="text-2xl font-bold" style={{ color: winnerColor }}>{result.msg}</p>
      </div>

      {/* Player results */}
      <div className="relative bg-bg-secondary/80 backdrop-blur rounded-2xl p-6 max-w-lg w-full border border-bg-tertiary/30 slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-center text-text-dim text-sm font-medium mb-4 tracking-wide uppercase">身份揭晓</h3>
        <div className="space-y-2.5">
          {state.players.map((p, i) => {
            const cards = p.identities.map(id => {
              const colorLabel = id.def.color === 'blue' ? '蓝' : id.def.color === 'red' ? '红' : id.def.color === 'neutral' ? '中' : '异';
              return `${id.def.name}(${colorLabel})`;
            }).join(' / ');
            return (
              <div key={p.index}
                className="flex items-center gap-3 py-2 px-3 rounded-xl bg-bg-primary/40 border border-bg-tertiary/20 slide-up"
                style={{ animationDelay: `${300 + i * 80}ms` }}
              >
                <span className={`shrink-0 text-lg ${p.alive ? '' : 'opacity-30'}`}>
                  {p.alive ? '✅' : '💀'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm">{p.name}</strong>
                    <span className={`text-xs font-bold ${factionTextColor[p.faction] || 'text-text-muted'}`}>
                      {factionLabel[p.faction]}阵营
                    </span>
                  </div>
                  <div className="text-xs text-text-muted truncate">{cards}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => { resetGame(); onRestart(); }}
        className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-faction-blue via-[#5b9be0] to-[#357abd] text-white font-bold text-lg cursor-pointer
          hover:shadow-xl hover:shadow-faction-blue/30 hover:-translate-y-0.5 active:translate-y-0
          transition-all duration-300 slide-up bg-shift"
        style={{ animationDelay: '600ms', minHeight: '48px' }}
      >
        再来一局
      </button>
    </div>
  );
}
