import { useGameState } from '../../hooks/useGameState';

interface Props {
  onRulebook?: () => void;
}

export function TopBar({ onRulebook }: Props) {
  const state = useGameState();
  const cp = state.players[state.currentPlayer];
  if (!cp) return null;

  const phaseLabels: Record<string, string> = {
    resource: '资源阶段',
    action: '行动阶段',
    peace: '鸣金阶段',
    gameover: '游戏结束',
  };
  const phaseGradients: Record<string, string> = {
    resource: 'from-accent-gold/20 to-accent-gold/5 border-accent-gold/30 text-accent-gold',
    action: 'from-accent-green/20 to-accent-green/5 border-accent-green/30 text-accent-green',
    peace: 'from-faction-hybrid/20 to-faction-hybrid/5 border-faction-hybrid/30 text-faction-hybrid',
    gameover: 'from-faction-red/20 to-faction-red/5 border-faction-red/30 text-faction-red',
  };

  return (
    <div className="flex justify-between items-center bg-bg-secondary/70 backdrop-blur rounded-2xl px-6 py-4 flex-wrap gap-3 border border-bg-tertiary/30 slide-up">
      <div className="flex items-center gap-3">
        <span className="text-text-dim text-sm">第</span>
        <span className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
          {state.turnCount}
        </span>
        <span className="text-text-dim text-sm">回合</span>
        <span className="w-px h-6 bg-bg-tertiary mx-1" />
        <span className="text-lg font-bold text-faction-blue">{cp.name}</span>
      </div>

      <span className={`px-4 py-1.5 rounded-full text-sm font-bold border bg-gradient-to-r ${phaseGradients[state.phase] || ''}`}>
        {phaseLabels[state.phase] || state.phase}
      </span>

      <div className="flex items-center gap-3">
        <button
          onClick={onRulebook}
          className="px-3 py-1.5 rounded-lg text-sm font-bold bg-bg-tertiary/30 hover:bg-bg-tertiary/50 text-text-dim hover:text-text-primary border border-bg-tertiary/20 hover:border-bg-tertiary/40 transition-all"
        >
          📖 规则书
        </button>
        <span className="text-2xl" role="img" aria-label="coin">⭐</span>
        <span className="text-xl font-bold text-faction-hybrid">{cp.coins}</span>
      </div>
    </div>
  );
}
