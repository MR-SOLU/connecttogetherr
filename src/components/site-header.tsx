import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, User, Users, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/logo";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth, useMyProfile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const linkCls = "rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
const activeCls = { className: "rounded-full px-3.5 py-2 text-sm font-semibold text-foreground bg-card shadow-soft" };

export function SiteHeader() {
  const { session, ready } = useAuth();
  const { data: profile } = useMyProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = (
    <>
      <Link to="/" className={linkCls} activeProps={activeCls} activeOptions={{ exact: true }} onClick={() => setOpen(false)}>Home</Link>
      <Link to="/domains" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>Domains</Link>
      <Link to="/how-it-works" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>How it works</Link>
      <Link to="/safety" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>Safety</Link>
      {session && (
        <>
          <Link to="/connect" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>Connect</Link>
          <Link to="/teams" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>Teams</Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">{links}</nav>
        <div className="flex items-center gap-2">
          {!ready ? (
            <div className="h-9 w-24" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
                <UserAvatar name={profile?.display_name || session.user.email || "?"} tone={profile?.avatar_tone ?? 0} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{profile?.display_name || session.user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/connect" })}><MessagesSquare /> Connect</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/teams" })}><Users /> My teams</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}><User /> Profile</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden rounded-full sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="hero">
                <Link to="/auth" search={{ mode: "signup" }}>Join free</Link>
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Open menu">
            <Menu />
          </Button>
        </div>
      </div>
      <nav className={cn("flex-col gap-1 border-t border-border/60 px-4 py-3 lg:hidden", open ? "flex" : "hidden")}>{links}</nav>
    </header>
  );
}
