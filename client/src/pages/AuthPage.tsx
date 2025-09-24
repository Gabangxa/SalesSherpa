import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from 'wouter';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { ResendVerificationDialog } from "@/components/ResendVerificationDialog";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Separator } from "@/components/ui/separator";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // If user is already logged in, redirect to home
  if (user) {
    navigate("/");
    return null;
  }
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      name: "",
      role: "",
    },
  });
  
  // Handle login form submission
  function onLoginSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }
  
  // Handle registration form submission
  function onRegisterSubmit(values: RegisterFormValues) {
    registerMutation.mutate(values);
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Left section - Forms */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
        {/* Subtle decorative elements for the left panel */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute -left-24 -top-24 w-64 h-64 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute -right-16 bottom-1/4 w-48 h-48 bg-white/3 rounded-full blur-xl"></div>
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white drop-shadow-sm">
              Welcome to Sales Sherpa
            </h2>
            <p className="text-white/80 mt-2">Access your sales accountability and guidance platform</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/10 border-white/10">
              <TabsTrigger value="login" className="text-base py-3">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-base py-3">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-white/10 shadow-xl bg-white/10 backdrop-blur-sm text-white">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Login</CardTitle>
                  <CardDescription className="text-base text-white/80">
                    Sign in to access your Sales Sherpa accountability platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <GoogleSignInButton />
                    
                    {/* Traditional login form temporarily disabled */}
                    <div className="text-center text-sm text-white/70 bg-white/5 p-4 rounded-lg border border-dashed border-white/20">
                      <p>Email/password login temporarily unavailable</p>
                      <p className="text-xs mt-1">Please use Google Sign-In above</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pb-6">
                  <p className="text-sm text-white/80">
                    Don't have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 font-semibold text-white hover:text-white/80" 
                      onClick={() => setActiveTab("register")}
                    >
                      Sign up
                    </Button>
                  </p>

                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card className="border-white/10 shadow-xl bg-white/10 backdrop-blur-sm text-white">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Create an Account</CardTitle>
                  <CardDescription className="text-base text-white/80">
                    Join Sales Sherpa to stay accountable and achieve your sales goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <GoogleSignInButton text="Sign up with Google" />
                    
                    {/* Traditional registration form temporarily disabled */}
                    <div className="text-center text-sm text-white/70 bg-white/5 p-4 rounded-lg border border-dashed border-white/20">
                      <p>Email/password registration temporarily unavailable</p>
                      <p className="text-xs mt-1">Please use Google Sign-Up above</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-center pb-6 space-y-4">
                  <p className="text-xs text-white/70 text-center">
                    By creating an account, you agree to our{" "}
                    <span className="text-white underline cursor-pointer">
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <button 
                      onClick={() => window.location.href = '/privacy-policy'}
                      className="text-white underline hover:text-white/80 bg-transparent border-none p-0 font-inherit cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                    .
                  </p>
                  <p className="text-sm text-white/80">
                    Already have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 font-semibold text-white hover:text-white/80" 
                      onClick={() => setActiveTab("login")}
                    >
                      Login
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right section - Hero image and info */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -left-32 top-1/3 w-72 h-72 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute right-1/4 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-xl"></div>
        </div>
        
        <div className="max-w-md relative z-10">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent drop-shadow-sm">
            Sales Sherpa
          </h1>
          <h2 className="text-2xl font-semibold mb-6 text-white/90">Accountability & Guidance for Sales Excellence</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="mr-3 mt-0.5 flex-shrink-0 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-lg">Daily check-ins and accountability</div>
            </li>
            <li className="flex items-start">
              <div className="mr-3 mt-0.5 flex-shrink-0 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-lg">Performance metrics tracking</div>
            </li>
            <li className="flex items-start">
              <div className="mr-3 mt-0.5 flex-shrink-0 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-lg">Personalized guidance from Sales Sherpa Assistant</div>
            </li>
            <li className="flex items-start">
              <div className="mr-3 mt-0.5 flex-shrink-0 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-lg">Time-off management that respects your boundaries</div>
            </li>
          </ul>
          <div className="mt-10 p-5 rounded-lg bg-white/10 backdrop-blur-sm shadow-xl border border-white/20">
            <p className="text-base">
              Sales Sherpa helps sales professionals stay accountable to their goals, track meaningful progress, and receive personalized guidance that requires your active engagement to maximize results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}