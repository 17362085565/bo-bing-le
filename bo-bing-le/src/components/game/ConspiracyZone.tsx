import type { Player } from '../../types/game';
import { useGameState } from '../../hooks/useGameState';

interface Props {
  player: Player;
}

export function ConspiracyZone({ player }: Props) {
  const state = useGameState();
  const isOwner = player.index === state.currentPlayer;

  if (player.playedConspiracies.length === 0) return null;

  return (
    <div className="flex gap-1.5">
      {player.playedConspiracies.map((g, i) => (
        <div
          key={i}
          className="w-9 h-11 rounded-lg bg-gradient-to-br from-bg-tertiary via-bg-tertiary to-faction-alien/20 border-2 border-faction-alien/40 flex items-center justify-center text-sm cursor-default
            hover:border-faction-alien/70 hover:shadow-[0_0_10px_rgba(155,89,182,0.2)] transition-all duration-300"
          title={isOwner ? g.def.desc : '阴谋（效果未知）'}
        >
          {isOwner ? g.def.name[0] : '🕵️'}
        </div>
      ))}
    </div>
  );
}
