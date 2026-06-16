import { formatScore, getScoreStyle } from "@/lib/leaderboard";

type ScorecardModalProps = {
  player: any | null;
  onClose: () => void;
  formatType: string;
  holes: any[];
  getPlayerScoreMap: (id: string) => Record<number, number>;
  getTeamScoreMap: (id: string) => Record<number, number>;
  sponsor?: any | null;
};

export default function ScorecardModal({
  player,
  onClose,
  formatType,
  holes,
  getPlayerScoreMap,
  getTeamScoreMap,
  sponsor,
}: ScorecardModalProps) {
  if (!player) return null;

  const playerScores =
    formatType === "individual"
      ? getPlayerScoreMap(player.id)
      : getTeamScoreMap(player.id);

  const frontHoles = holes.slice(0, 9);
  const backHoles = holes.slice(9, 18);

  const frontPar = frontHoles.reduce((t, h) => t + h.par, 0);
  const backPar = backHoles.reduce((t, h) => t + h.par, 0);
  const totalPar = frontPar + backPar;

  const frontScore = frontHoles.reduce(
    (t, h) => t + (playerScores[h.number] ?? 0),
    0
  );

  const backScore = backHoles.reduce(
    (t, h) => t + (playerScores[h.number] ?? 0),
    0
  );

  const totalScore = frontScore + backScore;

  const frontToPar = frontScore - frontPar;
  const backToPar = backScore - backPar;
  const totalToPar = totalScore - totalPar;

  const holeCellClass =
    "flex h-11 w-12 shrink-0 items-center justify-center border-r border-white/10 bg-gray-800 text-sm font-black text-white/60";

  const parCellClass =
    "flex h-11 w-12 shrink-0 items-center justify-center border-r border-white/10 bg-gray-700 text-sm font-black text-white/80";

  const scoreCellClass =
    "flex h-11 w-12 shrink-0 items-center justify-center border-r border-white/10 bg-black text-sm font-black text-white";

  const labelClass =
    "sticky left-0 z-10 flex h-11 w-20 shrink-0 items-center justify-start border-r border-white/20 bg-black px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff9900]";

  const totalClass =
    "flex h-11 w-12 shrink-0 flex-col items-center justify-center border-r border-white/10 bg-gray-900 text-xs font-black text-[#ff9900]";

  const scoreTotalClass =
    "flex h-11 w-12 shrink-0 flex-col items-center justify-center border-r border-white/10 bg-gray-900 text-[11px] font-black leading-tight text-[#ff9900]";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
              Scorecard
            </div>

            <div className="mt-1 text-2xl font-black">
              {player.name}
            </div>
          </div>

          <button onClick={onClose} className="text-3xl leading-none">
            ×
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-max overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="flex">
              <div className={labelClass}>Hole</div>

              {frontHoles.map((h) => (
                <div key={`hole-front-${h.number}`} className={holeCellClass}>
                  {h.number}
                </div>
              ))}

              <div className={totalClass}>OUT</div>

              {backHoles.map((h) => (
                <div key={`hole-back-${h.number}`} className={holeCellClass}>
                  {h.number}
                </div>
              ))}

              <div className={totalClass}>IN</div>
              <div className={totalClass}>TOT</div>
            </div>

            <div className="flex border-t border-white/10">
              <div className={labelClass}>Par</div>

              {frontHoles.map((h) => (
                <div key={`par-front-${h.number}`} className={parCellClass}>
                  {h.par}
                </div>
              ))}

              <div className={totalClass}>{frontPar}</div>

              {backHoles.map((h) => (
                <div key={`par-back-${h.number}`} className={parCellClass}>
                  {h.par}
                </div>
              ))}

              <div className={totalClass}>{backPar}</div>
              <div className={totalClass}>{totalPar}</div>
            </div>

            <div className="flex border-t border-white/10">
              <div className={labelClass}>Score</div>

              {frontHoles.map((h) => {
                const score = playerScores[h.number];
                const style = getScoreStyle(score, h.par);

                return (
                  <div key={`score-front-${h.number}`} className={scoreCellClass}>
                    {score ? (
                      <div
                        className={`flex items-center justify-center text-sm font-black ${style}`}
                      >
                        {score}
                      </div>
                    ) : (
                      "-"
                    )}
                  </div>
                );
              })}

              <div className={scoreTotalClass}>
                <div>{frontScore || "-"}</div>
                {frontScore ? (
                  <div className="text-[9px] text-white/60">
                    {formatScore(frontToPar)}
                  </div>
                ) : null}
              </div>

              {backHoles.map((h) => {
                const score = playerScores[h.number];
                const style = getScoreStyle(score, h.par);

                return (
                  <div key={`score-back-${h.number}`} className={scoreCellClass}>
                    {score ? (
                      <div
                        className={`flex items-center justify-center text-sm font-black ${style}`}
                      >
                        {score}
                      </div>
                    ) : (
                      "-"
                    )}
                  </div>
                );
              })}

              <div className={scoreTotalClass}>
                <div>{backScore || "-"}</div>
                {backScore ? (
                  <div className="text-[9px] text-white/60">
                    {formatScore(backToPar)}
                  </div>
                ) : null}
              </div>

              <div className={scoreTotalClass}>
                <div>{totalScore || "-"}</div>
                {totalScore ? (
                  <div className="text-[9px] text-white/60">
                    {formatScore(totalToPar)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
          {sponsor ? (
            <a
              href={sponsor.website_url || "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <img
                src={sponsor.image_url || "/ch-logo.png"}
                alt={sponsor.name}
                className="h-12 w-12 rounded-xl object-contain"
              />

              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                  Powered By
                </div>

                <div className="mt-1 truncate text-sm font-black text-white">
                  {sponsor.name}
                </div>
              </div>
            </a>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3" />
          )}

          <div className="flex min-w-[110px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
              Total
            </div>

            <div className="mt-1 text-3xl font-black text-[#ff9900]">
              {formatScore(player.net)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}