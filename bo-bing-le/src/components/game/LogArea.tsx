import { useGameState } from '../../hooks/useGameState';

export function LogArea() {
  const state = useGameState();
  const entries = state.log.slice(-30);

  if (entries.length === 0) return null;

  return (
    <div className="bg-bg-secondary/70 backdrop-blur rounded-2xl p-5 mt-4 max-h-[200px] overflow-y-auto border border-bg-tertiary/30">
      <h3 className="mb-3 text-text-dim text-sm font-medium tracking-wide uppercase">日志</h3>
      <div className="space-y-0.5">
        {[...entries].reverse().map(e => (
          <div key={e.id} className="py-1.5 px-2 rounded-lg text-sm text-text-dim hover:bg-bg-tertiary/30 transition-colors duration-200 flex gap-2">
            <span className="text-text-muted text-xs shrink-0 font-mono opacity-60">{e.time}</span>
            <span className="leading-snug">{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
