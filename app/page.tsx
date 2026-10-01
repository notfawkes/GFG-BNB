"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { getEmailAvatarUrl } from "@/lib/avatar";

export default function HomePage() {
  const { user, dbUser, signOut, loading } = useAuth();

  const greetingName =
    user?.displayName?.split(" ")[0] ||
    dbUser?.display_name?.split(" ")[0] ||
    "Bala";

  const avatarUrl = getEmailAvatarUrl(user?.email, greetingName);

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200 relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-32 right-1/4 size-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-sm group-hover:border-emerald-500/50 transition-colors">
              G
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-100 group-hover:text-white transition-colors">
              GFG BNB
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-xs text-zinc-400">
            <a href="#features" className="hover:text-zinc-200 transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-zinc-200 transition-colors">
              Architecture
            </a>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 font-mono text-[10px]">
              Neon Postgres Connected
            </span>
          </nav>

          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="size-8 rounded-full border border-zinc-800 bg-zinc-900/50 animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="flex items-center space-x-2 text-xs text-zinc-300 hover:text-white group"
                >
                  <div className="size-8 rounded-full overflow-hidden border border-emerald-500/40 bg-zinc-800">
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
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 md:py-20 relative z-10">
        <div className="w-full max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-6 backdrop-blur-sm animate-fadeIn">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firebase Auth + Neon Serverless PostgreSQL</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-5">
            Modern Authentication
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Built for Speed & Reliability
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
            Effortless passwordless magic links and secure email/password authentication, verified server-side with Firebase Admin and persisted in your Neon PostgreSQL database.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center space-x-2"
            >
              <span>{user ? "Go to Account" : "Open Login Portal"}</span>
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <a
              href="#architecture"
              className="px-5 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 hover:text-white font-medium text-sm transition-all backdrop-blur-sm"
            >
              How It Works
            </a>
          </div>

          {/* User Status / Preview Card */}
          <div className="max-w-xl mx-auto">
            {user ? (
              <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 shadow-xl backdrop-blur-xl text-left">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center space-x-3">
                    <div className="size-11 rounded-xl overflow-hidden border border-emerald-500/40 bg-zinc-800">
                      <Image
                        src={avatarUrl}
                        alt={greetingName}
                        width={44}
                        height={44}
                        unoptimized
                        className="size-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Hello {greetingName}!
                      </h2>
                      <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Synced
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 font-mono text-[11px] text-zinc-400">
                  <div className="flex justify-between">
                    <span>Neon UUID:</span>
                    <span className="text-emerald-400">{dbUser?.id || "Syncing..."}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Firebase UID:</span>
                    <span className="truncate max-w-[200px] text-zinc-300">{user.uid}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex justify-end">
                  <Link
                    href="/login"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
                  >
                    <span>Open full workspace view</span>
                    <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 shadow-2xl backdrop-blur-xl text-left">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
                  <span className="flex items-center space-x-1.5 font-mono text-[11px]">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>auth_pipeline.ts</span>
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">POST /api/auth/sync</span>
                </div>
                <pre className="p-3 bg-zinc-950/80 border border-zinc-800/60 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto">
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div id="features" className="w-full max-w-4xl mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm hover:border-zinc-700/80 transition-colors">
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Passwordless Magic Links</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Fast, password-free login sent right to your email. Click once to verify and sign in automatically.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm hover:border-zinc-700/80 transition-colors">
            <div className="size-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Email & Password</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Standard credentials supporting both registration and login, with automatic user synchronization.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm hover:border-zinc-700/80 transition-colors">
            <div className="size-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Neon Serverless DB</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Instant PostgreSQL row persistence with auto-generated UUIDs, timestamps, and server-side verification.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-6 text-center text-xs text-zinc-500">
        GFG BNB • Next.js App Router • Firebase Auth • Neon Serverless PostgreSQL
      </footer>
    </div>
  );
}