import { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { useTranslation } from "../../hooks/useTranslation";
import { trackEvent } from "../../utils/analytics";

export function FeedbackWidget() {
    // const { t } = useTranslation(); // unused for now as text is hardcoded French for MVP
    const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
    const [vote, setVote] = useState<"positive" | "negative" | null>(null);

    const handleVote = async (value: "positive" | "negative") => {
        setStatus("submitting");
        setVote(value);

        // Simulate API delay for UX
        await new Promise(resolve => setTimeout(resolve, 600));

        trackEvent("feedback_given", { value });
        setStatus("success");
    };

    if (status === "success") {
        return (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg animate-fade-in border border-emerald-100">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Merci pour votre retour !</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-sm font-medium text-slate-600">
                Cette analyse vous a-t-elle été utile ?
            </span>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleVote("positive")}
                    disabled={status === "submitting"}
                    className="h-8 px-3 gap-1.5 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                >
                    {status === "submitting" && vote === "positive" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <ThumbsUp className="h-3 w-3" />
                    )}
                    Yes
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleVote("negative")}
                    disabled={status === "submitting"}
                    className="h-8 px-3 gap-1.5 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                    {status === "submitting" && vote === "negative" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <ThumbsDown className="h-3 w-3" />
                    )}
                    No
                </Button>
            </div>
        </div>
    );
}
