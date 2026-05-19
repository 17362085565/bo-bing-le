import { useGameState } from '../../hooks/useGameState';

interface Props {
  onReady: () => void;
}

export function HandoffOverlay({ onReady }: Props) {
  const state = useGameState();
  const cp = state.players[state.currentPlayer];
  if (!cp) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-6"
      style={{ background: 'radial-gradient(ellipse at center, rgba(26,26,46,0.92) 0%, rgba(22,33,62,0.97) 100%)', backdropFilter: 'blur(16px)' }}>
      {/* Decorative ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] rounded-full border border-faction-blue/10 animate-[pulse_3s_ease-in-out_infinite]" />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-faction-alien/10 animate-[pulse_3s_ease-in-out_infinite_0.5s]" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-faction-hybrid/5 animate-[pulse_3s_ease-in-out_infinite_1s]" />
      </div>

      <div className="relative text-center slide-up">
        <h2 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          请传递设备
        </h2>
        <div className="text-3xl font-bold bg-gradient-to-r from-faction-blue to-faction-alien bg-clip-text text-transparent">
          {cp.name}
        </div>
        <p className="text-lg text-text-dim mt-1">的回合</p>
      </div>

      <p className="relative text-text-muted max-w-md text-center leading-relaxed text-sm slide-up" style={{ animationDelay: '200ms' }}>
        确保只有当前玩家能看到屏幕内容。<br />准备好后点击下方按钮。
      </p>

      {state.phase === 'peace' && state.peace.initiator !== null && !state.peace.responders.includes(state.currentPlayer) && (
        <div className="relative px-5 py-3 rounded-xl border-2 border-faction-hybrid/30 bg-faction-hybrid/10 text-faction-hybrid font-bold text-sm animate-[glowPulse_2s_ease-in-out_infinite] slide-up" style={{ animationDelay: '300ms' }}>
          🕊️ {state.players[state.peace.initiator]?.name} 发起了鸣金！你需要选择是否响应。
        </div>
      )}

      <button
        onClick={onReady}
        className="relative px-10 py-4 rounded-xl bg-gradient-to-r from-faction-blue via-[#5b9be0] to-[#357abd] text-white font-bold text-lg cursor-pointer
          hover:shadow-xl hover:shadow-faction-blue/30 hover:-translate-y-0.5 active:translate-y-0
          transition-all duration-300 min-w-[220px] slide-up bg-shift"
        style={{ animationDelay: '400ms', minHeight: '48px' }}
      >
        我已准备好，开始我的回合
      </button>
    </div>
  );
}
