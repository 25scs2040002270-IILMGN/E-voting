import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetElection,
  useUpdateElection,
  useUpdateElectionStatus,
  useDeleteElection,
  useListPosts,
  useCreatePost,
  useDeletePost,
  useListCandidates,
  useCreateCandidate,
  useDeleteCandidate,
  useListVoters,
  useRegisterVoter,
  useBulkRegisterVoters,
  useGetAuditLog,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ScreenLoader } from "@/components/ui-custom";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { format } from "date-fns";
import {
  Lock, Trash2, Plus, Users, Vote, BarChart3, ClipboardList,
  CheckCircle2, Circle, ChevronRight, ExternalLink, Upload,
  Globe, AlertCircle, FileText, ArrowRight, ShieldAlert
} from "lucide-react";

// Invisible component: fetches candidate count for a post and reports to parent
function PostCandidateChecker({ postId, onCount }: { postId: number; onCount: (postId: number, count: number) => void }) {
  const { data } = useListCandidates(postId);
  useEffect(() => {
    if (data !== undefined) onCount(postId, data.length);
  }, [data, postId]);
  return null;
}

const STATUS_FLOW = [
  { key: "draft",      label: "Setting Up",       desc: "Add positions and candidates." },
  { key: "nomination", label: "Nominations Open",  desc: "Candidates can be submitted." },
  { key: "voting",     label: "Voting is OPEN",    desc: "Students can cast their votes." },
  { key: "results",    label: "Results Announced", desc: "Winners are publicly declared." },
  { key: "closed",     label: "Election Ended",    desc: "All done." },
] as const;
type StatusKey = typeof STATUS_FLOW[number]["key"];

