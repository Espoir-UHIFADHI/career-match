import { Coins, Plus } from "lucide-react";
import { useUserStore } from "../../store/useUserStore";
import { Button } from "./Button";

export function CreditBalance() {
    const { credits, addCredits } = useUserStore();

    return (
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>{credits}</span>
                <span className="text-slate-400 text-xs hidden sm:inline">crédits</span>
            </div>

            {/* Hidden "Add Credits" button for demo/testing purposes */}
            <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full hover:bg-slate-200 text-slate-400 hover:text-indigo-600"
                onClick={() => addCredits(7)}
                title="Ajouter 7 crédits (Mode Démo)"
            >
                <Plus className="w-3 h-3" />
            </Button>
        </div>
    );
}
