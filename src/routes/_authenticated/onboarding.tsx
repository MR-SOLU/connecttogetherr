import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { useMyProfile } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — ConnectTogether" },
      { name: "description", content: "Add your name, bio and interests to start connecting." },
      { property: "og:title", content: "Set up your profile — ConnectTogether" },
      { property: "og:description", content: "Add your name, bio and interests to start connecting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { data: profile, isLoading } = useMyProfile();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Almost there</p>
      <h1 className="text-4xl font-extrabold sm:text-5xl">Tell people who you are.</h1>
      <p className="mt-3 text-muted-foreground">A real profile helps others trust you — and helps us match you with the right conversations.</p>
      <div className="mt-8 rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-8">
        {isLoading || !profile ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        ) : (
          <ProfileForm profile={profile} submitLabel="Save & start connecting" onSaved={() => navigate({ to: "/connect" })} />
        )}
      </div>
    </div>
  );
}
