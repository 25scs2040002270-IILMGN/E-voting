import { useParams } from "wouter";
import { useGetResults } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ScreenLoader, Card, StatusBadge, cn } from "@/components/ui-custom";
import { Trophy, Activity } from "lucide-react";

export default function ResultsPage() {
  const { id } = useParams();
  const electionId = parseInt(id || "0", 10);
  
  // Polling every 5 seconds for live results
  const { data, isLoading, error } = useGetResults(electionId, {
    query: { refetchInterval: 5000 }
  });

  if (isLoading && !data) return <Layout><ScreenLoader /></Layout>;
  if (error || !data) return <Layout><div className="p-20 text-center font-display text-4xl text-destructive">FAILED TO LOAD RESULTS</div></Layout>;

  const { election, results } = data;
  const isLive = election.status === "voting";
  const isFinal = election.status === "results" || election.status === "closed";

  return (
    <Layout>
      <div className="bg-black border-b-4 border-primary">
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <StatusBadge status={election.status} />
              {isLive && (
                <span className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase animate-pulse">
                  <Activity className="w-5 h-5" /> Live Updates
                </span>
              )}
            </div>
            <h1 className="font-display text-5xl sm:text-7xl text-white">{election.name}</h1>
            <p className="text-muted-foreground font-sans font-bold tracking-widest uppercase mt-2">
              {election.collegeName}
            </p>
          </div>
          
          <div className="bg-card border-2 border-border p-6 min-w-[200px] text-right">
            <div className="text-muted-foreground font-bold tracking-widest uppercase text-xs mb-1">Total Turnout</div>
            <div className="font-display text-4xl text-white">
              {election.totalVotesCast} <span className="text-xl text-muted-foreground">/ {election.totalVoters}</span>
            </div>
            <div className="w-full bg-background h-1 mt-3">
              <div 
                className="bg-primary h-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, (election.totalVotesCast / (election.totalVoters || 1)) * 100)}%`}} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {results.map((postResult, idx) => (
          <div key={postResult.post.id} className="animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 150}ms`}}>
            <div className="flex justify-between items-end mb-6 border-b-2 border-border pb-4">
              <h2 className="font-display text-4xl sm:text-5xl">{postResult.post.title}</h2>
              <span className="font-bold tracking-widest text-muted-foreground uppercase text-sm">
                {postResult.totalVotes} Votes Cast
              </span>
            </div>

            <div className="grid gap-6">
              {/* Sort candidates by vote count descending */}
              {[...postResult.candidates].sort((a,b) => b.voteCount - a.voteCount).map((c, i) => {
                const isWinner = isFinal && i === 0 && c.voteCount > 0;
                
                return (
                  <Card key={c.candidate.id} className={cn("p-6 sm:p-8", isWinner ? "border-primary bg-primary/5" : "")}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary flex items-center justify-center font-display text-2xl text-muted-foreground">
                          {i + 1}
                        </div>
                        <div>
                          <h3 className={cn("font-display text-3xl", isWinner ? "text-primary" : "text-white")}>
                            {c.candidate.name}
                            {isWinner && <Trophy className="inline-block ml-3 w-6 h-6 text-primary mb-1" />}
                          </h3>
                          <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase mt-1">
                            {c.candidate.department} • {c.candidate.year}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right w-full sm:w-auto">
                        <div className="font-display text-4xl text-white">{c.voteCount}</div>
                        <div className="text-primary font-bold tracking-widest text-sm">{c.percentage.toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-background overflow-hidden relative">
                      <div 
                        className={cn("h-full transition-all duration-1000 ease-out", isWinner ? "bg-primary" : "bg-muted-foreground")}
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </Card>
                );
              })}
              {postResult.candidates.length === 0 && (
                <p className="text-muted-foreground font-bold tracking-widest py-4">NO CANDIDATES FOR THIS POST</p>
              )}
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <div className="py-20 text-center font-display text-3xl text-muted-foreground">NO POSTS CONFIGURED</div>
        )}
      </div>
    </Layout>
  );
}