export default function AdminDashboard() {
  const { id } = useParams();
  const electionId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();

  const { passcode, setPasscode, isAuthenticated } = useAdminAuth(electionId);
  const [authInput, setAuthInput] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  const { data: election, isLoading, refetch: refetchElection } = useGetElection(electionId, {
    query: { enabled: isAuthenticated, refetchInterval: 5000 },
  });
  const { data: posts, refetch: refetchPosts } = useListPosts(electionId, {
    query: { enabled: isAuthenticated },
  });
  const { data: voters, refetch: refetchVoters } = useListVoters(electionId, {
    query: { enabled: isAuthenticated },
  });

  // Step completion logic
  const postsReady = (posts?.length ?? 0) > 0;
  const votersReady = election?.openEnrollment === true || (voters?.length ?? 0) > 0;

  // Track candidate counts per post — initialized by PostCandidateChecker components
  const [postCandidateCounts, setPostCandidateCounts] = useState<Record<number, number>>({});
  const handleCandidateCount = useCallback((postId: number, count: number) => {
    setPostCandidateCounts(prev => ({ ...prev, [postId]: count }));
  }, []);

  const candidatesReady = (posts?.length ?? 0) > 0 &&
    (posts ?? []).every(p => (postCandidateCounts[p.id] ?? 0) > 0);

  const STEPS = [
    {
      label: "Positions",
      icon: <ClipboardList className="w-5 h-5" />,
      description: "Add the roles students can vote for",
      ready: postsReady,
      unlocked: true,
    },
    {
      label: "Candidates",
      icon: <Users className="w-5 h-5" />,
      description: "Add who is running for each role",
      ready: candidatesReady,
      unlocked: postsReady,
    },
    {
      label: "Voters",
      icon: <Vote className="w-5 h-5" />,
      description: "Who is allowed to vote",
      ready: votersReady,
      unlocked: postsReady && candidatesReady,
    },
    {
      label: "Launch",
      icon: <BarChart3 className="w-5 h-5" />,
      description: "Open voting & see results",
      ready: election?.status !== "draft",
      unlocked: postsReady && candidatesReady && votersReady,
    },
  ];

  // ── Auth Screen ───────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-card border-2 border-border p-8">
            <div className="text-center mb-8">
              <div className="bg-primary/10 border-2 border-primary/30 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-3xl mb-2">Admin Login</h2>
              <p className="text-muted-foreground font-sans text-sm">
                Enter the password you set for Election #{electionId}
              </p>
            </div>
            <form onSubmit={e => { e.preventDefault(); setPasscode(authInput); }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={authInput}
                  onChange={e => setAuthInput(e.target.value)}
                  placeholder="Enter your secret password"
                  className="w-full bg-background border-2 border-border px-4 py-3 font-sans text-white focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <button type="submit" className="w-full bg-primary text-white font-bold uppercase tracking-wider py-4 hover:bg-primary/90 transition-all active:scale-95">
                Unlock Dashboard →
              </button>
            </form>
            <button onClick={() => setLocation("/admin")} className="w-full mt-4 text-muted-foreground text-sm hover:text-white transition-colors text-center py-2">
              ← Go back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) return <Layout><ScreenLoader /></Layout>;
  if (!election) return (
    <Layout>
      <div className="p-20 text-center">
        <h2 className="font-display text-3xl text-destructive">Election not found</h2>
        <button onClick={() => setLocation("/admin")} className="mt-6 text-primary font-bold hover:underline">← Back</button>
      </div>
    </Layout>
  );

  const statusIndex = STATUS_FLOW.findIndex(s => s.key === election.status);
  const allStepsDone = postsReady && candidatesReady && votersReady;

  return (
    <Layout>
      {/* Top Bar */}
      <div className="bg-black border-b-2 border-border">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${
              election.status === "voting" ? "text-green-400" :
              election.status === "results" ? "text-yellow-400" : "text-muted-foreground"
            }`}>
              {STATUS_FLOW.find(s => s.key === election.status)?.label ?? election.status}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl">{election.name}</h1>
            <p className="text-muted-foreground font-sans text-sm mt-0.5">{election.collegeName}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {election.status === "voting" && (
              <a href={`/vote/${election.id}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest border border-primary px-3 py-2 hover:bg-primary/10 transition-all">
                Voting Link <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {(election.status === "results" || election.status === "closed" || election.status === "voting") && (
              <a href={`/results/${election.id}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-widest border border-border px-3 py-2 hover:border-white hover:text-white transition-all">
                Results <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button onClick={() => setPasscode(null)}
              className="text-muted-foreground text-xs font-bold uppercase tracking-widest border border-border px-3 py-2 hover:border-white hover:text-white transition-all">
              Log Out
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            {STEPS.map((step, i) => (
              <button
                key={step.label}
                onClick={() => step.unlocked && setActiveStep(i)}
                disabled={!step.unlocked}
                className={`flex-1 min-w-[120px] flex flex-col items-center gap-1.5 py-4 px-2 border-b-2 transition-colors relative group ${
                  activeStep === i
                    ? "border-primary text-white"
                    : step.unlocked
                      ? "border-transparent text-muted-foreground hover:text-white hover:border-border"
                      : "border-transparent text-border cursor-not-allowed"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm transition-colors ${
                  step.ready
                    ? "border-green-500 bg-green-900/40 text-green-400"
                    : activeStep === i
                      ? "border-primary bg-primary/20 text-primary"
                      : step.unlocked
                        ? "border-border text-muted-foreground"
                        : "border-border/40 text-border"
                }`}>
                  {step.ready ? <CheckCircle2 className="w-4 h-4" /> : !step.unlocked ? <Lock className="w-3.5 h-3.5" /> : step.icon}
                </div>
                <span className="font-bold text-xs uppercase tracking-wider whitespace-nowrap">{step.label}</span>
                {activeStep === i && (
                  <p className="text-muted-foreground text-xs font-sans hidden sm:block">{step.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden checkers — always active, query candidate counts for all posts */}
      {(posts ?? []).map(p => (
        <PostCandidateChecker key={p.id} postId={p.id} onCount={handleCandidateCount} />
      ))}

      {/* Step Content */}
      <div className="container mx-auto px-4 max-w-4xl py-10">
        {activeStep === 0 && (
          <PostsStep
            electionId={electionId}
            posts={posts ?? []}
            onPostsChange={refetchPosts}
            onNext={() => setActiveStep(1)}
          />
        )}
        {activeStep === 1 && (
          <CandidatesStep
            electionId={electionId}
            posts={posts ?? []}
            postCandidateCounts={postCandidateCounts}
            onCandidateCountChange={handleCandidateCount}
            onNext={() => setActiveStep(2)}
          />
        )}
        {activeStep === 2 && (
          <VotersStep
            electionId={electionId}
            election={election}
            voters={voters ?? []}
            onVotersChange={() => { refetchVoters(); refetchElection(); }}
            onNext={() => setActiveStep(3)}
          />
        )}
        {activeStep === 3 && (
          <LaunchStep
            election={election}
            passcode={passcode!}
            statusIndex={statusIndex}
            allDone={allStepsDone}
            onUpdate={refetchElection}
            onDelete={() => setLocation("/")}
          />
        )}
      </div>
    </Layout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Positions
// ─────────────────────────────────────────────────────────────────────────────
function PostsStep({ electionId, posts, onPostsChange, onNext }: {
  electionId: number; posts: any[]; onPostsChange: () => void; onNext: () => void;
}) {
  const createMutation = useCreatePost();
  const deleteMutation = useDeletePost();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const COMMON_POSITIONS = ["President", "Vice President", "General Secretary", "Treasurer", "Cultural Secretary", "Sports Secretary", "Technical Secretary"];

  const handleCreate = async (titleToAdd: string, desc = "") => {
    if (!titleToAdd.trim()) return;
    await createMutation.mutateAsync({ electionId, data: { title: titleToAdd.trim(), description: desc.trim() } });
    setTitle("");
    setDescription("");
    onPostsChange();
  };

  return (
    <div>
      <h2 className="font-display text-3xl mb-2">Step 1 — Add Positions</h2>
      <p className="text-muted-foreground font-sans mb-8">
        A position is a role students vote for — like <em>President</em> or <em>Cultural Secretary</em>. Add all positions before moving on.
      </p>

      {/* Quick add common ones */}
      {posts.length === 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Quick add common positions:</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_POSITIONS.map(p => (
              <button key={p} onClick={() => handleCreate(p)}
                className="px-4 py-2 text-sm font-bold border border-dashed border-border text-muted-foreground hover:border-primary hover:text-white transition-all">
                + {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom add */}
      <form
        onSubmit={e => { e.preventDefault(); handleCreate(title, description); }}
        className="bg-card border-2 border-border p-5 mb-8"
      >
        <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">Add a Custom Position</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Position name (e.g. Cultural Secretary)"
            className="flex-1 bg-background border-2 border-border px-4 py-3 font-sans text-white text-sm focus:border-primary focus:outline-none transition-colors"
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 bg-background border-2 border-border px-4 py-3 font-sans text-white text-sm focus:border-primary focus:outline-none transition-colors"
          />
          <button type="submit" disabled={!title.trim() || createMutation.isPending}
            className="bg-primary text-white font-bold uppercase tracking-wider px-5 py-3 text-sm hover:bg-primary/90 transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2">
            <Plus className="w-4 h-4" /> {createMutation.isPending ? "Adding…" : "Add"}
          </button>
        </div>
      </form>

      {/* Current positions */}
      <div className="space-y-2 mb-8">
        {posts.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-sans">No positions added yet.</p>
          </div>
        ) : posts.map((post, i) => (
          <div key={post.id} className="flex items-center justify-between bg-card border border-green-800/40 p-4">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="font-display text-xl">{post.title}</h4>
                {post.description && <p className="text-muted-foreground text-sm font-sans">{post.description}</p>}
              </div>
            </div>
            <button onClick={async () => {
              if (confirm(`Delete "${post.title}"? All its candidates will also be removed.`)) {
                await deleteMutation.mutateAsync({ postId: post.id });
                onPostsChange();
              }
            }} className="text-muted-foreground hover:text-destructive transition-colors p-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {posts.length > 0 && (
        <div className="flex justify-between items-center bg-card border border-green-700 p-5">
          <div>
            <p className="font-bold text-green-400">{posts.length} position{posts.length !== 1 ? "s" : ""} added ✓</p>
            <p className="text-muted-foreground font-sans text-sm">Ready to add candidates. You can come back to add more positions later.</p>
          </div>
          <button onClick={onNext}
            className="bg-primary text-white font-bold uppercase tracking-wider px-6 py-3 hover:bg-primary/90 transition-all flex items-center gap-2 whitespace-nowrap">
            Next: Add Candidates <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Candidates
// ─────────────────────────────────────────────────────────────────────────────
function CandidatesStep({ electionId, posts, postCandidateCounts, onCandidateCountChange, onNext }: {
  electionId: number;
  posts: any[];
  postCandidateCounts: Record<number, number>;
  onCandidateCountChange: (postId: number, count: number) => void;
  onNext: () => void;
}) {
  const [selectedPostId, setSelectedPostId] = useState<number | null>(posts[0]?.id ?? null);
  const { data: candidates, refetch } = useListCandidates(selectedPostId ?? 0, { query: { enabled: !!selectedPostId } });
  const createMutation = useCreateCandidate();
  const deleteMutation = useDeleteCandidate();
  const [form, setForm] = useState({ name: "", rollNumber: "", department: "", year: "", manifesto: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostId) return;
    await createMutation.mutateAsync({ postId: selectedPostId, data: form });
    setForm({ name: "", rollNumber: "", department: "", year: "", manifesto: "" });
    refetch().then(res => {
      const count = res.data?.length ?? 0;
      onCandidateCountChange(selectedPostId, count);
    });
  };

  const handleRefetchAndCount = () => {
    refetch().then(res => {
      if (!selectedPostId) return;
      onCandidateCountChange(selectedPostId, res.data?.length ?? 0);
    });
  };

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-border">
        <Lock className="w-10 h-10 mx-auto mb-3 text-border" />
        <p className="font-display text-2xl text-muted-foreground mb-2">Add Positions First</p>
        <p className="text-muted-foreground font-sans text-sm">Go back to Step 1 and add at least one position before adding candidates.</p>
      </div>
    );
  }

  const selectedPost = posts.find(p => p.id === selectedPostId);
  const allPostsHaveCandidates = posts.every(p => (postCandidateCounts[p.id] ?? 0) > 0);

  return (
    <div>
      <h2 className="font-display text-3xl mb-2">Step 2 — Add Candidates</h2>
      <p className="text-muted-foreground font-sans mb-6">
        For each position, add the students running for it. Every position must have at least one candidate.
      </p>

      {/* Position tabs with completion status */}
      <div className="flex flex-wrap gap-2 mb-8">
        {posts.map(post => {
          const count = postCandidateCounts[post.id] ?? 0;
          const isSelected = selectedPostId === post.id;
          return (
            <button key={post.id} onClick={() => setSelectedPostId(post.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-2 transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-white"
                  : count > 0
                    ? "border-green-700 bg-green-950/20 text-green-400"
                    : "border-border text-muted-foreground hover:border-white hover:text-white"
              }`}>
              {count > 0
                ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                : <Circle className="w-4 h-4 opacity-50" />}
              {post.title}
              {count > 0 && <span className="text-xs">({count})</span>}
            </button>
          );
        })}
      </div>

      {selectedPostId && selectedPost ? (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Candidate list */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Candidates for "{selectedPost.title}"
            </h3>
            {!candidates || candidates.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-border text-muted-foreground">
                <p className="font-sans text-sm">No candidates added yet. Use the form →</p>
              </div>
            ) : (
              <div className="space-y-2">
                {candidates.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-card border border-border p-4">
                    <div>
                      <h4 className="font-display text-xl">{c.name}</h4>
                      <p className="text-muted-foreground text-sm font-sans">{c.rollNumber} · {c.department} · Year {c.year}</p>
                    </div>
                    <button onClick={async () => {
                      if (confirm(`Remove ${c.name}?`)) {
                        await deleteMutation.mutateAsync({ candidateId: c.id });
                        handleRefetchAndCount();
                      }
                    }} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add form */}
          <div className="bg-card border-2 border-border p-6 h-fit">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-5">Add a Candidate</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Full Name <span className="text-primary">*</span></label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Sharma"
                  className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Roll No. <span className="text-primary">*</span></label>
                  <input required value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} placeholder="e.g. 2021CS01"
                    className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Year <span className="text-primary">*</span></label>
                  <input required value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="3rd Year"
                    className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Department <span className="text-primary">*</span></label>
                <input required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Computer Science"
                  className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Campaign Promise (optional)</label>
                <textarea value={form.manifesto} onChange={e => setForm(f => ({ ...f, manifesto: e.target.value }))} rows={2} placeholder="What will they do if elected?"
                  className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none resize-none" />
              </div>
              <button type="submit" disabled={createMutation.isPending}
                className="w-full bg-primary text-white font-bold uppercase tracking-wider py-3 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> {createMutation.isPending ? "Adding…" : "Add Candidate"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-border text-muted-foreground">
          <p className="font-sans">Select a position above to manage its candidates.</p>
        </div>
      )}

      {allPostsHaveCandidates && (
        <div className="mt-8 flex justify-between items-center bg-card border border-green-700 p-5">
          <div>
            <p className="font-bold text-green-400">All positions have candidates ✓</p>
            <p className="text-muted-foreground font-sans text-sm">Next, set up who can vote.</p>
          </div>
          <button onClick={onNext}
            className="bg-primary text-white font-bold uppercase tracking-wider px-6 py-3 hover:bg-primary/90 transition-all flex items-center gap-2 whitespace-nowrap">
            Next: Setup Voters <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {!allPostsHaveCandidates && posts.length > 0 && (
        <div className="mt-6 flex items-start gap-3 border border-border p-4 text-muted-foreground">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-500" />
          <p className="font-sans text-sm">
            <strong className="text-white">Still needed:</strong>{" "}
            {posts.filter(p => (postCandidateCounts[p.id] ?? 0) === 0).map(p => p.title).join(", ")} need at least one candidate before you can continue.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Voters
// ─────────────────────────────────────────────────────────────────────────────
function VotersStep({ electionId, election, voters, onVotersChange, onNext }: {
  electionId: number; election: any; voters: any[]; onVotersChange: () => void; onNext: () => void;
}) {
  const registerMutation = useRegisterVoter();
  const bulkMutation = useBulkRegisterVoters();
  const updateElectionMutation = useUpdateElection();

  const [form, setForm] = useState({ voterId: "", name: "" });
  const [csvText, setCsvText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [importMode, setImportMode] = useState<"single" | "csv">("single");
  const [csvPreview, setCsvPreview] = useState<{ voterId: string; name: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const isOpenEnrollment = election.openEnrollment;
  const votedCount = voters.filter(v => v.hasVoted).length;

  const toggleOpenEnrollment = async () => {
    await updateElectionMutation.mutateAsync({
      electionId,
      data: { openEnrollment: !isOpenEnrollment },
    });
    onVotersChange();
  };

  const parseCsv = (text: string): { voterId: string; name: string }[] => {
    return text
      .trim()
      .split("\n")
      .filter(l => l.trim())
      .map(line => {
        const parts = line.split(",").map(s => s.trim());
        const voterId = parts[0];
        const name = parts.slice(1).join(" ").trim() || parts[0];
        return { voterId, name };
      })
      .filter(v => v.voterId);
  };

  const handleFileRead = (text: string) => {
    setCsvText(text);
    setCsvPreview(parseCsv(text).slice(0, 5));
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => handleFileRead(ev.target?.result as string);
    reader.readAsText(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => handleFileRead(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerMutation.mutateAsync({ electionId, data: form });
      setForm({ voterId: "", name: "" });
      onVotersChange();
    } catch {
      alert("Could not add voter. They might already be registered.");
    }
  };

  const handleBulkImport = async () => {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      alert("No valid entries found. Format: RollNumber, Full Name (one per line)");
      return;
    }
    try {
      const result = await bulkMutation.mutateAsync({ electionId, data: { voters: rows } });
      alert(`Done! ${result.registered} registered, ${result.skipped} already existed.`);
      setCsvText("");
      setCsvPreview([]);
      onVotersChange();
    } catch {
      alert("Import failed. Please try again.");
    }
  };

  const votersReady = isOpenEnrollment || voters.length > 0;

  return (
    <div>
      <h2 className="font-display text-3xl mb-2">Step 3 — Set Up Voters</h2>
      <p className="text-muted-foreground font-sans mb-8">
        Decide how students are allowed to vote. Choose one of the two methods below.
      </p>

      {/* Option A: Open Enrollment */}
      <div className={`border-2 p-6 mb-6 transition-all ${isOpenEnrollment ? "border-primary bg-primary/5" : "border-border"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Globe className={`w-6 h-6 ${isOpenEnrollment ? "text-primary" : "text-muted-foreground"}`} />
              <h3 className="font-display text-xl">Option A — Open Enrollment</h3>
              {isOpenEnrollment && <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 uppercase tracking-widest">Active</span>}
            </div>
            <p className="text-muted-foreground font-sans text-sm leading-relaxed">
              <strong className="text-white">Any student with a university ID can vote.</strong> No pre-registration needed.
              The student just enters their roll number at the voting screen and casts their vote directly.
              Ideal for large universities where the admin can't register everyone manually.
            </p>
          </div>
          <button
            onClick={toggleOpenEnrollment}
            disabled={updateElectionMutation.isPending}
            className={`flex-shrink-0 flex items-center gap-2 font-bold text-sm uppercase tracking-wider px-5 py-3 border-2 transition-all disabled:opacity-50 ${
              isOpenEnrollment
                ? "border-primary text-primary hover:bg-primary/10"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}>
            {updateElectionMutation.isPending
              ? "Updating…"
              : isOpenEnrollment
                ? "✓ Enabled — Click to Disable"
                : "Enable This"
            }
          </button>
        </div>

        {isOpenEnrollment && (
          <div className="mt-4 bg-primary/10 border border-primary/30 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-white font-sans text-sm">
              Open enrollment is <strong>active</strong>. Any student can now vote by entering their university roll number at the voting screen. 
              You can still register specific voters below — they'll just be validated before open students.
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-muted-foreground font-bold text-sm uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Option B: Register voters */}
      <div className={`border-2 p-6 mb-8 transition-all ${!isOpenEnrollment && voters.length > 0 ? "border-green-700/50" : "border-border"}`}>
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-muted-foreground" />
          <h3 className="font-display text-xl">Option B — Register Specific Voters</h3>
        </div>
        <p className="text-muted-foreground font-sans text-sm mb-6">
          Upload your university student list or add voters one by one. Only these students will be able to vote.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setImportMode("single")}
            className={`px-4 py-2 text-sm font-bold border-2 transition-all ${importMode === "single" ? "border-primary text-white" : "border-border text-muted-foreground hover:text-white"}`}>
            Add One at a Time
          </button>
          <button onClick={() => setImportMode("csv")}
            className={`px-4 py-2 text-sm font-bold border-2 transition-all flex items-center gap-2 ${importMode === "csv" ? "border-primary text-white" : "border-border text-muted-foreground hover:text-white"}`}>
            <Upload className="w-4 h-4" /> Import from University List (CSV)
          </button>
        </div>

        {importMode === "single" ? (
          <form onSubmit={handleSingle} className="flex flex-col sm:flex-row gap-3">
            <input required value={form.voterId} onChange={e => setForm(f => ({ ...f, voterId: e.target.value.toUpperCase() }))}
              placeholder="Roll Number / ID (e.g. 2021CS001)"
              className="flex-1 bg-background border-2 border-border px-4 py-3 font-sans text-white text-sm focus:border-primary focus:outline-none" />
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full Name"
              className="flex-1 bg-background border-2 border-border px-4 py-3 font-sans text-white text-sm focus:border-primary focus:outline-none" />
            <button type="submit" disabled={registerMutation.isPending}
              className="bg-primary text-white font-bold uppercase tracking-wider px-5 py-3 text-sm hover:bg-primary/90 transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2">
              <Plus className="w-4 h-4" /> {registerMutation.isPending ? "Adding…" : "Register Voter"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Drag and drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed p-10 text-center transition-all ${
                isDragging ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
              }`}>
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-bold text-white mb-1">Drop your student list CSV file here</p>
              <p className="text-muted-foreground font-sans text-sm">or click to browse</p>
              <p className="text-muted-foreground font-sans text-xs mt-3">
                Format: <code className="bg-background px-1.5 py-0.5 text-primary">RollNumber, Full Name</code> — one student per line
              </p>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileInput} className="hidden" />
            </div>

            {/* Or paste */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Or paste the list here:</label>
              <textarea
                value={csvText}
                onChange={e => { setCsvText(e.target.value); setCsvPreview(parseCsv(e.target.value).slice(0, 5)); }}
                placeholder={"2021CS001, Rahul Sharma\n2021CS002, Priya Kapoor\n2021CS003, Arjun Singh\n..."}
                rows={5}
                className="w-full bg-background border-2 border-border px-4 py-3 font-mono text-white text-xs focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {csvPreview.length > 0 && (
              <div className="bg-card border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Preview — {parseCsv(csvText).length} student{parseCsv(csvText).length !== 1 ? "s" : ""} detected:
                </p>
                <div className="space-y-1 mb-3">
                  {csvPreview.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-sans">
                      <span className="font-mono text-primary">{r.voterId}</span>
                      <span className="text-muted-foreground">{r.name}</span>
                    </div>
                  ))}
                  {parseCsv(csvText).length > 5 && (
                    <p className="text-muted-foreground text-xs mt-1">…and {parseCsv(csvText).length - 5} more</p>
                  )}
                </div>
                <button onClick={handleBulkImport} disabled={bulkMutation.isPending}
                  className="w-full bg-primary text-white font-bold uppercase tracking-wider py-3 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> {bulkMutation.isPending ? "Importing…" : `Import ${parseCsv(csvText).length} Students`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voter roster */}
      {voters.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {voters.length} registered · <span className="text-green-400">{votedCount} voted</span>
            </p>
          </div>
          <div className="border-2 border-border overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-sm font-sans">
              <thead className="bg-card text-xs text-muted-foreground uppercase tracking-widest sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Roll No.</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {voters.map(v => (
                  <tr key={v.id} className="bg-background">
                    <td className="px-4 py-2.5 font-mono font-bold text-white text-xs">{v.voterId}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.name}</td>
                    <td className="px-4 py-2.5">
                      {v.hasVoted
                        ? <span className="text-green-400 font-bold text-xs">Voted ✓</span>
                        : <span className="text-muted-foreground text-xs">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {votersReady && (
        <div className="flex justify-between items-center bg-card border border-green-700 p-5">
          <div>
            <p className="font-bold text-green-400">
              {isOpenEnrollment ? "Open enrollment enabled ✓" : `${voters.length} voter${voters.length !== 1 ? "s" : ""} registered ✓`}
            </p>
            <p className="text-muted-foreground font-sans text-sm">Ready to launch the election.</p>
          </div>
          <button onClick={onNext}
            className="bg-primary text-white font-bold uppercase tracking-wider px-6 py-3 hover:bg-primary/90 transition-all flex items-center gap-2 whitespace-nowrap">
            Next: Launch <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {!votersReady && (
        <div className="flex items-start gap-3 border border-border p-4 text-muted-foreground">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-500" />
          <p className="font-sans text-sm">
            <strong className="text-white">Action needed:</strong> Enable open enrollment above, or register at least one voter before you can continue.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: Launch
// ─────────────────────────────────────────────────────────────────────────────
function LaunchStep({ election, passcode, statusIndex, allDone, onUpdate, onDelete }: {
  election: any; passcode: string; statusIndex: number; allDone: boolean; onUpdate: () => void; onDelete: () => void;
}) {
  const statusMutation = useUpdateElectionStatus();
  const deleteMutation = useDeleteElection();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const { data: logs } = useGetAuditLog(election.id);

  const handleDelete = async () => {
    if (deleteInput !== election.name) return;
    try {
      await deleteMutation.mutateAsync({ electionId: election.id });
      onDelete();
    } catch {
      alert("Could not delete the election. Please try again.");
    }
  };

  const handleStatus = async (newStatus: StatusKey) => {
    const info = STATUS_FLOW.find(s => s.key === newStatus);
    if (!confirm(`Move election to "${info?.label}"?\n\nThis change will be visible to everyone immediately.`)) return;
    try {
      await statusMutation.mutateAsync({ electionId: election.id, data: { status: newStatus, adminPasscode: passcode } });
      onUpdate();
    } catch {
      alert("Could not update status. Please check your password and try again.");
    }
  };

  if (!allDone && election.status === "draft") {
    return (
      <div className="py-16 text-center border-2 border-dashed border-border">
        <Lock className="w-12 h-12 mx-auto mb-4 text-border" />
        <h3 className="font-display text-2xl text-muted-foreground mb-3">Complete Previous Steps First</h3>
        <p className="text-muted-foreground font-sans text-sm max-w-md mx-auto">
          Finish adding positions, candidates, and voter setup before you can open the election.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-3xl mb-2">Step 4 — Launch & Control</h2>
      <p className="text-muted-foreground font-sans mb-8">
        Move through the election stages. Each stage is one click away.
      </p>

      <div className="space-y-3 mb-10">
        {STATUS_FLOW.map((s, i) => {
          const isCurrent = election.status === s.key;
          const isPast = i < statusIndex;
          const isNext = i === statusIndex + 1;

          return (
            <div key={s.key} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-2 transition-all ${
              isCurrent ? "border-primary bg-primary/5" :
              isPast ? "border-border opacity-60" : "border-border"
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 flex items-center justify-center rounded-full border-2 text-sm font-bold flex-shrink-0 ${
                  isCurrent ? "border-primary bg-primary text-white" :
                  isPast ? "border-green-700 bg-green-900 text-green-400" :
                  "border-border text-muted-foreground"
                }`}>
                  {isPast ? "✓" : i + 1}
                </div>
                <div>
                  <div className="font-display text-xl flex items-center gap-2">
                    {s.label}
                    {isCurrent && <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 uppercase tracking-widest">NOW</span>}
                  </div>
                  <div className="text-muted-foreground text-sm font-sans">{s.desc}</div>
                </div>
              </div>
              {isNext && (
                <button
                  onClick={() => handleStatus(s.key)}
                  disabled={statusMutation.isPending}
                  className="sm:ml-auto bg-white text-black font-bold uppercase tracking-wider px-6 py-2.5 text-sm hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                  Move Here <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Voting link */}
      {election.status === "voting" && (
        <div className="bg-green-950/30 border-2 border-green-700 p-6 mb-10">
          <h3 className="font-display text-xl text-green-400 mb-2">Voting is Open!</h3>
          <p className="text-muted-foreground font-sans text-sm mb-4">Share this link with your students:</p>
          <div className="flex items-center gap-3 bg-black border border-green-700 p-3">
            <code className="text-green-400 text-sm flex-1 break-all font-mono">
              {window.location.origin}/vote/{election.id}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/vote/${election.id}`); alert("Copied!"); }}
              className="text-primary hover:text-white transition-colors font-bold text-sm uppercase tracking-wider whitespace-nowrap">
              Copy
            </button>
          </div>
          {election.openEnrollment && (
            <p className="text-muted-foreground font-sans text-xs mt-3">
              Open enrollment is on — any student with their university ID can vote at this link.
            </p>
          )}
        </div>
      )}

      {/* Activity log */}
      <div>
        <h3 className="font-display text-2xl mb-2">Activity Log</h3>
        <p className="text-muted-foreground font-sans text-sm mb-5">Every action in this election is recorded here for transparency.</p>
        {!logs || logs.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center border-2 border-dashed border-border">No activity yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {[...logs].reverse().map(log => (
              <div key={log.id} className="flex items-start justify-between gap-4 bg-card border-l-4 border-primary/30 px-4 py-3">
                <div>
                  <p className="font-bold text-white text-sm">{log.details || log.action}</p>
                  <p className="text-muted-foreground text-xs font-mono mt-0.5">{log.action}</p>
                </div>
                <time className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                  {format(new Date(log.createdAt), "MMM d, h:mm a")}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="mt-16 border-2 border-destructive/30 p-6">
        <div className="flex items-start gap-3 mb-4">
          <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-display text-xl text-destructive">Danger Zone</h3>
            <p className="text-muted-foreground font-sans text-sm mt-1">
              Permanently delete this election and all its data — candidates, votes, and audit logs. This cannot be undone.
            </p>
          </div>
        </div>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="border-2 border-destructive text-destructive font-bold uppercase tracking-wider text-sm px-5 py-2.5 hover:bg-destructive hover:text-white transition-all flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete Election
          </button>
        ) : (
          <div className="bg-destructive/5 border border-destructive/30 p-5 space-y-4">
            <p className="font-sans text-sm text-white">
              Type the election name exactly to confirm: <span className="font-bold text-destructive font-mono">{election.name}</span>
            </p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type election name here…"
              className="w-full bg-background border-2 border-destructive/50 px-4 py-3 text-white font-sans text-sm focus:border-destructive focus:outline-none"
            />
            <div className="flex gap-3">
              <button onClick={handleDelete}
                disabled={deleteInput !== election.name || deleteMutation.isPending}
                className="bg-destructive text-white font-bold uppercase tracking-wider px-5 py-2.5 text-sm hover:bg-destructive/90 transition-all disabled:opacity-40 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                {deleteMutation.isPending ? "Deleting…" : "Yes, Delete Forever"}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                className="border-2 border-border text-muted-foreground font-bold uppercase tracking-wider px-5 py-2.5 text-sm hover:border-white hover:text-white transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
