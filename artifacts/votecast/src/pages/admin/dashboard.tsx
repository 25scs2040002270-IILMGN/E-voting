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
  useBulkRegisterVoters,
  useGetAuditLog,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ScreenLoader } from "@/components/ui-custom";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { format } from "date-fns";
import { 
  Lock, Trash2, Plus, Users, Vote, BarChart3, ClipboardList,
  CheckCircle2, Circle, ChevronRight, ExternalLink, Upload
} from "lucide-react";

const STATUS_FLOW = [
  { key: "draft",      label: "Setting Up",          desc: "Add positions and candidates." },
  { key: "nomination", label: "Nominations Open",     desc: "Candidates can be submitted." },
  { key: "voting",     label: "Voting is OPEN",       desc: "Students can cast their votes." },
  { key: "results",    label: "Results Announced",    desc: "Winners are publicly declared." },
  { key: "closed",     label: "Election Ended",       desc: "All done." },
] as const;

type StatusKey = typeof STATUS_FLOW[number]["key"];

const SECTIONS = [
  { key: "setup",     icon: <ClipboardList className="w-5 h-5" />, label: "1. Positions" },
  { key: "candidates", icon: <Users className="w-5 h-5" />,        label: "2. Candidates" },
  { key: "voters",    icon: <Vote className="w-5 h-5" />,          label: "3. Voters" },
  { key: "control",   icon: <BarChart3 className="w-5 h-5" />,     label: "4. Control" },
] as const;

