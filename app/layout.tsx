import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";

export const metadata: Metadata = {
  title: "GFG BNB",
  description: "GFG BNB TEST",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF7F2] text-zinc-900 antialiased selection:bg-[#FC7819]/25 selection:text-zinc-950">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}