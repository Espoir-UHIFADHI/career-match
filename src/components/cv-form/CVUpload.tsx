import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { parseCV } from "../../services/ai/gemini";
import { useAppStore } from "../../store/useAppStore";
import type { ParsedCV } from "../../types";
import { CVReview } from "./CVReview";
import { useTranslation } from "../../hooks/useTranslation";

import { useAuth } from "@clerk/clerk-react";

export function CVUpload() {
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReviewing, setIsReviewing] = useState(false);
    const [tempCvData, setTempCvData] = useState<ParsedCV | null>(null);
    const { setCvData, setStep } = useAppStore();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Get fresh token for the request
            const token = await getToken({ template: 'supabase' });

            // Pass token to parseCV for authenticated request
            const parsedData = await parseCV(file, token || undefined);

            console.log("Parsed Data:", parsedData);

            // Toujours afficher l'écran de révision, même si certaines données manquent
            // L'utilisateur pourra compléter les informations manquantes
            setTempCvData(parsedData as ParsedCV);
            setIsReviewing(true);

        } catch (err) {
            console.error(err);
            setError(t('cvUpload.error'));
        } finally {
            setIsProcessing(false);
        }
    }, [getToken, t]);



    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "text/plain": [".txt"],
        },
        maxFiles: 1,
    });

    const handleSaveReview = (data: ParsedCV) => {
        setCvData(data);
        setStep(2);
    };

    const handleCancelReview = () => {
        setIsReviewing(false);
        setTempCvData(null);
    };

    if (isReviewing && tempCvData) {
        return (
            <CVReview
                initialData={tempCvData}
                onSave={handleSaveReview}
                onCancel={handleCancelReview}
            />
        );
    }

    return (
        <div className="max-w-xl mx-auto animate-fade-in">
            <div className="text-center mb-10 space-y-3">
                <h2 className="text-3xl font-bold text-slate-900">
                    {t('cvUpload.title')}
                </h2>
                <p className="text-slate-600 text-lg">
                    {t('cvUpload.subtitle')}
                </p>
            </div>

            <Card className="glass-panel border-dashed border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all duration-300 group">
                <CardContent className="p-0">
                    <div
                        {...getRootProps()}
                        className="flex flex-col items-center justify-center p-12 cursor-pointer min-h-[350px] relative overflow-hidden"
                    >
                        <input {...getInputProps()} />

                        {/* Background Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {isProcessing ? (
                            <div className="text-center relative z-10">
                                <div className="relative mb-6 mx-auto w-16 h-16">
                                    <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin"></div>
                                    <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-indigo-600 animate-pulse" />
                                </div>
                                <p className="text-xl font-medium text-slate-900 mb-2">{t('cvUpload.analyzing')}</p>
                                <p className="text-sm text-slate-600">{t('cvUpload.analyzingDesc')}</p>
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="bg-indigo-100 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-200 border border-indigo-200">
                                    <Upload className="h-10 w-10 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                                </div>
                                {isDragActive ? (
                                    <p className="text-xl font-medium text-indigo-600 animate-pulse">{t('cvUpload.dropHere')}</p>
                                ) : (
                                    <>
                                        <p className="text-xl font-medium text-slate-900 mb-3">
                                            {t('cvUpload.dragDrop')}
                                        </p>
                                        <p className="text-sm text-slate-600 mb-8">
                                            {t('cvUpload.supports')}
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="hover:bg-slate-100 text-slate-900 border-slate-300 px-8 py-6 text-base"
                                        >
                                            {t('cvUpload.selectFile')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-slide-up">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    {error}
                </div>
            )}
        </div>
    );
}
