import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Architecture from "@/components/landing/Architecture";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-zinc-900 selection:bg-[#FC7819]/25 selection:text-zinc-950">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Architecture />
      </main>
      <Footer />
    </div>
  );
}