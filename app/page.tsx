"use client";

import { useState } from "react";

const holes = [
  { number: 1, par: 4, yards: 385 },
  { number: 2, par: 3, yards: 165 },
  { number: 3, par: 5, yards: 525 },
  { number: 4, par: 4, yards: 410 },
  { number: 5, par: 4, yards: 360 },
  { number: 6, par: 3, yards: 145 },
  { number: 7, par: 5, yards: 540 },
  { number: 8, par: 4, yards: 395 },
  { number: 9, par: 4, yards: 420 },
];

export default function Home() {
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});

  const hole = holes[currentHoleIndex];
  const score = scores[hole.number] ?? hole.par;

  const updateScore = (newScore: number) => {
    if (newScore < 1) return;
    setScores({ ...scores, [hole.number]: newScore });
  };

  const goPrev = () => {
    if (currentHoleIndex > 0) setCurrentHoleIndex(currentHoleIndex - 1);
  };

  const goNext = () => {
    if (currentHoleIndex < holes.length - 1) setCurrentHoleIndex(currentHoleIndex + 1);
  };

  const totalScore = holes.reduce((total, h) => total + (scores[h.number] ?? 0), 0);
  const holesPlayed = Object.keys(scores).length;

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center">
        <div className="text-lg font-black tracking-wide">CLUBS & HOLES</div>
        <div className="text-2xl">☰</div>
      </div>

      <div className="mt-8 text-center">
        <div className="text-sm text-yellow-400 uppercase tracking-[0.3em]">
          Belt Invitational
        </div>
        <h1 className="mt-3 text-4xl font-black">Hole {hole.number}</h1>
        <p className="mt-2 text-gray-400">
          Par {hole.par} · {hole.yards} Yards
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={() => updateScore(score + 1)}
          className="text-5xl text-gray-400 active:text-white"
        >
          ▲
        </button>

        <div className="my-4 text-[10rem] leading-none font-black">{score}</div>

        <button
          onClick={() => updateScore(score - 1)}
          className="text-5xl text-gray-400 active:text-white"
        >
          ▼
        </button>

       <button
  onClick={() => updateScore(score)}
  className="mt-8 w-full max-w-xs rounded-full bg-yellow-400 px-8 py-4 text-lg font-black text-black"
>
  ENTER SCORE
</button>

        <div className="mt-6 text-center text-sm text-gray-400">
          Through {holesPlayed} · Total: {totalScore || "--"}
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={goPrev}
          className="text-4xl disabled:opacity-20"
          disabled={currentHoleIndex === 0}
        >
          ←
        </button>

        <div className="text-center text-xs text-yellow-400">
          🔥 Live ticker: Mike birdied Hole 4 · New leader at -2
        </div>

        <button
          onClick={goNext}
          className="text-4xl disabled:opacity-20"
          disabled={currentHoleIndex === holes.length - 1}
        >
          →
        </button>
      </div>
    </div>
  );
}