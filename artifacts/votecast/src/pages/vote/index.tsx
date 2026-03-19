import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetElection,
  useCheckVoterStatus,
  useListPosts,
  useListCandidates,
  useCastVote,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ScreenLoader } from "@/components/ui-custom";
import { Vote, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, User } from "lucide-react";

// ——— Main page ———
export default function VotePage() {
  const { id } = useParams();
  const electionId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();

  const { data: election, isLoading } = useGetElection(electionId);
  const checkVoter = useCheckVoterStatus();

  const [voterId, setVoterId] = useState("");
  const [voterInfo, setVoterInfo] = useState<any>(null);
  const [inputError, setInputError] = useState("");

  if (isLoading) return <Layout><ScreenLoader /></Layout>;

  if (!election || election.status !== "voting") {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-6" />
          <h1 className="font-display text-5xl mb-3">Voting Not Open</h1>
          <p className="text-muted-foreground font-sans text-lg max-w-md mb-8">
            {!election
              ? "This election doesn't exist or the link is incorrect."
              : election.status === "results" || election.status === "closed"
                ? "This election has ended. You can view the final results."
                : "Voting for this election hasn't started yet. Please check back later."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {(election?.status === "results" || election?.status === "closed") && (
              <button
                onClick={() => setLocation(`/results/${electionId}`)}
                className="bg-primary text-white font-bold uppercase tracking-wider px-8 py-4 hover:bg-primary/90 transition-all"
              >
                View Results
              </button>
            )}
            <button
              onClick={() => setLocation("/")}
              className="border-2 border-border text-white font-bold uppercase tracking-wider px-8 py-4 hover:border-white transition-all"
            >
              Go Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterId.trim()) return;
    setInputError("");
    try {
      const res = await checkVoter.mutateAsync({ electionId, data: { voterId: voterId.trim().toUpperCase() } });
      if (!res.isRegistered) {
        setInputError("This ID is not registered for this election. Please check with your organizer.");
        return;
      }
      setVoterInfo(res);
    } catch {
      setInputError("Something went wrong. Please try again.");
    }
  };

  // Already voted screen
  if (voterInfo?.hasVoted) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
          <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
          <h1 className="font-display text-5xl mb-3 text-green-400">Already Voted</h1>
          <p className="text-muted-foreground font-sans text-lg max-w-md mb-2">
            Hi <strong className="text-white">{voterInfo.name || voterInfo.voterId}</strong>,
          </p>
          <p className="text-muted-foreground font-sans mb-8">
            Your vote has already been recorded. Each person can only vote once.
          </p>
          <button onClick={() => setLocation("/")} className="border-2 border-border text-white font-bold uppercase tracking-wider px-8 py-4 hover:border-white transition-all">
            Go Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Election header */}
      <div className="bg-black border-b-2 border-primary">
        <div className="container mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
            <Vote className="w-4 h-4" /> Voting is Open
          </div>
          <h1 className="font-display text-3xl sm:text-4xl">{election.name}</h1>
          <p className="text-muted-foreground font-sans text-sm mt-1">{election.collegeName}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl py-12">
        {!voterInfo ? (
          // Step 1: ID check
          <div className="bg-card border-2 border-border p-8">
            <div className="text-center mb-8">
              <div className="bg-primary/10 border-2 border-primary/30 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-3xl mb-2">Enter Your Student ID</h2>
              <p className="text-muted-foreground font-sans text-base">
                Type the roll number or ID you were given to participate in this election.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Your Student / Voter ID
                </label>
                <input
                  required
                  value={voterId}
                  onChange={e => { setVoterId(e.target.value); setInputError(""); }}
                  placeholder="e.g. 2021CS001"
                  className="w-full bg-background border-2 border-border px-4 py-4 font-mono text-white text-xl text-center tracking-widest focus:border-primary focus:outline-none transition-colors uppercase"
                />
                {inputError && (
                  <div className="mt-3 flex items-start gap-2 text-red-400 text-sm font-sans">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {inputError}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={checkVoter.isPending || !voterId.trim()}
                className="w-full bg-primary text-white font-display text-xl uppercase tracking-wider py-5 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Vote className="w-6 h-6" />
                {checkVoter.isPending ? "Checking…" : "Continue to Vote"}
              </button>
            </form>

            <p className="text-center text-muted-foreground font-sans text-xs mt-6">
              Don't know your ID? Contact your election organizer.
            </p>
          </div>
        ) : (
          // Step 2+: Voting booth
          <VotingBooth
            election={election}
            electionId={electionId}
            voterId={voterInfo.voterId}
            voterName={voterInfo.name}
          />
        )}
      </div>
    </Layout>
  );
}

