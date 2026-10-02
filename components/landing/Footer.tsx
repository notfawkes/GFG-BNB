"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#EBE4D8] bg-[#FAF7F2] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="size-7 rounded-lg bg-[#FC7819]/10 border border-[#FC7819]/25 flex items-center justify-center text-[#FC7819] font-bold text-xs">
            G
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-900">
            GFG BNB
          </span>
          <span className="text-zinc-400 text-xs">|</span>
          <span className="text-xs text-zinc-500">
            Next.js App Router • Neon PostgreSQL
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-600">
          <a href="#features" className="hover:text-black transition-colors">
            Features
          </a>
          <a href="#architecture" className="hover:text-black transition-colors">
            Architecture
          </a>
          <Link href="/auth" className="hover:text-[#FC7819] transition-colors font-medium">
            Login Portal
          </Link>
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#FC7819]/10 text-[#FC7819] border border-[#FC7819]/20 font-mono text-[10px]">
            <span className="size-1.5 rounded-full bg-[#FC7819]" />
            <span>Black & Orange Theme</span>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#EBE4D8]/80 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} GFG BNB. All rights reserved.
      </div>
    </footer>
  );
}
