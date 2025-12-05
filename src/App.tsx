import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { useAppStore } from "./store/useAppStore";
import { useUserStore } from "./store/useUserStore";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Button } from "./components/ui/Button";
import { ArrowLeft } from "lucide-react";
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

// ... existing imports



function App() {
  console.log("App.tsx rendering");
  const { step, setStep, cvData, jobData, analysisResults, setCvData, language } = useAppStore();
  const { fetchCredits } = useUserStore();
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { t } = useTranslation();

  const steps = [
    { id: 1, name: t('steps.uploadName'), description: t('steps.uploadDescription') },
    { id: 2, name: t('steps.jobName'), description: t('steps.jobDescription') },
    { id: 3, name: t('steps.analysisName'), description: t('steps.analysisDescription') },
    { id: 4, name: t('steps.resultsName'), description: t('steps.resultsDescription') },
  ];

  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user) {
        try {
          // Get Supabase token from Clerk
          const token = await getToken({ template: 'supabase' });
          // Sync user with Supabase (fetch credits) using the token
          fetchCredits(user.id, token || undefined);
        } catch (error) {
          console.error("Error getting Supabase token:", error);
          // Check if it's the specific template error
          if (error instanceof Error && error.message.includes("No JWT template exists")) {
            console.error("CRITICAL: You must create a JWT template named 'supabase' in your Clerk Dashboard.");
          }
          // Fallback to unauthenticated fetch (might fail RLS but better than crashing)
          fetchCredits(user.id, undefined);
        }
      }
    };

    syncUser();
  }, [isSignedIn, user, fetchCredits, getToken]);


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
          <div className="max-w-[210mm] mx-auto">
            <Button variant="ghost" onClick={() => setStep(3)} className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" /> {t('common.back')}
            </Button>
            {analysisResults.optimizedCV ? (
              <div className="bg-white shadow-xl rounded-lg overflow-hidden my-8">
                <PrintableCV data={analysisResults.optimizedCV} language={language} />
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

  return (
    <Layout>
      {!isSignedIn || step === 0 ? (
        <LandingPage />
      ) : (
        <div className="space-y-8">
          {step !== 5 && step !== 6 && <Steps steps={steps} currentStep={step} onStepClick={handleStepClick} />}
          {renderStep()}
        </div>
      )}
    </Layout>
  );
}

export default App;
