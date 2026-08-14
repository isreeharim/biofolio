"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Sparkles, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialHandle = searchParams.get("handle") || "";

  // Step state: 1 = Request, 2 = Verify
  const [step, setStep] = React.useState<1 | 2>(1);
  const [displayName, setDisplayName] = React.useState("");
  const [username, setUsername] = React.useState(initialHandle);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // OTP inputs state (6 boxes)
  const [otpDigits, setOtpDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState(30);

  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, countdown]);

  // Step 1: Send OTP code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
    if (cleanUser.length < 3) {
      setErrorMsg("Username must be at least 3 characters.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const supabase = createClient();

      // Check handle availability first
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleanUser)
        .maybeSingle();

      if (existingUser) {
        throw new Error("This username is already taken. Please pick another.");
      }

      // Send 6-digit Email OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: {
            username: cleanUser,
            display_name: displayName.trim() || cleanUser,
          },
        },
      });

      if (otpError) throw otpError;

      toast.success(`6-digit code sent to ${email}`);
      setStep(2);
      setCountdown(30);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle digit changes
  const handleDigitChange = (index: number, val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = num ? num[0] : "";
    setOtpDigits(newDigits);

    if (num && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    const code = newDigits.join("");
    if (code.length === 6) {
      handleVerifyOtp(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!pasted) return;

    const chars = pasted.slice(0, 6).split("");
    const newDigits = [...otpDigits];
    chars.forEach((c, i) => {
      newDigits[i] = c;
    });
    setOtpDigits(newDigits);

    if (chars.length < 6) {
      otpInputRefs.current[chars.length]?.focus();
    } else {
      otpInputRefs.current[5]?.focus();
      handleVerifyOtp(newDigits.join(""));
    }
  };

  // Step 2: Verify OTP and save initial password
  const handleVerifyOtp = async (code: string) => {
    setErrorMsg(null);
    if (code.length < 6) {
      setErrorMsg("Please enter all 6 digits.");
      return;
    }

    try {
      setIsSubmitting(true);
      const supabase = createClient();

      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "email",
      });

      if (error) throw error;

      // Update user password for future password sign-ins
      if (password) {
        try {
          await supabase.auth.updateUser({ password });
        } catch (pwErr) {
          console.warn("Password update notice:", pwErr);
        }
      }

      toast.success("Account verified! Launching your Creator Studio...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired verification code.");
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: {
            username: username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ""),
            display_name: displayName.trim(),
          },
        },
      });
      if (error) throw error;
      toast.success("A new 6-digit code has been sent!");
      setCountdown(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-[#E4DFDA] shadow-lg rounded-2xl">
      {step === 1 ? (
        <>
          <CardHeader className="text-center space-y-2">
            <span className="w-10 h-10 rounded-full bg-[#EDE9FE] text-[#6E5DCD] flex items-center justify-center mx-auto text-xl font-bold">
              ✦
            </span>
            <CardTitle className="font-serif text-2xl">Start your Biofolio</CardTitle>
            <CardDescription className="text-xs">
              Choose your unique handle and verify your email with a 6-digit OTP.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14171A]">Your Name *</label>
                <Input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Amelia Parker"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14171A]">Username / Address *</label>
                <div className="flex items-center border border-[#E4DFDA] rounded-lg bg-white overflow-hidden focus-within:border-[#6E5DCD] focus-within:ring-2 focus-within:ring-[#6E5DCD]/15">
                  <span className="bg-[#FAF6F0] px-3 py-2 text-xs font-mono text-[#918C95] border-r border-[#E4DFDA] select-none">
                    biofolio.site/
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="amelia"
                    className="w-full px-3 py-2 text-sm text-[#14171A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14171A]">Email Address *</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amelia@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14171A]">
                  Create Password * <span className="font-normal text-[#918C95]">(for signing in later)</span>
                </label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                  {errorMsg}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl gap-1">
                {isSubmitting ? (
                  <span>Sending 6-digit OTP...</span>
                ) : (
                  <>
                    <span>Send 6-Digit OTP Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-[#E4DFDA] pt-4 text-xs text-[#6B6572]">
            <span>Already have an account?</span>
            <Link href="/login" className="ml-1 text-[#6E5DCD] font-semibold hover:underline">
              Sign in with password
            </Link>
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader className="text-center space-y-2">
            <span className="w-10 h-10 rounded-full bg-[#EDE9FE] text-[#6E5DCD] flex items-center justify-center mx-auto text-xl font-bold">
              <Mail className="w-5 h-5" />
            </span>
            <CardTitle className="font-serif text-2xl">Enter verification code</CardTitle>
            <CardDescription className="text-xs">
              We sent a 6-digit code to <strong className="text-[#14171A]">{email}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 6 Digit Box Inputs */}
            <div className="flex items-center justify-center gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className="w-11 h-13 text-center text-xl font-bold font-mono border-2 border-[#E4DFDA] rounded-xl bg-white focus:border-[#6E5DCD] focus:ring-2 focus:ring-[#6E5DCD]/15 focus:outline-none transition-all"
                />
              ))}
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium text-center">
                {errorMsg}
              </div>
            )}

            <Button
              onClick={() => handleVerifyOtp(otpDigits.join(""))}
              disabled={isSubmitting || otpDigits.join("").length < 6}
              className="w-full rounded-xl gap-1"
            >
              {isSubmitting ? (
                <span>Verifying code...</span>
              ) : (
                <>
                  <span>Verify &amp; Launch Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-[#E4DFDA] pt-4 text-xs text-[#6B6572]">
            <button
              onClick={() => setStep(1)}
              type="button"
              className="hover:underline text-[#6B6572]"
            >
              ← Change Details
            </button>
            <button
              onClick={handleResend}
              type="button"
              disabled={countdown > 0 || isSubmitting}
              className="text-[#6E5DCD] font-semibold hover:underline disabled:opacity-50"
            >
              {countdown > 0 ? `Resend in (${countdown}s)` : "Resend Code"}
            </button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export default function SignupPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading...</div>}>
      <SignupFormContent />
    </React.Suspense>
  );
}
