import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-sand/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Meet real people who care about the same things you do. Talk it through, share perspectives, and build a team.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-display font-semibold">Explore</p>
          <Link to="/domains" className="block text-muted-foreground hover:text-foreground">Interest domains</Link>
          <Link to="/how-it-works" className="block text-muted-foreground hover:text-foreground">How it works</Link>
          <Link to="/connect" className="block text-muted-foreground hover:text-foreground">Start connecting</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-display font-semibold">Trust</p>
          <Link to="/safety" className="block text-muted-foreground hover:text-foreground">Safety & real accounts</Link>
          <Link to="/auth" className="block text-muted-foreground hover:text-foreground">Sign in</Link>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ConnectTogether · Made for curious people
      </div>
    </footer>
  );
}
