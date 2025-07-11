import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { z } from "zod";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string()
});

type User = z.infer<typeof userSchema>;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  name: string;
  role: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // Prevent excessive refetching
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      const data = await res.json();
      return userSchema.parse(data);
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
    },
    onError: (error: any) => {
      // Extract specific error message from server response
      let errorMessage = "Invalid username or password";
      
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message && !error.message.includes("There was an issue")) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (error.status === 401) {
        errorMessage = "Invalid username or password. Please try again.";
      } else if (error.status === 429) {
        errorMessage = "Too many login attempts. Please wait before trying again.";
      } else if (error.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", data);
      const userData = await res.json();
      return userSchema.parse(userData);
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
      });
    },
    onError: (error: any) => {
      // Extract specific error message from server response
      let errorMessage = "Could not create account";
      
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message && !error.message.includes("There was an issue")) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (error.status === 400) {
        if (errorMessage.includes("Username already exists")) {
          errorMessage = "This username is already taken. Please choose a different one.";
        } else if (errorMessage.includes("Email already exists")) {
          errorMessage = "This email is already registered. Please use a different email or try logging in.";
        } else if (errorMessage.includes("username")) {
          errorMessage = "Username must be at least 3 characters long.";
        } else if (errorMessage.includes("email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (errorMessage.includes("password")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (errorMessage.includes("name")) {
          errorMessage = "Please provide a valid name.";
        } else if (errorMessage.includes("role")) {
          errorMessage = "Please provide a valid role.";
        } else {
          errorMessage = "Please check your information and try again.";
        }
      } else if (error.status === 429) {
        errorMessage = "Too many registration attempts. Please wait before trying again.";
      } else if (error.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}