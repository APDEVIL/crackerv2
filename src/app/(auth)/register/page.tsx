"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/server/better-auth/client";

function GithubIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const { error } = await authClient.signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    if (error) {
      toast.error(error.message ?? "Registration failed");
      setLoading(false);
      return;
    }

    toast.success("Account created! Welcome to DS Cracker 🎆");
    router.push("/");
    router.refresh();
  }

  async function handleGithub() {
    setGithubLoading(true);

    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });

    if (error) {
      toast.error(error.message ?? "GitHub sign in failed");
      setGithubLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <p className="font-serif text-3xl font-black text-[#D4380D]">
            DS Cracker
          </p>
          <p className="mt-1 text-sm text-gray-500">Create your account</p>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm shadow-orange-50">

          {/* GitHub */}
          <Button
            variant="outline"
            className="w-full gap-2 rounded-xl border-gray-200"
            onClick={handleGithub}
            disabled={githubLoading}
          >
            {githubLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <GithubIcon className="h-4 w-4" />
            }
            Continue with GitHub
          </Button>

          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-gray-400">or</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="name"
                className="text-xs font-medium text-gray-600"
              >
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ramesh Kumar"
                value={form.name}
                onChange={set("name")}
                className="mt-1 rounded-xl"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-xs font-medium text-gray-600"
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                className="mt-1 rounded-xl"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="password"
                className="text-xs font-medium text-gray-600"
              >
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set("password")}
                  className="rounded-xl pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  tabIndex={-1}
                >
                  {showPw
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label
                htmlFor="confirm"
                className="text-xs font-medium text-gray-600"
              >
                Confirm password
              </Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={set("confirm")}
                className="mt-1 rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#D4380D] text-white hover:bg-[#b82e08]"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[#D4380D] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}