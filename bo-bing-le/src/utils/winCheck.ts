import type { GameState, GameResult } from '../types/game';

export function checkDeath(state: GameState, playerIndex: number): boolean {
  const p = state.players[playerIndex];
  const revealedCount = p.identities.filter(id => id.revealed && !id.removed).length;
  const removedCount = p.identities.filter(id => id.removed).length;
  // Death: 3 revealed OR all 3 removed
  return revealedCount >= 3 || removedCount >= 3 || (revealedCount + removedCount >= 3);
}

export function checkWin(state: GameState): GameResult | null {
  const alive = state.players.filter(p => p.alive);

  // Alien win: if first kill was NOT an alien, aliens win immediately
  if (state.killRecords.length > 0 && !state.alienFirstKilled) {
    const aliensAlive = alive.filter(p => p.faction === 'alien');
    if (aliensAlive.length > 0) {
      return { winner: 'alien', msg: `第一个死亡玩家不是异族，异族胜利！` };
    }
  }

  // Kill-based wins only valid when no aliens remain (aliens have priority).
  // Blue/Red mutual kills win regardless of hybrids.
  const aliensAlive = alive.some(p => p.faction === 'alien');

  if (!aliensAlive) {
    for (const record of state.killRecords) {
      const killer = state.players[record.killer];
      const victim = state.players[record.victim];
      if (!killer || !victim) continue;

      // Hybrid: personally kill blue or red
      if (killer.faction === 'hybrid' && (victim.faction === 'blue' || victim.faction === 'red')) {
        return { winner: 'hybrid', msg: `混血儿 ${killer.name} 亲手杀死了 ${victim.name}，混血儿胜利！` };
      }
      // Blue/Red mutual kills → win regardless of whether hybrids are alive
      if (killer.faction === 'blue' && victim.faction === 'red') {
        return { winner: 'blue', msg: `蓝色阵营 ${killer.name} 杀死了红色阵营 ${victim.name}，蓝色胜利！` };
      }
      if (killer.faction === 'red' && victim.faction === 'blue') {
        return { winner: 'red', msg: `红色阵营 ${killer.name} 杀死了蓝色阵营 ${victim.name}，红色胜利！` };
      }
    }
  }

  // Elimination: all non-blue/red factions gone → check blue vs red
  const namesakeFactions = alive.filter(p => p.faction === 'alien' || p.faction === 'hybrid');
  const blues = alive.filter(p => p.faction === 'blue');
  const reds = alive.filter(p => p.faction === 'red');

  if (namesakeFactions.length === 0) {
    if (blues.length === 0 && reds.length === 0) return null;
    if (reds.length === 0 && blues.length > 0) return { winner: 'blue', msg: '红色阵营全部死亡，蓝色阵营胜利！' };
    if (blues.length === 0 && reds.length > 0) return { winner: 'red', msg: '蓝色阵营全部死亡，红色阵营胜利！' };
  }

  return null;
}

export function resolvePeace(state: GameState): GameResult | null {
  const alive = state.players.filter(p => p.alive);
  const factions = alive.map(p => p.faction);
  const allSame = factions.every(f => f === factions[0]);

  if (allSame) {
    return { winner: factions[0], msg: '鸣金成功！场上全为同一阵营，共同胜利！' };
  }

  const ac = factions.filter(f => f === 'alien').length;
  const hc = factions.filter(f => f === 'hybrid').length;
  const bc = factions.filter(f => f === 'blue').length;
  const rc = factions.filter(f => f === 'red').length;

  // 异族不被首杀：aliens lose priority if first-killed
  if (!state.alienFirstKilled && ac > 0) return { winner: 'alien', msg: '鸣金失败，异族在场优先胜利！' };
  if (hc > 0) return { winner: 'hybrid', msg: '鸣金失败，混血儿优先胜利！' };
  if (rc < bc) return { winner: 'red', msg: '鸣金失败，人数较少的红色阵营胜利！' };
  if (bc < rc) return { winner: 'blue', msg: '鸣金失败，人数较少的蓝色阵营胜利！' };

  return { winner: 'draw', msg: '鸣金失败，红蓝平局！' };
}
