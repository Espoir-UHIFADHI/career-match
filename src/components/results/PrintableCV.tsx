import React, { useMemo } from "react";
import type { ParsedCV } from "../../types";
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar } from "lucide-react";

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

    const textStr = typeof text === 'string' ? text :
        Array.isArray(text) ? text.join('\n') :
            typeof text === 'object' ? JSON.stringify(text) :
                String(text);

    return textStr
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .trim();
};

const getExperiencePoints = (text: any): string[] => {
    let str = cleanMarkdown(text);
    if (!str) return [];

    if (str.includes('\n')) {
        return str.split('\n').filter(line => line.trim());
    }

    str = str.replace(/(^|\s)([•-])\s/g, '\n$2 ');
    return str.split('\n').filter(line => line.trim());
};

const calculateDensity = (data: ParsedCV): 'comfortable' | 'compact' | 'ultra' => {
    let score = 0;
    if (data.summary) score += data.summary.length;
    data.experience?.forEach(exp => {
        score += (exp.description?.length || 0) + 100; // +100 overhead per item
    });
    data.education?.forEach(edu => {
        score += (edu.description?.length || 0) + 50;
    });

    if (score > 3000) return 'ultra';
    if (score > 2000) return 'compact';
    return 'comfortable';
};

export const PrintableCV = React.forwardRef<HTMLDivElement, PrintableCVProps>(({ data, language = "French" }, ref) => {
    const headers = SECTION_HEADERS[language];

    const density = useMemo(() => calculateDensity(data), [data]);

    const config = useMemo(() => {
        switch (density) {
            case 'ultra':
                return {
                    padding: '6mm 8mm',
                    titleSize: 'text-xl',
                    headerGap: 'mb-1',
                    sectionGap: 'mb-2',
                    bodyText: 'text-[10px] leading-snug',
                    smallText: 'text-[9px] leading-snug',
                    iconSize: 10,
                    colGap: 'gap-4'
                };
            case 'compact':
                return {
                    padding: '8mm 10mm',
                    titleSize: 'text-2xl',
                    headerGap: 'mb-2',
                    sectionGap: 'mb-3',
                    bodyText: 'text-[11px] leading-snug',
                    smallText: 'text-[10px] leading-snug',
                    iconSize: 11,
                    colGap: 'gap-5'
                };
            case 'comfortable':
            default:
                return {
                    padding: '14mm 15mm',
                    titleSize: 'text-3xl',
                    headerGap: 'mb-3',
                    sectionGap: 'mb-5',
                    bodyText: 'text-[12.5px] leading-normal',
                    smallText: 'text-[11.5px] leading-normal',
                    iconSize: 12,
                    colGap: 'gap-6'
                };
        }
    }, [density]);

    // Vérification de sécurité pour éviter les erreurs
    if (!data || !data.contact) {
        return (
            <div
                ref={ref}
                className="relative w-[210mm] h-[297mm] mx-auto bg-white text-black shadow-lg print:shadow-none print:m-0 overflow-hidden flex items-center justify-center"
                style={{ padding: '8mm 10mm', boxSizing: 'border-box' }}
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
            className="relative w-[210mm] min-h-[297mm] h-auto mx-auto shadow-lg print:shadow-none print:m-0 print:w-full print:h-auto font-sans"
            style={{
                padding: config.padding,
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#1e293b'
            }}
        >
            {/* Header */}
            <header className={`border-b-2 border-slate-800 pb-2 ${config.sectionGap}`}>
                <h1 className={`${config.titleSize} font-extrabold uppercase tracking-tight text-slate-900 mb-0.5 leading-none`}>
                    {data.contact?.firstName || ''} {data.contact?.lastName || ''}
                </h1>

                {/* HEADLINE */}
                {data.headline && (
                    <div className={`text-sm font-bold uppercase tracking-wide text-indigo-700 ${config.headerGap}`}>
                        {cleanMarkdown(data.headline)}
                    </div>
                )}

                {/* Contact Info with Icons */}
                <div className={`flex flex-wrap gap-x-4 gap-y-1 ${config.smallText} text-slate-600 font-medium items-center`}>
                    {data.contact?.email && (
                        <div className="flex items-center gap-1">
                            <Mail size={config.iconSize} className="text-indigo-600" />
                            <span>{data.contact.email}</span>
                        </div>
                    )}
                    {data.contact?.phone && (
                        <div className="flex items-center gap-1">
                            <Phone size={config.iconSize} className="text-indigo-600" />
                            <span>{data.contact.phone}</span>
                        </div>
                    )}
                    {data.contact?.location && (
                        <div className="flex items-center gap-1">
                            <MapPin size={config.iconSize} className="text-indigo-600" />
                            <span>{data.contact.location}</span>
                        </div>
                    )}
                    {data.contact?.linkedin && (
                        <div className="flex items-center gap-1">
                            <Linkedin size={config.iconSize} className="text-indigo-600" />
                            <a href={data.contact.linkedin} target="_blank" rel="noreferrer" className="hover:text-indigo-800 hover:underline">LinkedIn</a>
                        </div>
                    )}
                    {data.contact?.website && (
                        <div className="flex items-center gap-1">
                            <Globe size={config.iconSize} className="text-indigo-600" />
                            <a href={data.contact.website} target="_blank" rel="noreferrer" className="hover:text-indigo-800 hover:underline">Portfolio</a>
                        </div>
                    )}
                </div>
            </header>

            {/* Summary */}
            {data.summary && (
                <section className={config.sectionGap}>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 pb-0.5 mb-1.5">
                        {headers.summary}
                    </h2>
                    <p className={`${config.bodyText} text-justify text-slate-700`}>
                        {cleanMarkdown(data.summary)}
                    </p>
                </section>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <section className={config.sectionGap}>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 pb-0.5 mb-1.5">
                        {headers.experience}
                    </h2>
                    <div className="space-y-2.5">
                        {data.experience.map((exp, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className={`font-bold ${density === 'ultra' ? 'text-xs' : 'text-sm'} text-slate-900`}>{cleanMarkdown(exp.role)}</h3>
                                    <span className={`${config.smallText} font-medium text-slate-500 whitespace-nowrap ml-4 flex items-center gap-1`}>
                                        <Calendar size={config.iconSize - 2} className="inline-block mb-0.5" />
                                        {exp.dates}
                                    </span>
                                </div>
                                <div className={`${config.smallText} font-bold text-indigo-700 mb-0.5`}>{cleanMarkdown(exp.company)}</div>
                                <ul className="space-y-0.5">
                                    {getExperiencePoints(exp.description).map((line: string, idx: number) => (
                                        <li key={idx} className={`flex items-start ${config.bodyText} text-slate-700`}>
                                            <span className="mr-1.5 mt-1 w-1 h-1 bg-indigo-500 rounded-full flex-shrink-0"></span>
                                            <span className="flex-1">{line.trim().replace(/^[-•*]\s*/, '')}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <section className={config.sectionGap}>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 pb-0.5 mb-1.5">
                        {headers.education}
                    </h2>
                    <div className="space-y-1.5">
                        {data.education.map((edu, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className={`font-bold ${density === 'ultra' ? 'text-xs' : 'text-sm'} text-slate-900`}>{cleanMarkdown(edu.school)}</h3>
                                    <span className={`${config.smallText} font-medium text-slate-500 whitespace-nowrap ml-4`}>{edu.dates}</span>
                                </div>
                                <div className={`${config.smallText} text-slate-800 font-medium`}>{cleanMarkdown(edu.degree)}</div>
                                {edu.description && <p className={`${config.smallText} mt-0.5 text-slate-600`}>{cleanMarkdown(edu.description)}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Skills Grid - Tech & Soft */}
            <div className={`grid grid-cols-12 ${config.colGap} mt-2`}>
                {/* Left Column: Tech Skills */}
                <div className="col-span-7 space-y-2">
                    {data.skills && data.skills.length > 0 && (
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 pb-0.5 mb-1.5">
                                {headers.skills}
                            </h2>
                            <div className="flex flex-wrap gap-1">
                                {data.skills.map((skill, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-slate-50 text-slate-700 text-[9px] font-semibold border border-slate-200 rounded-md">
                                        {cleanMarkdown(skill)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Soft Skills */}
                <div className="col-span-5 space-y-2">
                    {data.softSkills && data.softSkills.length > 0 && (
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 pb-0.5 mb-1.5">
                                {headers.softSkills}
                            </h2>
                            <div className="flex flex-wrap gap-1">
                                {data.softSkills.map((skill, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-medium rounded-md">
                                        {cleanMarkdown(skill)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Languages, Certifications, Interests */}
            <div className={`grid grid-cols-3 ${config.colGap} mt-3 pt-2 border-t border-slate-100`}>
                {/* Languages */}
                <div>
                    {data.languages && data.languages.length > 0 && (
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 pb-0.5 mb-1.5">
                                {headers.languages}
                            </h2>
                            <ul className="space-y-0.5">
                                {data.languages.map((lang, idx) => (
                                    <li key={idx} className={`${config.smallText} text-slate-700 flex items-center`}>
                                        <span className="w-1 h-1 bg-indigo-400 rounded-full mr-1.5"></span>
                                        {cleanMarkdown(lang)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Certifications */}
                <div>
                    {data.certifications && data.certifications.length > 0 && (
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 pb-0.5 mb-1.5">
                                {headers.certifications}
                            </h2>
                            <ul className="space-y-0.5">
                                {data.certifications.map((cert, idx) => {
                                    const isStr = typeof cert === 'string';
                                    const name = isStr ? cert : cert.name;
                                    const url = !isStr ? cert.url : null;

                                    return (
                                        <li key={idx} className={`${config.smallText} text-slate-700 flex items-start text-justify`}>
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                                            <span className="leading-snug">
                                                {url ? (
                                                    <a
                                                        href={url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="hover:text-indigo-600 hover:underline decoration-indigo-300 underline-offset-2 transition-colors cursor-pointer"
                                                    >
                                                        {cleanMarkdown(name)}
                                                    </a>
                                                ) : (
                                                    cleanMarkdown(name)
                                                )}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Interests */}
                <div>
                    {data.interests && data.interests.length > 0 && (
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 pb-0.5 mb-1.5">
                                {headers.interests}
                            </h2>
                            <div className={`${config.smallText} text-slate-700 leading-snug text-justify`}>
                                {cleanMarkdown(data.interests.join(", "))}
                            </div>
                        </div>
                    )}
                </div>
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
                        color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
});

PrintableCV.displayName = "PrintableCV";
