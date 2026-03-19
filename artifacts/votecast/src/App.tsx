import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Home from "@/pages/home";
import AdminLanding from "@/pages/admin/index";
import AdminDashboard from "@/pages/admin/dashboard";
import VotePage from "@/pages/vote/index";
import ResultsPage from "@/pages/results/index";
import ElectionDetail from "@/pages/election/index";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminLanding} />
      <Route path="/admin/:id" component={AdminDashboard} />
      <Route path="/vote/:id" component={VotePage} />
      <Route path="/results/:id" component={ResultsPage} />
      <Route path="/election/:id" component={ElectionDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
