import { useState } from "react";
import { useLocation } from "wouter";
import { useListElections, useCreateElection } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button, Input, Label, Card, ScreenLoader, StatusBadge } from "@/components/ui-custom";
import { Lock, Plus, ArrowRight, Shield } from "lucide-react";

export default function AdminLanding() {
  const [location, setLocation] = useLocation();
  const { data: elections, isLoading } = useListElections();
  const createMutation = useCreateElection();
  
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    collegeName: "",
    description: "",
    adminPasscode: ""
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newElection = await createMutation.mutateAsync({ data: formData });
      // Automatically save passcode to localstorage and navigate
      localStorage.setItem(`votecast_admin_${newElection.id}`, formData.adminPasscode);
      setLocation(`/admin/${newElection.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create election");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b-4 border-border pb-8">
          <div>
            <h1 className="font-display text-5xl sm:text-6xl text-white">ADMIN PORTAL</h1>
            <p className="text-muted-foreground font-sans font-medium mt-2 tracking-widest uppercase">
              Manage elections and verify results
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={() => setIsCreating(!isCreating)}
            variant={isCreating ? "outline" : "primary"}
          >
            {isCreating ? "Cancel" : <><Plus className="w-5 h-5 mr-2" /> New Election</>}
          </Button>
        </div>

        {isCreating && (
          <Card className="mb-12 border-primary border-l-4">
            <h2 className="font-display text-3xl mb-8">CREATE NEW ELECTION</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Election Name</Label>
                  <Input 
                    required 
                    placeholder="e.g. Student Council 2025" 
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({...p, name: e.target.value}))}
                  />
                </div>
                <div>
                  <Label>College / University Name</Label>
                  <Input 
                    required 
                    placeholder="e.g. State University" 
                    value={formData.collegeName}
                    onChange={(e) => setFormData(p => ({...p, collegeName: e.target.value}))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Description (Optional)</Label>
                  <Input 
                    placeholder="Brief details about the election..." 
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({...p, description: e.target.value}))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Admin Passcode (KEEP THIS SAFE)</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input 
                      type="password"
                      required 
                      className="pl-12"
                      placeholder="Super secret passcode" 
                      value={formData.adminPasscode}
                      onChange={(e) => setFormData(p => ({...p, adminPasscode: e.target.value}))}
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" size="lg" isLoading={createMutation.isPending} className="w-full md:w-auto">
                INITIALIZE ELECTION
              </Button>
            </form>
          </Card>
        )}

        {isLoading ? (
          <ScreenLoader />
        ) : elections && elections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <Card key={election.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => setLocation(`/admin/${election.id}`)}>
                <div className="flex justify-between items-start mb-4">
                  <StatusBadge status={election.status} />
                </div>
                <h3 className="font-display text-2xl mb-1">{election.name}</h3>
                <p className="text-muted-foreground font-sans text-sm mb-6">{election.collegeName}</p>
                
                <div className="flex items-center justify-between text-sm font-bold tracking-widest uppercase mt-auto pt-6 border-t border-border">
                  <span>Manage</span>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <Shield className="w-16 h-16 mx-auto mb-6 opacity-20" />
            <h3 className="font-display text-3xl">NO ELECTIONS YET</h3>
          </div>
        )}
      </div>
    </Layout>
  );
}
