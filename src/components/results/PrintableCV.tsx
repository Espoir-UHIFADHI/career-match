import React from "react";
import type { ParsedCV } from "../../types";

interface PrintableCVProps {
    data: ParsedCV;
    language?: "English" | "French";
}

const SECTION_HEADERS = {
    English: {
        summary: "Professional Summary",
        experience: "Experience",
        education: "Education",
        skills: "Skills",
        softSkills: "Soft Skills",
        languages: "Languages",
        certifications: "Certifications",
        interests: "Interests"
    },
    French: {
        summary: "Résumé professionnel",
        experience: "Expérience",
        education: "Formation",
        skills: "Compétences techniques",
        softSkills: "Compétences comportementales",
        languages: "Langues",
        certifications: "Certifications",
        interests: "Centres d'intérêt"
    }
};

// Fonction utilitaire pour nettoyer le texte Markdown
const cleanMarkdown = (text: any): string => {
    if (!text) return '';

    // Convert to string if it's not already (handles arrays, objects, etc.)
    const textStr = typeof text === 'string' ? text :
        Array.isArray(text) ? text.join('\n') :
            typeof text === 'object' ? JSON.stringify(text) :
                String(text);

    return textStr
        .replace(/\*\*/g, '') // Supprime les ** pour le gras
        .replace(/\*/g, '')   // Supprime les * pour l'italique
        .replace(/#{1,6}\s/g, '') // Supprime les # pour les titres
        .trim();
};

// Fonction pour découper proprement les points d'expérience
const getExperiencePoints = (text: any): string[] => {
    let str = cleanMarkdown(text);
    if (!str) return [];

    // Priorité 1: Utiliser les sauts de ligne s'ils existent
    if (str.includes('\n')) {
        return str.split('\n').filter(line => line.trim());
    }

    // Priorité 2: Fallback - Si pas de sauts de ligne, essayer de séparer par les puces
    // On cherche les motifs " - " ou " • " ou début de ligne avec tiret/puce
    // On remplace par \n + puce pour forcer le split
    str = str.replace(/(^|\s)([•-])\s/g, '\n$2 ');

    return str.split('\n').filter(line => line.trim());
};

export const PrintableCV = React.forwardRef<HTMLDivElement, PrintableCVProps>(({ data, language = "French" }, ref) => {
    const headers = SECTION_HEADERS[language];

    // Vérification de sécurité pour éviter les erreurs
    if (!data || !data.contact) {
        return (
            <div
                ref={ref}
                className="relative w-[210mm] h-[297mm] mx-auto bg-white text-black shadow-lg print:shadow-none print:m-0 overflow-hidden flex items-center justify-center"
                style={{
                    padding: '8mm 10mm',
                    boxSizing: 'border-box',
                }}
            >
                <div className="text-center text-slate-500">
                    <p className="text-xl font-semibold mb-2">CV en cours de génération...</p>
                    <p className="text-sm">Les données du CV optimisé sont en cours de traitement.</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className="relative w-[210mm] min-h-[297mm] h-auto mx-auto bg-white text-black shadow-lg print:shadow-none print:m-0 print:w-full print:h-auto"
            style={{
                padding: '12mm 15mm', // Optimised margins for print
                boxSizing: 'border-box',
            }}
        >
            {/* Header - Balanced Format */}
            <div className="border-b border-slate-800 pb-3 mb-4">
                <h1 className="text-[22px] font-bold uppercase tracking-wide mb-1 text-slate-900 leading-none">
                    {data.contact?.firstName || ''} {data.contact?.lastName || ''}
                </h1>

                {/* HEADLINE */}
                {data.headline && (
                    <div className="text-[14px] font-bold text-indigo-800 mb-1.5 uppercase tracking-tight leading-none">
                        {cleanMarkdown(data.headline)}
                    </div>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 leading-tight font-medium">
                    {data.contact?.email && <span>{data.contact.email}</span>}
                    {data.contact?.phone && <span>• {data.contact.phone}</span>}
                    {data.contact?.location && <span>• {data.contact.location}</span>}
                    {data.contact?.linkedin && <span>• <a href={data.contact.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a></span>}
                    {data.contact?.website && <span>• <a href={data.contact.website} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a></span>}
                </div>
            </div>

            {/* Summary */}
            {data.summary && (
                <div className="mb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 mb-1.5 pb-0.5">{headers.summary}</h2>
                    <p className="text-[11px] leading-relaxed text-justify text-slate-800">{cleanMarkdown(data.summary)}</p>
                </div>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 mb-2 pb-0.5">{headers.experience}</h2>
                    <div className="space-y-3">
                        {data.experience.map((exp, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-bold text-[13px] text-slate-900">{cleanMarkdown(exp.role)}</h3>
                                    <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap ml-2">{exp.dates}</span>
                                </div>
                                <div className="text-[12px] font-semibold text-indigo-700 mb-0.5">{cleanMarkdown(exp.company)}</div>
                                <ul className="list-none space-y-0.5 mt-0.5">
                                    {getExperiencePoints(exp.description).map((line: string, idx: number) => (
                                        <li key={idx} className="flex items-start text-[11px] leading-snug text-slate-700">
                                            <span className="mr-1.5 flex-shrink-0 text-slate-900 font-bold">-</span>
                                            <span>{line.trim().replace(/^[-•*]\s*/, '')}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 mb-2 pb-0.5">{headers.education}</h2>
                    <div className="space-y-2">
                        {data.education.map((edu, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-bold text-[13px] text-slate-900">{cleanMarkdown(edu.school)}</h3>
                                    <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap ml-2">{edu.dates}</span>
                                </div>
                                <div className="text-[12px] text-slate-700">{cleanMarkdown(edu.degree)}</div>
                                {edu.description && <p className="text-[11px] text-slate-600 mt-0.5">{cleanMarkdown(edu.description)}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills & Others */}
            <div className="space-y-1">
                {/* Technical Skills */}
                {data.skills && data.skills.length > 0 && (
                    <div className="flex items-baseline text-[11px]">
                        <span className="font-bold text-slate-900 w-40 flex-shrink-0">{headers.skills} :</span>
                        <span className="text-slate-700 flex-1 leading-snug">{cleanMarkdown(data.skills.join(" • "))}</span>
                    </div>
                )}

                {/* Soft Skills */}
                {data.softSkills && data.softSkills.length > 0 && (
                    <div className="flex items-baseline text-[11px]">
                        <span className="font-bold text-slate-900 w-40 flex-shrink-0">{headers.softSkills} :</span>
                        <span className="text-slate-700 flex-1 leading-snug">{cleanMarkdown(data.softSkills.join(" • "))}</span>
                    </div>
                )}

                {/* Languages */}
                {data.languages && data.languages.length > 0 && (
                    <div className="flex items-baseline text-[11px]">
                        <span className="font-bold text-slate-900 w-40 flex-shrink-0">{headers.languages} :</span>
                        <span className="text-slate-700 flex-1 leading-snug">{cleanMarkdown(data.languages.join(" • "))}</span>
                    </div>
                )}

                {/* Certifications */}
                {data.certifications && data.certifications.length > 0 && (
                    <div className="flex items-baseline text-[11px]">
                        <span className="font-bold text-slate-900 w-40 flex-shrink-0">{headers.certifications} :</span>
                        <span className="text-slate-700 flex-1 leading-snug">{cleanMarkdown(data.certifications.join(" • "))}</span>
                    </div>
                )}

                {/* Interests */}
                {data.interests && data.interests.length > 0 && (
                    <div className="flex items-baseline text-[11px]">
                        <span className="font-bold text-slate-900 w-40 flex-shrink-0">{headers.interests} :</span>
                        <span className="text-slate-700 flex-1 leading-snug">{cleanMarkdown(data.interests.join(" • "))}</span>
                    </div>
                )}
            </div>

            {/* Print-specific styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
});

PrintableCV.displayName = "PrintableCV";
