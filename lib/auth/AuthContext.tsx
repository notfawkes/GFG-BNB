"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { onAuthStateChanged, signOut as fbSignOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { DbUser } from "@/lib/db/users";
import { fetchNeonUser, syncUserWithNeon } from "@/lib/auth/client";

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  dbLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshDbUser: () => Promise<void>;
  setDbUser: (dbUser: DbUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  dbLoading: false,
  error: null,
  signOut: async () => {},
  refreshDbUser: async () => {},
  setDbUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDbUser = useCallback(async () => {
    if (!auth.currentUser) {
      setDbUser(null);
      return;
    }

    try {
      setDbLoading(true);
      setError(null);
      let data = await fetchNeonUser(auth.currentUser);

      // If user doesn't exist in Neon DB yet, auto-sync
      if (!data) {
        data = await syncUserWithNeon(auth.currentUser);
      }

      setDbUser(data);
    } catch (err: unknown) {
      console.error("Failed to load user from Neon DB:", err);
      const msg =
        err instanceof Error ? err.message : "Database sync error";
      setError(msg);
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          setDbLoading(true);
          let data = await fetchNeonUser(currentUser);
          if (!data) {
            data = await syncUserWithNeon(currentUser);
          }
          setDbUser(data);
        } catch (err) {
          console.error("Error fetching Neon user on auth change:", err);
        } finally {
          setDbLoading(false);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setDbUser(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        loading,
        dbLoading,
        error,
        signOut: handleSignOut,
        refreshDbUser,
        setDbUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
