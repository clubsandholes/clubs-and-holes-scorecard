import Link from "next/link";

export default function AdminNav() {
  return (
    <div className="mb-8 rounded-[2rem] border border-white/10 bg-gray-950/90 p-5 text-white">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <img
            src="/clubs-n-holes.png"
            alt="Clubs & Holes"
            className="h-12 w-auto"
          />

          <div>
            <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
              Clubs & Holes
            </div>

            <div className="text-lg font-black">
              Admin
            </div>
          </div>
        </Link>

        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="rounded-full border border-white/10 bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.14em]">
            Tournaments
          </Link>

          <Link href="/admin/courses" className="rounded-full border border-white/10 bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.14em]">
            Courses
          </Link>

          <Link href="/admin/sponsors" className="rounded-full border border-white/10 bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.14em]">
            Sponsors
          </Link>
        </div>
      </div>
    </div>
  );
}