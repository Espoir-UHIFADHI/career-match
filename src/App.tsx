import { useEffect, useRef, useState, useCallback } from "react";
import { Layout } from "./components/Layout";
import { useAppStore } from "./store/useAppStore";
import { useUserStore } from "./store/useUserStore";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Button } from "./components/ui/Button";
import { ArrowLeft, Download } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Steps } from "./components/ui/Steps";
import { useTranslation } from "./hooks/useTranslation";


import { CVUpload } from "./components/cv-form/CVUpload";
import { CVReview } from "./components/cv-form/CVReview";
import { JobInput } from "./components/job-input/JobInput";
import { MatchingDashboard } from "./components/results/MatchingDashboard";
import { PrintableCV } from "./components/results/PrintableCV";
import { NetworkingSearch } from "./components/networking/NetworkingSearch";
import { EmailPredictorTool } from "./components/networking/EmailPredictorTool";
import { PricingPage } from "./components/PricingPage";

import { LandingPage } from "./components/LandingPage";
import { PrivacyPolicy } from "./components/pages/PrivacyPolicy";
import { TermsOfService } from "./components/pages/TermsOfService";
import { Contact } from "./components/pages/Contact";
import { PurchaseSuccessModal } from "./components/modals/PurchaseSuccessModal";

// ... existing imports



