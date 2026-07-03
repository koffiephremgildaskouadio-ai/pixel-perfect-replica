import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index.tsx";

const Bureau = lazy(() => import("./pages/Bureau.tsx"));
const Membres = lazy(() => import("./pages/Membres.tsx"));
const Actualites = lazy(() => import("./pages/Actualites.tsx"));
const Chat = lazy(() => import("./pages/Chat.tsx"));
const Connexion = lazy(() => import("./pages/Connexion.tsx"));
const CarteMembre = lazy(() => import("./pages/CarteMembre.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const APropos = lazy(() => import("./pages/APropos.tsx"));
const Conference = lazy(() => import("./pages/Conference.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Annuaire = lazy(() => import("./pages/Annuaire.tsx"));
const FranceVille = lazy(() => import("./pages/FranceVille.tsx"));
const Portail = lazy(() => import("./pages/Portail.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/bureau" element={<Bureau />} />
            <Route path="/membres" element={<Membres />} />
            <Route path="/actualites" element={<Actualites />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/carte/:id" element={<CarteMembre />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/a-propos" element={<APropos />} />
            <Route path="/france-ville" element={<FranceVille />} />
            <Route path="/portail/:slug" element={<Portail />} />
            <Route path="/conference" element={<Conference />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/annuaire" element={<Annuaire />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
