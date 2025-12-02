import React from "react";
import type { ParsedCV } from "../../types";

interface PrintableCVProps {
    data: ParsedCV;
}

export const PrintableCV = React.forwardRef<HTMLDivElement, PrintableCVProps>(({ data }, ref) => {
    return (
        <div
            ref={ref}
            className="relative w-[210mm] h-[297mm] mx-auto bg-white text-black shadow-lg print:shadow-none print:m-0"
            style={{
                padding: '10mm 12mm', // Marges maintenues
                boxSizing: 'border-box',
            }}
        >
            {/* Header - Ultra Compact & Expert Format */}
            <div className="border-b border-slate-800 pb-2 mb-3">
                <h1 className="text-3xl font-bold uppercase tracking-wide mb-0.5 text-slate-900">
                    {data.contact.firstName} {data.contact.lastName}
                </h1>

                {/* HEADLINE - Expert Requirement */}
                {data.headline && (
                    <div className="text-base font-bold text-indigo-800 mb-1.5 uppercase tracking-tight">
                        {data.headline}
                    </div>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-slate-600">
                    {data.contact.email && <span>{data.contact.email}</span>}
                    {data.contact.phone && <span>• {data.contact.phone}</span>}
                    {data.contact.location && <span>• {data.contact.location}</span>}
                    {data.contact.linkedin && <span>• <a href={data.contact.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a></span>}
                    {data.contact.website && <span>• <a href={data.contact.website} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a></span>}
                </div>
            </div>

            {/* Summary - Ultra Compact */}
            {data.summary && (
                <div className="mb-3">
                    <h2 className="text-[16px] font-bold uppercase tracking-wider text-slate-500 mb-1">Professional Summary</h2>
                    <p className="text-[14px] leading-snug text-justify">{data.summary}</p>
                </div>
            )}

            {/* Experience - Ultra Compact */}
            {data.experience.length > 0 && (
                <div className="mb-3">
                    <h2 className="text-[16px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Experience</h2>
                    <div className="space-y-2">
                        {data.experience.map((exp, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-bold text-[14px]">{exp.role}</h3>
                                    <span className="text-[12px] text-slate-500 whitespace-nowrap ml-2">{exp.dates}</span>
                                </div>
                                <div className="text-[13px] font-medium text-slate-700 mb-0.5">{exp.company}</div>
                                <p className="text-[14px] leading-snug whitespace-pre-line pl-1 border-l-2 border-slate-100">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education - Ultra Compact */}
            {data.education && data.education.length > 0 && (
                <div className="mb-3">
                    <h2 className="text-[16px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Education</h2>
                    <div className="space-y-1.5">
                        {data.education.map((edu, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-bold text-[14px]">{edu.school}</h3>
                                    <span className="text-[12px] text-slate-500 whitespace-nowrap ml-2">{edu.dates}</span>
                                </div>
                                <div className="text-[14px] text-slate-700">{edu.degree}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills - Ultra Compact */}
            {data.skills.length > 0 && (
                <div className="mb-2">
                    <h2 className="text-[16px] font-bold uppercase tracking-wider text-slate-500 mb-1">Skills</h2>
                    <div className="flex flex-wrap gap-1.5">
                        {data.skills.map((skill, i) => (
                            <span key={i} className="bg-slate-100 px-2 py-0.5 rounded text-[12px] print:border print:border-slate-300">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Certifications - Added if missing */}
            {data.certifications && data.certifications.length > 0 && (
                <div className="mb-2 mt-2">
                    <h2 className="text-[16px] font-bold uppercase tracking-wider text-slate-500 mb-1">Certifications</h2>
                    <div className="flex flex-wrap gap-1.5">
                        {data.certifications.map((cert, i) => (
                            <span key={i} className="text-[12px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                {cert}
                            </span>
                        ))}
                    </div>
                </div>
            )}

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
