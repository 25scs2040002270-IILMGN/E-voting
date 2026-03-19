import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetElection, 
  useUpdateElectionStatus,
  useListPosts,
  useCreatePost,
  useDeletePost,
  useListCandidates,
  useCreateCandidate,
  useDeleteCandidate,
  useListVoters,
  useRegisterVoter,
  useGetAuditLog
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button, Input, Label, Card, ScreenLoader, StatusBadge, cn } from "@/components/ui-custom";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { format } from "date-fns";
import { Trash2, UserPlus, Lock, ShieldAlert } from "lucide-react";

export default function AdminDashboard() {
  const { id } = useParams();
  const electionId = parseInt(id || "0", 10);
  
  const { passcode, setPasscode, isAuthenticated } = useAdminAuth(electionId);
  const [authInput, setAuthInput] = useState("");
  
  const [activeTab, setActiveTab] = useState<"overview"|"posts"|"candidates"|"voters"|"audit">("overview");

  const { data: election, isLoading: loadingElection, refetch: refetchElection } = useGetElection(electionId, { query: { enabled: isAuthenticated }});
  
  // Handlers for Auth
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 flex justify-center">
          <Card className="w-full max-w-md border-t-4 border-t-primary">
            <div className="text-center mb-8">
              <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-3xl">ADMIN ACCESS</h2>
              <p className="text-muted-foreground uppercase text-xs tracking-widest mt-2">Enter passcode for Election #{electionId}</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setPasscode(authInput); }}>
              <Label>Passcode</Label>
              <Input 
                type="password" 
                required 
                value={authInput} 
                onChange={e => setAuthInput(e.target.value)} 
                className="mb-6"
              />
              <Button type="submit" className="w-full" size="lg">Unlock Dashboard</Button>
            </form>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loadingElection) return <Layout><ScreenLoader /></Layout>;
  if (!election) return <Layout><div className="p-20 text-center font-display text-3xl">ELECTION NOT FOUND</div></Layout>;

  return (
    <Layout>
      <div className="bg-card border-b border-border pb-0 pt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <StatusBadge status={election.status} />
              <h1 className="font-display text-4xl sm:text-5xl mt-4">{election.name}</h1>
              <p className="text-primary font-bold tracking-widest uppercase mt-2">{election.collegeName}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPasscode(null)}>Log Out</Button>
          </div>

          <div className="flex gap-8 overflow-x-auto">
            {(["overview", "posts", "candidates", "voters", "audit"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-4 font-display text-xl uppercase tracking-wider border-b-4 transition-colors whitespace-nowrap",
                  activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === "overview" && <TabOverview election={election} passcode={passcode!} onUpdate={refetchElection} />}
        {activeTab === "posts" && <TabPosts electionId={electionId} />}
        {activeTab === "candidates" && <TabCandidates electionId={electionId} />}
        {activeTab === "voters" && <TabVoters electionId={electionId} />}
        {activeTab === "audit" && <TabAudit electionId={electionId} passcode={passcode!} />}
      </div>
    </Layout>
  );
}

