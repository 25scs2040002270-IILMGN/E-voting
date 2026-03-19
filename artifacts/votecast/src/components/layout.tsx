import { Link, useLocation } from "wouter";
import { Shield, ChevronRight } from "lucide-react";
import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Heavy, industrial Navbar */}
      <header className="sticky top-0 z-50 w-full border-b-4 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-primary text-white p-2 transform -skew-x-12 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} />
            </div>
            <span className="font-display text-3xl sm:text-4xl tracking-wider uppercase mt-1">
              Vote<span className="text-primary">Cast</span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              href="/admin" 
              className={`font-sans font-bold uppercase tracking-wider text-sm sm:text-base flex items-center gap-1 transition-colors duration-200 ${
                location.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Admin <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10">
        {children}
      </main>

      {/* Brutalist Footer */}
      <footer className="border-t border-border bg-card py-12 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-muted-foreground" />
            <span className="font-display text-2xl text-muted-foreground tracking-widest">
              VOTECAST
            </span>
          </div>
          <p className="text-muted-foreground font-sans text-sm font-medium uppercase tracking-widest">
            Fair Conduct. Ironclad Results.
          </p>
        </div>
      </footer>
    </div>
  );
}
