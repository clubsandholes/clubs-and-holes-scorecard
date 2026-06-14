"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function PublicTournamentPage() {
  const params = useParams();
  const code = String(params.code || "").toUpperCase();

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <img
          src="/ch-logo.png"
          alt="Clubs & Holes"
          className="mx-auto h-20 w-auto"
        />

        <h1 className="mt-6 text-5xl font-black">THE LOT</h1>

        <div className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-[#ff9900]">
          Where golf sh!t happens.
        </div>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/60 p-6">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
            Tournament Feed
          </div>

          <div className="mt-3 text-3xl font-black">
            {code}
          </div>

          <div className="mt-4 text-white/50">
            The Turn and The Bunker are coming next.
          </div>
        </div>

        <Link
          href="/live"
          className="mt-8 inline-block rounded-full border border-white/10 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
        >
          Back To The Lot
        </Link>
      </div>
    </div>
  );
}