import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Loader2, UserRoundPen, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyProfile } from "@/hooks/use-auth";
import { isProfileComplete, profileMissing } from "@/lib/rules";

export function ProfileGate({ children }: { children: ReactNode }) {
  const { data: profile, isLoading } = useMyProfile();
  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (profile?.is_suspended) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h1 className="text-3xl font-bold">Your account is paused</h1>
        <p className="mt-3 text-muted-foreground">Several members reported this account, so it can't post for now.</p>
      </div>
    );
  }
  if (!isProfileComplete(profile)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <UserRoundPen className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold">Finish your profile first</h1>
        <p className="mt-3 text-muted-foreground">
          To keep fake accounts out, everyone adds {profileMissing(profile).join(", ")} before connecting.
        </p>
        <Button asChild variant="hero" size="xl" className="mt-6"><Link to="/onboarding">Complete my profile</Link></Button>
      </div>
    );
  }
  return <>{children}</>;
}
