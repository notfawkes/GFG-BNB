"use client";

export default function Features() {
  const features = [
    {
      title: "Password Login",
      description:
        "Secure email and password sign-in with credentials stored in your Neon database.",
      icon: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: "Neon Auth",
    },
    {
      title: "Email & Password Auth",
      description:
        "Passwords are hashed on the server, with sign-in sessions stored in Neon.",
      icon: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      badge: "Password Auth",
    },
    {
      title: "Neon Serverless Postgres",
      description:
        "Instant user row persistence into Neon PostgreSQL with auto-generated UUIDs, timestamps, and server-side verification.",
      icon: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      badge: "Neon Serverless",
    },
    {
      title: "Dynamic Avatars",
      description:
        "Consistent email-derived avatars dynamically rendered with custom warm black and orange palettes via Dicebear API.",
      icon: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: "Dicebear Initials",
    },
    {
      title: "HttpOnly Session Cookies",
      description:
        "Secure session tokens stored in protected cookies for seamless SSR hydration and middleware route protection.",
      icon: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      badge: "Next.js Security",
    },
    {
      title: "Server-Side Sessions",
      description:
        "HttpOnly session cookies keep your account signed in while Neon stores and validates each session.",
      icon: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      badge: "HttpOnly Cookies",
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FC7819]/10 text-[#FC7819] border border-[#FC7819]/25 mb-4">
            <span className="size-1.5 rounded-full bg-[#FC7819]" />
            <span>Architecture & Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#121212]">
            Engineered with Precision
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed">
            A cohesive stack designed for instant authentication, zero lock-in, and reliable data persistence.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group p-6 rounded-2xl bg-white/70 hover:bg-white border border-[#EBE4D8] hover:border-[#FC7819]/40 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-[#FC7819]/10 text-[#FC7819] flex items-center justify-center border border-[#FC7819]/20 group-hover:scale-105 group-hover:bg-[#FC7819] group-hover:text-white transition-all">
                    {feature.icon}
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#FAF7F2] text-zinc-700 border border-[#E5DEC9]">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#121212] group-hover:text-black transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#F0EAE0] flex items-center text-xs font-medium text-[#FC7819] group-hover:translate-x-1 transition-transform">
                <span>Explore component</span>
                <svg className="size-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
