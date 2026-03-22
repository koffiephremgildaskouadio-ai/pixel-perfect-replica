import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import Index from "./pages/Index.tsx";
import Bureau from "./pages/Bureau.tsx";
import Membres from "./pages/Membres.tsx";
import Actualites from "./pages/Actualites.tsx";
import Chat from "./pages/Chat.tsx";
import Connexion from "./pages/Connexion.tsx";
import CarteMembre from "./pages/CarteMembre.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bureau" element={<Bureau />} />
          <Route path="/membres" element={<Membres />} />
          <Route path="/actualites" element={<Actualites />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/carte/:id" element={<CarteMembre />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
