import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth, useUser } from "@clerk/clerk-react";
import { ArrowLeft, Download } from "lucide-react";
// @ts-ignore - @react-pdf/renderer entry types
import { pdf } from "@react-pdf/renderer";
import { useAppStore } from "../store/useAppStore";
import { useUserStore } from "../store/useUserStore";
import { useTranslation } from "../hooks/useTranslation";
import { resumeService } from "../services/resumeService";
import { CVUpload } from "./cv-form/CVUpload";
import { CVReview } from "./cv-form/CVReview";
import { JobInput } from "./job-input/JobInput";
import { PurchaseSuccessModal } from "./modals/PurchaseSuccessModal";
import { OnboardingModal } from "./modals/OnboardingModal";
import { PricingPage } from "./PricingPage";
import { CVDocument } from "./results/CVDocument";
import { MatchingDashboard } from "./results/MatchingDashboard";
import { PrintableCV } from "./results/PrintableCV";
import { EmailPredictorTool } from "./networking/EmailPredictorTool";
import { NetworkingSearch } from "./networking/NetworkingSearch";
import { CVHistory } from "./history/CVHistory";
import { cvHistoryService } from "../services/cvHistoryService";
import { Button } from "./ui/Button";
import { Steps } from "./ui/Steps";
import { trackPurchaseCompleted, trackSignUp, trackCTAClicked } from "../utils/analytics";
import { isAdminEmail } from "../lib/adminUsers";

