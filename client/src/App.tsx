import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";

import Dashboard from "@/pages/Dashboard";
import GoalsPage from "@/pages/GoalsPage";
import CheckInsPage from "@/pages/CheckInsPage";
import StrategyPage from "@/pages/StrategyPage";
import ResourcesPage from "@/pages/ResourcesPage";
import NotFound from "@/pages/not-found";

import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";

// For demo purposes, we're using a fixed user ID
const CURRENT_USER_ID = 1;

function AppContent() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch current user data
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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
          <Route path="/" component={Dashboard} />
          <Route path="/goals" component={GoalsPage} />
          <Route path="/check-ins" component={CheckInsPage} />
          <Route path="/strategy" component={StrategyPage} />
          <Route path="/resources" component={ResourcesPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
