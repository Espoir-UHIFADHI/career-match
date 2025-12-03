import { Layout } from "./components/Layout";
import { useAppStore } from "./store/useAppStore";
import { Button } from "./components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { Steps } from "./components/ui/Steps";

import { CVUpload } from "./components/cv-form/CVUpload";
import { CVReview } from "./components/cv-form/CVReview";
import { JobInput } from "./components/job-input/JobInput";
import { MatchingDashboard } from "./components/results/MatchingDashboard";
import { PrintableCV } from "./components/results/PrintableCV";
import { NetworkingSearch } from "./components/networking/NetworkingSearch";
import { EmailPredictorTool } from "./components/networking/EmailPredictorTool";

const steps = [
  { id: 1, name: 'Upload CV', description: 'Your Profile' },
  { id: 2, name: 'Job Details', description: 'Target Role' },
  { id: 3, name: 'Analysis', description: 'Match & Optimize' },
  { id: 4, name: 'Results', description: 'Download PDF' },
];

function App() {
  console.log("App.tsx rendering");
  const { step, setStep, cvData, jobData, analysisResults, setCvData, language } = useAppStore();

  const handleStepClick = (stepId: number) => {
    // Prevent jumping ahead without data
    if (stepId === 2 && !cvData) return;
    if (stepId === 3 && (!cvData || !jobData)) return;
    if (stepId === 4 && (!analysisResults)) return;
    // Networking (step 5) can be accessed anytime? Or maybe after CV upload?
    // Let's allow it anytime for now, or maybe after step 1.
    // User request: "Implémente un onglet networking séparé"
    // Let's make it accessible if step 1 is done, or just always accessible?
    // Usually networking is better when you know what you are looking for.
    // Let's allow it if cvData exists, similar to other steps, or just make it independent.
    // If I make it independent, I need to handle the "Next" flow.
    // Let's keep it linear for now: accessible if previous steps are done OR if it's treated as a separate tool.
    // Given the "separate tab" request, maybe it should be always clickable if we had a real tab system.
    // But with the current "Steps" flow, it implies a sequence.
    // Let's allow clicking step 5 if step 1 is done (basic profile).
    if (stepId === 5 && !cvData) return;
    // Step 6 (Email Predictor) is always accessible


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
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
            <div className="bg-white shadow-xl rounded-lg overflow-hidden my-8">
              <PrintableCV data={analysisResults.optimizedCV} language={language} />
            </div>
          </div>
        ) : <MatchingDashboard />;
      case 5: return <NetworkingSearch />;
      case 6: return <EmailPredictorTool />;
      default: return <CVUpload />;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {step !== 5 && step !== 6 && <Steps steps={steps} currentStep={step} onStepClick={handleStepClick} />}
        {renderStep()}
      </div>
    </Layout>
  );
}

export default App;
