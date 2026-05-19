import { useGameState, useGameActions } from '../../hooks/useGameState';
import { getL1Pool, getL2Pool, getL3Pool, getGhostKingPool } from '../../data/identityCards';
import type { Layer } from '../../types/cards';

export function Modal() {
  const state = useGameState();
  const actions = useGameActions();
  const modal = state.pendingModal;
  if (!modal) return null;

  const close = () => actions.clearModal();
  const ctx = modal.context || {};
  const cp = state.players[state.currentPlayer];

  const btnClass = 'w-full py-3.5 my-1.5 rounded-xl border border-bg-tertiary/60 bg-bg-primary/60 text-text-primary text-left text-sm cursor-pointer hover:border-faction-blue hover:bg-bg-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 px-4';

  const renderContent = () => {
    switch (modal.type) {
      case 'select_player':
        return (
          <>
            {state.players.filter(p => p.alive && p.index !== modal.excludePlayer).map(p => (
              <button key={p.index} className={btnClass}
                style={{ minHeight: '48px' }}
                onClick={() => { close(); handlePlayerSelect(p.index); }}>
                <span className="font-medium">{p.name}</span>
              </button>
            ))}
          </>
        );

      case 'select_player_layer':
        return (
          <>
            {state.players.filter(p => p.alive && p.index !== modal.excludePlayer).map(p => (
              [1, 2, 3].map(l => {
                const id = p.identities[l - 1];
                const ra = modal.resolveAction;

                // For swap_revealed_step2: only show revealed cards of the target layer
                if (ra === 'effect_swap_revealed_step2') {
                  const targetLayer = (ctx.targetLayer as number) || 1;
                  if (l !== targetLayer || !id.revealed || id.removed) return null;
                }
                // Default: skip revealed/removed for investigate-like actions
                if (ra !== 'effect_swap_revealed_step2' && (id.revealed || id.removed)) return null;

                return (
                  <button key={`${p.index}-${l}`} className={btnClass}
                    style={{ minHeight: '48px' }}
                    onClick={() => { close(); handlePlayerLayerSelect(p.index, l); }}>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-text-muted">- 第{l}层</span>
                  </button>
                );
              })
            ))}
          </>
        );

      case 'select_layer_list':
        return (
          <>
            {modal.layers?.map(l => {
              const pName = ctx.playerName as string | undefined;
              return (
                <button key={l} className={btnClass}
                  style={{ minHeight: '48px' }}
                  onClick={() => { close(); handleLayerSelect(l); }}>
                  <span className="font-medium">{pName ? `${pName} - ` : ''}第{l}层</span>
                </button>
              );
            })}
          </>
        );

      case 'select_card': {
        const ra = modal.resolveAction;
        let pool: { type: string; name: string; desc: string }[] = [];

        if (ra === 'effect_ghostking_mimic') {
          pool = getGhostKingPool();
        } else if (ra === 'effect_dreamthief_card' || ra === 'effect_diviner_guess_card') {
          const l = (ctx.targetLayer as number) || 1;
          if (l === 1) pool = getL1Pool();
          else if (l === 2) pool = getL2Pool();
          else pool = getL3Pool();
        } else {
          const layer = (ctx.layer as number) || 1;
          if (layer === 1) pool = getL1Pool();
          else if (layer === 2) pool = getL2Pool();
          else pool = getL3Pool();
        }

        return (
          <>
            {pool.map(c => (
              <button key={c.type} className={btnClass}
                style={{ minHeight: '48px' }}
                onClick={() => { close(); handleCardSelect(c.type); }}>
                <strong>{c.name}</strong>
                <span className="ml-2 text-text-dim text-xs">{c.desc}</span>
              </button>
            ))}
          </>
        );
      }

      case 'select_grimoire':
        return (
          <>
            {state.grimoireDiscard.map(g => (
              <button key={g.uid} className={btnClass}
                style={{ minHeight: '48px' }}
                onClick={() => { close(); handleGrimoireSelect(g.uid); }}>
                <strong>{g.def.name}</strong>
                <span className="ml-2 text-text-dim text-xs">{g.def.desc}</span>
              </button>
            ))}
          </>
        );

      case 'select_grimoire_from_list':
        return (
          <>
            {modal.grimoireList?.map(g => (
              <button key={g.uid} className={btnClass}
                style={{ minHeight: '48px' }}
                onClick={() => { close(); handleGrimoireSelect(g.uid); }}>
                <strong>{g.def.name}</strong>
                <span className="ml-2 text-text-dim text-xs">{g.def.desc}</span>
              </button>
            ))}
          </>
        );

      case 'confirm_peace':
        return (
          <div className="text-center">
            <p className="text-text-dim leading-relaxed mb-5 text-sm">
              你认为场上所有玩家都是你的队友吗？<br />
              鸣金跳过你的回合，其他玩家依次选择是否响应。<br />
              全员响应且均同阵营→共同胜利。<br />
              否则按异族&gt;混血儿&gt;少数红/蓝判定。
            </p>
            <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-faction-hybrid to-accent-gold text-bg-primary font-bold cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              style={{ minHeight: '48px' }}
              onClick={() => { close(); actions.initiatePeace(); }}>
              确认鸣金
            </button>
          </div>
        );

      case 'confirm_continue':
        return (
          <div className="text-center">
            <p className="text-text-dim leading-relaxed mb-5 text-sm">{modal.title}</p>
            <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-faction-blue to-[#357abd] text-white font-bold cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              style={{ minHeight: '48px' }}
              onClick={() => { close(); handleContinue(); }}>
              继续
            </button>
            <button className="w-full py-3 mt-3 rounded-xl bg-bg-tertiary/60 text-text-muted cursor-pointer hover:text-text-primary transition-all duration-300"
              style={{ minHeight: '44px' }}
              onClick={close}>
              停止
            </button>
          </div>
        );

      default:
        return <p className="text-text-muted text-center py-4">未知操作</p>;
    }
  };

  // ── Handler: Player Select ──
  const handlePlayerSelect = (target: number) => {
    const ra = modal.resolveAction;

    switch (ra) {
      case 'grimoire_compel': {
        const idx = (ctx.grimoireIndex as number) ?? -1;
        if (idx >= 0) actions.grimoireSelectPlayer(idx, target);
        break;
      }
      case 'grimoire_forced_trade_p1': {
        const idx = (ctx.grimoireIndex as number) ?? -1;
        const tName = state.players[target].name;
        const urev = state.players[target].identities
          .filter(id => !id.revealed && !id.removed)
          .map(id => id.layer);
        actions.setModal({
          type: 'select_layer_list',
          title: `强买强卖：选择${tName}的第几层？`,
          layers: urev,
          resolveAction: 'grimoire_forced_trade_l1',
          context: { grimoireIndex: idx, player1: target, playerName: tName },
        });
        break;
      }
      case 'grimoire_forced_trade_p2': {
        const idx = (ctx.grimoireIndex as number) ?? -1;
        const p1 = (ctx.player1 as number) ?? -1;
        const l1 = (ctx.layer1 as number) ?? 1;
        const urev = state.players[target].identities
          .filter(id => !id.revealed && !id.removed && id.layer === l1)
          .map(id => id.layer);
        if (urev.length === 0) {
          actions.addLog(`❌ ${state.players[target].name} 的第${l1}层已被揭示，无法交换！`);
          break;
        }
        actions.grimoireSwap(idx, p1, l1 as Layer, target, l1 as Layer);
        break;
      }
      case 'effect_skip_player':
        actions.effectSkipPlayer(target);
        break;
      case 'effect_protect':
        actions.effectProtect(target);
        actions.addLog(`🛡️ ${state.players[target].name} 受到侍从保护，直到下回合不能被调查。`);
        break;
    }
  };

  // ── Handler: Player + Layer Select ──
  const handlePlayerLayerSelect = (target: number, layer: number) => {
    const ra = modal.resolveAction;
    const layerTyped = layer as Layer;

    switch (ra) {
      case 'investigate':
        actions.investigate(target, layerTyped, false);
        break;
      case 'reveal':
        actions.revealDirect(target, layerTyped);
        break;
      case 'grimoire_foresight': {
        const idx = (ctx.grimoireIndex as number) ?? -1;
        if (idx >= 0) actions.grimoireSelectPlayerLayer(idx, target, layerTyped);
        break;
      }
      // Declaration effects
      case 'effect_reveal_any':
        actions.effectRevealAny(target, layerTyped);
        break;
      case 'effect_hide_any':
        actions.effectHideAny(target, layerTyped);
        break;
      case 'effect_disable':
        actions.effectDisable(target, layerTyped);
        break;
      case 'effect_seer_1': {
        actions.investigate(target, layerTyped, false);
        const remaining = ((ctx.remaining as number) || 2) - 1;
        if (remaining > 0) {
          actions.setModal({
            type: 'select_player_layer',
            title: `【先知】调查第二个目标（${remaining}次剩余）`,
            excludePlayer: state.currentPlayer,
            resolveAction: 'effect_seer_2',
            context: { remaining },
          });
        }
        break;
      }
      case 'effect_seer_2':
        actions.investigate(target, layerTyped, false);
        break;
      case 'effect_swap_revealed_step1': {
        // Find the revealed card of the same layer on current player
        const myRevealed = cp.identities.filter(id => id.revealed && !id.removed && id.layer === layer);
        if (myRevealed.length === 0) {
          // Swap with any revealed same-layer
          break;
        }
        // Swap: my card <-> their card
        actions.grimoireSwap(-1, state.currentPlayer, layerTyped, target, layerTyped);
        break;
      }
      case 'effect_remove_identity':
        actions.effectRemoveIdentity(target, layerTyped);
        break;
      case 'effect_dreamthief_guess': {
        // Store target info, then show card selection
        const targetLayer = layer;
        actions.setModal({
          type: 'select_card',
          title: `【窃梦】猜测${state.players[target].name}的第${targetLayer}层是什么？`,
          resolveAction: 'effect_dreamthief_card',
          context: { targetLayer, dreamTarget: target },
        });
        break;
      }
      case 'effect_diviner_guess': {
        const targetLayer = layer;
        actions.setModal({
          type: 'select_card',
          title: `【占卜师】猜测${state.players[target].name}的第${targetLayer}层是什么？`,
          resolveAction: 'effect_diviner_guess_card',
          context: { targetLayer, divinerTarget: target, remaining: (ctx.remaining as number) || 3 },
        });
        break;
      }
    }
  };

  // ── Handler: Layer Select ──
  const handleLayerSelect = (layer: number) => {
    const ra = modal.resolveAction;

    switch (ra) {
      case 'investigate_self':
        actions.investigate(state.currentPlayer, layer as Layer, true);
        break;
      case 'declare_layer': {
        actions.setModal({
          type: 'select_card',
          title: `宣言第${layer}层：你猜是什么身份？`,
          resolveAction: 'declare_card',
          context: { layer },
        });
        break;
      }
      case 'declare_card':
        break;
      case 'grimoire_introspect': {
        const idx = (ctx.grimoireIndex as number) ?? -1;
        if (idx >= 0) actions.grimoireSelectLayer(idx, layer as Layer);
        break;
      }
      case 'effect_reveal_own_l3_layer':
        actions.effectRevealAny(state.currentPlayer, layer as Layer);
        break;
      case 'grimoire_forced_trade_l1': {
        const idx = (ctx.grimoireIndex as number) ?? -1;
        const p1 = (ctx.player1 as number) ?? -1;
        // Select second player with same layer
        actions.setModal({
          type: 'select_player',
          title: `强买强卖：选择第二位玩家（第${layer}层）`,
          excludePlayer: state.currentPlayer,
          resolveAction: 'grimoire_forced_trade_p2',
          context: { grimoireIndex: idx, player1: p1, layer1: layer },
        });
        break;
      }
    }
  };

  // ── Handler: Card Select ──
  const handleCardSelect = (type: string) => {
    const ra = modal.resolveAction;

    switch (ra) {
      case 'declare_card': {
        const layer = (ctx.layer as number) || 1;
        actions.declare(layer as Layer, type);
        break;
      }
      case 'effect_ghostking_mimic': {
        // Apply the mimicked effect to the current player
        // We re-dispatch as a declare effect with the mimicked type
        actions.addLog(`👻 鬼王模仿了【${type}】效果！`);
        if (['l1_hunter', 'l1_seer', 'l1_priest', 'l1_disciple', 'l1_poet', 'l1_servant', 'l1_merchant',
              'l2_mage', 'l2_detective', 'l2_bewitch', 'l2_dreamthief', 'l2_phantom', 'l2_redmoon', 'l2_awakened'].includes(type)) {
          // Re-dispatch to trigger the effect — handled via a follow-up action
          actions.setModal({
            type: 'confirm_continue',
            title: `鬼王效果：${type}`,
            resolveAction: 'ghostking_chain',
            context: { mimickedType: type },
          });
        }
        break;
      }
      case 'effect_dreamthief_card': {
        const dreamTarget = (ctx.dreamTarget as number) ?? -1;
        const targetLayer = (ctx.targetLayer as number) ?? 1;
        const tp = state.players[dreamTarget];
        if (!tp) break;
        const actual = tp.identities[targetLayer - 1].def;
        const correct = actual.type === type;

        if (correct) {
          actions.addLog(`🎭 窃梦猜中！揭示${tp.name}的第${targetLayer}层并发动其效果！`);
          actions.revealDirect(dreamTarget, targetLayer as Layer);
        } else {
          actions.addLog(`❌ 窃梦猜错，无效果。`);
        }
        break;
      }
      case 'effect_diviner_guess_card': {
        const divinerTarget = (ctx.divinerTarget as number) ?? -1;
        const targetLayer = (ctx.targetLayer as number) ?? 1;
        const tp = state.players[divinerTarget];
        const remaining = ((ctx.remaining as number) || 3) - 1;
        if (!tp) break;
        const actual = tp.identities[targetLayer - 1].def;
        const correct = actual.type === type;

        if (correct) {
          actions.addLog(`🔮 占卜师猜中${tp.name}的第${targetLayer}层！`);
          if (remaining > 0) {
            actions.setModal({
              type: 'confirm_continue',
              title: `占卜师猜中！是否继续？（剩余${remaining}次）`,
              resolveAction: 'effect_diviner_continue',
              context: { remaining },
            });
          }
        } else {
          actions.addLog(`❌ 占卜师猜错，效果结束。`);
        }
        break;
      }
    }
  };

  // ── Handler: Continue ──
  const handleContinue = () => {
    const ra = modal.resolveAction;

    switch (ra) {
      case 'effect_diviner_continue': {
        const remaining = (ctx.remaining as number) || 3;
        if (remaining <= 0) break;
        actions.setModal({
          type: 'select_player_layer',
          title: `【占卜师】继续猜测（剩余${remaining}次）`,
          excludePlayer: state.currentPlayer,
          resolveAction: 'effect_diviner_guess',
          context: { remaining },
        });
        break;
      }
    }
  };

  // ── Handler: Grimoire Select ──
  const handleGrimoireSelect = (uid: string) => {
    const idx = (ctx.grimoireIndex as number) ?? -1;
    if (idx >= 0) actions.grimoireSelectGrimoire(idx, uid);
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-bg-secondary/95 backdrop-blur rounded-3xl p-6 max-w-md w-[92%] max-h-[80vh] overflow-y-auto border border-bg-tertiary/40 shadow-2xl scale-in">
        <h3 className="text-center mb-5 text-text-primary font-bold text-lg">{modal.title}</h3>
        {renderContent()}
        <button className="w-full py-3 mt-3 rounded-xl bg-bg-tertiary/60 text-text-muted cursor-pointer hover:text-text-primary hover:bg-bg-tertiary transition-all duration-300 text-sm font-medium"
          style={{ minHeight: '44px' }}
          onClick={close}>
          取消
        </button>
      </div>
    </div>
  );
}
