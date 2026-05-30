import Link from "next/link";

export default function AdminNav() {
  return (
    <div className="mb-8 rounded-[2rem] border border-white/10 bg-gray-950 p-4 text-white">
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Clubs & Holes Admin
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/admin" className="rounded-full bg-black px-4 py-3 text-center text-xs font-black uppercase">
          Tournaments
        </Link>

        <Link href="/admin/courses" className="rounded-full bg-black px-4 py-3 text-center text-xs font-black uppercase">
          Courses
        </Link>

        <Link href="/admin/sponsors" className="rounded-full bg-black px-4 py-3 text-center text-xs font-black uppercase">
        Sponsors
        </Link>
      </div>
    </div>
  );
}