function App() {
  console.log("App.tsx rendering");
  const { step, setStep, cvData, jobData, analysisResults, setCvData, language, userId, setUserId, reset } = useAppStore();
  const { fetchCredits, credits } = useUserStore();
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { t } = useTranslation();

  const printRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Notification Logic
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedCreditsAmount, setAddedCreditsAmount] = useState(0);
  const prevCreditsRef = useRef(credits);

  // Track credit increases
  useEffect(() => {
    // Only trigger if we have a valid previous balance (not initial load 0->X)
    // AND if the credits actually increased
    if (credits > prevCreditsRef.current && prevCreditsRef.current !== 0) {
      const diff = credits - prevCreditsRef.current;
      // Only show for significant increases (purchases), e.g. >= 20
      if (diff >= 20) {
        setAddedCreditsAmount(diff);
        setShowSuccessModal(true);
      }
    }
    prevCreditsRef.current = credits;
  }, [credits]);

  // Handle Resize for CV Preview
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `CV_${cvData?.contact?.firstName || 'User'}_${cvData?.contact?.lastName || ''}`,
  });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // 210mm is approximately 794px at 96 DPI
        const cvWidth = 794;

        // Add some padding to calculation if needed, or simply scale to fit
        if (containerWidth < cvWidth) {
          setScale(containerWidth / cvWidth);
        } else {
          setScale(1);
        }
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [step, analysisResults]); // Re-run when step changes to Results

  const steps = [
    { id: 1, name: t('steps.uploadName'), description: t('steps.uploadDescription') },
    { id: 2, name: t('steps.jobName'), description: t('steps.jobDescription') },
    { id: 3, name: t('steps.analysisName'), description: t('steps.analysisDescription') },
    { id: 4, name: t('steps.resultsName'), description: t('steps.resultsDescription') },
  ];

  const syncUser = useCallback(async () => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      if (userId !== user.id) {
        console.log("User changed, resetting store");
        reset();
        setUserId(user.id);
      }

      try {
        const token = await getToken({ template: 'supabase' });
        fetchCredits(user.id, token || undefined);
      } catch (error) {
        console.error("Error getting Supabase token:", error);
        if (error instanceof Error && error.message.includes("No JWT template exists")) {
          console.error("CRITICAL: You must create a JWT template named 'supabase' in your Clerk Dashboard.");
        }
        fetchCredits(user.id, undefined);
      }
    } else if (!isSignedIn && userId) {
      console.log("User logged out, resetting store");
      reset();
    }
  }, [isLoaded, isSignedIn, user, userId, fetchCredits, getToken, reset, setUserId]);

  // Initial sync
  useEffect(() => {
    syncUser();
  }, [syncUser]);

  // Re-sync on window focus (e.g. returning from Gumroad)
  useEffect(() => {
    const onFocus = () => {
      console.log("Window focused, refreshing credits...");
      syncUser();
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [syncUser]);

  // Handle first-time login (Welcome Email)
  useEffect(() => {
    const sendWelcome = async () => {
      if (!isLoaded || !isSignedIn || !user) return;

      const metadata = user.unsafeMetadata as { welcome_sent?: boolean };

      if (!metadata.welcome_sent) {
        console.log("New user detected, sending welcome email...");
        try {
          const token = await getToken({ template: 'supabase' });
          if (!token) return;

          // Dynamically import to avoid circular dependencies if any, or just use imported
          const { sendTransactionalEmail } = await import("./services/emailService");

          const email = user.primaryEmailAddress?.emailAddress;
          if (!email) return;

          const sent = await sendTransactionalEmail(
            email,
            'welcome',
            { name: user.firstName || 'User' },
            token
          );

          if (sent) {
            await user.update({
              unsafeMetadata: { ...metadata, welcome_sent: true }
            });
            console.log("Welcome email sent and metadata updated.");
          }
        } catch (error) {
          console.error("Failed to send welcome email:", error);
        }
      }
    };

    sendWelcome();
  }, [isLoaded, isSignedIn, user]);


  const handleStepClick = (stepId: number) => {
    // ... existing logic
    if (stepId === 2 && !cvData) return;
    if (stepId === 3 && (!cvData || !jobData)) return;
    if (stepId === 4 && (!analysisResults)) return;
    if (stepId === 5 && !cvData) return;

    setStep(stepId);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return cvData ? (
          <CVReview
            initialData={cvData}
            onSave={(data) => {
              setCvData(data);
              setStep(2);
            }}
            onCancel={() => {
              setCvData(null); // Reset to allow re-upload
            }}
          />
        ) : <CVUpload />;
      case 2: return <JobInput />;
      case 3: return <MatchingDashboard />;
      case 4:
        return analysisResults ? (
          <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <Button variant="ghost" onClick={() => setStep(3)} className="gap-2 self-start">
                <ArrowLeft className="h-4 w-4" /> {t('common.back')}
              </Button>

              {analysisResults!.optimizedCV && (
                <Button
                  onClick={() => handlePrint()}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  {t('dashboard.downloadPDF')}
                </Button>
              )}
            </div>

            {analysisResults!.optimizedCV ? (
              <div
                ref={containerRef}
                className="w-full overflow-hidden flex justify-center bg-slate-100/50 rounded-xl border border-slate-200 p-4 sm:p-8 mb-8"
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    height: `${297 * 3.78 * scale}px`, // Adjust height to avoid huge whitespace or clip
                    width: '210mm' // Fixed width for the inner content
                  }}
                  className="transition-transform duration-200"
                >
                  <PrintableCV ref={printRef} data={analysisResults!.optimizedCV!} language={language} />
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center my-8">
                <h3 className="text-lg font-medium text-red-800 mb-2">Optimization Skipped</h3>
                <p className="text-red-600">
                  The match score was too low to generate a valid optimized CV.
                  Please return to the dashboard to review the analysis.
                </p>
              </div>
            )}
          </div>
        ) : <MatchingDashboard />;
      case 5: return <NetworkingSearch />;
      case 6: return <EmailPredictorTool />;
      case 7: return <PricingPage />;
      case 8: return <PrivacyPolicy />;
      case 9: return <TermsOfService />;
      case 10: return <Contact />;
      default: return <CVUpload />;
    }
  };

  const isPublicPage = step === 0 || step === 8 || step === 9 || step === 10;

  return (
    <Layout>
      {(!isSignedIn && !isPublicPage) || step === 0 ? (
        <LandingPage />
      ) : (
        <div className="space-y-8">
          {step < 8 && step !== 5 && step !== 6 && <Steps steps={steps} currentStep={step} onStepClick={handleStepClick} />}
          {renderStep()}
        </div>
      )}

      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        creditsAdded={addedCreditsAmount}
      />
    </Layout>
  );
}

export default App;