// ——— Voting Booth: One post at a time ———
function VotingBooth({ election, electionId, voterId, voterName }: {
  election: any; electionId: number; voterId: string; voterName: string;
}) {
  const { data: posts, isLoading } = useListPosts(electionId);
  const voteMutation = useCastVote();
  const [, setLocation] = useLocation();

  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (isLoading || !posts) return <ScreenLoader />;

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground font-sans">No positions have been set up for this election yet.</p>
      </div>
    );
  }

  // Submission success
  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-green-900 border-4 border-green-500 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-14 h-14 text-green-400" />
        </div>
        <h2 className="font-display text-5xl text-green-400 mb-3">Vote Submitted!</h2>
        <p className="text-muted-foreground font-sans text-lg mb-2">
          Thank you, <strong className="text-white">{voterName || voterId}</strong>.
        </p>
        <p className="text-muted-foreground font-sans mb-10">
          Your votes have been securely recorded. Each person can only vote once.
        </p>
        <button
          onClick={() => setLocation("/")}
          className="border-2 border-border text-white font-bold uppercase tracking-wider px-8 py-4 hover:border-white transition-all"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const currentPost = posts[currentStep];
  const isLastStep = currentStep === posts.length - 1;
  const hasSelectedAll = posts.every(p => selections[p.id] !== undefined);

  const handleSubmit = async () => {
    if (!hasSelectedAll) return;
    if (!confirm(`You're about to submit your final vote. This cannot be undone.\n\nAre you sure?`)) return;

    await voteMutation.mutateAsync({
      electionId,
      data: {
        voterId,
        votes: Object.entries(selections).map(([postId, candidateId]) => ({
          postId: Number(postId),
          candidateId,
        })),
      },
    });
    setSubmitted(true);
  };

  return (
    <div>
      {/* Voter greeting */}
      <div className="flex items-center justify-between mb-6 bg-card border-l-4 border-primary p-4">
        <div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Voting as</p>
          <p className="font-bold text-white">{voterName || voterId} &nbsp;·&nbsp; <span className="font-mono text-muted-foreground text-sm">{voterId}</span></p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Progress</p>
          <p className="font-bold text-primary">{Object.keys(selections).length} / {posts.length} done</p>
        </div>
      </div>

      {/* Step progress dots */}
      <div className="flex items-center gap-2 mb-8">
        {posts.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setCurrentStep(i)}
            className={`flex-1 h-2 rounded-full transition-all ${
              selections[p.id] !== undefined
                ? "bg-green-500"
                : i === currentStep
                  ? "bg-primary"
                  : "bg-border"
            }`}
            title={p.title}
          />
        ))}
      </div>

      {/* Current position */}
      <div className="mb-6">
        <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
          Position {currentStep + 1} of {posts.length}
        </div>
        <h2 className="font-display text-4xl">{currentPost.title}</h2>
        {currentPost.description && (
          <p className="text-muted-foreground font-sans mt-1">{currentPost.description}</p>
        )}
        <p className="text-muted-foreground font-sans text-sm mt-2">Select one candidate:</p>
      </div>

      {/* Candidates */}
      <CandidateSelector
        postId={currentPost.id}
        selectedId={selections[currentPost.id]}
        onSelect={(candidateId) => {
          setSelections(s => ({ ...s, [currentPost.id]: candidateId }));
        }}
      />

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 gap-4">
        {currentStep > 0 ? (
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            className="flex items-center gap-2 border-2 border-border text-muted-foreground font-bold uppercase tracking-wider px-6 py-3 hover:border-white hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}

        {!isLastStep ? (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={!selections[currentPost.id]}
            className="flex items-center gap-2 bg-primary text-white font-bold uppercase tracking-wider px-8 py-3 hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            Next Position <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!hasSelectedAll || voteMutation.isPending}
            className="flex items-center gap-3 bg-green-700 text-white font-display text-xl uppercase tracking-wider px-10 py-4 hover:bg-green-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Vote className="w-6 h-6" />
            {voteMutation.isPending ? "Submitting…" : "Submit My Vote"}
          </button>
        )}
      </div>

      {!selections[currentPost.id] && (
        <p className="text-center text-muted-foreground text-sm font-sans mt-4">
          Please select a candidate to continue.
        </p>
      )}
    </div>
  );
}

// ——— Candidate selector for a post ———
function CandidateSelector({ postId, selectedId, onSelect }: {
  postId: number; selectedId?: number; onSelect: (id: number) => void;
}) {
  const { data: candidates, isLoading } = useListCandidates(postId);

  if (isLoading) return <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  if (!candidates || candidates.length === 0) {
    return (
      <div className="py-10 text-center border-2 border-dashed border-border text-muted-foreground">
        <p className="font-sans">No candidates registered for this position.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {candidates.map(c => {
        const isSelected = selectedId === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left border-2 p-5 transition-all hover:scale-[1.01] active:scale-[0.99] ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className={`font-display text-2xl ${isSelected ? "text-primary" : "text-white"}`}>
                  {c.name}
                </h3>
                <p className="text-muted-foreground font-sans text-sm mt-1">
                  {c.rollNumber} &nbsp;·&nbsp; {c.department} &nbsp;·&nbsp; Year {c.year}
                </p>
                {c.manifesto && (
                  <p className="text-muted-foreground font-sans text-sm mt-2 italic line-clamp-2">
                    "{c.manifesto}"
                  </p>
                )}
              </div>

              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                isSelected ? "border-primary bg-primary" : "border-border"
              }`}>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
