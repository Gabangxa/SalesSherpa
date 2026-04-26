import { useState, useEffect, memo, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { NotificationProvider } from "@/hooks/use-notifications";
import { AlertCheckerProvider } from "@/components/providers/AlertCheckerProvider";
import { ProtectedRoute } from "@/lib/protected-route";
import ErrorBoundary from "@/components/ui/error-boundary";
import { PageLoading, LoadingOverlay } from "@/components/ui/loading";
import { OfflineAlert, OfflineBanner } from "@/components/ui/offline-alert";

// Lazy load page components for performance
import Dashboard from "@/pages/Dashboard";
import GoalsPage from "@/pages/GoalsPage";
import CheckInsPage from "@/pages/CheckInsPage";
import MeetingNotesPage from "@/pages/MeetingNotesPage";
import SettingsPage from "@/pages/SettingsPage";
import WebSocketTest from "@/pages/WebSocketTest";
import AuthPage from "@/pages/AuthPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import NotFound from "@/pages/not-found";

import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";

// Memoized components for performance optimization
const MemoizedSidebar = memo(Sidebar);
const MemoizedMobileHeader = memo(MobileHeader);

function AppContent() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  // Toggle mobile menu - memoized to prevent unnecessary re-renders
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prevState => !prevState);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Show public routes when user is not authenticated
  if (!user && location !== "/auth" && location !== "/verify-email" && location !== "/privacy-policy") {
    return (
      <ErrorBoundary>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route path="/privacy-policy" component={PrivacyPolicyPage} />
          <Route>
            <AuthPage />
          </Route>
        </Switch>
      </ErrorBoundary>
    );
  }

  // Render auth page for unauthenticated users
  if (!user) {
    return (
      <ErrorBoundary>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route path="/privacy-policy" component={PrivacyPolicyPage} />
          <Route>
            <AuthPage />
          </Route>
        </Switch>
      </ErrorBoundary>
    );
  }

  // Loading state with improved UI component
  if (isLoading) {
    return <PageLoading text="Loading your dashboard..." />;
  }

  // Main app layout for authenticated users
  return (
    <div className="flex h-screen overflow-hidden" data-bind="app-container">
      {/* Display offline banner at the top of the screen when offline */}
      <OfflineBanner />
      
      <MemoizedSidebar userData={user} currentPath={location} />
      <MemoizedMobileHeader 
        isMenuOpen={isMobileMenuOpen} 
        toggleMenu={toggleMobileMenu} 
        userData={user}
        currentPath={location}
      />
      
      <main className="flex-1 overflow-y-auto bg-background pt-16 lg:pt-0">
        <ErrorBoundary>
          <Switch>
            <ProtectedRoute path="/" component={Dashboard} />
            <ProtectedRoute path="/goals" component={GoalsPage} />
            <ProtectedRoute path="/check-ins" component={CheckInsPage} />
            <ProtectedRoute path="/meeting-notes" component={MeetingNotesPage} />
            <ProtectedRoute path="/settings" component={SettingsPage} />
            <ProtectedRoute path="/websocket-test" component={WebSocketTest} />
            <Route path="/auth" component={AuthPage} />
            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
        
        {/* Display offline alert for immediate notifications */}
        <OfflineAlert />
      </main>
    </div>
  );
}

// Wrap the entire app in an error boundary for global error handling
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
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
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
