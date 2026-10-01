"use client";

import { GrainGradient } from "@paper-design/shaders-react";
import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { syncUserWithNeon } from "@/lib/auth/client";
import { getEmailAvatarUrl } from "@/lib/avatar";

const termsText = (
  <>
    By creating an account, you agree to our{" "}
    <a
      href="#"
      className="font-medium text-black/50 underline underline-offset-2 dark:text-white/50 hover:text-[#FC7819]"
    >
      Terms and Services
    </a>{" "}
    and{" "}
    <a
      href="#"
      className="font-medium text-black/50 underline underline-offset-2 dark:text-white/50 hover:text-[#FC7819]"
    >
      Privacy Policy
    </a>
  </>
);

function getFriendlyErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password. Please check your credentials.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Please sign in instead.";
      case "auth/weak-password":
        return "Password must be at least 6 characters long.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/invalid-action-code":
        return "This sign-in link is invalid or has already been used.";
      case "auth/expired-action-code":
        return "This sign-in link has expired. Please request a new one.";
      case "auth/user-disabled":
        return "This user account has been disabled.";
      case "auth/too-many-requests":
        return "Too many requests. Please try again later.";
      default:
        if (
          "message" in err &&
          typeof (err as { message: unknown }).message === "string"
        ) {
          return (err as { message: string }).message;
        }
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "An unexpected error occurred. Please try again.";
}

