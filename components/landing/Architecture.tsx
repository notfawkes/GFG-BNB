"use client";

import Link from "next/link";

export default function Architecture() {
  const steps = [
    {
      num: "01",
      title: "Client Intent",
      desc: "User submits their email in the UI. Email and password are submitted securely.",
      tech: "Next.js App Router",
    },
    {
      num: "02",
      title: "Password Verification",
      desc: "The server verifies a password hash stored with the account.",
      tech: "Node.js scrypt",
    },
    {
      num: "03",
      title: "Session Creation",
      desc: "A protected session is created and stored in Neon PostgreSQL.",
      tech: "Neon PostgreSQL",
    },
    {
      num: "04",
      title: "Neon DB Persistence",
      desc: "The signed-in account and its profile are loaded from Neon PostgreSQL.",
      tech: "Neon Serverless Postgres",
    },
  ];

  return (
    <section id="architecture" className="py-20 px-4 sm:px-6 bg-[#F4EFE6]/60 border-y border-[#EBE4D8] relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FC7819]/10 text-[#FC7819] border border-[#FC7819]/25 mb-4">
            <span className="size-1.5 rounded-full bg-[#FC7819]" />
            <span>End-to-End Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#121212]">
            How the Authentication Flow Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed">
            Password authentication and account sessions run through Neon PostgreSQL.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-6 rounded-2xl bg-white border border-[#EBE4D8] shadow-sm flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 text-3xl font-black text-zinc-200 pointer-events-none select-none">
                {step.num}
              </div>
              <div>
                <span className="inline-block text-[11px] font-mono font-semibold text-[#FC7819] mb-2">
                  {step.tech}
                </span>
                <h3 className="text-base font-semibold text-[#121212] mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#F0EAE0] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>Status</span>
                <span className="text-[#FC7819] font-semibold">Active</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="rounded-2xl bg-[#141414] p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Ready to test the authentication flow?
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Create an account or sign in with your email and password.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              href="/auth"
              className="px-6 py-2.5 rounded-xl bg-[#FC7819] hover:bg-[#EA580C] text-white font-semibold text-sm transition-all shadow-md active:scale-95"
            >
              Open Auth Portal
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
