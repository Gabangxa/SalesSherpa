import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";

interface GoogleSignInButtonProps {
  text?: string;
  className?: string;
}

export function GoogleSignInButton({ 
  text = "Continue with Google", 
  className = "" 
}: GoogleSignInButtonProps) {
  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      variant="outline"
      className={`w-full h-11 border-border/60 hover:bg-muted/50 ${className}`}
      type="button"
    >
      <Chrome className="w-4 h-4 mr-2 text-[#4285F4]" />
      {text}
    </Button>
  );
}