import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from 'wouter';
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
      role: "Fintech Sales Professional",
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
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center bg-muted/20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Welcome to Sales Sherpa
            </h2>
            <p className="text-muted-foreground mt-2">Access your sales accountability and guidance platform</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" className="text-base py-3">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-base py-3">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-border/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Login</CardTitle>
                  <CardDescription className="text-base">
                    Sign in to access your Sales Sherpa accountability platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="your.username" 
                                {...field} 
                                className="h-11" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                className="h-11" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-11 mt-4 shadow-md text-base font-medium" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center pb-6">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 font-semibold text-primary" 
                      onClick={() => setActiveTab("register")}
                    >
                      Sign up
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card className="border-border/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Create an Account</CardTitle>
                  <CardDescription className="text-base">
                    Join Sales Sherpa to stay accountable and achieve your sales goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="your.username" 
                                {...field} 
                                className="h-11" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="john@example.com" 
                                {...field} 
                                className="h-11" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                {...field} 
                                className="h-11" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Job Role</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Fintech Sales Professional" 
                                {...field} 
                                className="h-11" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                className="h-11" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-11 mt-4 shadow-md text-base font-medium" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center pb-6">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 font-semibold text-primary" 
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
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/90 to-primary flex-col justify-center items-center p-12 text-white relative overflow-hidden">
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