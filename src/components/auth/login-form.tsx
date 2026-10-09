"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AssetIcon } from "@/components/ui/asset-icon";
import { Divider } from "@/components/ui/divider";
import { Notice } from "@/components/ui/notice";
import { ApiError, login, storeToken } from "@/lib/api";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"info" | "error">("info");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await login(email.trim(), password);
      storeToken(response.data.token);
      router.push("/dashboard");
    } catch (err) {
      setTone("error");
      setMessage(
        err instanceof ApiError ? err.message : "Could not sign you in.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-96">
      <div className="flex justify-center">
        <Brand />
      </div>
      <h1 className="mt-10 text-center font-display text-[25px] leading-[1.3] font-semibold text-[#eee]">
        Sign in to your Account
      </h1>
      <p className="mt-1 text-center text-sm text-[#9aa0b5]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup/account-type"
          className="text-lavender hover:underline"
        >
          Sign Up
        </Link>
      </p>
      <form className="mt-8" onSubmit={handleSubmit}>
        <Input
          aria-label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          variant="filled"
          leading={<AssetIcon name="mail" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <div className="mt-4">
          <PasswordInput
            aria-label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            variant="filled"
            leading={<AssetIcon name="lock" />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div className="mt-2 flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-lavender hover:underline"
          >
            Forgot Your Password?
          </Link>
        </div>
        <Button
          variant="login"
          size="lg"
          type="submit"
          fullWidth
          className="mt-4"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Log In"}
        </Button>
      </form>
      <div className="mt-6">
        <Divider />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {(["google", "facebook"] as const).map((provider) => (
          <Button
            key={provider}
            variant="secondary"
            className="h-[47px] font-medium text-[#9aa0b5]"
            onClick={() => {
              setTone("info");
              setMessage(
                `${provider === "google" ? "Google" : "Facebook"} sign-in isn't connected yet. You can sign in with email and password, or explore registration with Sign Up.`,
              );
            }}
          >
            <AssetIcon name={provider} />
            {provider === "google" ? "Google" : "Facebook"}
          </Button>
        ))}
      </div>
      {message && (
        <div className="mt-5">
          <Notice tone={tone}>{message}</Notice>
        </div>
      )}
    </div>
  );
}
