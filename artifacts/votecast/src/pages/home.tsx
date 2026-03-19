import { useListElections } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button, Card, ScreenLoader, StatusBadge } from "@/components/ui-custom";
import { ArrowRight, Trophy, Users, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const { data: elections, isLoading, error } = useListElections();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center bg-black overflow-hidden">
        {/* Dynamic mesh background */}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-mesh.png`} 
            alt="Hero background" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        {/* Angled stark overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl animate-in slide-in-from-left-8 fade-in duration-700 ease-out">
            <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl text-white leading-none tracking-tight">
              DECIDE <br />
              <span className="text-primary text-shadow-sm">THE FUTURE.</span>
            </h1>
            <p className="mt-8 text-xl sm:text-2xl text-gray-400 font-sans font-medium tracking-wide max-w-xl border-l-4 border-primary pl-6">
              The uncompromising platform for college elections. Live voting. Real-time results. Ironclad integrity.
            </p>
            <div className="mt-12 flex flex-wrap gap-6">
              <Button size="xl" asChild className="clip-diagonal">
                <a href="#elections">View Elections</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Active Elections Section */}
      <section id="elections" className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16 border-b-2 border-border pb-8">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl text-white tracking-widest">
                ACTIVE ELECTIONS
              </h2>
              <p className="text-muted-foreground font-sans font-medium mt-2 tracking-widest uppercase text-sm">
                Select your college to cast your vote
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin">Admin Portal</Link>
            </Button>
          </div>

          {isLoading ? (
            <ScreenLoader />
          ) : error ? (
            <div className="p-8 border-2 border-destructive bg-destructive/10 text-destructive text-center font-bold tracking-widest uppercase">
              Failed to load elections. Please try again.
            </div>
          ) : elections && elections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {elections.map((election, i) => (
                <Card 
                  key={election.id} 
                  className="flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <StatusBadge status={election.status} />
                    <span className="text-xs text-muted-foreground font-bold tracking-widest">
                      ID: #{election.id}
                    </span>
                  </div>
                  
                  <h3 className="font-display text-3xl mb-2 line-clamp-2">
                    {election.name}
                  </h3>
                  <p className="text-primary font-bold tracking-widest uppercase text-sm mb-8">
                    {election.collegeName}
                  </p>

                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="font-medium font-sans">
                        {election.totalVoters.toLocaleString()} Registered
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Trophy className="w-5 h-5 text-primary" />
                      <span className="font-medium font-sans">
                        {election.totalVotesCast.toLocaleString()} Votes Cast
                      </span>
                    </div>
                    {election.votingEndsAt && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="font-medium font-sans text-sm">
                          Ends: {format(new Date(election.votingEndsAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      asChild
                    >
                      <Link href={`/election/${election.id}`}>Details</Link>
                    </Button>

                    {election.status === 'voting' && (
                      <Button className="w-full" asChild>
                        <Link href={`/vote/${election.id}`}>Vote Now</Link>
                      </Button>
                    )}
                    
                    {election.status === 'results' || election.status === 'closed' ? (
                      <Button className="w-full bg-white text-black hover:bg-gray-200" asChild>
                        <Link href={`/results/${election.id}`}>Results</Link>
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center border-4 border-dashed border-border">
              <h3 className="font-display text-4xl text-muted-foreground mb-4">NO ELECTIONS FOUND</h3>
              <p className="text-muted-foreground font-sans font-medium">Check back later or create a new one.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
