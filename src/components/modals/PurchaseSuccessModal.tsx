import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Check } from "lucide-react";

interface PurchaseSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    creditsAdded: number;
}

export function PurchaseSuccessModal({ isOpen, onClose, creditsAdded }: PurchaseSuccessModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Paiement validé" className="max-w-md">
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <Check className="w-8 h-8 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                    Merci pour votre achat ! 🚀
                </h2>

                <p className="text-slate-600 text-lg">
                    Vos <strong className="text-indigo-600">{creditsAdded} Crédits</strong> ont été ajoutés instantanément à votre compte Career Match.
                </p>

                <p className="text-slate-500">
                    Vous pouvez maintenant retourner sur l'application et lancer vos analyses.
                </p>

                <div className="pt-4 w-full">
                    <Button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        C'est parti !
                    </Button>
                </div>

                <p className="text-xs text-slate-400">
                    L'équipe Career Match
                </p>
            </div>
        </Modal>
    );
}
