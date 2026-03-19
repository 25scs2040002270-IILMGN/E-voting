import { Link, useLocation } from "wouter";
import { Vote } from "lucide-react";
import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Clean top navbar */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-black/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-primary text-white p-2 group-hover:scale-110 transition-transform duration-200">
              <Vote className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-2xl sm:text-3xl tracking-wide uppercase">
              Vote<span className="text-primary">Cast</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {!isAdmin ? (
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-white text-sm font-bold uppercase tracking-widest px-4 py-2 border border-transparent hover:border-border transition-all"
              >
                Organizer Login
              </Link>
            ) : (
              <Link
                href="/"
                className="text-muted-foreground hover:text-white text-sm font-bold uppercase tracking-widest px-4 py-2 border border-transparent hover:border-border transition-all"
              >
                ← Back to Home
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border bg-card py-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4" />
            <span className="font-display text-lg tracking-widest">VOTECAST</span>
          </div>
          <p className="font-sans uppercase tracking-widest text-xs">Fair elections, transparent results.</p>
        </div>
      </footer>
    </div>
  );
}