export default function AdminDashboard() {
  const { id } = useParams();
  const electionId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();

  const { passcode, setPasscode, isAuthenticated } = useAdminAuth(electionId);
  const [authInput, setAuthInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeSection, setActiveSection] = useState<string>("setup");

  const {
    data: election,
    isLoading,
    refetch: refetchElection,
  } = useGetElection(electionId, { query: { enabled: isAuthenticated } });

  // — PASSCODE SCREEN —
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
                Enter the password you set when creating Election #{electionId}
              </p>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                setAuthError("");
                setPasscode(authInput);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Your Secret Password
                </label>
                <input
                  type="password"
                  required
                  value={authInput}
                  onChange={e => { setAuthInput(e.target.value); setAuthError(""); }}
                  placeholder="Enter password"
                  className="w-full bg-background border-2 border-border px-4 py-3 font-sans text-white focus:border-primary focus:outline-none transition-colors"
                />
                {authError && <p className="text-destructive text-sm mt-2 font-sans">{authError}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white font-bold uppercase tracking-wider py-4 hover:bg-primary/90 transition-all active:scale-95"
              >
                Unlock Dashboard →
              </button>
            </form>

            <button
              onClick={() => setLocation("/admin")}
              className="w-full mt-4 text-muted-foreground font-sans text-sm hover:text-white transition-colors text-center py-2"
            >
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
        <button onClick={() => setLocation("/admin")} className="mt-6 text-primary font-bold hover:underline">← Back to Admin</button>
      </div>
    </Layout>
  );

  const statusIndex = STATUS_FLOW.findIndex(s => s.key === election.status);

  return (
    <Layout>
      {/* Top bar */}
      <div className="bg-black border-b-2 border-border">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${
              election.status === "voting" ? "text-green-400" :
              election.status === "results" ? "text-yellow-400" :
              "text-muted-foreground"
            }`}>
              {STATUS_FLOW.find(s => s.key === election.status)?.label ?? election.status}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl">{election.name}</h1>
            <p className="text-muted-foreground font-sans text-sm mt-1">{election.collegeName}</p>
          </div>

          <div className="flex items-center gap-3">
            {election.status === "voting" && (
              <a
                href={`/vote/${election.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-widest border border-primary px-4 py-2 hover:bg-primary/10 transition-all"
              >
                Voting Link <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {(election.status === "voting" || election.status === "results" || election.status === "closed") && (
              <a
                href={`/results/${election.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-widest border border-border px-4 py-2 hover:border-white hover:text-white transition-all"
              >
                Results <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => setPasscode(null)}
              className="text-muted-foreground hover:text-white text-sm font-bold uppercase tracking-widest border border-border px-4 py-2 hover:border-white transition-all"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="container mx-auto px-4 pb-4 flex items-center gap-8 text-sm font-sans">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span><strong className="text-white">{election.totalVoters}</strong> voters registered</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Vote className="w-4 h-4" />
            <span><strong className="text-white">{election.totalVotesCast}</strong> votes cast</span>
          </div>
          {election.totalVoters > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="w-4 h-4" />
              <span><strong className="text-white">{Math.round((election.totalVotesCast / election.totalVoters) * 100)}%</strong> turnout</span>
            </div>
          )}
        </div>

        {/* Section tabs */}
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto border-t border-border">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                  activeSection === s.key
                    ? "border-primary text-white"
                    : "border-transparent text-muted-foreground hover:text-white"
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-4xl py-10">
        {activeSection === "setup" && (
          <PostsSection electionId={electionId} />
        )}
        {activeSection === "candidates" && (
          <CandidatesSection electionId={electionId} />
        )}
        {activeSection === "voters" && (
          <VotersSection electionId={electionId} />
        )}
        {activeSection === "control" && (
          <ControlSection
            election={election}
            passcode={passcode!}
            statusIndex={statusIndex}
            onUpdate={refetchElection}
          />
        )}
      </div>
    </Layout>
  );
}

// ——————————————————————————————————————
// SECTION: Positions
// ——————————————————————————————————————
function PostsSection({ electionId }: { electionId: number }) {
  const { data: posts, refetch } = useListPosts(electionId);
  const createMutation = useCreatePost();
  const deleteMutation = useDeletePost();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createMutation.mutateAsync({ electionId, data: { title: title.trim(), description: description.trim() } });
    setTitle("");
    setDescription("");
    refetch();
  };

  return (
    <div>
      <h2 className="font-display text-3xl mb-2">Add Positions</h2>
      <p className="text-muted-foreground font-sans mb-8">
        A position is a role students can vote for — like <em>President</em>, <em>Vice President</em>, or <em>Cultural Secretary</em>.
      </p>

      {/* Add form */}
      <form onSubmit={handleCreate} className="bg-card border-2 border-border p-6 mb-8">
        <h3 className="font-bold uppercase tracking-widest text-sm text-muted-foreground mb-5">Add a New Position</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Position name (e.g. President)"
            className="flex-1 bg-background border-2 border-border px-4 py-3 font-sans text-white focus:border-primary focus:outline-none transition-colors"
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            className="flex-1 bg-background border-2 border-border px-4 py-3 font-sans text-white focus:border-primary focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-primary text-white font-bold uppercase tracking-wider px-6 py-3 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? "Adding…" : "Add Position"}
          </button>
        </div>
      </form>

      {/* Existing positions */}
      <div>
        <h3 className="font-bold uppercase tracking-widest text-sm text-muted-foreground mb-4">
          {posts?.length ?? 0} Position{posts?.length !== 1 ? "s" : ""} Added
        </h3>

        {!posts || posts.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-sans">No positions added yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post, i) => (
              <div key={post.id} className="flex items-center justify-between bg-card border border-border p-4">
                <div className="flex items-center gap-4">
                  <div className="font-display text-2xl text-muted-foreground w-8 text-center">{i + 1}</div>
                  <div>
                    <h4 className="font-display text-xl">{post.title}</h4>
                    {post.description && <p className="text-muted-foreground text-sm font-sans">{post.description}</p>}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (confirm(`Delete "${post.title}"? All candidates for this position will also be deleted.`)) {
                      await deleteMutation.mutateAsync({ postId: post.id });
                      refetch();
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2"
                  title="Delete position"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {posts && posts.length > 0 && (
        <div className="mt-8 flex items-center gap-3 text-primary font-bold uppercase tracking-widest text-sm">
          Next: Add candidates for each position
          <ChevronRight className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

// ——————————————————————————————————————
// SECTION: Candidates
// ——————————————————————————————————————
function CandidatesSection({ electionId }: { electionId: number }) {
  const { data: posts } = useListPosts(electionId);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const { data: candidates, refetch } = useListCandidates(selectedPostId ?? 0, { query: { enabled: !!selectedPostId } });
  const createMutation = useCreateCandidate();
  const deleteMutation = useDeleteCandidate();

  const [form, setForm] = useState({ name: "", rollNumber: "", department: "", year: "", manifesto: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostId) return;
    await createMutation.mutateAsync({ postId: selectedPostId, data: form });
    setForm({ name: "", rollNumber: "", department: "", year: "", manifesto: "" });
    refetch();
  };

  return (
    <div>
      <h2 className="font-display text-3xl mb-2">Add Candidates</h2>
      <p className="text-muted-foreground font-sans mb-8">
        For each position, add the students who are running. Select a position first, then add candidates for it.
      </p>

      {/* Position selector */}
      {!posts || posts.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-border text-muted-foreground">
          <p className="font-sans">You need to add positions first before adding candidates.</p>
        </div>
      ) : (
        <>
          {/* Position tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {posts.map(post => (
              <button
                key={post.id}
                onClick={() => setSelectedPostId(post.id)}
                className={`px-5 py-2 font-bold uppercase tracking-wider text-sm border-2 transition-all ${
                  selectedPostId === post.id
                    ? "border-primary bg-primary/10 text-white"
                    : "border-border text-muted-foreground hover:border-white hover:text-white"
                }`}
              >
                {post.title}
              </button>
            ))}
          </div>

          {selectedPostId ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Candidates list */}
              <div>
                <h3 className="font-bold uppercase tracking-widest text-sm text-muted-foreground mb-4">
                  Candidates for: {posts.find(p => p.id === selectedPostId)?.title}
                </h3>

                {!candidates || candidates.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-border text-muted-foreground">
                    <p className="font-sans text-sm">No candidates added yet for this position.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {candidates.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-card border border-border p-4">
                        <div>
                          <h4 className="font-display text-xl">{c.name}</h4>
                          <p className="text-muted-foreground text-sm font-sans">{c.rollNumber} • {c.department} • Year {c.year}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (confirm(`Remove ${c.name}?`)) {
                              await deleteMutation.mutateAsync({ candidateId: c.id });
                              refetch();
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add form */}
              <div className="bg-card border-2 border-border p-6 h-fit">
                <h3 className="font-bold uppercase tracking-widest text-sm text-muted-foreground mb-5">Add a Candidate</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Full Name <span className="text-primary">*</span></label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Sharma" className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Roll Number <span className="text-primary">*</span></label>
                      <input required value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} placeholder="e.g. 2021CS01" className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Year <span className="text-primary">*</span></label>
                      <input required value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="e.g. 3rd Year" className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Department <span className="text-primary">*</span></label>
                    <input required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Computer Science" className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Campaign Promise (optional)</label>
                    <textarea value={form.manifesto} onChange={e => setForm(f => ({ ...f, manifesto: e.target.value }))} placeholder="What will this candidate do if elected?" rows={2} className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none resize-none" />
                  </div>
                  <button type="submit" disabled={createMutation.isPending} className="w-full bg-primary text-white font-bold uppercase tracking-wider py-3 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> {createMutation.isPending ? "Adding…" : "Add Candidate"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-border text-muted-foreground">
              <p className="font-sans">Click on a position above to manage its candidates.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ——————————————————————————————————————
// SECTION: Voters
// ——————————————————————————————————————
function VotersSection({ electionId }: { electionId: number }) {
  const { data: voters, refetch } = useListVoters(electionId);
  const registerMutation = useRegisterVoter();
  const bulkMutation = useBulkRegisterVoters();
  const [form, setForm] = useState({ voterId: "", name: "" });
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const handleSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerMutation.mutateAsync({ electionId, data: form });
      setForm({ voterId: "", name: "" });
      refetch();
    } catch {
      alert("Could not register voter. Their ID might already be registered.");
    }
  };

  const handleBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.trim().split("\n").filter(l => l.trim());
    const voters = lines.map(line => {
      const [voterId, ...nameParts] = line.split(",").map(s => s.trim());
      return { voterId, name: nameParts.join(" ") || voterId };
    }).filter(v => v.voterId);

    if (voters.length === 0) {
      alert("No valid entries found. Use format: RollNumber, Name (one per line)");
      return;
    }

    try {
      const result = await bulkMutation.mutateAsync({ electionId, data: { voters } });
      alert(`Done! ${result.registered} registered, ${result.skipped} already existed.`);
      setBulkText("");
      setShowBulk(false);
      refetch();
    } catch {
      alert("Bulk import failed. Please try again.");
    }
  };

  const votedCount = voters?.filter(v => v.hasVoted).length ?? 0;

  return (
    <div>
      <h2 className="font-display text-3xl mb-2">Register Voters</h2>
      <p className="text-muted-foreground font-sans mb-8">
        Only registered students can vote. Add them one by one, or paste a list for bulk import.
      </p>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Single voter */}
        <div className="bg-card border-2 border-border p-6">
          <h3 className="font-bold uppercase tracking-widest text-sm text-muted-foreground mb-5">Add One Voter</h3>
          <form onSubmit={handleSingle} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Roll Number / Voter ID <span className="text-primary">*</span></label>
              <input required value={form.voterId} onChange={e => setForm(f => ({ ...f, voterId: e.target.value.toUpperCase() }))} placeholder="e.g. 2021CS001" className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Full Name <span className="text-primary">*</span></label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Priya Kapoor" className="w-full bg-background border-2 border-border px-3 py-2.5 font-sans text-white text-sm focus:border-primary focus:outline-none" />
            </div>
            <button type="submit" disabled={registerMutation.isPending} className="w-full bg-primary text-white font-bold uppercase tracking-wider py-3 hover:bg-primary/90 transition-all disabled:opacity-50">
              {registerMutation.isPending ? "Adding…" : "Register Voter"}
            </button>
          </form>
        </div>

        {/* Bulk import */}
        <div className="bg-card border-2 border-border p-6">
          <h3 className="font-bold uppercase tracking-widest text-sm text-muted-foreground mb-2">Bulk Import</h3>
          <p className="text-muted-foreground font-sans text-xs mb-5">
            Paste one voter per line in format: <code className="bg-background px-1.5 py-0.5 text-primary">RollNumber, Full Name</code>
          </p>
          <form onSubmit={handleBulk} className="space-y-4">
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={"2021CS001, Rahul Sharma\n2021CS002, Priya Kapoor\n2021CS003, Arjun Singh"}
              rows={6}
              className="w-full bg-background border-2 border-border px-3 py-2.5 font-mono text-white text-xs focus:border-primary focus:outline-none resize-none"
            />
            <button type="submit" disabled={bulkMutation.isPending || !bulkText.trim()} className="w-full border-2 border-border text-white font-bold uppercase tracking-wider py-3 hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> {bulkMutation.isPending ? "Importing…" : "Import List"}
            </button>
          </form>
        </div>
      </div>

      {/* Voter table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold uppercase tracking-widest text-sm text-muted-foreground">
            {voters?.length ?? 0} Registered • <span className="text-green-400">{votedCount} Voted</span>
          </h3>
        </div>

        {!voters || voters.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-sans">No voters registered yet.</p>
          </div>
        ) : (
          <div className="border-2 border-border overflow-hidden">
            <table className="w-full text-sm font-sans">
              <thead className="bg-card text-xs text-muted-foreground uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3 text-left">Roll No.</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {voters.map(v => (
                  <tr key={v.id} className="bg-background">
                    <td className="px-4 py-3 font-mono font-bold text-white">{v.voterId}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.name}</td>
                    <td className="px-4 py-3">
                      {v.hasVoted ? (
                        <span className="flex items-center gap-1.5 text-green-400 font-bold text-xs uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Voted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground font-bold text-xs uppercase">
                          <Circle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ——————————————————————————————————————
// SECTION: Control
// ——————————————————————————————————————
function ControlSection({ election, passcode, statusIndex, onUpdate }: {
  election: any; passcode: string; statusIndex: number; onUpdate: () => void;
}) {
  const statusMutation = useUpdateElectionStatus();
  const { data: logs } = useGetAuditLog(election.id);

  const handleStatus = async (newStatus: StatusKey) => {
    const statusInfo = STATUS_FLOW.find(s => s.key === newStatus);
    if (!confirm(`Change election to "${statusInfo?.label}"?\n\nThis will be visible to everyone immediately.`)) return;
    try {
      await statusMutation.mutateAsync({ electionId: election.id, data: { status: newStatus, adminPasscode: passcode } });
      onUpdate();
    } catch {
      alert("Could not update status. Please check your password and try again.");
    }
  };

  return (
    <div className="space-y-10">
      {/* Election status control */}
      <div>
        <h2 className="font-display text-3xl mb-2">Control Election</h2>
        <p className="text-muted-foreground font-sans mb-8">
          Move the election through its stages. The current stage is highlighted.
        </p>

        <div className="space-y-3">
          {STATUS_FLOW.map((s, i) => {
            const isCurrent = election.status === s.key;
            const isPast = i < statusIndex;

            return (
              <div
                key={s.key}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-2 transition-all ${
                  isCurrent ? "border-primary bg-primary/5" :
                  isPast ? "border-border bg-card opacity-60" :
                  "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-bold ${
                    isCurrent ? "border-primary bg-primary text-white" :
                    isPast ? "border-green-700 bg-green-900 text-green-400" :
                    "border-border text-muted-foreground"
                  }`}>
                    {isPast ? "✓" : i + 1}
                  </div>
                  <div>
                    <div className="font-display text-xl">{s.label}</div>
                    <div className="text-muted-foreground text-sm font-sans">{s.desc}</div>
                  </div>
                  {isCurrent && (
                    <span className="bg-primary text-white text-xs font-bold uppercase px-2 py-1 tracking-widest">
                      Current
                    </span>
                  )}
                </div>

                {!isCurrent && !isPast && (
                  <button
                    onClick={() => handleStatus(s.key)}
                    disabled={statusMutation.isPending}
                    className="sm:ml-auto bg-white text-black font-bold uppercase tracking-wider px-6 py-2.5 text-sm hover:bg-gray-200 transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                  >
                    Move to This Stage <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {election.status === "voting" && (
          <div className="mt-6 bg-green-950/30 border-2 border-green-700 p-5">
            <h3 className="font-display text-xl text-green-400 mb-2">Voting is Open!</h3>
            <p className="text-muted-foreground font-sans text-sm mb-4">
              Share this link with your students so they can vote:
            </p>
            <div className="flex items-center gap-3 bg-black border border-green-700 p-3">
              <code className="text-green-400 text-sm flex-1 break-all font-mono">
                {window.location.origin}/vote/{election.id}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/vote/${election.id}`);
                  alert("Link copied!");
                }}
                className="text-primary hover:text-white transition-colors whitespace-nowrap text-sm font-bold uppercase tracking-wider"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div>
        <h3 className="font-display text-2xl mb-2">Activity Log</h3>
        <p className="text-muted-foreground font-sans text-sm mb-6">Every action taken in this election is recorded here for transparency.</p>
        {!logs || logs.length === 0 ? (
          <p className="text-muted-foreground font-sans text-sm py-8 text-center border-2 border-dashed border-border">No activity recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
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
    </div>
  );
}
