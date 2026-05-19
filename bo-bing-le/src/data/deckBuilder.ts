import type { IdentityCardInstance, GrimoireInstance } from '../types/cards';
import type { Player } from '../types/game';
import { buildL1Deck, buildL2Deck, buildL3Deck } from './identityCards';
import { GRIMOIRE_DEFS } from './grimoireCards';
import { shuffle } from '../utils/shuffle';
import { calcFaction } from '../utils/faction';

export function buildIdentityCards(n: number): Player[] {
  const l1 = buildL1Deck();
  const l2 = buildL2Deck();
  const l3 = buildL3Deck();

  return Array.from({ length: n }, (_, i) => {
    const ids: IdentityCardInstance[] = [
      { uid: `l1_${i}`, def: l1[i], layer: 1, revealed: false, effectDisabled: false, removed: false },
      { uid: `l2_${i}`, def: l2[i], layer: 2, revealed: false, effectDisabled: false, removed: false },
      { uid: `l3_${i}`, def: l3[i], layer: 3, revealed: false, effectDisabled: false, removed: false },
    ];
    return {
      index: i,
      name: '',
      identities: ids,
      coins: 0,
      grimoires: [],
      playedConspiracies: [],
      alive: true,
      faction: calcFaction(ids),
      skipNext: false,
      mustDeclare: false,
      cannotDeclare: false,
      declarationsThisTurn: 0,
      maxDeclarationsThisTurn: 1,
      protected: false,
      investigationDiscount: false,
      hasActedThisTurn: false,
    };
  });
}

export function buildGrimoireDeck(): GrimoireInstance[] {
  const deck: GrimoireInstance[] = [];
  GRIMOIRE_DEFS.forEach(def => {
    const count = def.type.startsWith('wealth_') ? 1
      : def.type.startsWith('bluff_') ? 1
      : 1;
    deck.push({ uid: `${def.type}_${deck.filter(d => d.def.type === def.type).length}`, def });
  });
  return shuffle(deck);
}

export function drawGrimoire(
  deck: GrimoireInstance[],
  discard: GrimoireInstance[],
  count: number
): { drawn: GrimoireInstance[]; deck: GrimoireInstance[]; discard: GrimoireInstance[]; empty: boolean } {
  const drawn: GrimoireInstance[] = [];
  let d = [...deck];
  let disc = [...discard];
  for (let i = 0; i < count; i++) {
    if (d.length === 0) {
      return { drawn, deck: d, discard: disc, empty: true };
    }
    drawn.push(d.pop()!);
  }
  return { drawn, deck: d, discard: disc, empty: d.length === 0 };
}
