"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { getEmailAvatarUrl } from "@/lib/avatar";

export default function Hero() {
  const { user, dbUser } = useAuth();

  const greetingName =
    user?.displayName?.split(" ")[0] ||
    dbUser?.display_name?.split(" ")[0] ||
    "Bala";

  const avatarUrl = getEmailAvatarUrl(user?.email, greetingName);

  return (
    <section className="relative px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
      {/* Decorative ambient warm background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-[#FC7819]/10 via-[#F7D8BA]/20 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Warm Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-medium bg-[#FC7819]/10 text-[#FC7819] border border-[#FC7819]/25 mb-6 backdrop-blur-sm shadow-sm animate-fadeIn">
          <span className="size-1.5 rounded-full bg-[#FC7819] animate-pulse" />
          <span>Firebase Auth + Resend + Neon Serverless PostgreSQL</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#121212] leading-[1.08] mb-5">
          Modern Authentication
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#121212] via-[#FC7819] to-[#EA580C]">
            Built for Speed & Reliability
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-600 leading-relaxed mb-8">
          Effortless passwordless magic links delivered via Resend and secure email/password authentication, verified server-side with Firebase Admin and persisted in your Neon PostgreSQL database.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
          <Link
            href="/auth"
            className="px-6 py-3 rounded-xl bg-[#121212] hover:bg-black text-white font-semibold text-sm transition-all shadow-lg shadow-black/10 active:scale-[0.98] flex items-center space-x-2"
          >
            <span>{user ? "Go to Account" : "Open Login Portal"}</span>
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          <a
            href="#architecture"
            className="px-6 py-3 rounded-xl border border-[#E0D7C7] hover:border-[#D0C5B2] bg-[#F4EFE6] hover:bg-[#EDE6DA] text-zinc-800 font-medium text-sm transition-all shadow-sm"
          >
            How It Works
          </a>
        </div>

        {/* Preview / Status Card */}
        <div className="max-w-xl mx-auto text-left">
          {user ? (
            <div className="p-6 rounded-2xl bg-white/80 border border-[#EBE4D8] shadow-md backdrop-blur-sm">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EAE0]">
                <div className="flex items-center space-x-3.5">
                  <div className="size-11 rounded-xl overflow-hidden border-2 border-[#FC7819]/40 bg-zinc-900 shadow-sm">
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
                    <h2 className="text-sm font-semibold text-zinc-900">
                      Hello {greetingName}!
                    </h2>
                    <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FC7819]/10 text-[#FC7819] border border-[#FC7819]/25">
                  Live Synced
                </span>
              </div>

              <div className="mt-3.5 space-y-2 font-mono text-[11px] text-zinc-600">
                <div className="flex justify-between">
                  <span>Neon UUID:</span>
                  <span className="text-[#FC7819] font-medium">{dbUser?.id || "Syncing..."}</span>
                </div>
                <div className="flex justify-between">
                  <span>Firebase UID:</span>
                  <span className="truncate max-w-[200px] text-zinc-800">{user.uid}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0EAE0] flex justify-end">
                <Link
                  href="/auth"
                  className="text-xs text-[#FC7819] hover:text-[#EA580C] font-semibold flex items-center space-x-1"
                >
                  <span>Open workspace auth view</span>
                  <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white/80 border border-[#EBE4D8] shadow-md backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-zinc-600 mb-3">
                <span className="flex items-center space-x-2 font-mono text-[11px]">
                  <span className="size-2 rounded-full bg-[#FC7819]" />
                  <span className="font-semibold text-zinc-800">auth_pipeline.ts</span>
                </span>
                <span className="text-[11px] text-[#FC7819] font-mono font-medium">POST /api/auth/send-link</span>
              </div>
              <pre className="p-4 bg-[#141414] border border-black/20 rounded-xl text-[11px] font-mono text-zinc-200 overflow-x-auto leading-relaxed">
{`// 1. Generate link via Firebase Admin SDK
const link = await adminAuth.generateSignInWithEmailLink(email, settings);

// 2. Send via Resend with template c3761b4f-a0e3-4983-aa5d-11a7c174bace
await resend.emails.send({ to: email, template: { id: templateId, variables } });

// 3. User verifies link -> Persisted in Neon PostgreSQL
await sql\`INSERT INTO users (firebase_uid, email) VALUES ...\`;`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
