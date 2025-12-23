/**
 * APP ROUTER - Main application routing configuration
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";

import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Charts from "@/pages/Charts";
import Systems from "@/pages/Systems";
import System1 from "@/pages/System1";
import Journal from "@/pages/Journal";
import Backtests from "@/pages/Backtests";
import Opportunities from "@/pages/Opportunities";
import Calculator from "@/pages/Calculator";
import News from "@/pages/News";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/charts" element={<Charts />} />
              <Route path="/systems" element={<Systems />} />
              <Route path="/systems/system1" element={<System1 />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/backtests" element={<Backtests />} />
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/news" element={<News />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
