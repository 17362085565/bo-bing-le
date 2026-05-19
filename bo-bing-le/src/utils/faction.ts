import type { Faction } from '../types/cards';
import type { IdentityCardInstance } from '../types/cards';

export function calcFaction(identities: IdentityCardInstance[]): Faction {
  // Check for 异族 L3 first
  const l3 = identities.find(id => id.layer === 3);
  if (l3 && l3.def.type === 'l3_alien' && !l3.effectDisabled && !l3.removed) {
    return 'alien';
  }

  // Check for 败类 L3 (if revealed, treated as alien)
  const scum = identities.find(id => id.def.type === 'l3_scum');
  if (scum && scum.revealed && !scum.effectDisabled && !scum.removed) {
    return 'alien';
  }

  // Check for 叛徒 L3: invert first two layers' concentration
  const traitor = identities.find(id => id.def.type === 'l3_traitor');
  const inverted = traitor && !traitor.effectDisabled && !traitor.removed;

  let blue = 0;
  let red = 0;

  for (const id of identities) {
    if (id.removed) continue;
    if (id.effectDisabled) continue;

    const layer = id.layer;
    // 哲学家 L2: when revealed, treated as red
    if (id.def.type === 'l2_philosopher' && id.revealed) {
      if (inverted) {
        blue += layer;
      } else {
        red += layer;
      }
      continue;
    }

    if (id.def.color === 'blue') {
      if (inverted) {
        red += layer;
      } else {
        blue += layer;
      }
    } else if (id.def.color === 'red') {
      if (inverted) {
        blue += layer;
      } else {
        red += layer;
      }
    }
    // neutral cards don't contribute to concentration
  }

  if (blue > red) return 'blue';
  if (red > blue) return 'red';
  return 'hybrid';
}
