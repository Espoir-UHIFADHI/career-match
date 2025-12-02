import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface StepsProps {
    steps: {
        id: number;
        name: string;
        description?: string;
    }[];
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export function Steps({ steps, currentStep, onStepClick }: StepsProps) {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="overflow-hidden rounded-md lg:flex lg:rounded-none lg:border-l lg:border-r lg:border-gray-200">
                {steps.map((step, stepIdx) => (
                    <li key={step.id} className="relative overflow-hidden lg:flex-1">
                        <div
                            className={cn(
                                stepIdx === 0 ? "border-b-0 rounded-t-md" : "",
                                stepIdx === steps.length - 1 ? "border-t-0 rounded-b-md" : "",
                                "border border-gray-200 overflow-hidden lg:border-0"
                            )}
                        >
                            {step.id < currentStep ? (
                                <button
                                    onClick={() => onStepClick?.(step.id)}
                                    className="group w-full"
                                >
                                    <span
                                        className="absolute left-0 top-0 h-full w-1 bg-transparent group-hover:bg-gray-200 lg:bottom-0 lg:top-auto lg:h-1 lg:w-full"
                                        aria-hidden="true"
                                    />
                                    <span
                                        className={cn(
                                            stepIdx !== 0 ? "lg:pl-9" : "",
                                            "flex items-start px-6 py-5 text-sm font-medium"
                                        )}
                                    >
                                        <span className="flex-shrink-0">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 group-hover:bg-blue-800">
                                                <Check className="h-6 w-6 text-white" aria-hidden="true" />
                                            </span>
                                        </span>
                                        <span className="ml-4 mt-0.5 flex min-w-0 flex-col">
                                            <span className="text-sm font-medium text-gray-900">{step.name}</span>
                                            <span className="text-sm font-medium text-gray-500">{step.description}</span>
                                        </span>
                                    </span>
                                </button>
                            ) : step.id === currentStep ? (
                                <div aria-current="step">
                                    <span
                                        className="absolute left-0 top-0 h-full w-1 bg-blue-600 lg:bottom-0 lg:top-auto lg:h-1 lg:w-full"
                                        aria-hidden="true"
                                    />
                                    <span
                                        className={cn(
                                            stepIdx !== 0 ? "lg:pl-9" : "",
                                            "flex items-start px-6 py-5 text-sm font-medium"
                                        )}
                                    >
                                        <span className="flex-shrink-0">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600">
                                                <span className="text-blue-600">{step.id}</span>
                                            </span>
                                        </span>
                                        <span className="ml-4 mt-0.5 flex min-w-0 flex-col">
                                            <span className="text-sm font-medium text-blue-600">{step.name}</span>
                                            <span className="text-sm font-medium text-gray-500">{step.description}</span>
                                        </span>
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => onStepClick?.(step.id)}
                                    className="group w-full"
                                >
                                    <span
                                        className="absolute left-0 top-0 h-full w-1 bg-transparent group-hover:bg-gray-200 lg:bottom-0 lg:top-auto lg:h-1 lg:w-full"
                                        aria-hidden="true"
                                    />
                                    <span
                                        className={cn(
                                            stepIdx !== 0 ? "lg:pl-9" : "",
                                            "flex items-start px-6 py-5 text-sm font-medium"
                                        )}
                                    >
                                        <span className="flex-shrink-0">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                                                <span className="text-gray-500 group-hover:text-gray-900">{step.id}</span>
                                            </span>
                                        </span>
                                        <span className="ml-4 mt-0.5 flex min-w-0 flex-col text-left">
                                            <span className="text-sm font-medium text-gray-500 group-hover:text-gray-900">{step.name}</span>
                                            <span className="text-sm font-medium text-gray-500">{step.description}</span>
                                        </span>
                                    </span>
                                </button>
                            )}

                            {stepIdx !== 0 ? (
                                <>
                                    {/* Separator */}
                                    <div className="absolute inset-0 top-0 left-0 hidden w-3 lg:block" aria-hidden="true">
                                        <svg
                                            className="h-full w-full text-gray-300"
                                            viewBox="0 0 12 82"
                                            fill="none"
                                            preserveAspectRatio="none"
                                        >
                                            <path d="M0.5 0V31L10.5 41L0.5 51V82" vectorEffect="non-scaling-stroke" stroke="currentcolor" />
                                        </svg>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
