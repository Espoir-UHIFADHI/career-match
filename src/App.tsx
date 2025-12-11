import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Layout } from "./components/Layout";
import { LandingPage } from "./components/LandingPage";
import Wizard from "./components/Wizard";
import { PricingPage } from "./components/PricingPage";
import { CareerTemplate } from "./components/pages/CareerTemplate";
import { PrivacyPolicy } from "./components/pages/PrivacyPolicy";
import { TermsOfService } from "./components/pages/TermsOfService";
import { Contact } from "./components/pages/Contact";
import { PublicAnalysis } from "./components/share/PublicAnalysis";
import { useUser, ClerkLoaded, ClerkLoading } from "@clerk/clerk-react";
import { useEffect } from "react";

// ScrollToTop component to ensure navigation resets scroll
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { isLoaded } = useUser();

  // ClerkLoaded guarantees isLoaded is true, but we keep a safe fallback or simply render
  // Actually, inside ClerkLoaded, isLoaded is guaranteed true.

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/career/:slug" element={<CareerTemplate />} />
      <Route path="/share/:id" element={<PublicAnalysis />} />
      <Route path="/app" element={<Wizard />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ClerkLoading>
          <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <Layout>
            <AppRoutes />
          </Layout>
        </ClerkLoaded>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
