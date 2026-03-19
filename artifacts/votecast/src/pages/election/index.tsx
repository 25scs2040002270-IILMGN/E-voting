import { useParams, Link } from "wouter";
import { useGetElection, useListPosts } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button, Card, ScreenLoader, StatusBadge } from "@/components/ui-custom";
import { MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ElectionDetail() {
  const { id } = useParams();
  const electionId = parseInt(id || "0", 10);
  
  const { data: election, isLoading } = useGetElection(electionId);
  const { data: posts } = useListPosts(electionId);

  if (isLoading) return <Layout><ScreenLoader /></Layout>;
  if (!election) return <Layout><div className="p-20 text-center font-display text-4xl text-destructive">ELECTION NOT FOUND</div></Layout>;

  return (
    <Layout>
      <div className="bg-background">
        {/* Header Block */}
        <div className="border-b-4 border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="mb-6"><StatusBadge status={election.status} /></div>
            <h1 className="font-display text-6xl sm:text-8xl text-white mb-6 uppercase tracking-tight max-w-4xl leading-none">
              {election.name}
            </h1>
            <div className="flex flex-wrap gap-8 text-muted-foreground font-bold tracking-widest uppercase text-sm">
              <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/> {election.collegeName}</span>
              <span className="flex items-center gap-2"><Users className="w-5 h-5 text-primary"/> {election.totalVoters} Voters</span>
              {election.votingEndsAt && <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Ends {format(new Date(election.votingEndsAt), 'MMM d, yyyy')}</span>}
            </div>
            
            <p className="mt-8 text-lg font-sans font-medium max-w-2xl text-gray-300 leading-relaxed">
              {election.description || "Official college election portal. Ensure you have your Voter ID ready before proceeding."}
            </p>

            <div className="mt-12 flex gap-4">
              {election.status === "voting" && (
                <Button size="xl" asChild className="animate-pulse">
                  <Link href={`/vote/${election.id}`}>CAST YOUR VOTE</Link>
                </Button>
              )}
              {(election.status === "results" || election.status === "closed" || election.status === "voting") && (
                <Button size="xl" variant={election.status === "voting" ? "outline" : "primary"} asChild>
                  <Link href={`/results/${election.id}`}>VIEW LIVE RESULTS</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Posts Preview */}
        <div className="container mx-auto px-4 py-20">
          <h2 className="font-display text-4xl mb-12">AVAILABLE POSITIONS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts?.map((post) => (
              <Card key={post.id} className="hover:border-primary transition-colors duration-300">
                <h3 className="font-display text-3xl mb-2 text-white">{post.title}</h3>
                <p className="text-muted-foreground font-bold tracking-widest text-xs uppercase">
                  {post.description || "One candidate selection"}
                </p>
              </Card>
            ))}
            {posts?.length === 0 && <p className="text-muted-foreground font-bold tracking-widest">NO POSITIONS ANNOUNCED YET</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
