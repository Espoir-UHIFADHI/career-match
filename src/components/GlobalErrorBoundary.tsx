import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-4">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Une erreur est survenue</h1>
                    <p className="text-slate-600 mb-4">L'application n'a pas pu charger correctement.</p>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 max-w-md w-full">
                        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-100 mb-4 overflow-auto max-h-40">
                            {this.state.error?.message || "Erreur inconnue"}
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                            Si le problème persiste, vérifiez la configuration (Clerk Publishable Key).
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                            Recharger la page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
