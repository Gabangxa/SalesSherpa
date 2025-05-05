import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { NotificationProvider } from "@/hooks/use-notifications";
import { AlertCheckerProvider } from "@/components/providers/AlertCheckerProvider";
import { ProtectedRoute } from "@/lib/protected-route";

import Dashboard from "@/pages/Dashboard";
import GoalsPage from "@/pages/GoalsPage";
import CheckInsPage from "@/pages/CheckInsPage";
import StrategyPage from "@/pages/StrategyPage";
import ResourcesPage from "@/pages/ResourcesPage";
import SettingsPage from "@/pages/SettingsPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";

import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { Loader2 } from "lucide-react";

function AppContent() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Show public routes when user is not on the /auth page
  if (!user && location !== "/auth") {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <AuthPage />
        </Route>
      </Switch>
    );
  }

  // Render auth page for unauthenticated users
  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <AuthPage />
        </Route>
      </Switch>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-neutral-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Main app layout for authenticated users
  return (
    <div className="flex h-screen overflow-hidden" data-bind="app-container">
      <Sidebar userData={user} currentPath={location} />
      <MobileHeader 
        isMenuOpen={isMobileMenuOpen} 
        toggleMenu={toggleMobileMenu} 
        userData={user}
        currentPath={location}
      />
      
      <main className="flex-1 overflow-y-auto bg-neutral-50 pt-16 lg:pt-0">
        <Switch>
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/goals" component={GoalsPage} />
          <ProtectedRoute path="/check-ins" component={CheckInsPage} />
          <ProtectedRoute path="/strategy" component={StrategyPage} />
          <ProtectedRoute path="/resources" component={ResourcesPage} />
          <ProtectedRoute path="/settings" component={SettingsPage} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <AlertCheckerProvider>
            <TooltipProvider>
              <Toaster />
              <AppContent />
            </TooltipProvider>
          </AlertCheckerProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
