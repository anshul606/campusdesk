"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, KeyRound, ArrowRight, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [etherealUrl, setEtherealUrl] = useState<string | null>(null);

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (user) {
      router.push("/resources");
    }
  }, [user, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send OTP.");
        setLoading(false);
        return;
      }

      setStep("otp");
      setCooldown(60);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
      if (data.previewUrl) {
        setEtherealUrl(data.previewUrl);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code.");
        setLoading(false);
        return;
      }

      login(data.token, data.user);
      router.push("/resources");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickName: string) => {
    setEmail(quickEmail);
    setName(quickName);
    setError(null);
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-sm">
        <h2 className="font-display text-2xl text-[var(--color-ink)] dark:text-[#E8E4DC]">
          Campus<em className="text-[var(--color-sandstone)]">Desk</em>
        </h2>


        <div className="mt-8">
          {error && (
            <div className="mb-4 rounded-md border border-[var(--color-clay)]/20 bg-orange-50 px-3 py-2.5 text-sm text-[var(--color-clay)] dark:bg-orange-950/30 dark:border-orange-900/40">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Full name <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-[var(--color-ink)] placeholder-stone-400 focus:border-[var(--color-sandstone)] focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  University email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@lnmiit.ac.in"
                    className="block w-full rounded-md border border-stone-300 pl-9 pr-3 py-2 text-sm font-mono text-[var(--color-ink)] placeholder-stone-400 focus:border-[var(--color-sandstone)] focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-sandstone)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                <p className="text-xs text-stone-400 mb-2">
                  Demo accounts, click to fill:
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("admin@lnmiit.ac.in", "Admin User")}
                    className="text-xs text-[var(--color-sandstone)] hover:underline font-medium"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("student1@lnmiit.ac.in", "Student 1")}
                    className="text-xs text-[var(--color-sandstone)] hover:underline font-medium"
                  >
                    Student 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("student2@lnmiit.ac.in", "Student 2")}
                    className="text-xs text-[var(--color-sandstone)] hover:underline font-medium"
                  >
                    Student 2
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-md border border-[var(--color-sage)]/20 bg-emerald-50 px-3 py-2.5 text-sm text-[var(--color-sage)] dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="w-full">
                    <p>Code sent to <strong className="font-mono">{email}</strong>.</p>
                    {devOtpHint && (
                      <p className="mt-1 font-mono font-bold text-[var(--color-ink)] dark:text-white">
                        Dev code: {devOtpHint}
                      </p>
                    )}
                    {etherealUrl && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200 dark:border-emerald-900/50">
                        <a
                          href={etherealUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 dark:text-emerald-200 dark:hover:text-white underline underline-offset-2"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View sent HTML email on Ethereal Mail ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  6-digit code
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="block w-full tracking-[0.25em] font-mono text-center text-lg font-bold rounded-md border border-stone-300 py-2.5 text-[var(--color-ink)] focus:border-[var(--color-sandstone)] focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-sandstone)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify & sign in"
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-stone-500 hover:text-[var(--color-ink)] dark:hover:text-white"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={() => handleRequestOtp()}
                  className="font-medium text-[var(--color-sandstone)] hover:underline disabled:text-stone-400 disabled:no-underline"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
