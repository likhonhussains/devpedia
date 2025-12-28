import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { BadgeCelebrationProvider } from "@/contexts/BadgeCelebrationContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Article from "./pages/Article";
import CreatePost from "./pages/CreatePost";
import Auth from "./pages/Auth";
import ReadingHistory from "./pages/ReadingHistory";
import Messages from "./pages/Messages";
import UserSearch from "./pages/UserSearch";
import Leaderboard from "./pages/Leaderboard";
import Drafts from "./pages/Drafts";
import Achievements from "./pages/Achievements";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Api from "./pages/Api";
import Ebooks from "./pages/Ebooks";
import EbookDetail from "./pages/EbookDetail";
import CreateEbook from "./pages/CreateEbook";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BadgeCelebrationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/article/:slug" element={<Article />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/drafts" element={<Drafts />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/history" element={<ReadingHistory />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/users" element={<UserSearch />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/groups/:id" element={<GroupDetail />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/api" element={<Api />} />
                <Route path="/ebooks" element={<Ebooks />} />
                <Route path="/ebooks/:id" element={<EbookDetail />} />
                <Route path="/ebooks/create" element={<CreateEbook />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </BadgeCelebrationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
