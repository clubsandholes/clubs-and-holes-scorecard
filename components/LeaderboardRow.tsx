import { formatScore } from "@/lib/leaderboard";

type LeaderboardRowProps = {
  player: any;
  index: number;
  totalPlayers: number;
  onClick: () => void;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export default function LeaderboardRow({
  player,
  index,
  totalPlayers,
  onClick,
}: LeaderboardRowProps) {
  const leaderboardImage =
    player.image_url || player.profile_image_url || "";

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-between rounded-[1.5rem] border p-4 shadow-xl backdrop-blur-md ${
        index === 0
          ? "border-[#ff9900] bg-[#ff9900]/90 text-black"
          : "border-white/10 bg-black/55 text-white"
      }`}
    >
      <div>
        <div className="text-xs font-black uppercase tracking-[0.18em] opacity-70">
          {index === 0
            ? "🏆 Current Leader"
            : index === totalPlayers - 1
            ? "🗑️ Last Place"
            : `#${index + 1}`}
        </div>

        <div className="mt-1 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-950">
            {leaderboardImage ? (
              <img
                src={leaderboardImage}
                alt={player.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-sm font-black text-[#ff9900]">
                {getInitials(player.name)}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-lg font-black">
              {player.name}
            </div>
          </div>
        </div>

        <div className="mt-1 text-xs opacity-70">
          Thru {player.thru} · Gross {player.gross || "--"}
        </div>

        <div className="mt-1 text-xs font-bold uppercase tracking-[0.14em] opacity-60">
          Tap to view scorecard
        </div>
      </div>

      <div className="text-4xl font-black">
        {formatScore(player.net)}
      </div>
    </div>
  );
}