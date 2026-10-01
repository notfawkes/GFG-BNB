"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { getEmailAvatarUrl } from "@/lib/avatar";

export default function Navbar() {
  const { user, dbUser, signOut, loading } = useAuth();

  const greetingName =
    user?.displayName?.split(" ")[0] ||
    dbUser?.display_name?.split(" ")[0] ||
    "Bala";

  const avatarUrl = getEmailAvatarUrl(user?.email, greetingName);

  return (
    <header className="border-b border-[#EBE4D8] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="size-8 rounded-lg bg-[#FC7819]/10 border border-[#FC7819]/25 flex items-center justify-center text-[#FC7819] font-bold text-sm shadow-sm group-hover:bg-[#FC7819]/20 transition-all">
            G
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-900 group-hover:text-black transition-colors">
            GFG BNB
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-xs text-zinc-600">
          <a href="#features" className="hover:text-zinc-950 transition-colors">
            Features
          </a>
          <a href="#architecture" className="hover:text-zinc-950 transition-colors">
            Architecture
          </a>
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#FC7819]/10 text-[#FC7819] border border-[#FC7819]/20 font-mono text-[10px] font-medium">
            <span className="size-1.5 rounded-full bg-[#FC7819] animate-pulse" />
            <span>Neon Serverless Connected</span>
          </span>
        </nav>

        {/* User Auth Actions */}
        <div className="flex items-center space-x-3">
          {loading ? (
            <div className="size-8 rounded-full border border-[#EBE4D8] bg-[#EFE9DF] animate-pulse" />
          ) : user ? (
            <div className="flex items-center space-x-3">
              <Link
                href="/auth"
                className="flex items-center space-x-2 text-xs text-zinc-800 hover:text-black group"
              >
                <div className="size-8 rounded-full overflow-hidden border-2 border-[#FC7819]/40 bg-zinc-900 shadow-sm">
                  <Image
                    src={avatarUrl}
                    alt={greetingName}
                    width={32}
                    height={32}
                    unoptimized
                    className="size-full object-cover"
                  />
                </div>
                <span className="hidden sm:inline font-medium">
                  Hello, {greetingName}
                </span>
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="px-3 py-1.5 rounded-lg border border-[#E0D7C7] hover:border-[#D0C5B2] bg-[#F4EFE6] hover:bg-[#EDE6DA] text-xs text-zinc-700 hover:text-black transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5">
              <Link
                href="/auth"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 hover:text-black transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#121212] hover:bg-black text-white transition-all shadow-sm active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