function TabOverview({ election, passcode, onUpdate }: { election: any, passcode: string, onUpdate: () => void }) {
  const statusMutation = useUpdateElectionStatus();
  
  const statuses = ["draft", "nomination", "voting", "results", "closed"] as const;

  const handleStatusChange = async (newStatus: any) => {
    if(!confirm(`Change election status to ${newStatus.toUpperCase()}?`)) return;
    try {
      await statusMutation.mutateAsync({
        electionId: election.id,
        data: { status: newStatus, adminPasscode: passcode }
      });
      onUpdate();
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <h3 className="font-display text-2xl mb-6">ELECTION LIFECYCLE</h3>
        <div className="space-y-4">
          {statuses.map((s, i) => {
            const isActive = election.status === s;
            const isPast = statuses.indexOf(election.status) > i;
            return (
              <div key={s} className="flex items-center gap-4">
                <div className={cn(
                  "w-4 h-4 rounded-full border-2",
                  isActive ? "bg-primary border-primary" : isPast ? "bg-white border-white" : "bg-transparent border-muted"
                )} />
                <span className={cn(
                  "font-sans font-bold uppercase tracking-widest",
                  isActive ? "text-primary" : isPast ? "text-white" : "text-muted-foreground"
                )}>
                  {s}
                </span>
                {election.status !== s && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto"
                    onClick={() => handleStatusChange(s)}
                    isLoading={statusMutation.isPending}
                  >
                    Set Active
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      
      <Card>
        <h3 className="font-display text-2xl mb-6">STATISTICS</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-background p-6 border-l-4 border-primary">
            <div className="text-5xl font-display">{election.totalVoters}</div>
            <div className="text-muted-foreground font-bold text-xs uppercase tracking-widest mt-2">Registered Voters</div>
          </div>
          <div className="bg-background p-6 border-l-4 border-primary">
            <div className="text-5xl font-display">{election.totalVotesCast}</div>
            <div className="text-muted-foreground font-bold text-xs uppercase tracking-widest mt-2">Votes Cast</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TabPosts({ electionId }: { electionId: number }) {
  const { data: posts, refetch } = useListPosts(electionId);
  const createMutation = useCreatePost();
  const deleteMutation = useDeletePost();
  const [formData, setFormData] = useState({ title: "", description: "", maxVotesPerVoter: 1 });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ electionId, data: formData });
      setFormData({ title: "", description: "", maxVotesPerVoter: 1 });
      refetch();
    } catch(e: any) { alert(e.message); }
  };

  const handleDelete = async (postId: number) => {
    if(!confirm("Delete this post? All candidates under it will be lost.")) return;
    try {
      await deleteMutation.mutateAsync({ postId });
      refetch();
    } catch(e: any) { alert(e.message); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {posts?.map(p => (
          <Card key={p.id} className="flex justify-between items-center p-6 py-4">
            <div>
              <h4 className="font-display text-2xl">{p.title}</h4>
              <p className="text-muted-foreground text-sm font-medium">{p.description}</p>
            </div>
            <Button variant="ghost" className="text-destructive hover:bg-destructive/20 hover:text-destructive" onClick={() => handleDelete(p.id)}>
              <Trash2 className="w-5 h-5" />
            </Button>
          </Card>
        ))}
        {posts?.length === 0 && <div className="text-muted-foreground py-10 text-center border-2 border-dashed border-border font-bold tracking-widest">NO POSTS YET</div>}
      </div>
      
      <Card className="h-fit">
        <h3 className="font-display text-2xl mb-6">ADD POST</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label>Title (e.g. President)</Label>
            <Input required value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} />
          </div>
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>Create Post</Button>
        </form>
      </Card>
    </div>
  );
}

function TabCandidates({ electionId }: { electionId: number }) {
  const { data: posts } = useListPosts(electionId);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  
  const { data: candidates, refetch } = useListCandidates(selectedPost || 0, { query: { enabled: !!selectedPost }});
  const createMutation = useCreateCandidate();
  const deleteMutation = useDeleteCandidate();
  
  const [formData, setFormData] = useState({ name: "", rollNumber: "", department: "", year: "", manifesto: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    try {
      await createMutation.mutateAsync({ postId: selectedPost, data: formData });
      setFormData({ name: "", rollNumber: "", department: "", year: "", manifesto: "" });
      refetch();
    } catch(e: any) { alert(e.message); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-4">
          <Label className="mb-0 whitespace-nowrap">Filter by Post:</Label>
          <select 
            className="w-full bg-background border-2 border-border h-12 px-4 font-sans font-bold uppercase"
            onChange={e => setSelectedPost(Number(e.target.value))}
            value={selectedPost || ""}
          >
            <option value="" disabled>Select a post</option>
            {posts?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        {selectedPost ? (
          <div className="space-y-4">
            {candidates?.map(c => (
              <Card key={c.id} className="flex justify-between items-center p-6">
                <div>
                  <h4 className="font-display text-2xl">{c.name}</h4>
                  <p className="text-primary text-xs font-bold tracking-widest uppercase">{c.rollNumber} • {c.department} • {c.year}</p>
                </div>
                <Button variant="ghost" className="text-destructive" onClick={async () => {
                  if(confirm("Delete candidate?")) {
                    await deleteMutation.mutateAsync({ candidateId: c.id });
                    refetch();
                  }
                }}><Trash2 className="w-5 h-5" /></Button>
              </Card>
            ))}
            {candidates?.length === 0 && <div className="text-muted-foreground py-10 text-center border-2 border-dashed border-border font-bold">NO CANDIDATES</div>}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-border text-muted-foreground font-bold tracking-widest">
            SELECT A POST FIRST
          </div>
        )}
      </div>
      
      <Card className="h-fit" style={{ opacity: selectedPost ? 1 : 0.5, pointerEvents: selectedPost ? 'auto' : 'none' }}>
        <h3 className="font-display text-2xl mb-6">ADD CANDIDATE</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div><Label>Name</Label><Input required value={formData.name} onChange={e=>setFormData(f=>({...f, name: e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Roll Number</Label><Input required value={formData.rollNumber} onChange={e=>setFormData(f=>({...f, rollNumber: e.target.value}))} /></div>
            <div><Label>Year</Label><Input required value={formData.year} onChange={e=>setFormData(f=>({...f, year: e.target.value}))} /></div>
          </div>
          <div><Label>Department</Label><Input required value={formData.department} onChange={e=>setFormData(f=>({...f, department: e.target.value}))} /></div>
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>Register Candidate</Button>
        </form>
      </Card>
    </div>
  );
}

function TabVoters({ electionId }: { electionId: number }) {
  const { data: voters, refetch } = useListVoters(electionId);
  const registerMutation = useRegisterVoter();
  const [formData, setFormData] = useState({ voterId: "", name: "" });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerMutation.mutateAsync({ electionId, data: formData });
      setFormData({ voterId: "", name: "" });
      refetch();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="p-0 overflow-hidden border-2 border-border">
          <table className="w-full text-left font-sans">
            <thead className="bg-secondary text-secondary-foreground text-xs uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Voter ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border">
              {voters?.map(v => (
                <tr key={v.id} className="bg-background">
                  <td className="px-6 py-4 font-bold">{v.voterId}</td>
                  <td className="px-6 py-4 text-muted-foreground">{v.name}</td>
                  <td className="px-6 py-4">
                    {v.hasVoted ? (
                      <span className="text-green-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1">Voted</span>
                    ) : (
                      <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
              {voters?.length === 0 && <tr><td colSpan={3} className="px-6 py-10 text-center text-muted-foreground font-bold tracking-widest">NO VOTERS REGISTERED</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="h-fit">
        <h3 className="font-display text-2xl mb-6 flex items-center gap-2"><UserPlus className="w-6 h-6 text-primary"/> REGISTER VOTER</h3>
        <form onSubmit={handleRegister} className="space-y-4">
          <div><Label>Voter ID / Roll No.</Label><Input required value={formData.voterId} onChange={e=>setFormData(f=>({...f, voterId: e.target.value}))}/></div>
          <div><Label>Full Name</Label><Input required value={formData.name} onChange={e=>setFormData(f=>({...f, name: e.target.value}))}/></div>
          <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>Add Voter</Button>
        </form>
      </Card>
    </div>
  );
}

function TabAudit({ electionId, passcode }: { electionId: number, passcode: string }) {
  // Passcode should ideally be passed in headers, but our API uses it for updates. 
  // For GET audit, maybe we just call it directly assuming no auth block on GET, 
  // or it relies on cookies/headers handled by the server. 
  const { data: logs } = useGetAuditLog(electionId);

  return (
    <Card className="border-t-4 border-t-primary">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-primary" />
        <h3 className="font-display text-3xl">AUDIT TRAIL</h3>
      </div>
      <div className="space-y-4">
        {logs?.map(log => (
          <div key={log.id} className="p-4 bg-background border-l-2 border-primary flex justify-between items-center">
            <div>
              <p className="font-bold text-white uppercase tracking-wider">{log.action}</p>
              {log.details && <p className="text-muted-foreground text-sm mt-1">{log.details}</p>}
            </div>
            <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-1">
              {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
            </span>
          </div>
        ))}
        {(!logs || logs.length === 0) && <p className="text-muted-foreground font-bold tracking-widest text-center py-10">NO AUDIT LOGS FOUND</p>}
      </div>
    </Card>
  );
}
