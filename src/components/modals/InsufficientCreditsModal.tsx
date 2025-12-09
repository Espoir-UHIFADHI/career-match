import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useTranslation } from "../../hooks/useTranslation";
import { AlertCircle, CreditCard } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useEffect } from "react";
import { trackEvent } from "../../utils/analytics";

interface InsufficientCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InsufficientCreditsModal({ isOpen, onClose }: InsufficientCreditsModalProps) {
    const { t } = useTranslation();
    const { setStep } = useAppStore();

    useEffect(() => {
        if (isOpen) {
            trackEvent("credits_exhausted_view");
        }
    }, [isOpen]);

    const handleViewPricing = () => {
        onClose();
        setStep(7); // Navigate to PricingPage
        window.scrollTo(0, 0);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('credits.insufficientTitle')} className="max-w-md">
            <div className="flex flex-col items-center text-center space-y-4 pt-2 pb-4">
                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">{t('credits.outOfCredits')}</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">
                        {t('credits.upgradeDescription')}
                    </p>
                </div>

                <div className="flex flex-col w-full gap-3 pt-4">
                    <Button
                        onClick={handleViewPricing}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 py-6 text-lg"
                    >
                        <CreditCard className="mr-2 h-5 w-5" />
                        {t('credits.viewOffers')}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        {t('common.cancel')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
