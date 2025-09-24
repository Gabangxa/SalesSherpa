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
      className={`w-full h-11 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 text-white transition-all duration-300 shadow-lg hover:shadow-xl ${className}`}
      type="button"
    >
      <Chrome className="w-4 h-4 mr-2 text-[#4285F4]" />
      {text}
    </Button>
  );
}