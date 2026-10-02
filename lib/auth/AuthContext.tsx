"use client";
import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { DbUser } from "@/lib/db/users";
interface AuthContextType { user: DbUser | null; dbUser: DbUser | null; loading: boolean; dbLoading: boolean; error: string | null; signOut: () => Promise<void>; refreshDbUser: () => Promise<void>; setDbUser: (user: DbUser | null) => void }
const AuthContext = createContext<AuthContextType>({ user: null, dbUser: null, loading: true, dbLoading: false, error: null, signOut: async () => {}, refreshDbUser: async () => {}, setDbUser: () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
 const [user, setUser] = useState<DbUser | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
 const refreshDbUser = useCallback(async () => { try { const res = await fetch("/api/auth/me", { cache: "no-store" }); if (!res.ok) throw new Error("Could not load your account."); const data = await res.json(); setUser(data.user ?? null); setError(null); } catch (err) { setError(err instanceof Error ? err.message : "Could not load your account."); } }, []);
 useEffect(() => { void refreshDbUser().finally(() => setLoading(false)); }, [refreshDbUser]);
 const signOut = async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); };
 return <AuthContext.Provider value={{ user, dbUser: user, loading, dbLoading: false, error, signOut, refreshDbUser, setDbUser: setUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