function Wizard() {
  const { step, setStep, cvData, jobData, analysisResults, setCvData, language, userId, setUserId, reset, prependCVHistoryCache } = useAppStore();
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

  // Onboarding modal - affiché une seule fois au premier login
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Gating du téléchargement PDF
  const [showDownloadUpsell, setShowDownloadUpsell] = useState(false);
  const isAdmin = isAdminEmail(user?.primaryEmailAddress?.emailAddress);
  const canDownload = isAdmin || credits > 0;

  // Track credit increases - détecte les achats Gumroad au retour sur la page
  useEffect(() => {
    if (credits > prevCreditsRef.current && prevCreditsRef.current !== 0) {
      const diff = credits - prevCreditsRef.current;
      if (diff >= 20) {
        setAddedCreditsAmount(diff);
        setShowSuccessModal(true);
        // Identifie le plan acheté d'après la quantité de crédits reçus
        const plan = diff >= 100 ? "career-coach" : "pack-booster";
        const value = diff >= 100 ? 14.99 : 4.99;
        trackPurchaseCompleted(plan, value);
      }
    }
    prevCreditsRef.current = credits;
  }, [credits]);

  // Handle Resize for CV Preview
  const handleDownload = async () => {
    if (!analysisResults?.optimizedCV) return;

    // Gating : si l'utilisateur n'a plus de crédits, afficher l'upsell avant de télécharger
    if (!canDownload) {
      trackCTAClicked("download_gate", "upsell_shown");
      setShowDownloadUpsell(true);
      return;
    }

    try {
      const blob = await pdf(
        <CVDocument
          data={analysisResults.optimizedCV}
          language={analysisResults.analysisLanguage || language}
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

      // Save to Supabase + update session cache (fire-and-forget)
      if (cvData && jobData && userId) {
        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          cvData,
          jobData: {
            title: jobData.title,
            company: jobData.company,
            description: jobData.description,
          },
          matchScore: analysisResults.score,
          analysisLanguage: analysisResults.analysisLanguage || language,
          optimizedCV: analysisResults.optimizedCV,
          fullAnalysis: analysisResults,
          fullJobData: jobData,
        };
        prependCVHistoryCache(entry);
        getToken({ template: 'supabase' }).then((token) => {
          cvHistoryService.add(userId, entry, token || undefined);
        });
      }
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
      const userChanged = userId !== user.id;
      if (userChanged) {
        console.log("User changed, resetting store");
        reset();
        setUserId(user.id);
      }

      try {
        const token = await getToken({ template: 'supabase' });
        fetchCredits(user.id, token || undefined);

        // Restore CV from DB if not in local store (after logout/different device)
        const currentCvData = useAppStore.getState().cvData;
        if (!currentCvData) {
          const savedResume = await resumeService.getResume(user.id, token || undefined);
          if (savedResume) {
            setCvData(savedResume);
            // Stay on step 1 for review, don't jump ahead
            if (useAppStore.getState().step === 1) {
              setStep(1);
            }
          }
        }
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
  }, [isLoaded, isSignedIn, user, userId, fetchCredits, getToken, reset, setUserId, setCvData, setStep]);

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
        // Marquer immédiatement pour éviter les re-déclenchements si email ou UTM échouent
        await user.update({ unsafeMetadata: { ...metadata, welcome_sent: true } });

        trackSignUp(user.externalAccounts?.[0]?.provider ?? "email");
        setShowOnboarding(true);

        try {
          const token = await getToken({ template: 'supabase' });
          if (!token) return;

          // Persister les UTMs (non-bloquant)
          try {
            const rawUtm = sessionStorage.getItem("career_match_utm");
            if (rawUtm) {
              const utm = JSON.parse(rawUtm);
              const { createClerkSupabaseClient } = await import("../services/supabase");
              const supabase = createClerkSupabaseClient(token);
              await supabase.rpc("set_user_utm", {
                p_user_id:      user.id,
                p_utm_source:   utm.utm_source   ?? null,
                p_utm_medium:   utm.utm_medium   ?? null,
                p_utm_campaign: utm.utm_campaign ?? null,
                p_utm_content:  utm.utm_content  ?? null,
                p_utm_term:     utm.utm_term     ?? null,
                p_gclid:        utm.gclid        ?? null,
              });
              sessionStorage.removeItem("career_match_utm");
            }
          } catch (utmErr) {
            console.error("UTM persistence failed (non-blocking):", utmErr);
          }

          // Email de bienvenue (non-bloquant — échec n'empêche pas la suite)
          const email = user.primaryEmailAddress?.emailAddress;
          if (email) {
            const { sendTransactionalEmail } = await import("../services/emailService");
            await sendTransactionalEmail(email, 'welcome', { name: user.firstName || 'User' }, token);
          }
        } catch (error) {
          console.error("Failed to send welcome email:", error);
        }
      }
    };

    sendWelcome();
  }, [isLoaded, isSignedIn, user, getToken]);

  const handleStepClick = (stepId: number) => {
    // Prevent skipping steps logic
    if (stepId === 2 && !cvData) return;
    if (stepId === 3 && (!cvData || !jobData)) return;
    if (stepId === 4 && (!analysisResults)) return;
    if (stepId === 5 && !cvData) return;

    setStep(stepId);
  };

  const handleCVSave = useCallback(async (data: import("../types").ParsedCV) => {
    setCvData(data);
    setStep(2);
    if (isSignedIn && user) {
      try {
        const token = await getToken({ template: 'supabase' });
        await resumeService.saveResume(user.id, data, token || undefined);
      } catch (err) {
        console.error("Failed to persist CV to DB:", err);
      }
    }
  }, [isSignedIn, user, getToken, setCvData, setStep]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return cvData ? (
          <CVReview
            initialData={cvData}
            onSave={handleCVSave}
            onCancel={() => {
              setCvData(null); // Reset to allow re-upload
            }}
          />
        ) : <CVUpload onSave={handleCVSave} />;
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
      case 8: return <CVHistory />;
      default: return <CVUpload />;
    }
  };



  const getSeoMetadata = (step: number) => {
    switch (step) {
      case 1:
        return { title: t('seo.uploadTitle') || "Télécharger CV | Career Match", desc: t('seo.uploadDesc') || "Importez votre CV pour une analyse IA instantanée." };
      case 2:
        return { title: t('seo.jobTitle') || "Cibler une Offre | Career Match", desc: t('seo.jobDesc') || "Analysez une offre d'emploi spécifique pour vérifier votre compatibilité." };
      case 3:
        return { title: t('seo.analysisTitle') || "Analyse en Cours | Career Match", desc: t('seo.analysisDesc') || "Notre IA analyse votre profil par rapport au poste visé." };
      case 4:
        return { title: t('seo.resultsTitle') || "Résultats & Optimisation | Career Match", desc: t('seo.resultsDesc') || "Consultez votre score de match et téléchargez votre CV optimisé." };
      case 5:
        return { title: t('seo.networkingTitle') || "Réseautage | Career Match", desc: t('seo.networkingDesc') || "Identifiez les recruteurs et employés clés pour cette entreprise." };
      case 6:
        return { title: t('seo.emailTitle') || "Email Finder | Career Match", desc: t('seo.emailDesc') || "Trouvez les emails professionnels vérifiés de vos contacts." };
      case 7:
        return null; // Let PricingPage handle its own SEO
      default:
        return { title: "Career Match | Assistant Carrière IA", desc: "Optimisez votre recherche d'emploi avec l'IA." };
    }
  };

  const seo = getSeoMetadata(step);

  return (
    <>
      {seo && (
        <Helmet>
          <title>{seo.title}</title>
          <meta name="description" content={seo.desc} />
          <meta property="og:title" content={seo.title} />
          <meta property="og:description" content={seo.desc} />
        </Helmet>
      )}
      <div className="space-y-8">
        {step < 8 && step !== 5 && step !== 6 && step !== 8 && <Steps steps={steps} currentStep={step} onStepClick={handleStepClick} />}
        {renderStep()}
      </div>
      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        creditsAdded={addedCreditsAmount}
      />
      {/* Modal upsell déclenché avant le téléchargement PDF quand crédits = 0 */}
      {showDownloadUpsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Votre CV optimisé est prêt
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Vous avez utilisé vos 3 crédits gratuits. Pour télécharger votre CV optimisé en PDF, rechargez votre compte.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  setShowDownloadUpsell(false);
                  trackCTAClicked("download_gate", "pack_pro");
                  setStep(7);
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
              >
                +100 crédits — 14,99 € <span className="text-indigo-200 font-normal text-sm ml-1">(recommandé)</span>
              </button>
              <button
                onClick={() => {
                  setShowDownloadUpsell(false);
                  trackCTAClicked("download_gate", "pack_booster");
                  setStep(7);
                }}
                className="w-full py-3 border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-all text-sm"
              >
                +20 crédits — 4,99 €
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Paiement sécurisé via Gumroad · Crédits disponibles immédiatement
            </p>

            <button
              onClick={() => setShowDownloadUpsell(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={async (role, industry) => {
          setShowOnboarding(false);
          try {
            const token = await getToken({ template: 'supabase' });
            if (!token || !user?.id) return;
            const { createClerkSupabaseClient } = await import("../services/supabase");
            const supabase = createClerkSupabaseClient(token);
            await supabase.rpc("set_user_utm", {
              p_user_id:    user.id,
              p_target_role: role,
              p_industry:   industry,
            });
          } catch (err) {
            console.error("Onboarding save failed (non-blocking):", err);
          }
        }}
        onSkip={() => setShowOnboarding(false)}
      />
    </>
  );
}

export default Wizard;
