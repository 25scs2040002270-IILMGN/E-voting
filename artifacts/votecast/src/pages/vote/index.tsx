import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetElection,
  useCheckVoterStatus,
  useListPosts,
  useListCandidates,
  useCastVote
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button, Input, Label, Card, ScreenLoader, cn } from "@/components/ui-custom";
import { Fingerprint, CheckCircle2, ShieldCheck } from "lucide-react";

export default function VotePage() {
  const { id } = useParams();
  const electionId = parseInt(id || "0", 10);
  const [location, setLocation] = useLocation();
  
  const { data: election, isLoading: loadingElection } = useGetElection(electionId);
  const checkVoterMutation = useCheckVoterStatus();
  
  const [voterId, setVoterId] = useState("");
  const [voterInfo, setVoterInfo] = useState<any>(null);

  if (loadingElection) return <Layout><ScreenLoader /></Layout>;
  
  if (!election || election.status !== "voting") {
    return (
      <Layout>
        <div className="py-32 text-center container mx-auto">
          <h1 className="font-display text-5xl text-destructive mb-4">VOTING CLOSED</h1>
          <p className="font-sans text-xl text-muted-foreground mb-8">This election is currently not accepting votes.</p>
          <Button onClick={() => setLocation(`/election/${electionId}`)}>Return to Details</Button>
        </div>
      </Layout>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await checkVoterMutation.mutateAsync({ electionId, data: { voterId } });
      setVoterInfo(res);
    } catch (err: any) {
      alert(err.message || "Verification failed");
    }
  };

  return (
    <Layout>
      <div className="bg-primary/10 border-b-2 border-primary py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl sm:text-5xl tracking-widest text-primary">CAST YOUR VOTE</h1>
          <p className="font-bold tracking-widest uppercase mt-2 text-white">{election.name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {!voterInfo ? (
          <Card className="max-w-md mx-auto mt-12 border-t-4 border-t-primary shadow-2xl">
            <div className="text-center mb-8">
              <Fingerprint className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="font-display text-3xl">VOTER IDENTIFICATION</h2>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2">Enter your registered ID</p>
            </div>
            <form onSubmit={handleVerify}>
              <Label>Voter ID</Label>
              <Input required value={voterId} onChange={e => setVoterId(e.target.value.toUpperCase())} className="mb-6 text-center text-2xl font-display tracking-widest" placeholder="e.g. 2021CS01" />
              <Button type="submit" className="w-full" size="lg" isLoading={checkVoterMutation.isPending}>Verify Identity</Button>
            </form>
          </Card>
        ) : (
          <VotingBooth electionId={electionId} voterId={voterInfo.voterId} name={voterInfo.name} hasVoted={voterInfo.hasVoted} />
        )}
      </div>
    </Layout>
  );
}

function VotingBooth({ electionId, voterId, name, hasVoted }: { electionId: number, voterId: string, name: string, hasVoted: boolean }) {
  const { data: posts, isLoading } = useListPosts(electionId);
  const voteMutation = useCastVote();
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (hasVoted) {
    return (
      <Card className="text-center py-20 border-green-500 border-2">
        <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h2 className="font-display text-5xl text-white mb-4">VOTE RECORDED</h2>
        <p className="font-bold uppercase tracking-widest text-muted-foreground">Thank you for participating, {name || voterId}.</p>
      </Card>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
        <ShieldCheck className="w-32 h-32 text-primary mx-auto mb-8" />
        <h2 className="font-display text-6xl text-white mb-4">BALLOT SECURED</h2>
        <p className="font-bold uppercase tracking-widest text-muted-foreground">Your voice has been heard.</p>
        <Button className="mt-12" asChild><a href="/">Return Home</a></Button>
      </div>
    );
  }

  if (isLoading) return <ScreenLoader />;

  const isComplete = posts && Object.keys(selections).length === posts.length;

  const handleSubmit = async () => {
    if(!isComplete) return;
    if(!confirm("Submit final ballot? This action is irreversible.")) return;

    try {
      await voteMutation.mutateAsync({
        electionId,
        data: {
          voterId,
          votes: Object.entries(selections).map(([postId, candidateId]) => ({
            postId: Number(postId),
            candidateId
          }))
        }
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || "Failed to submit vote");
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex justify-between items-center bg-secondary p-4 px-6 border-l-4 border-primary">
        <span className="font-bold tracking-widest uppercase text-muted-foreground">Voter: <span className="text-white">{name || voterId}</span></span>
        <span className="font-bold tracking-widest text-primary">{Object.keys(selections).length} / {posts?.length} Selected</span>
      </div>

      {posts?.map((post, i) => (
        <PostVotingBlock 
          key={post.id} 
          post={post} 
          delay={i * 150}
          selectedCandidateId={selections[post.id]}
          onSelect={(cid) => setSelections(s => ({...s, [post.id]: cid}))}
        />
      ))}

      <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t-2 border-border p-6 mt-12 flex flex-col sm:flex-row justify-between items-center gap-6">
        <p className="font-bold tracking-widest uppercase text-sm text-muted-foreground text-center sm:text-left">
          {isComplete ? "All positions selected. Ready to cast." : "Select a candidate for every position to continue."}
        </p>
        <Button 
          size="xl" 
          disabled={!isComplete} 
          onClick={handleSubmit}
          isLoading={voteMutation.isPending}
          className="w-full sm:w-auto"
        >
          SUBMIT BALLOT
        </Button>
      </div>
    </div>
  );
}

function PostVotingBlock({ post, selectedCandidateId, onSelect, delay }: any) {
  const { data: candidates } = useListCandidates(post.id);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: `${delay}ms`}}>
      <h3 className="font-display text-4xl mb-2">{post.title}</h3>
      <p className="text-muted-foreground text-sm font-bold tracking-widest uppercase mb-6">{post.description || "Select exactly one candidate"}</p>
      
      <div className="grid sm:grid-cols-2 gap-4">
        {candidates?.map((c: any) => {
          const isSelected = selectedCandidateId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "p-6 text-left border-2 transition-all duration-200 group relative overflow-hidden",
                isSelected ? "border-primary bg-primary/10 scale-[1.02] shadow-2xl shadow-primary/20" : "border-border bg-card hover:border-muted-foreground"
              )}
            >
              <div className="relative z-10">
                <h4 className={cn("font-display text-3xl transition-colors", isSelected ? "text-primary" : "text-white")}>{c.name}</h4>
                <p className="text-muted-foreground font-bold text-xs tracking-widest uppercase mt-2">{c.department} • Year {c.year}</p>
              </div>
              
              {isSelected && (
                <div className="absolute top-4 right-4 bg-primary text-black rounded-full p-1 animate-in zoom-in">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
