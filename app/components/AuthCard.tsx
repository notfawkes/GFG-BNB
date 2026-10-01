"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { syncUserWithNeon } from "@/lib/auth/client";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password. Please check your credentials.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Please sign in instead.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/expired-action-code":
        return "This sign-in link has expired. Please request a new one.";
      case "auth/invalid-action-code":
        return "This sign-in link is invalid or has already been used.";
      default:
        if (
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ) {
          return (error as { message: string }).message;
        }
    }
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred. Please try again.";
}

export default function AuthCard() {
  const { user, dbUser, loading, dbLoading, signOut, refreshDbUser, setDbUser } =
    useAuth();

  // Mode: "password" | "passwordless"
  const [tab, setTab] = useState<"password" | "passwordless">("password");

  // Email & Password states
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Passwordless magic link states
  const [magicEmail, setMagicEmail] = useState("");
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);

  // Magic link link-completion states
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [confirmEmailNeeded, setConfirmEmailNeeded] = useState(false);
  const [manualConfirmEmail, setManualConfirmEmail] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const completeMagicLinkSignIn = useCallback(
    async (targetEmail: string) => {
      setIsVerifyingLink(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      try {
        const result = await signInWithEmailLink(
          auth,
          targetEmail,
          window.location.href
        );
        window.localStorage.removeItem("emailForSignIn");

        // Sync user to Neon database
        const syncedUser = await syncUserWithNeon(result.user);
        setDbUser(syncedUser);

        setSuccessMsg("Successfully signed in and synced with Neon database!");
        setConfirmEmailNeeded(false);

        // Clean the URL query params without full page reload
        if (window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (err) {
        console.error("Magic link verification error:", err);
        setErrorMsg(getErrorMessage(err));
      } finally {
        setIsVerifyingLink(false);
      }
    },
    [setDbUser]
  );

  // Check if current URL contains Firebase sign-in link
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isSignInWithEmailLink(auth, window.location.href)) {
      const storedEmail = window.localStorage.getItem("emailForSignIn");
      queueMicrotask(() => {
        setTab("passwordless");
        if (storedEmail) {
          void completeMagicLinkSignIn(storedEmail);
        } else {
          setConfirmEmailNeeded(true);
        }
      });
    }
  }, [completeMagicLinkSignIn]);

  const handlePasswordlessSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, magicEmail.trim(), actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", magicEmail.trim());

      setLinkSentTo(magicEmail.trim());
      setSuccessMsg(`Sign-in link sent to ${magicEmail.trim()}!`);
    } catch (err) {
      console.error("Send sign in link error:", err);
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    try {
      if (isSignUp) {
        // Register new user
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        if (displayName.trim()) {
          await updateProfile(credential.user, {
            displayName: displayName.trim(),
          });
        }

        // Sync to Neon DB
        const syncedDbUser = await syncUserWithNeon(
          credential.user,
          displayName.trim()
        );
        setDbUser(syncedDbUser);
        setSuccessMsg("Account created and saved in Neon database!");
      } else {
        // Sign in existing user
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        // Sync or fetch Neon DB record
        const syncedDbUser = await syncUserWithNeon(credential.user);
        setDbUser(syncedDbUser);
        setSuccessMsg("Signed in successfully!");
      }
    } catch (err) {
      console.error("Password auth error:", err);
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-center shadow-2xl backdrop-blur-xl">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-4" />
        <p className="text-zinc-400 text-sm">Checking authentication status...</p>
      </div>
    );
  }

  // --- LOGGED IN STATE ---
  if (user) {
    return (
      <div className="w-full max-w-lg mx-auto p-6 sm:p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-2xl backdrop-blur-xl transition-all">
        {/* Header Badge */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
              {user.email ? user.email[0].toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                {user.displayName || user.email?.split("@")[0] || "User"}
              </h2>
              <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
            </div>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Neon Synced</span>
          </div>
        </div>

        {/* Database Record Details */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Neon Postgres Record
            </h3>
            {dbLoading ? (
              <span className="text-xs text-zinc-500 animate-pulse">Syncing...</span>
            ) : (
              <button
                type="button"
                onClick={() => refreshDbUser()}
                className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors flex items-center space-x-1"
                title="Refresh database record"
              >
                <span>Refresh</span>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
          </div>

          {dbUser ? (
            <div className="rounded-xl bg-zinc-950/60 border border-zinc-800/80 p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between group">
                <span className="text-zinc-500">ID (UUID):</span>
                <div className="flex items-center space-x-1">
                  <span className="text-emerald-400">{dbUser.id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(dbUser.id, "uuid")}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white px-1 text-[10px] transition-opacity"
                  >
                    {copiedKey === "uuid" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between group">
                <span className="text-zinc-500">Firebase UID:</span>
                <div className="flex items-center space-x-1">
                  <span className="text-zinc-300 truncate max-w-[200px]" title={dbUser.firebase_uid}>
                    {dbUser.firebase_uid}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(dbUser.firebase_uid, "uid")}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white px-1 text-[10px] transition-opacity"
                  >
                    {copiedKey === "uid" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Email:</span>
                <span className="text-zinc-300">{dbUser.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Display Name:</span>
                <span className="text-zinc-300">
                  {dbUser.display_name || <em className="text-zinc-600">none</em>}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Created:</span>
                <span className="text-zinc-400">
                  {new Date(dbUser.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-zinc-950/60 border border-zinc-800/80 p-4 text-center">
              <p className="text-zinc-400 text-xs mb-2">Syncing database record...</p>
              <button
                type="button"
                onClick={() => refreshDbUser()}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              >
                Sync with Neon Now
              </button>
            </div>
          )}

          {/* Toggle Raw JSON */}
          {dbUser && (
            <div>
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center space-x-1"
              >
                <span>{showRawJson ? "Hide" : "View"} raw Postgres row JSON</span>
                <svg
                  className={`w-3 h-3 transform transition-transform ${showRawJson ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showRawJson && (
                <pre className="mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto">
                  {JSON.stringify(dbUser, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={signOut}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs border border-zinc-700/60 hover:border-zinc-600 transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // --- MAGIC LINK VERIFICATION PROGRESS STATE ---
  if (isVerifyingLink) {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-2xl backdrop-blur-xl text-center">
        <div className="inline-block animate-spin rounded-full h-9 w-9 border-2 border-emerald-500 border-t-transparent mb-4" />
        <h3 className="text-base font-medium text-zinc-100">Verifying Magic Link</h3>
        <p className="text-zinc-400 text-xs mt-1">
          Authenticating with Firebase and storing your profile in Neon database...
        </p>
      </div>
    );
  }

  // --- MAGIC LINK MANUAL CONFIRM EMAIL (If opened in another browser/device) ---
  if (confirmEmailNeeded) {
    return (
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-100">Confirm Your Email</h2>
          <p className="text-xs text-zinc-400 mt-1">
            To complete sign-in from this device, please re-enter the email where you received the link.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualConfirmEmail.trim()) {
              completeMagicLinkSignIn(manualConfirmEmail.trim());
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={manualConfirmEmail}
              onChange={(e) => setManualConfirmEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
          >
            Complete Sign In
          </button>
        </form>
      </div>
    );
  }

  // --- MAIN AUTH TABS (Email & Password OR Passwordless) ---
  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-2xl backdrop-blur-xl">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 mb-3 shadow-inner">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11a7.978 7.978 0 002.04 5.385" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
          Welcome to App
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Firebase Authentication with Neon PostgreSQL persistence
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="grid grid-cols-2 p-1 bg-zinc-950/70 border border-zinc-800/80 rounded-xl mb-6 text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            setTab("password");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            tab === "password"
              ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span>Email & Password</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab("passwordless");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            tab === "passwordless"
              ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Passwordless Link</span>
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: EMAIL & PASSWORD */}
      {tab === "password" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="text-zinc-400 font-medium">
              {isSignUp ? "Create a new account" : "Sign in to existing account"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center space-x-2 mt-2"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>{isSignUp ? "Creating account..." : "Signing in..."}</span>
              </>
            ) : (
              <span>{isSignUp ? "Create Account & Store in Neon" : "Sign In & Sync Neon"}</span>
            )}
          </button>
        </form>
      )}

      {/* TAB 2: PASSWORDLESS MAGIC LINK */}
      {tab === "passwordless" && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            We will email you a password-free magic link that signs you in instantly and links your account directly to Neon database.
          </p>

          {linkSentTo ? (
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Check your email</span>
              </div>
              <p className="text-xs text-zinc-300">
                A sign-in link was sent to <strong className="text-white">{linkSentTo}</strong>. Click the link in that email to finish signing in.
              </p>
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Didn’t receive it?</span>
                <button
                  type="button"
                  onClick={() => setLinkSentTo(null)}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  Send to different email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordlessSend} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Sending magic link...</span>
                  </>
                ) : (
                  <span>Send Magic Link</span>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