export default function AuthSection() {
  const { user, dbUser, signOut, refreshDbUser, setDbUser } = useAuth();

  // Auth mode: "signup" | "login" | "passwordless"
  const [mode, setMode] = useState<"signup" | "login" | "passwordless">("signup");

  // Form input states
  const [firstName, setFirstName] = useState("Bala");
  const [lastName, setLastName] = useState("Sharma");
  const [email, setEmail] = useState("bala@example.com");
  const [password, setPassword] = useState("password123");

  // Passwordless magic link status
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Status & loading states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Prompt state if link opened on another device without email in localStorage
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [confirmEmailInput, setConfirmEmailInput] = useState("");

  const handleCompleteSignIn = useCallback(
    async (emailForSignIn: string) => {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      try {
        const credential = await signInWithEmailLink(
          auth,
          emailForSignIn,
          window.location.href
        );

        window.localStorage.removeItem("emailForSignIn");

        // Log Firebase UID and Email (no tokens)
        console.log("Firebase UID:", credential.user.uid);
        console.log("Email:", credential.user.email);

        // Synchronize and persist user in Neon PostgreSQL via server
        const syncedDbUser = await syncUserWithNeon(credential.user, "Bala");
        setDbUser(syncedDbUser);

        setSuccessMsg("Signed in successfully via magic link and synced to Neon!");
        setNeedsEmailConfirm(false);

        // Clean query params from URL
        if (window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (err: unknown) {
        console.error("Magic link completion error:", err);
        setErrorMsg(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [setDbUser]
  );

  // Handle incoming magic link if present in URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isSignInWithEmailLink(auth, window.location.href)) {
      const storedEmail = window.localStorage.getItem("emailForSignIn");

      queueMicrotask(() => {
        setMode("passwordless");
        if (storedEmail) {
          void handleCompleteSignIn(storedEmail);
        } else {
          setNeedsEmailConfirm(true);
        }
      });
    }
  }, [handleCompleteSignIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const displayName =
      `${firstName.trim()} ${lastName.trim()}`.trim() || "Bala";

    try {
      // 1. Passwordless Flow: uses server API (Firebase Admin + Resend)
      if (mode === "passwordless") {
        if (!email.trim()) {
          throw new Error("Please enter your email address.");
        }

        const res = await fetch("/api/auth/send-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || "Failed to send magic link.");
        }

        window.localStorage.setItem("emailForSignIn", email.trim());
        setMagicLinkSent(true);
        setSuccessMsg("Check your email for a sign-in link.");
        return;
      }

      // 2. Email & Password Login Flow
      if (mode === "login") {
        if (!email.trim() || !password) {
          throw new Error("Please enter both email and password.");
        }

        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

        console.log("Firebase UID:", cred.user.uid);
        console.log("Email:", cred.user.email);

        const syncedDbUser = await syncUserWithNeon(cred.user);
        setDbUser(syncedDbUser);
        setSuccessMsg("Signed in successfully!");
        return;
      }

      // 3. Email & Password Signup Flow
      if (!email.trim() || !password) {
        throw new Error("Please fill in all required fields.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      let loggedUser;
      try {
        const newCred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        loggedUser = newCred.user;
        await updateProfile(loggedUser, { displayName });
      } catch (createErr: unknown) {
        const errObj = createErr as { code?: string };
        if (errObj.code === "auth/email-already-in-use") {
          const cred = await signInWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );
          loggedUser = cred.user;
        } else {
          throw createErr;
        }
      }

      console.log("Firebase UID:", loggedUser.uid);
      console.log("Email:", loggedUser.email);

      // Sync and store user in Neon Database
      const syncedDbUser = await syncUserWithNeon(loggedUser, displayName);
      setDbUser(syncedDbUser);
      setSuccessMsg("Account created and saved in Neon database!");
    } catch (err: unknown) {
      console.error("Auth error:", err);
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getGreetingName = () => {
    if (user?.displayName) {
      return user.displayName.split(" ")[0] || user.displayName;
    }
    if (dbUser?.display_name) {
      return dbUser.display_name.split(" ")[0] || dbUser.display_name;
    }
    return "Bala";
  };

  const avatarUrl = getEmailAvatarUrl(user?.email, user?.displayName || "Bala");

  return (
    <section className="min-h-screen bg-white p-3 text-black antialiased dark:bg-[#080808] dark:text-white">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-4 lg:grid-cols-[0.94fr_1.06fr]">
        {/* Left Side: Centered Content */}
        <div className="relative flex min-h-[640px] flex-col justify-center items-center rounded-xl border border-black/10 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#0c0c0c] lg:min-h-0 lg:p-12 xl:p-14">
          {/* Top link back to home */}
          <div className="absolute top-5 left-5 sm:top-7 sm:left-8 z-20">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-[#FC7819] transition-colors"
            >
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[500px] my-auto py-8">
            {user ? (
              /* --- LOGGED IN STATE: Hello Bala! with Email Avatar --- */
              <div className="space-y-6 animate-fadeIn pt-4">
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <div className="size-16 sm:size-18 rounded-xl overflow-hidden border-2 border-[#FC7819]/50 shadow-lg bg-[#FC7819]/10 flex items-center justify-center">
                      <Image
                        src={avatarUrl}
                        alt={getGreetingName()}
                        width={72}
                        height={72}
                        unoptimized
                        className="size-full object-cover"
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 size-3.5 bg-[#FC7819] rounded-full border-2 border-white dark:border-[#0c0c0c] shadow-sm" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-zinc-900 dark:text-zinc-100">
                      Hello {getGreetingName()}!
                    </h1>
                    <p className="text-xs sm:text-sm text-black/60 dark:text-white/50">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-[#FC7819]/10 text-[#FC7819] border border-[#FC7819]/25">
                  <span className="size-1.5 rounded-full bg-[#FC7819] animate-pulse" />
                  <span>Authenticated & Stored in Neon PostgreSQL</span>
                </div>

                {/* Database Record Details */}
                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5 font-sans">
                    <span className="text-black/50 dark:text-white/40 text-[11px] font-medium">
                      Neon Database Record
                    </span>
                    <button
                      type="button"
                      onClick={() => refreshDbUser()}
                      className="text-[#FC7819] hover:underline text-[11px]"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-black/50 dark:text-white/40">UUID:</span>
                    <span className="font-semibold text-[#FC7819] truncate max-w-[200px]">
                      {dbUser?.id || "Syncing..."}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-black/50 dark:text-white/40">Firebase UID:</span>
                    <span className="truncate max-w-[200px] text-black/80 dark:text-white/80">
                      {user.uid}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-black/50 dark:text-white/40">Email:</span>
                    <span className="text-black/80 dark:text-white/80 truncate max-w-[200px]">
                      {user.email}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-black/50 dark:text-white/40">Created:</span>
                    <span className="text-black/60 dark:text-white/60">
                      {dbUser?.created_at
                        ? new Date(dbUser.created_at).toLocaleString()
                        : "Just now"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex h-10 px-5 items-center justify-center rounded-lg border border-black/30 bg-black text-xs sm:text-sm font-medium text-white transition-colors hover:bg-black/85 dark:border-white/30 dark:bg-white dark:text-black dark:hover:bg-white/85"
                  >
                    Sign Out
                  </button>
                  <Link
                    href="/"
                    className="flex h-10 px-4 items-center justify-center rounded-lg border border-black/15 bg-transparent text-xs sm:text-sm font-medium text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Go to Home Page
                  </Link>
                </div>
              </div>
            ) : needsEmailConfirm ? (
              /* --- CONFIRM EMAIL (If opened in another browser) --- */
              <div className="space-y-4 pt-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Confirm your email
                  </h1>
                  <p className="mt-1.5 text-xs text-black/60 dark:text-white/55">
                    Please confirm the email where you received the sign-in link to complete authentication.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                    {errorMsg}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (confirmEmailInput.trim()) {
                      void handleCompleteSignIn(confirmEmailInput.trim());
                    }
                  }}
                  className="space-y-4"
                >
                  <FieldBox
                    label="Email Address"
                    value={confirmEmailInput}
                    onChange={setConfirmEmailInput}
                    type="email"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-11 w-full items-center justify-center rounded-lg border border-black/30 bg-black text-sm font-semibold text-white transition-colors hover:bg-black/85 disabled:opacity-50 dark:border-white/30 dark:bg-white dark:text-black dark:hover:bg-white/85"
                  >
                    {loading ? "Verifying..." : "Complete Sign In"}
                  </button>
                </form>
              </div>
            ) : (
              /* --- LOGGED OUT STATE: Auth Form with Refined Typography --- */
              <div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-zinc-900 dark:text-zinc-100">
                    {mode === "signup" && "Create an account"}
                    {mode === "login" && "Sign in to account"}
                    {mode === "passwordless" && "Passwordless Sign in"}
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-black/60 dark:text-white/55">
                    {mode === "signup" && "Brainstorm in chat, build in cowork"}
                    {mode === "login" && "Welcome back, enter your password to continue"}
                    {mode === "passwordless" && "Sign in with a secure magic link sent via Resend"}
                  </p>
                </div>

                {/* Mode Switcher Buttons */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {mode === "signup" ? (
                    <>
                      <OptionButton
                        icon={<KeyIcon />}
                        label="Already have account? Sign In"
                        onClick={() => {
                          setMode("login");
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                      />
                      <OptionButton
                        icon={<MagicLinkIcon />}
                        label="Passwordless Magic Link"
                        onClick={() => {
                          setMode("passwordless");
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                      />
                    </>
                  ) : mode === "login" ? (
                    <>
                      <OptionButton
                        icon={<UserPlusIcon />}
                        label="Need an account? Sign Up"
                        onClick={() => {
                          setMode("signup");
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                      />
                      <OptionButton
                        icon={<MagicLinkIcon />}
                        label="Passwordless Magic Link"
                        onClick={() => {
                          setMode("passwordless");
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <OptionButton
                        icon={<KeyIcon />}
                        label="Sign in with Password"
                        onClick={() => {
                          setMode("login");
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                      />
                      <OptionButton
                        icon={<UserPlusIcon />}
                        label="Create new account"
                        onClick={() => {
                          setMode("signup");
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                      />
                    </>
                  )}
                </div>

                <div className="my-5 text-center text-xs font-medium text-black/40 dark:text-white/40">
                  {mode === "signup" && "or enter your details to register"}
                  {mode === "login" && "or enter your credentials"}
                  {mode === "passwordless" && "or send magic link via Resend"}
                </div>

                {errorMsg && (
                  <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-2.5 rounded-lg bg-[#FC7819]/10 border border-[#FC7819]/30 text-[#FC7819] text-xs">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Signup only fields */}
                  {mode === "signup" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldBox
                        label="First Name"
                        value={firstName}
                        onChange={setFirstName}
                        type="text"
                      />
                      <FieldBox
                        label="Last Name"
                        value={lastName}
                        onChange={setLastName}
                        type="text"
                      />
                    </div>
                  )}

                  {/* Common Email field */}
                  <FieldBox
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    type="email"
                  />

                  {/* Password field for signup and login */}
                  {mode !== "passwordless" && (
                    <FieldBox
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      type="password"
                    />
                  )}

                  {/* Signup only terms & updates */}
                  {mode === "signup" && (
                    <div className="space-y-2 pt-1 text-xs leading-4 text-black/40 dark:text-white/40">
                      <CheckboxLine>
                        I don&apos;t want to receive feature update emails
                      </CheckboxLine>
                      <CheckboxLine defaultChecked>{termsText}</CheckboxLine>
                    </div>
                  )}

                  {/* Passwordless note */}
                  {mode === "passwordless" && magicLinkSent && (
                    <div className="p-3 rounded-lg bg-[#FC7819]/5 border border-[#FC7819]/25 text-xs text-black/80 dark:text-white/80">
                      Check your email for a sign-in link.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 flex h-11 w-full items-center justify-center rounded-lg border border-black/30 bg-black text-sm font-semibold text-white transition-colors hover:bg-black/85 disabled:opacity-50 dark:border-white/30 dark:bg-white dark:text-black dark:hover:bg-white/85"
                  >
                    {loading
                      ? "Processing..."
                      : mode === "signup"
                      ? "Submit & Create Account"
                      : mode === "login"
                      ? "Sign In with Password"
                      : "Send Magic Link"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right side shader hero card */}
        <div className="relative flex min-h-[520px] overflow-hidden rounded-xl bg-black p-8 text-white sm:p-10 lg:min-h-0">
          <GrainGradient
            speed={1}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.5}
            intensity={0.5}
            noise={0.25}
            shape="corners"
            frame={2854.5}
            colors={["#FFFFFF", "#FC7819", "#FC7819", "#FFFFFF"]}
            colorBack="#00000000"
            className="absolute inset-0 bg-black"
          />

          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            <h2 className="max-w-[540px] pt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:pt-12 lg:text-[44px] lg:leading-[1.05]">
              Think fast,
              <br />
              Build faster
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

function OptionButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-xs font-medium leading-none text-black transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
    >
      <span className="shrink-0 text-[#FC7819]">{icon}</span>
      <span className="truncate whitespace-nowrap">{label}</span>
    </button>
  );
}

function FieldBox({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  type?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <label className="flex h-11 items-center justify-between gap-3 rounded-lg border border-black/15 bg-white px-3.5 text-sm dark:border-white/15 dark:bg-white/5">
      <input
        type={type}
        value={value}
        aria-label={label}
        onFocus={() => {
          if (!isEditing) {
            setIsEditing(true);
          }
        }}
        onChange={(event) => {
          setIsEditing(true);
          onChange?.(event.target.value);
        }}
        className="min-w-0 flex-1 truncate bg-transparent text-black/80 dark:text-white/80 outline-none placeholder:text-black/30 dark:placeholder:text-white/35 text-xs sm:text-sm"
      />
      {!isEditing && !value && (
        <span className="shrink-0 text-xs text-black/60 dark:text-white/60 pointer-events-none">
          {label}
        </span>
      )}
    </label>
  );
}

function CheckboxLine({
  children,
  defaultChecked,
}: {
  children: ReactNode;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <span className="relative mt-0.5 size-3.5 shrink-0">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="peer size-full appearance-none rounded-[2px] border border-black/25 bg-white checked:border-black checked:bg-black dark:border-white/30 dark:bg-white/5 dark:checked:border-white dark:checked:bg-white"
        />
        <svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block dark:text-black"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 6.2 5 8.1 9 3.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}

function KeyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

function MagicLinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}
