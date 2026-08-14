"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Forgot password mode
  const [isForgotMode, setIsForgotMode] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setIsSubmitting(true);
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      toast.success("Signed in successfully! Launching Studio...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password.");
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setIsSubmitting(true);
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/dashboard`,
      });

      if (error) throw error;

      setResetSuccess(true);
      toast.success("Password reset link sent to your email!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-[#E4DFDA] shadow-lg rounded-2xl">
      {!isForgotMode ? (
        <>
          <CardHeader className="text-center space-y-2">
            <span className="w-10 h-10 rounded-full bg-[#EDE9FE] text-[#6E5DCD] flex items-center justify-center mx-auto text-xl font-bold">
              ✦
            </span>
            <CardTitle className="font-serif text-2xl">Sign in to Biofolio</CardTitle>
            <CardDescription className="text-xs">
              Enter your email and password to access your creator studio.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#14171A]">Email Address</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#14171A]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setErrorMsg(null);
                    }}
                    className="text-xs text-[#6E5DCD] hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                  {errorMsg}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl gap-1">
                {isSubmitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-[#E4DFDA] pt-4 text-xs text-[#6B6572]">
            <span>Don&apos;t have an account?</span>
            <Link href="/signup" className="ml-1 text-[#6E5DCD] font-semibold hover:underline">
              Create one with OTP
            </Link>
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader className="text-center space-y-2">
            <span className="w-10 h-10 rounded-full bg-[#EDE9FE] text-[#6E5DCD] flex items-center justify-center mx-auto text-xl font-bold">
              <KeyRound className="w-5 h-5" />
            </span>
            <CardTitle className="font-serif text-2xl">Reset password</CardTitle>
            <CardDescription className="text-xs">
              Enter your email and we&apos;ll send you a password recovery link.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {resetSuccess ? (
              <div className="text-center space-y-4 py-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                  Password reset link sent to <strong>{email}</strong>. Check your inbox!
                </div>
                <Button
                  onClick={() => {
                    setIsForgotMode(false);
                    setResetSuccess(false);
                  }}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#14171A]">Email Address</label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                    {errorMsg}
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl gap-1">
                  {isSubmitting ? "Sending link..." : "Send Reset Link"}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-[#E4DFDA] pt-4 text-xs text-[#6B6572]">
            <button
              onClick={() => {
                setIsForgotMode(false);
                setErrorMsg(null);
              }}
              type="button"
              className="text-[#6B6572] hover:underline"
            >
              ← Back to sign in
            </button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
