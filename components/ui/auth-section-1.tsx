"use client";

import { GrainGradient } from "@paper-design/shaders-react";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { getEmailAvatarUrl } from "@/lib/avatar";

const termsText = (
  <>
    By creating an account, you agree to our{" "}
    <a
      href="#"
      className="font-medium text-black/50 underline underline-offset-2 dark:text-white/50"
    >
      Terms and Services
    </a>{" "}
    and{" "}
    <a
      href="#"
      className="font-medium text-black/50 underline underline-offset-2 dark:text-white/50"
    >
      Privacy Policy
    </a>
  </>
);

export default function AuthSectionOne() {
  const { user, dbUser, signOut, refreshDbUser, setDbUser } = useAuth();

  // Auth mode: "signup" | "login" | "passwordless"
  const [mode, setMode] = useState<"signup" | "login" | "passwordless">("signup");

  // Form input states
  const [firstName, setFirstName] = useState("Bala");
  const [lastName, setLastName] = useState("Sharma");
  const [email, setEmail] = useState("bala@example.com");
  const [password, setPassword] = useState("password123");

  // Passwordless status
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Status & loading states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle incoming magic link if present in URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const storedEmail =
        window.localStorage.getItem("emailForSignIn") || "bala@example.com";
      signInWithEmailLink(auth, storedEmail, window.location.href)
        .then(async (cred) => {
          window.localStorage.removeItem("emailForSignIn");
          const synced = await syncUserWithNeon(cred.user, "Bala");
          setDbUser(synced);
          setSuccessMsg("Signed in via magic link and synced with Neon!");
          if (window.history.replaceState) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        })
        .catch((err) => {
          console.error(err);
          setErrorMsg(err.message);
        });
    }
  }, [setDbUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const displayName =
      `${firstName.trim()} ${lastName.trim()}`.trim() || "Bala";

    try {
      if (mode === "passwordless") {
        if (!email.trim()) {
          throw new Error("Please enter your email address.");
        }

        const actionCodeSettings = {
          url: `${window.location.origin}/login`,
          handleCodeInApp: true,
        };

        await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
        window.localStorage.setItem("emailForSignIn", email.trim());
        setMagicLinkSent(true);
        setSuccessMsg(`Magic sign-in link sent to ${email.trim()}! Check your inbox.`);
        return;
      }

      if (mode === "login") {
        if (!email.trim() || !password) {
          throw new Error("Please enter both email and password.");
        }

        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const syncedDbUser = await syncUserWithNeon(cred.user);
        setDbUser(syncedDbUser);
        setSuccessMsg("Signed in successfully!");
        return;
      }

      // mode === "signup"
      if (!email.trim() || !password) {
        throw new Error("Please fill in all required fields.");
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
        // If user already exists, sign in instead
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

      // Sync user with Neon Database
      const syncedDbUser = await syncUserWithNeon(loggedUser, displayName);
      setDbUser(syncedDbUser);
      setSuccessMsg("Account created and synced with Neon database!");
    } catch (err: unknown) {
      console.error("Auth error:", err);
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setErrorMsg(msg);
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
    <section className="min-h-screen bg-white p-3 text-black antialiased dark:bg-[#050505] dark:text-white">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-4 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="flex min-h-[640px] items-start rounded-xl border border-black/15 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#0a0a0a] lg:min-h-0 lg:p-12 xl:p-14">
          <div className="mx-auto w-full max-w-[500px]">
            {/* Top link back to home */}
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-emerald-500 transition-colors"
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Home</span>
              </Link>
              <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                Firebase × Neon
              </span>
            </div>

            {user ? (
              /* --- LOGGED IN STATE: Hello Bala! with Email Avatar --- */
              <div className="space-y-6 animate-fadeIn pt-4">
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <div className="size-16 sm:size-18 rounded-xl overflow-hidden border-2 border-emerald-500/40 shadow-lg bg-emerald-700/20 flex items-center justify-center">
                      <Image
                        src={avatarUrl}
                        alt={getGreetingName()}
                        width={72}
                        height={72}
                        unoptimized
                        className="size-full object-cover"
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 size-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0a0a0a] shadow-sm" />
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
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                      className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px]"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-black/50 dark:text-white/40">UUID:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
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
                    {mode === "passwordless" && "Sign in with an instant email link"}
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
                  {mode === "passwordless" && "or request email link"}
                </div>

                {errorMsg && (
                  <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
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
                    <div className="p-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 text-xs text-black/70 dark:text-white/70">
                      Check your inbox at <strong>{email}</strong> and click the link to log in.
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

            <a
              href="#"
              className="mb-4 inline-flex h-10 max-w-full items-center gap-2.5 rounded-lg border border-white/20 px-4 text-xs sm:text-sm font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white"
            >
              <WindowsIcon className="size-4 shrink-0" />
              <span className="truncate whitespace-nowrap">
                Download the windows app
              </span>
            </a>
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
      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-black/20 bg-white px-3 text-xs font-medium leading-none text-black transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
    >
      <span className="shrink-0 text-emerald-600 dark:text-emerald-400">{icon}</span>
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
    <label className="flex h-11 items-center justify-between gap-3 rounded-lg border border-black/20 bg-white px-3.5 text-sm dark:border-white/15 dark:bg-white/5">
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

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 4.7 10.7 3.6v7.7H3V4.7Zm8.8-1.25L21 2.1v9.2h-9.2V3.45ZM3 12.7h7.7v7.7L3 19.3v-6.6Zm8.8 0H21v9.2l-9.2-1.3v-7.9Z" />
    </svg>
  );
}
