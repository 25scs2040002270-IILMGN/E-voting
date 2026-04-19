import { useState } from "react";
import { useLocation } from "wouter";
import { useListElections, useCreateElection } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ScreenLoader } from "@/components/ui-custom";
import {
  Settings, Plus, ArrowRight, Vote, Users, ChevronRight,
  X, Eye, EyeOff, UserCircle2, Lock, CheckCircle2
} from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  draft:      "Setting Up",
  nomination: "Nominations Open",
  voting:     "Voting Open",
  results:    "Results Published",
  closed:     "Ended",
};

const STATUS_COLOR: Record<string, string> = {
  draft:      "text-gray-400",
  nomination: "text-blue-400",
  voting:     "text-green-400",
  results:    "text-yellow-400",
  closed:     "text-gray-500",
};

const ORGANIZER_NAME_KEY = "votecast_organizer_name";
const ORGANIZER_PASS_KEY = "votecast_organizer_password";

function getOrganizerProfile() {
  return {
    name: localStorage.getItem(ORGANIZER_NAME_KEY) ?? "",
    password: localStorage.getItem(ORGANIZER_PASS_KEY) ?? "",
  };
}

// ─── Step 1: Organizer Setup ──────────────────────────────────────────────────
function OrganizerSetupScreen({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (password.length < 4) { setError("Password must be at least 4 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    localStorage.setItem(ORGANIZER_NAME_KEY, name.trim());
    localStorage.setItem(ORGANIZER_PASS_KEY, password);
    onDone();
  };

  return (
    <Layout>
      <div className="min-h-[85vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Badge */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-primary/10 border-2 border-primary/40 flex items-center justify-center">
              <UserCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-primary font-bold uppercase tracking-widest text-xs">Organizer Setup</p>
              <h1 className="font-display text-3xl leading-tight">Welcome, Organizer</h1>
            </div>
          </div>

          <p className="text-muted-foreground font-sans text-sm mb-8 leading-relaxed">
            Before creating your election, set up your organizer identity. Your name and password will be used to manage all elections you create.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Your Name <span className="text-primary">*</span>
              </label>
              <input
                required
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Prof. Ramesh Kumar"
                className="w-full bg-background border-2 border-border px-4 py-3 font-sans text-white text-sm focus:border-primary focus:outline-none transition-colors"
              />
              <p className="text-muted-foreground text-xs mt-1.5 font-sans">
                This is how you'll be identified as the election organizer.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Create Your Password <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 4 characters"
                  className="w-full bg-background border-2 border-border px-4 py-3 pr-12 font-sans text-white text-sm focus:border-primary focus:outline-none transition-colors"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Confirm Password <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Type password again"
                  className={`w-full bg-background border-2 px-4 py-3 pr-12 font-sans text-white text-sm focus:outline-none transition-colors ${
                    confirm && confirm !== password ? "border-destructive" : "border-border focus:border-primary"
                  }`}
                />
                {confirm && confirm === password && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/40 text-destructive text-sm font-sans px-4 py-3">
                {error}
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 px-4 py-3 flex gap-3">
              <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground font-sans text-xs leading-relaxed">
                Remember this password — you'll need it every time you log in to manage your elections. There is no password recovery.
              </p>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || password.length < 4 || password !== confirm}
              className="w-full bg-primary text-white font-display text-xl uppercase tracking-wider py-4 hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center gap-3"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

// ─── Main Admin Landing ───────────────────────────────────────────────────────
export default function AdminLanding() {
  const [, setLocation] = useLocation();
  const { data: elections, isLoading } = useListElections();
  const createMutation = useCreateElection();

  const profile = getOrganizerProfile();
  const [isSetUp, setIsSetUp] = useState(!!(profile.name && profile.password));
  const [showCreate, setShowCreate] = useState(false);
  const [electionName, setElectionName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [description, setDescription] = useState("");

  // Show setup screen if organizer hasn't set name/password yet
  if (!isSetUp) {
    return <OrganizerSetupScreen onDone={() => setIsSetUp(true)} />;
  }

  const org = getOrganizerProfile();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newElection = await createMutation.mutateAsync({
        data: {
          name: electionName,
          collegeName,
          description,
          adminPasscode: org.password,
        },
      });
      localStorage.setItem(`votecast_admin_${newElection.id}`, org.password);
      setLocation(`/admin/${newElection.id}`);
    } catch {
      alert("Could not create election. Please try again.");
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="bg-black border-b-2 border-border py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-primary" />
                <span className="text-primary font-bold uppercase tracking-widest text-sm">Organizer Panel</span>
              </div>
              <h1 className="font-display text-5xl sm:text-6xl mb-1">MANAGE ELECTIONS</h1>
              <p className="text-muted-foreground font-sans text-sm mt-1">
                Logged in as <span className="text-white font-bold">{org.name}</span>
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm("Log out? You'll need your password to get back in.")) {
                  localStorage.removeItem(ORGANIZER_NAME_KEY);
                  localStorage.removeItem(ORGANIZER_PASS_KEY);
                  setIsSetUp(false);
                }
              }}
              className="text-muted-foreground text-xs font-bold uppercase tracking-widest border border-border px-3 py-2 hover:border-white hover:text-white transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-10">
        {/* Create Election Button */}
        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-primary text-white font-display text-2xl uppercase tracking-wider px-8 py-6 flex items-center justify-center gap-4 hover:bg-primary/90 transition-all active:scale-95 mb-8 shadow-lg shadow-primary/20"
        >
          <Plus className="w-7 h-7" />
          Create New Election
        </button>

        {/* Create Election Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border-2 border-border w-full max-w-lg p-8 relative">
              <button
                onClick={() => setShowCreate(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="font-display text-3xl mb-1">Create New Election</h2>
              <p className="text-muted-foreground font-sans text-sm mb-8">
                Organized by <span className="text-white font-bold">{org.name}</span>
              </p>

              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Election Name <span className="text-primary">*</span>
                  </label>
                  <input
                    required
                    autoFocus
                    value={electionName}
                    onChange={e => setElectionName(e.target.value)}
                    placeholder="e.g. Student Council Election 2025"
                    className="w-full bg-background border-2 border-border px-4 py-3 font-sans text-white text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    College / Institution Name <span className="text-primary">*</span>
                  </label>
                  <input
                    required
                    value={collegeName}
                    onChange={e => setCollegeName(e.target.value)}
                    placeholder="e.g. Delhi Technological University"
                    className="w-full bg-background border-2 border-border px-4 py-3 font-sans text-white text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Short Description <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Annual student council elections"
                    className="w-full bg-background border-2 border-border px-4 py-3 font-sans text-white text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 border-2 border-border text-muted-foreground font-bold uppercase tracking-wider py-3 hover:border-white hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 bg-primary text-white font-bold uppercase tracking-wider py-3 hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {createMutation.isPending ? "Creating…" : "Create Election →"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Elections List */}
        <div>
          <h2 className="font-display text-2xl mb-6 tracking-wide text-muted-foreground">YOUR ELECTIONS</h2>

          {isLoading ? (
            <ScreenLoader />
          ) : !elections || elections.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-border">
              <Settings className="w-12 h-12 text-border mx-auto mb-4" />
              <h3 className="font-display text-2xl text-muted-foreground mb-2">No elections yet</h3>
              <p className="text-muted-foreground font-sans text-sm">Click "Create New Election" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {elections.map(election => (
                <button
                  key={election.id}
                  onClick={() => setLocation(`/admin/${election.id}`)}
                  className="w-full border-2 border-border bg-card hover:border-primary transition-all p-5 flex items-center justify-between gap-4 group text-left"
                >
                  <div className="min-w-0">
                    <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${STATUS_COLOR[election.status] ?? "text-gray-400"}`}>
                      {STATUS_LABEL[election.status] ?? election.status}
                    </div>
                    <h3 className="font-display text-2xl leading-tight truncate">{election.name}</h3>
                    <p className="text-muted-foreground text-sm font-sans mt-1 truncate">{election.collegeName}</p>
                    <div className="flex items-center gap-4 mt-3 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> {election.totalVoters} voters
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Vote className="w-3.5 h-3.5" /> {election.totalVotesCast} voted
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest whitespace-nowrap">
                    Manage <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick guide */}
        <div className="mt-12 border-l-4 border-primary pl-6 py-2">
          <h3 className="font-bold uppercase tracking-widest text-xs mb-3 text-muted-foreground">FIRST TIME? HERE'S WHAT TO DO:</h3>
          <ol className="space-y-2 text-muted-foreground font-sans text-sm list-decimal list-inside">
            <li>Create an election with your college name</li>
            <li>Add positions (e.g. President, Vice President)</li>
            <li>Add candidates for each position</li>
            <li>Register all eligible voters</li>
            <li>Open voting when ready, then declare results</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}
