import { useListElections } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { ScreenLoader } from "@/components/ui-custom";
import { Vote, Settings, CheckCircle2, Clock, Users, ChevronRight, ArrowRight } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:       { label: "Setting Up",            color: "bg-gray-600 text-gray-100" },
  nomination:  { label: "Nominations Open",       color: "bg-blue-600 text-blue-100" },
  voting:      { label: "🔴 Voting is OPEN",      color: "bg-green-700 text-white" },
  results:     { label: "Results Published",      color: "bg-yellow-600 text-black" },
  closed:      { label: "Election Ended",         color: "bg-gray-700 text-gray-300" },
};

export default function Home() {
  const { data: elections, isLoading } = useListElections();

  const activeElections = elections?.filter(e => e.status === "voting") ?? [];
  const otherElections = elections?.filter(e => e.status !== "voting") ?? [];

  return (
    <Layout>
      {/* Hero: Two Paths */}
      <section className="bg-black min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Subtle mesh bg */}
        <div className="absolute inset-0 opacity-20">
          <img src={`${import.meta.env.BASE_URL}images/hero-mesh.png`} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-2 mb-8">
            College Election Platform
          </div>
          <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl text-white leading-none mb-6">
            YOUR VOTE.<br />
            <span className="text-primary">YOUR VOICE.</span>
          </h1>
          <p className="text-gray-400 text-xl mb-14 font-sans max-w-xl mx-auto">
            Simple, fair, and transparent elections for your college — from nominations to final results.
          </p>

          {/* The TWO big choice buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a
              href="#vote"
              className="group w-full sm:w-auto bg-primary text-white font-display text-2xl uppercase tracking-wider px-10 py-6 flex items-center justify-center gap-4 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/30"
            >
              <Vote className="w-8 h-8" strokeWidth={2.5} />
              I Want to Vote
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>

            <Link
              href="/admin"
              className="group w-full sm:w-auto bg-card border-2 border-border text-white font-display text-2xl uppercase tracking-wider px-10 py-6 flex items-center justify-center gap-4 hover:border-white transition-all hover:scale-105 active:scale-95"
            >
              <Settings className="w-8 h-8 text-muted-foreground group-hover:text-white transition-colors" strokeWidth={2} />
              I'm an Organizer
              <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="bg-card border-y border-border py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-4xl text-center mb-12 tracking-wide">HOW IT WORKS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", icon: <Settings className="w-8 h-8 text-primary" />, title: "Organizer sets up", desc: "Creates the election, adds positions and candidates, registers voters." },
              { step: "02", icon: <Vote className="w-8 h-8 text-primary" />, title: "Students vote", desc: "Each registered student enters their ID and casts their vote — quick and simple." },
              { step: "03", icon: <CheckCircle2 className="w-8 h-8 text-primary" />, title: "Results are declared", desc: "Live vote counts are shown and winners are announced instantly." },
            ].map(item => (
              <div key={item.step} className="flex flex-col items-center text-center p-6">
                <div className="font-display text-6xl text-border mb-4">{item.step}</div>
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-display text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm font-sans leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Elections List */}
      <section id="vote" className="bg-background py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-4xl mb-2 tracking-wide">FIND YOUR ELECTION</h2>
          <p className="text-muted-foreground font-sans mb-10">Select your college's election below to cast your vote or view results.</p>

          {isLoading ? (
            <ScreenLoader />
          ) : !elections || elections.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-border">
              <Vote className="w-16 h-16 text-border mx-auto mb-4" />
              <h3 className="font-display text-3xl text-muted-foreground mb-2">No Elections Yet</h3>
              <p className="text-muted-foreground font-sans mb-6">Elections will appear here once an organizer sets them up.</p>
              <Link href="/admin" className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest hover:underline">
                Go to Organizer Panel <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active/voting elections first */}
              {activeElections.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-bold text-green-500 uppercase tracking-widest text-sm">Voting Open Now</span>
                  </div>
                  {activeElections.map(e => (
                    <ElectionCard key={e.id} election={e} primary />
                  ))}
                </div>
              )}

              {otherElections.length > 0 && (
                <div>
                  {activeElections.length > 0 && (
                    <p className="font-bold uppercase tracking-widest text-sm text-muted-foreground mb-4">Other Elections</p>
                  )}
                  {otherElections.map(e => (
                    <ElectionCard key={e.id} election={e} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function ElectionCard({ election, primary }: { election: any; primary?: boolean }) {
  const statusInfo = STATUS_LABEL[election.status] ?? { label: election.status, color: "bg-gray-600" };
  const turnoutPct = election.totalVoters > 0
    ? Math.round((election.totalVotesCast / election.totalVoters) * 100)
    : 0;

  return (
    <div className={`border-2 ${primary ? "border-green-700 bg-green-950/20" : "border-border bg-card"} p-6 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-all hover:border-primary group`}>
      <div className="flex-1 min-w-0">
        <span className={`inline-block text-xs font-bold px-3 py-1 mb-3 rounded-full ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        <h3 className="font-display text-2xl sm:text-3xl leading-tight">{election.name}</h3>
        <p className="text-muted-foreground text-sm font-sans mt-1">{election.collegeName}</p>

        <div className="flex items-center gap-6 mt-4 text-muted-foreground text-sm font-sans">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" /> {election.totalVoters} voters registered
          </span>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> {election.totalVotesCast} votes cast
          </span>
        </div>

        {election.totalVoters > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden max-w-[200px]">
              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${turnoutPct}%` }} />
            </div>
            <span className="text-xs font-bold text-muted-foreground">{turnoutPct}% turnout</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full sm:w-auto">
        {election.status === "voting" && (
          <Link
            href={`/vote/${election.id}`}
            className="bg-primary text-white font-display text-lg uppercase tracking-wider px-8 py-4 flex items-center justify-center gap-3 hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-primary/20"
          >
            <Vote className="w-5 h-5" /> Cast My Vote
          </Link>
        )}

        {(election.status === "results" || election.status === "closed" || election.status === "voting") && (
          <Link
            href={`/results/${election.id}`}
            className="border-2 border-border text-white font-display text-lg uppercase tracking-wider px-8 py-3 flex items-center justify-center gap-3 hover:border-white transition-all active:scale-95 whitespace-nowrap"
          >
            View Results
          </Link>
        )}

        {(election.status === "draft" || election.status === "nomination") && (
          <span className="text-muted-foreground font-bold text-sm uppercase tracking-widest text-center py-2">
            {election.status === "draft" ? "Not started yet" : "Accepting nominations"}
          </span>
        )}
      </div>
    </div>
  );
}
