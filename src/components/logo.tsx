import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center">
        <span className="absolute left-0 top-1 h-6 w-6 rounded-full bg-primary transition-transform group-hover:-translate-x-0.5" />
        <span className="absolute bottom-1 right-0 h-6 w-6 rounded-full bg-forest/90 mix-blend-multiply transition-transform group-hover:translate-x-0.5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Connect<span className="text-primary">Together</span>
      </span>
    </Link>
  );
}
