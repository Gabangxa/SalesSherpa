import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from 'wouter';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mountain, CheckCircle2 } from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const FEATURES = [
  "Daily check-ins to stay on top of your pipeline",
  "Goal tracking with real progress, not vanity metrics",
  "Sherpa — a straight-talking AI sales colleague",
  "Time-off management that actually respects your boundaries",
];

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  if (user) {
    navigate("/");
    return null;
  }

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", name: "", role: "" },
  });

  function onLoginSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  function onRegisterSubmit(values: RegisterFormValues) {
    registerMutation.mutate(values);
  }

  return (
    <div className="min-h-screen flex bg-cream dark:bg-dark-bg">

      {/* ── Left: form panel ── */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-8 py-12">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 self-start md:self-auto">
          <div className="w-10 h-10 bg-clay rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-forest dark:text-parchment">
            SalesSherpa
          </span>
        </div>

        <div className="w-full max-w-md">

          {/* Heading */}
          <h1 className="font-serif text-3xl font-light italic text-forest dark:text-parchment mb-1">
            {activeTab === "login" ? "Welcome back." : "Join SalesSherpa."}
          </h1>
          <p className="text-sm text-forest/55 dark:text-parchment/55 mb-8">
            {activeTab === "login"
              ? "Sign in to your accountability platform."
              : "Create your account and start tracking what matters."}
          </p>

          {/* Tab switcher */}
          <div className="flex rounded-2xl border border-earth/25 dark:border-earth/15 bg-white dark:bg-dark-card p-1 mb-6 shadow-sm">
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all capitalize ${
                  activeTab === tab
                    ? "bg-clay text-white shadow-sm"
                    : "text-forest/60 dark:text-parchment/60 hover:text-forest dark:hover:text-parchment"
                }`}
              >
                {tab === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-earth/20 dark:border-earth/10 shadow-sm p-7">

            {activeTab === "login" ? (
              <div className="space-y-5">
                <GoogleSignInButton />

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-earth/20 dark:bg-earth/10" />
                  <span className="text-xs text-forest/40 dark:text-parchment/40 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-earth/20 dark:bg-earth/10" />
                </div>

                <div className="rounded-2xl border border-dashed border-earth/30 dark:border-earth/15 bg-earth/5 dark:bg-earth/5 px-4 py-3 text-center">
                  <p className="text-sm text-forest/60 dark:text-parchment/50">
                    Email / password login is temporarily unavailable.
                  </p>
                  <p className="text-xs text-forest/40 dark:text-parchment/35 mt-1">
                    Please use Google Sign-In above.
                  </p>
                </div>

                <p className="text-center text-sm text-forest/55 dark:text-parchment/55">
                  No account yet?{" "}
                  <button
                    onClick={() => setActiveTab("register")}
                    className="font-semibold text-clay hover:text-clay/80 transition-colors"
                  >
                    Register
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <GoogleSignInButton text="Sign up with Google" />

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-earth/20 dark:bg-earth/10" />
                  <span className="text-xs text-forest/40 dark:text-parchment/40 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-earth/20 dark:bg-earth/10" />
                </div>

                <div className="rounded-2xl border border-dashed border-earth/30 dark:border-earth/15 bg-earth/5 dark:bg-earth/5 px-4 py-3 text-center">
                  <p className="text-sm text-forest/60 dark:text-parchment/50">
                    Email / password registration is temporarily unavailable.
                  </p>
                  <p className="text-xs text-forest/40 dark:text-parchment/35 mt-1">
                    Please use Google Sign-Up above.
                  </p>
                </div>

                <p className="text-center text-xs text-forest/45 dark:text-parchment/40 leading-relaxed">
                  By creating an account you agree to our{" "}
                  <button
                    onClick={() => window.location.href = "/privacy-policy"}
                    className="underline hover:text-clay transition-colors"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>

                <p className="text-center text-sm text-forest/55 dark:text-parchment/55">
                  Already have an account?{" "}
                  <button
                    onClick={() => setActiveTab("login")}
                    className="font-semibold text-clay hover:text-clay/80 transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: hero panel — mirrors sidebar aesthetic ── */}
      <div className="hidden md:flex md:w-1/2 bg-moss flex-col justify-center px-14 py-12 relative overflow-hidden">

        {/* Organic decorative blobs — same vibe as the dashboard's earth tones */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sage/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-64 h-64 bg-clay/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-sm">

          {/* Brand mark */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-clay rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-parchment">SalesSherpa</span>
          </div>

          <h2 className="font-serif text-4xl font-light italic text-parchment mb-3 leading-snug">
            Your silent corner<br />of the sales floor.
          </h2>
          <p className="text-parchment/65 text-base mb-10 leading-relaxed">
            No manager watching. No dashboards for others. Just you, your numbers, and a colleague who listens.
          </p>

          <ul className="space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-earth flex-shrink-0 mt-0.5" />
                <span className="text-parchment/80 text-sm leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Pull quote */}
          <div className="mt-12 border-l-2 border-clay pl-5">
            <p className="text-parchment/70 text-sm italic leading-relaxed">
              "Built for the rep who's on their own all day with no one to debrief with."
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
