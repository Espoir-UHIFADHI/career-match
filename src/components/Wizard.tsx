import { useEffect, useRef, useState, useCallback } from "react";

import { useAppStore } from "../store/useAppStore";
import { useUserStore } from "../store/useUserStore";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Button } from "./ui/Button";
import { ArrowLeft, Download } from "lucide-react";
// @ts-ignore
import { pdf } from "@react-pdf/renderer";
import { CVDocument } from "./results/CVDocument";
import { Steps } from "./ui/Steps";
import { useTranslation } from "../hooks/useTranslation";


import { CVUpload } from "./cv-form/CVUpload";
import { CVReview } from "./cv-form/CVReview";
import { JobInput } from "./job-input/JobInput";
import { MatchingDashboard } from "./results/MatchingDashboard";
import { PrintableCV } from "./results/PrintableCV";
import { NetworkingSearch } from "./networking/NetworkingSearch";
import { EmailPredictorTool } from "./networking/EmailPredictorTool";
import { PricingPage } from "./PricingPage";

import { PurchaseSuccessModal } from "./modals/PurchaseSuccessModal";

// ... existing imports



function Wizard() {
  console.log("Wizard.tsx rendering");
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
  const handleDownload = async () => {
    if (!analysisResults?.optimizedCV) return;

    try {
      const blob = await pdf(
        <CVDocument
          data={analysisResults.optimizedCV}
          language={analysisResults.analysisLanguage || language} // Use the persisted language, fallback to app language
        />
      ).toBlob();

      const filename = `Optimized_CV_${cvData?.contact?.firstName || 'User'}_${cvData?.contact?.lastName || ''}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF download error:", e);
    }
  };

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

  // Referral Logic
  useEffect(() => {
    // 1. Catch URL param
    const params = new URLSearchParams(window.location.search);
    const refId = params.get('ref');
    if (refId) {
      console.log("Referral detected:", refId);
      localStorage.setItem('career_match_ref', refId);
    }

    // 2. Process if signed in
    const processRef = async () => {
      if (!isSignedIn || !user) return;

      const storedRef = localStorage.getItem('career_match_ref');
      if (!storedRef) return;

      // Prevent self-referral loop optimization
      if (storedRef === user.id) {
        localStorage.removeItem('career_match_ref');
        return;
      }

      console.log("Processing referral for:", storedRef);

      try {
        const token = await getToken({ template: 'supabase' });
        // Import dynamically to avoid top-level issues if any
        const { createClerkSupabaseClient } = await import('../services/supabase');
        const supabase = createClerkSupabaseClient(token || "");

        // Use Edge Function for secure processing + Email Notification
        const { data, error } = await supabase.functions.invoke('process-referral', {
          body: { referrer_id: storedRef }
        });

        console.log("Referral Process Result:", data, error);

        // Clear storage regardless of success/fail to avoid infinite retries
        // (unless network error, but for MVP simpler is better)
        localStorage.removeItem('career_match_ref');

        if (data && data.success) {
          // Maybe show a toast "Bienvenue ! Vous avez été parrainé."
        }
      } catch (err) {
        console.error("Referral Error:", err);
      }
    };

    if (isLoaded && isSignedIn) {
      processRef();
    }
  }, [isLoaded, isSignedIn, user, getToken]);

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
          const { sendTransactionalEmail } = await import("../services/emailService");

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
    // Prevent skipping steps logic
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
                  onClick={handleDownload}
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
                  <PrintableCV ref={printRef} data={analysisResults!.optimizedCV!} language={analysisResults.analysisLanguage || language} />
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
      default: return <CVUpload />;
    }
  };

  const isPublicPage = step === 0 || step === 8 || step === 9 || step === 10;

  return (
    <>
      <div className="space-y-8">
        {step < 8 && step !== 5 && step !== 6 && <Steps steps={steps} currentStep={step} onStepClick={handleStepClick} />}
        {renderStep()}
      </div>
      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        creditsAdded={addedCreditsAmount}
      />
    </>
  );
}

export default Wizard;
