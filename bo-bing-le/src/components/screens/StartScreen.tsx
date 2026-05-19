import { useState } from 'react';
import { useGameActions } from '../../hooks/useGameState';

interface Props {
  onStart: () => void;
}

const PARTICLE_COLORS = ['#4a90d9', '#d94a4a', '#9b59b6', '#f1c40f', '#27ae60'];

function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {Array.from({ length: 20 }).map((_, i) => {
        const size = 4 + Math.random() * 8;
        const left = Math.random() * 100;
        const delay = Math.random() * 8;
        const duration = 8 + Math.random() * 12;
        const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size, height: size,
              left: `${left}%`, top: '-20px',
              background: color,
              opacity: 0.15 + Math.random() * 0.2,
              animation: `confettiFall ${duration}s ${delay}s linear infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export function StartScreen({ onStart }: Props) {
  const { initGame } = useGameActions();
  const [playerCount, setPlayerCount] = useState(6);
  const [names, setNames] = useState<string[]>(['小明', '小红', '小刚', '小丽', '阿强', '阿珍']);

  const defaultNames = ['小明', '小红', '小刚', '小丽', '阿强', '阿珍', '大壮', '小美'];

  const handleCountChange = (n: number) => {
    setPlayerCount(n);
    setNames(prev => {
      const next = [...prev];
      while (next.length < n) next.push(defaultNames[next.length] || `玩家${next.length + 1}`);
      return next.slice(0, n);
    });
  };

  const handleStart = () => {
    const finalNames = names.map((n, i) => n.trim() || `玩家${i + 1}`);
    initGame(finalNames);
    onStart();
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen gap-6 p-4" style={{ zIndex: 1 }}>
      <FloatingParticles />

      {/* Title area */}
      <div className="text-center slide-up" style={{ animationDelay: '0ms' }}>
        <h1
          className="text-6xl font-bold bg-gradient-to-r from-faction-blue via-faction-alien to-faction-red bg-clip-text text-transparent bg-shift"
          style={{ fontFamily: 'var(--font-display)', lineHeight: 1.3 }}
        >
          波冰乐宣言
        </h1>
        <p className="text-text-dim text-lg mt-2 tracking-wide">身份推理聚会游戏 · 5-8人 · 热座模式</p>
      </div>

      {/* Main card */}
      <div
        className="bg-bg-secondary/80 backdrop-blur rounded-3xl p-8 max-w-md w-full border border-bg-tertiary/50 slide-up shadow-2xl shadow-black/30"
        style={{ animationDelay: '150ms' }}
      >
        <label className="block mb-3 text-text-dim text-sm font-medium tracking-wide">选择玩家人数</label>
        <div className="flex gap-2.5 mb-5">
          {[5, 6, 7, 8].map(n => (
            <button
              key={n}
              onClick={() => handleCountChange(n)}
              className={`flex-1 py-3 rounded-xl border-2 transition-all duration-300 text-base font-bold cursor-pointer
                ${n === playerCount
                  ? 'border-faction-blue bg-faction-blue/15 text-faction-blue shadow-lg shadow-faction-blue/20 scale-105'
                  : 'border-bg-tertiary text-text-muted hover:border-faction-blue/50 hover:text-text-primary hover:bg-bg-tertiary/50'
                }`}
            >
              {n}人
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {names.map((name, i) => (
            <div key={i} className="slide-up" style={{ animationDelay: `${200 + i * 50}ms` }}>
              <label className="block mb-1 text-text-dim text-xs font-medium tracking-wide">
                玩家{i + 1}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setNames(prev => prev.map((n, j) => j === i ? e.target.value : n))}
                maxLength={8}
                className="w-full px-4 py-3 border border-bg-tertiary rounded-xl bg-bg-primary/60 text-text-primary text-base outline-none focus:border-faction-blue focus:ring-2 focus:ring-faction-blue/20 transition-all duration-300 placeholder:text-text-muted/40"
                placeholder={`玩家${i + 1}`}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-faction-blue via-[#5b9be0] to-[#357abd] text-white font-bold text-lg cursor-pointer
            hover:shadow-xl hover:shadow-faction-blue/30 hover:-translate-y-0.5 active:translate-y-0
            transition-all duration-300 bg-shift"
          style={{ minHeight: '48px' }}
        >
          开始游戏
        </button>
      </div>

      {/* Rules summary */}
      <div
        className="text-text-muted max-w-md text-center leading-relaxed text-sm bg-bg-secondary/40 backdrop-blur rounded-2xl p-5 border border-bg-tertiary/30 slide-up"
        style={{ animationDelay: '400ms' }}
      >
        <strong className="text-text-primary">规则简述</strong>
        <p className="mt-2">
          每位玩家持有<strong className="text-faction-blue">3层身份牌</strong>，红蓝阵营由颜色浓度决定。
          不知道自己身份——通过星币调查、魔典效果来推理。
        </p>
        <p className="mt-1">
          猜对身份可发动<strong className="text-faction-hybrid">强力宣言效果</strong>；
          猜错只揭示无效果。三层全揭示=死亡出局。
        </p>
      </div>
    </div>
  );
}
