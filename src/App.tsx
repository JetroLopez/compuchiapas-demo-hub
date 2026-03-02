
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Index from "./pages/Index";
import Servicios from "./pages/Servicios";
import Productos from "./pages/Productos";
import PCBuilder from "./pages/PCBuilder";
import SoftwareESD from "./pages/SoftwareESD";
import Blog from "./pages/Blog";
import Contacto from "./pages/Contacto";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import VisibilityGuard from "./components/VisibilityGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<VisibilityGuard pageId="inicio"><Index /></VisibilityGuard>} />
              <Route path="/servicios" element={<VisibilityGuard pageId="servicios"><Servicios /></VisibilityGuard>} />
              <Route path="/productos" element={<VisibilityGuard pageId="productos"><Productos /></VisibilityGuard>} />
              <Route path="/productos/arma-tu-pc" element={<VisibilityGuard pageId="productos"><PCBuilder /></VisibilityGuard>} />
              <Route path="/software-esd" element={<VisibilityGuard pageId="software-esd"><SoftwareESD /></VisibilityGuard>} />
              <Route path="/blog" element={<VisibilityGuard pageId="blog"><Blog /></VisibilityGuard>} />
              <Route path="/contacto" element={<VisibilityGuard pageId="contacto"><Contacto /></VisibilityGuard>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
