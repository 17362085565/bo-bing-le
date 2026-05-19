import { useGameState, useGameActions } from '../../hooks/useGameState';
import type { Layer } from '../../types/cards';

export function ActionPanel() {
  const state = useGameState();
  const actions = useGameActions();
  const cp = state.players[state.currentPlayer];
  if (!cp) return null;

  const phase = state.phase;

  const btnBase = 'w-full py-3 my-1.5 rounded-xl font-bold cursor-pointer transition-all duration-300 text-sm';
  const btnPrimary = `${btnBase} bg-gradient-to-r from-faction-blue via-[#5b9be0] to-[#357abd] text-white hover:shadow-lg hover:shadow-faction-blue/30 hover:-translate-y-0.5 active:translate-y-0`;
  const btnGold = `${btnBase} bg-gradient-to-r from-faction-hybrid to-accent-gold text-bg-primary hover:shadow-lg hover:shadow-faction-hybrid/30 hover:-translate-y-0.5 active:translate-y-0`;
  const btnOutline = (color: string) =>
    `${btnBase} border-2 bg-transparent hover:-translate-y-0.5 active:translate-y-0 ${color}`;

  // Resource Phase
  if (phase === 'resource') {
    const lowGrimoire = state.grimoireDeck.length < 10;
    return (
      <div className="bg-bg-secondary/70 backdrop-blur rounded-2xl p-5 border border-bg-tertiary/30">
        <h3 className="text-center mb-4 text-text-dim text-sm font-medium tracking-wide uppercase">资源选择</h3>
        <button className={btnGold} style={{ minHeight: '48px' }}
          onClick={() => actions.chooseResource('coins')}>
          💰 获取 2 枚星币
        </button>
        {lowGrimoire && (
          <button className={btnGold} style={{ minHeight: '48px' }}
            onClick={() => actions.chooseResource('coins_3')}>
            💰 获取 3 枚星币 <span className="text-xs opacity-70">(魔典不足10张)</span>
          </button>
        )}
        <button className={btnOutline('border-faction-alien text-faction-alien hover:bg-faction-alien/10')} style={{ minHeight: '48px' }}
          onClick={() => actions.chooseResource('grimoire')}>
          📜 抽取 1 张魔典 <span className="text-xs opacity-70">(剩{state.grimoireDeck.length}张)</span>
        </button>
      </div>
    );
  }

  // Peace Phase
  if (phase === 'peace') {
    const initiator = state.peace.initiator !== null ? state.players[state.peace.initiator] : null;
    return (
      <div className="bg-bg-secondary/70 backdrop-blur rounded-2xl p-5 border border-bg-tertiary/30">
        <h3 className="text-center mb-4 text-text-dim text-sm font-medium tracking-wide uppercase">行动</h3>
        <div className="text-center mb-4 px-4 py-3 rounded-xl border border-faction-hybrid/20 bg-faction-hybrid/5">
          <p className="text-faction-hybrid text-sm font-medium">
            🕊️ {initiator?.name ?? '?'} 发起了鸣金
          </p>
        </div>
        <button className={btnOutline('border-faction-hybrid text-faction-hybrid hover:bg-faction-hybrid/10')} style={{ minHeight: '48px' }}
          onClick={() => actions.respondPeace(true)}>
          🕊️ 响应鸣金（接受）
        </button>
        <button className={btnOutline('border-faction-red text-faction-red hover:bg-faction-red/10')} style={{ minHeight: '48px' }}
          onClick={() => actions.respondPeace(false)}>
          💔 拒绝鸣金
        </button>
      </div>
    );
  }

  // Action Phase
  if (phase !== 'action') return null;

  const discount = cp.investigationDiscount;

  const handleInvestigate = (layer: Layer) => {
    const others = state.players.filter(p => p.alive && p.index !== state.currentPlayer);
    if (others.length === 0) return;
    actions.setModal({
      type: 'select_player_layer',
      title: `调查：选择目标和层数（第${layer}层）${discount ? ' [半价!]' : ''}`,
      excludePlayer: state.currentPlayer,
      layer,
      resolveAction: 'investigate',
      context: { layer },
    });
  };

  const handleInvestigateSelf = () => {
    const unrevealed = cp.identities.filter(id => !id.revealed).map(id => id.layer);
    if (unrevealed.length === 0) return;
    actions.setModal({
      type: 'select_layer_list',
      title: '调查自己的哪一层？',
      layers: unrevealed,
      resolveAction: 'investigate_self',
    });
  };

  const handleReveal = () => {
    const targets: { player: number; name: string; layer: number }[] = [];
    state.players.forEach(p => {
      if (p.index === state.currentPlayer || !p.alive) return;
      p.identities.forEach(id => {
        if (!id.revealed && !id.removed) targets.push({ player: p.index, name: p.name, layer: id.layer });
      });
    });
    if (targets.length === 0) return;
    actions.setModal({
      type: 'select_player_layer',
      title: '揭示身份：选择目标和层数',
      excludePlayer: state.currentPlayer,
      resolveAction: 'reveal',
    });
  };

  const handleDeclare = () => {
    const unrevealed = cp.identities.filter(id => !id.revealed).map(id => id.layer);
    if (unrevealed.length === 0) return;
    actions.setModal({
      type: 'select_layer_list',
      title: '宣言：选择要宣言的层数',
      layers: unrevealed,
      resolveAction: 'declare_layer',
    });
  };

  return (
    <div className="bg-bg-secondary/70 backdrop-blur rounded-2xl p-5 border border-bg-tertiary/30">
      <h3 className="text-center mb-4 text-text-dim text-sm font-medium tracking-wide uppercase">行动</h3>

      {state.pendingModal && (
        <p className="text-center text-accent-gold text-sm mb-3 animate-[pulse_1.5s_ease-in-out_infinite]">
          请完成上方效果选择...
        </p>
      )}

      {/* Investigate */}
      <div className="mb-2">
        <p className="text-xs text-text-muted mb-1.5 px-1">
          🔍 调查 {discount && <span className="text-accent-gold">(侦探效果：调查他人仅需1⭐!)</span>}
        </p>
        <button className="w-full py-2.5 my-1 rounded-xl border border-bg-tertiary bg-bg-primary/60 text-text-primary text-sm text-left cursor-pointer hover:border-faction-blue hover:bg-bg-primary transition-all duration-300" style={{ minHeight: '44px' }}
          onClick={() => handleInvestigate(1)}>
          <span className="px-2">调查身份一</span>
          <span className="float-right px-2 text-faction-hybrid font-bold">{discount ? '1⭐' : '1⭐'}</span>
        </button>
        <button className="w-full py-2.5 my-1 rounded-xl border border-bg-tertiary bg-bg-primary/60 text-text-primary text-sm text-left cursor-pointer hover:border-faction-blue hover:bg-bg-primary transition-all duration-300" style={{ minHeight: '44px' }}
          onClick={() => handleInvestigate(2)}>
          <span className="px-2">调查身份二</span>
          <span className="float-right px-2 text-faction-hybrid font-bold">{discount ? '1⭐' : '2⭐'}</span>
        </button>
        <button className="w-full py-2.5 my-1 rounded-xl border border-bg-tertiary bg-bg-primary/60 text-text-primary text-sm text-left cursor-pointer hover:border-faction-blue hover:bg-bg-primary transition-all duration-300" style={{ minHeight: '44px' }}
          onClick={() => handleInvestigate(3)}>
          <span className="px-2">调查身份三</span>
          <span className="float-right px-2 text-faction-hybrid font-bold">{discount ? '1⭐' : '3⭐'}</span>
        </button>
        <button className="w-full py-2 my-1 rounded-xl border border-bg-tertiary bg-bg-tertiary/40 text-text-muted text-sm cursor-pointer hover:border-faction-blue/50 hover:text-text-primary transition-all duration-300" style={{ minHeight: '44px' }}
          onClick={handleInvestigateSelf}>
          调查自己（双倍费用）
        </button>
      </div>

      {/* Reveal */}
      <div className="mt-3">
        <button className={btnOutline('border-faction-red/60 text-faction-red hover:bg-faction-red/10 hover:border-faction-red')} style={{ minHeight: '44px' }}
          onClick={handleReveal}>
          📢 揭示一张身份
        </button>
      </div>

      {/* Declare */}
      <div className="mt-3">
        <button className={btnOutline('border-faction-alien/60 text-faction-alien hover:bg-faction-alien/10 hover:border-faction-alien')} style={{ minHeight: '44px' }}
          onClick={handleDeclare}>
          ✨ 宣言自己的身份
        </button>
        {cp.mustDeclare && (
          <p className="text-faction-red text-xs text-center mt-1.5 font-medium animate-[pulse_1.5s_ease-in-out_infinite]">
            ⚠ 本回合必须宣言！
          </p>
        )}
      </div>

      {/* Peace */}
      <div className="mt-3">
        {cp.hasActedThisTurn ? (
          <button disabled className="w-full py-3 my-1 rounded-xl border border-bg-tertiary/30 bg-transparent text-text-muted/30 cursor-not-allowed text-sm" style={{ minHeight: '44px' }}>
            🕊️ 鸣金（已行动过）
          </button>
        ) : (
          <button className={btnOutline('border-faction-hybrid/60 text-faction-hybrid hover:bg-faction-hybrid/10 hover:border-faction-hybrid')} style={{ minHeight: '44px' }}
            onClick={() => actions.setModal({ type: 'confirm_peace', title: '确认鸣金', resolveAction: 'peace' })}>
            🕊️ 鸣金
          </button>
        )}
      </div>

      {/* End Turn */}
      <div className="mt-3">
        {cp.mustDeclare && cp.declarationsThisTurn === 0 ? (
          <button disabled className="w-full py-3 rounded-xl bg-bg-tertiary/30 text-text-muted/30 cursor-not-allowed text-sm" style={{ minHeight: '44px' }}>
            🔒 必须先宣言才能结束回合
          </button>
        ) : (
          <button className="w-full py-3 rounded-xl bg-bg-tertiary/60 text-text-primary text-sm font-medium cursor-pointer hover:bg-bg-tertiary hover:shadow-md transition-all duration-300" style={{ minHeight: '44px' }}
            onClick={() => actions.endTurn()}>
            ✅ 结束回合
          </button>
        )}
      </div>
    </div>
  );
}
