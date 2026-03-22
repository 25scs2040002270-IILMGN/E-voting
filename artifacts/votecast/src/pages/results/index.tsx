import { useParams, useLocation } from "wouter";
import { useGetResults } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ScreenLoader } from "@/components/ui-custom";
import { Trophy, Activity, Share2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ResultsPage() {
  const { id } = useParams();
  const electionId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useGetResults(electionId, {
    query: { refetchInterval: 5000 },
  });

  if (isLoading && !data) return <Layout><ScreenLoader /></Layout>;
  if (error || !data) return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-display text-4xl text-destructive mb-4">Results Not Available</h2>
        <p className="text-muted-foreground font-sans mb-6">Unable to load results. The election may not exist.</p>
        <button onClick={() => setLocation("/")} className="border-2 border-border text-white font-bold uppercase tracking-wider px-6 py-3 hover:border-white transition-all">
          Go Home
        </button>
      </div>
    </Layout>
  );

  const { election, results } = data;
  const isLive = election.status === "voting";
  const isFinal = election.status === "results" || election.status === "closed";
  const turnoutPct = election.totalVoters > 0
    ? Math.round((election.totalVotesCast / election.totalVoters) * 100)
    : 0;

  const shareResults = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${election.name} — Results`, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Results link copied to clipboard!");
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className={`border-b-4 ${isLive ? "border-primary bg-black" : isFinal ? "border-yellow-600 bg-black" : "border-border bg-black"}`}>
        <div className="container mx-auto px-4 py-10">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm font-bold uppercase tracking-widest mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="flex-1">
              {isLive && (
                <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm mb-3 animate-pulse">
                  <Activity className="w-4 h-4" /> Live — Updating every 5 seconds
                </div>
              )}
              {isFinal && (
                <div className="flex items-center gap-2 text-yellow-400 font-bold tracking-widest uppercase text-sm mb-3">
                  <Trophy className="w-4 h-4" /> Final Results
                </div>
              )}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-none mb-2">{election.name}</h1>
              <p className="text-muted-foreground font-sans text-lg">{election.collegeName}</p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 items-start lg:items-end">
              {/* Turnout card */}
              <div className="bg-card border-2 border-border p-5 min-w-[180px]">
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">Voter Turnout</p>
                <div className="font-display text-4xl text-white mb-1">
                  {election.totalVotesCast}
                  <span className="text-xl text-muted-foreground font-sans"> / {election.totalVoters}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-background overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${turnoutPct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-primary">{turnoutPct}%</span>
                </div>
              </div>

              <button onClick={shareResults}
                className="flex items-center gap-2 border-2 border-border text-muted-foreground font-bold uppercase tracking-wider text-sm px-4 py-2.5 hover:border-white hover:text-white transition-all">
                <Share2 className="w-4 h-4" /> Share Results
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Winners Banner (final results only) */}
      {isFinal && results.length > 0 && results.some(r => r.candidates.length > 0) && (
        <div className="bg-gradient-to-r from-yellow-950/40 via-yellow-900/20 to-yellow-950/40 border-b-2 border-yellow-800">
          <div className="container mx-auto px-4 py-8">
            <h2 className="font-display text-3xl text-yellow-400 mb-6 flex items-center gap-3">
              <Trophy className="w-7 h-7" /> Election Winners
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(postResult => {
                const sorted = [...postResult.candidates].sort((a, b) => b.voteCount - a.voteCount);
                const winner = sorted[0];
                if (!winner || winner.voteCount === 0) return null;
                return (
                  <div key={postResult.post.id} className="bg-black/40 border border-yellow-700 p-4">
                    <p className="text-yellow-600 text-xs font-bold uppercase tracking-widest mb-1">{postResult.post.title}</p>
                    <h3 className="font-display text-2xl text-white">{winner.candidate.name}</h3>
                    <p className="text-muted-foreground text-sm font-sans">{winner.candidate.department}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold text-sm">{winner.voteCount} votes ({winner.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Detailed results per position */}
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-14">
        {results.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-3xl text-muted-foreground">No positions configured yet</p>
          </div>
        ) : (
          results.map((postResult, idx) => (
            <div key={postResult.post.id}>
              <div className="flex justify-between items-end mb-6 pb-4 border-b-2 border-border">
                <div>
                  <h2 className="font-display text-4xl sm:text-5xl">{postResult.post.title}</h2>
                  {postResult.post.description && (
                    <p className="text-muted-foreground font-sans text-sm mt-1">{postResult.post.description}</p>
                  )}
                </div>
                <span className="font-bold text-muted-foreground uppercase text-xs tracking-widest">
                  {postResult.totalVotes} vote{postResult.totalVotes !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-4">
                {postResult.candidates.length === 0 ? (
                  <p className="text-muted-foreground font-sans text-sm py-6">No candidates for this position.</p>
                ) : (
                  [...postResult.candidates]
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((c, i) => {
                      const isWinner = isFinal && i === 0 && c.voteCount > 0;
                      const isRunnerUp = isFinal && i === 1 && c.voteCount > 0;
                      return (
                        <div key={c.candidate.id} className={`p-5 sm:p-6 border-2 transition-all ${
                          isWinner ? "border-yellow-600 bg-yellow-950/20" :
                          isRunnerUp ? "border-border bg-card" :
                          "border-border bg-card opacity-80"
                        }`}>
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`w-10 h-10 flex items-center justify-center text-lg font-display flex-shrink-0 ${
                                isWinner ? "bg-yellow-600 text-black" :
                                isRunnerUp ? "bg-gray-700 text-white" :
                                "bg-card border border-border text-muted-foreground"
                              }`}>
                                {isWinner ? <Trophy className="w-5 h-5" /> : i + 1}
                              </div>
                              <div className="min-w-0">
                                <h3 className={`font-display text-2xl sm:text-3xl leading-tight ${isWinner ? "text-yellow-400" : "text-white"}`}>
                                  {c.candidate.name}
                                </h3>
                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">
                                  {c.candidate.rollNumber} · {c.candidate.department} · {c.candidate.year}
                                </p>
                                {c.candidate.manifesto && (
                                  <p className="text-muted-foreground font-sans text-sm mt-1 italic line-clamp-1">"{c.candidate.manifesto}"</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className={`font-display text-4xl ${isWinner ? "text-yellow-400" : "text-white"}`}>{c.voteCount}</div>
                              <div className="font-bold text-sm text-muted-foreground">{c.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                          <div className="w-full h-2.5 bg-background overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ease-out ${
                                isWinner ? "bg-yellow-500" :
                                isRunnerUp ? "bg-gray-500" :
                                "bg-border"
                              }`}
                              style={{ width: `${c.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          ))
        )}

        {/* Live update notice */}
        {isLive && (
          <div className="text-center border-t border-border pt-8 text-muted-foreground font-sans text-sm">
            <Activity className="w-4 h-4 inline-block mr-2 text-primary animate-pulse" />
            Results are updating automatically every 5 seconds while voting is open.
          </div>
        )}
      </div>
    </Layout>
  );
}
