import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Layout } from "./components/Layout";
import { LandingPage } from "./components/LandingPage";

// Heavy routes loaded lazily — kept out of the landing page bundle
const Wizard = lazy(() => import("./components/Wizard"));
const PricingPage = lazy(() => import("./components/PricingPage").then(m => ({ default: m.PricingPage })));
const About = lazy(() => import("./components/pages/About").then(m => ({ default: m.About })));
const Blog = lazy(() => import("./components/pages/Blog").then(m => ({ default: m.Blog })));
const BlogPost = lazy(() => import("./components/pages/BlogPost").then(m => ({ default: m.BlogPost })));
const CareerTemplate = lazy(() => import("./components/pages/CareerTemplate").then(m => ({ default: m.CareerTemplate })));
const PrivacyPolicy = lazy(() => import("./components/pages/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import("./components/pages/TermsOfService").then(m => ({ default: m.TermsOfService })));
const Contact = lazy(() => import("./components/pages/Contact").then(m => ({ default: m.Contact })));
const PublicAnalysis = lazy(() => import("./components/share/PublicAnalysis").then(m => ({ default: m.PublicAnalysis })));
// Standalone — rendu sans Layout global (no nav, no footer)
const LandingPageAds = lazy(() => import("./components/pages/LandingPageAds").then(m => ({ default: m.LandingPageAds })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Route standalone — pas de Layout (no nav, no footer) */}
        <Route path="/lp/cv-ats" element={<LandingPageAds />} />

        {/* Routes avec Layout global */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/career/:slug" element={<CareerTemplate />} />
              <Route path="/share/:id" element={<PublicAnalysis />} />
              <Route path="/app" element={<Wizard />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
