import { useState } from "react";
import { useLocation } from "wouter";
import { useListElections, useCreateElection } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ScreenLoader } from "@/components/ui-custom";
import { Settings, Plus, ArrowRight, Vote, Users, ChevronRight, X } from "lucide-react";

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

export default function AdminLanding() {
  const [, setLocation] = useLocation();
  const { data: elections, isLoading } = useListElections();
  const createMutation = useCreateElection();

  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    collegeName: "",
    description: "",
    adminPasscode: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.adminPasscode.length < 4) {
      alert("Your secret password must be at least 4 characters.");
      return;
    }
    try {
      const newElection = await createMutation.mutateAsync({ data: formData });
      localStorage.setItem(`votecast_admin_${newElection.id}`, formData.adminPasscode);
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
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6 text-primary" />
            <span className="text-primary font-bold uppercase tracking-widest text-sm">Organizer Panel</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl mb-3">MANAGE ELECTIONS</h1>
          <p className="text-muted-foreground font-sans text-lg">
            Create and manage college elections. Set up positions, add candidates, register voters, and control the voting process.
          </p>
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

        {/* Create Form Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border-2 border-border w-full max-w-lg p-8 relative">
              <button
                onClick={() => setShowCreate(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="font-display text-3xl mb-2">Create New Election</h2>
              <p className="text-muted-foreground font-sans text-sm mb-8">Fill in the details below to get started.</p>

              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Election Name <span className="text-primary">*</span>
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Student Council Election 2025"
                    className="w-full bg-background border-2 border-border px-4 py-3 font-sans text-white focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    College / Institution Name <span className="text-primary">*</span>
                  </label>
                  <input
                    required
                    value={formData.collegeName}
                    onChange={e => setFormData(p => ({ ...p, collegeName: e.target.value }))}
                    placeholder="e.g. Delhi Technological University"
                    className="w-full bg-background border-2 border-border px-4 py-3 font-sans text-white focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Short Description <span className="text-gray-600">(optional)</span>
                  </label>
                  <input
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="e.g. Annual student council elections"
                    className="w-full bg-background border-2 border-border px-4 py-3 font-sans text-white focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Your Secret Password <span className="text-primary">*</span>
                  </label>
                  <input
                    required
                    type="password"
                    value={formData.adminPasscode}
                    onChange={e => setFormData(p => ({ ...p, adminPasscode: e.target.value }))}
                    placeholder="You'll need this to manage the election"
                    className="w-full bg-background border-2 border-border px-4 py-3 font-sans text-white focus:border-primary focus:outline-none transition-colors"
                  />
                  <p className="text-muted-foreground text-xs mt-2 font-sans">
                    ⚠️ Remember this password — you'll need it every time you log back in.
                  </p>
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
              <h3 className="font-display text-2xl text-muted-foreground mb-2">No elections created yet</h3>
              <p className="text-muted-foreground font-sans text-sm">Click the button above to create your first election.</p>
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

        {/* Instructions for first-timers */}
        <div className="mt-12 border-l-4 border-primary pl-6 py-2">
          <h3 className="font-bold uppercase tracking-widest text-sm mb-3 text-muted-foreground">FIRST TIME? HERE'S WHAT TO DO:</h3>
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
