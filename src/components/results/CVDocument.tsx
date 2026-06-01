import React, { useMemo } from "react";
import {
    Page, Text, View, Document, StyleSheet, Link, Font, Svg, Circle, Path
} from "@react-pdf/renderer";
import type { ParsedCV } from "../../types";
import { normalizeParsedCV } from "../../utils/normalizeCV";

// Register Outfit — same font as PrintableCV (font-sans = Outfit)
Font.register({
    family: 'Outfit',
    fonts: [
        { src: '/fonts/Outfit-Regular.ttf',   fontWeight: 400 },
        { src: '/fonts/Outfit-Bold.ttf',       fontWeight: 700 },
        { src: '/fonts/Outfit-ExtraBold.ttf',  fontWeight: 800 },
    ],
});

// No automatic hyphenation — prevents "OPÉRA-\nTIONNEL"
Font.registerHyphenationCallback((word) => [word]);

// ─── SVG Icons — exact Lucide paths used in PrintableCV ─────────────────────

const IconMail = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="none" stroke="#4338ca" strokeWidth="2" />
        <Path d="M22 6l-10 7L2 6" fill="none" stroke="#4338ca" strokeWidth="2" />
    </Svg>
);
const IconPhone = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" fill="none" stroke="#4338ca" strokeWidth="2" />
    </Svg>
);
const IconMapPin = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" fill="none" stroke="#4338ca" strokeWidth="2" />
        <Circle cx="12" cy="10" r="3" fill="none" stroke="#4338ca" strokeWidth="2" />
    </Svg>
);
const IconLinkedin = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" fill="#4338ca" />
        <Path d="M2 9h4v12H2z" fill="#4338ca" />
        <Circle cx="4" cy="4" r="2" fill="#4338ca" />
    </Svg>
);
const IconGlobe = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="10" fill="none" stroke="#4338ca" strokeWidth="2" />
        <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" fill="none" stroke="#4338ca" strokeWidth="2" />
    </Svg>
);
const IconCalendar = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" fill="none" stroke="#64748b" strokeWidth="2" />
        <Path d="M16 2v4M8 2v4M3 10h18" fill="none" stroke="#64748b" strokeWidth="2" />
    </Svg>
);

// Bullet dots — identical to PrintableCV
// Experience: w-1 h-1 bg-indigo-500 = 4px = 3pt, #6366f1
// Footer:     w-1 h-1 bg-indigo-400 = 4px = 3pt, #818cf8
const FooterDot = () => (
    <Svg width={3} height={3} viewBox="0 0 6 6">
        <Circle cx="3" cy="3" r="3" fill="#818cf8" />
    </Svg>
);

// ─── Density — height-based selection ────────────────────────────────────────
//
// Rather than a char-count heuristic, we estimate the real rendered height in pt
// for each density level, then pick the loosest one that fits in A4.
//
// A4 = 595.28 × 841.89 pt.  We leave a 20pt safety buffer → max usable = 821pt.

type Density = 'comfortable' | 'compact' | 'ultra';

const A4_H       = 841.89;
const MAX_H      = A4_H - 20;       // 20pt safety buffer
const MM         = 2.8346;          // 1mm in pt
const CW         = 0.53;            // avg char width ratio for Outfit (conservative)

// Per-density layout params (must mirror createStyles below)
const DENSITY_PARAMS = {
    comfortable: { pv: 14*MM, ph: 15*MM, base: 9.375, lead: 1.5,  small: 8.625, role: 10.5, name: 22.5, secGap: 15, hlMb: 12 },
    compact:     { pv: 8*MM,  ph: 10*MM, base: 8.25,  lead: 1.375, small: 7.5,  role: 10.5, name: 18,   secGap: 9,  hlMb: 8  },
    ultra:       { pv: 6*MM,  ph: 8*MM,  base: 7.5,   lead: 1.375, small: 6.75, role: 9,    name: 15,   secGap: 6,  hlMb: 3  },
} as const;

// Shared layout constants (same for all densities — mirrors createStyles)
const _SEC_T  = 9;     // SEC_TITLE_SIZE
const _SEC_PB = 1.5;   // SEC_TITLE_PB
const _SEC_MB = 4.5;   // SEC_TITLE_MB
const _COMP_MB = 4;    // COMPANY_MB
const _JR_MB   = 1.5;  // JOB_ROW_MB
const _EXP_GAP = 7.5;  // EXP_ITEMS_GAP
const _EDU_GAP = 4.5;  // EDU_ITEMS_GAP
const _BUL_GAP = 1.5;  // BULLET_GAP
const _FOOTER_MT = 9;
const _FOOTER_PT = 6;
const _FOOTER_IG = 1.5;
const _SKILLS_MT = 6;
const _HDR_PB    = 6;

const lh  = (sz: number, lead: number) => sz * lead;

const textLines = (text: string, sz: number, w: number): number => {
    if (!text || !text.trim()) return 0;
    const cpl = Math.max(1, Math.floor(w / (sz * CW)));
    return Math.ceil(text.length / cpl);
};


const estimateHeight = (data: ParsedCV, d: Density): number => {
    const p   = DENSITY_PARAMS[d];
    const w   = 595.28 - 2 * p.ph;   // usable content width
    let   h   = 0;

    // ── Header
    h += lh(p.name, 1) + 1.5;                          // name
    if (data.headline) h += lh(10.5, 1.15) + p.hlMb;   // headline
    h += lh(p.small, 1.5) + 2;                          // contact row
    h += _HDR_PB + p.secGap;                            // border + gap

    // ── Summary
    if (data.summary) {
        h += _SEC_T + _SEC_PB + _SEC_MB;
        h += textLines(clean(data.summary), p.base, w) * lh(p.base, p.lead);
        h += p.secGap;
    }

    // ── Experience
    if (data.experience?.length) {
        h += _SEC_T + _SEC_PB + _SEC_MB;
        data.experience.forEach((exp, i) => {
            if (i > 0) h += _EXP_GAP;
            h += lh(p.role, 1) + _JR_MB;               // role row
            h += lh(p.small, 1.375) + _COMP_MB;        // company
            // description lines
            const desc = clean(exp.description || '');
            const lines = desc.includes('\n')
                ? desc.split('\n').filter(l => l.trim())
                : [desc];
            lines.forEach(line => {
                h += textLines(line, p.base, w) * lh(p.base, p.lead) + _BUL_GAP;
            });
        });
        h += p.secGap;
    }

    // ── Education
    if (data.education?.length) {
        h += _SEC_T + _SEC_PB + _SEC_MB;
        data.education.forEach((edu, i) => {
            if (i > 0) h += _EDU_GAP;
            h += lh(p.role, 1) + _JR_MB;               // school row
            h += lh(p.small, 1.375);                    // degree
            if (edu.description) h += lh(p.small, 1.375) + 1.5;
        });
        h += p.secGap;
    }

    // ── Skills grid (2-column list)
    h += _SKILLS_MT;
    const techRows = Math.ceil((data.skills || []).length / 2);
    const softRows = Math.ceil((data.softSkills || []).length / 2);
    const techH  = (_SEC_T + _SEC_PB + _SEC_MB) + techRows * lh(p.base, p.lead);
    const softH  = (_SEC_T + _SEC_PB + _SEC_MB) + softRows * lh(p.base, p.lead);
    h += Math.max(techH, softH);

    // ── Footer
    const hasLang  = (data.languages?.length  || 0) > 0;
    const hasCert  = (data.certifications?.length || 0) > 0;
    const hasInt   = (data.interests?.length   || 0) > 0;
    if (hasLang || hasCert || hasInt) {
        h += _FOOTER_MT + _FOOTER_PT + 0.75;
        const maxItems = Math.max(
            data.languages?.length  || 0,
            data.certifications?.length || 0,
            hasInt ? 1 : 0
        );
        h += _SEC_T + _SEC_PB + _SEC_MB;
        h += maxItems * (lh(p.small, 1.375) + _FOOTER_IG);
    }

    return h;
};

const calculateDensity = (data: ParsedCV): Density => {
    const levels: Density[] = ['comfortable', 'compact', 'ultra'];
    for (const d of levels) {
        if (estimateHeight(data, d) <= MAX_H) return d;
    }
    return 'ultra'; // ultra always used as last resort
};

// ─── Styles — every value is px × 0.75 = pt, matching PrintableCV exactly ───
//
// Tailwind → pt conversion reference:
//   text-3xl  = 30px = 22.5pt    text-2xl = 24px = 18pt   text-xl = 20px = 15pt
//   text-sm   = 14px = 10.5pt    text-xs  = 12px =  9pt
//   text-[12.5px] = 9.375pt      text-[11px] = 8.25pt     text-[10px] = 7.5pt
//   text-[11.5px] = 8.625pt      text-[9px]  = 6.75pt
//   mb-5 = 20px = 15pt   mb-3 = 12px = 9pt    mb-2 = 8px = 6pt    mb-1 = 4px = 3pt
//   pb-2 = 8px = 6pt     pb-0.5 = 2px = 1.5pt mb-1.5 = 6px = 4.5pt
//   space-y-2.5 = 10px = 7.5pt   space-y-1.5 = 6px = 4.5pt
//   space-y-0.5 = 2px = 1.5pt    mt-2 = 8px = 6pt   mt-3 = 12px = 9pt
//   pt-2 = 8px = 6pt    gap-6 = 24px = 18pt  gap-5 = 20px = 15pt  gap-4 = 16px = 12pt
//   gap-x-4 = 16px = 12pt        gap-y-1 = 4px = 3pt
//   px-1.5 = 6px = 4.5pt         py-0.5 = 2px = 1.5pt
//   w-1/h-1 = 4px = 3pt          mr-1.5 = 6px = 4.5pt   mt-1 = 4px = 3pt
//   rounded-md = 6px = 4.5pt     ml-4 = 16px = 12pt

const createStyles = (density: Density) => {
    // Per-density values (all in pt)
    const c = {
        comfortable: {
            pagePad:       '14mm 15mm',
            nameSize:      22.5,   // text-3xl
            headlineMb:    12,     // mb-3
            contactSize:   8.625,  // text-[11.5px]
            sectionGap:    15,     // mb-5
            bodySize:      9.375,  // text-[12.5px]
            bodyLead:      1.5,    // leading-normal
            smallSize:     8.625,  // text-[11.5px]
            roleSize:      10.5,   // text-sm
            colGap:        18,     // gap-6
            iconSize:      12,
        },
        compact: {
            pagePad:       '8mm 10mm',
            nameSize:      18,     // text-2xl
            headlineMb:    8,      // mb-2
            contactSize:   7.5,    // text-[10px]
            sectionGap:    9,      // mb-3
            bodySize:      8.25,   // text-[11px]
            bodyLead:      1.375,  // leading-snug
            smallSize:     7.5,    // text-[10px]
            roleSize:      10.5,   // text-sm
            colGap:        15,     // gap-5
            iconSize:      11,
        },
        ultra: {
            pagePad:       '6mm 8mm',
            nameSize:      15,     // text-xl
            headlineMb:    3,      // mb-1 (approx)
            contactSize:   6.75,   // text-[9px]
            sectionGap:    6,      // mb-2
            bodySize:      7.5,    // text-[10px]
            bodyLead:      1.375,  // leading-snug
            smallSize:     6.75,   // text-[9px]
            roleSize:      9,      // text-xs (ultra special case)
            colGap:        12,     // gap-4
            iconSize:      10,
        },
    }[density];

    // Shared constants (same across all densities)
    const SEC_TITLE_SIZE  = 9;     // text-xs
    const BADGE_SIZE      = 6.75;  // text-[9px]
    const HEADER_PB       = 6;     // pb-2
    const SEC_TITLE_PB    = 1.5;   // pb-0.5
    const SEC_TITLE_MB    = 4.5;   // mb-1.5
    const COMPANY_MB      = 4;     // space between role and company
    const JOB_ROW_MB      = 1.5;   // mb-0.5
    const EXP_ITEMS_GAP   = 7.5;   // space-y-2.5
    const EDU_ITEMS_GAP   = 4.5;   // space-y-1.5
    const BULLET_GAP      = 1.5;   // space-y-0.5
    const BULLET_DOT_SIZE = 3;     // w-1 h-1
    const BULLET_DOT_MR   = 4.5;   // mr-1.5
    const BULLET_DOT_MT   = 3;     // mt-1
    const SKILLS_MT       = 6;     // mt-2
    const BADGE_PX        = 4.5;   // px-1.5
    const BADGE_PY        = 1.5;   // py-0.5
    const BADGE_RADIUS    = 4.5;   // rounded-md
    const BADGE_GAP       = 3;     // gap-1
    const FOOTER_MT       = 9;     // mt-3
    const FOOTER_PT       = 6;     // pt-2
    const FOOTER_ITEM_GAP = 1.5;   // space-y-0.5
    const CONTACT_GAP_X   = 12;    // gap-x-4

    return StyleSheet.create({
        page: {
            padding: c.pagePad,
            backgroundColor: '#ffffff',
            fontFamily: 'Outfit',
            fontSize: c.bodySize,
            color: '#1e293b',
            lineHeight: c.bodyLead,
        },

        // ── Header — <header className={`border-b-2 border-slate-800 pb-2 ${sectionGap}`}>
        header: {
            paddingBottom: HEADER_PB,
            marginBottom: c.sectionGap,
            borderBottomWidth: 1.5,       // border-b-2 = 2px = 1.5pt
            borderBottomColor: '#1e293b', // border-slate-800
        },
        // <h1 font-extrabold uppercase tracking-tight leading-none mb-0.5>
        name: {
            fontSize: c.nameSize,
            fontFamily: 'Outfit',
            fontWeight: 800,              // font-extrabold
            textTransform: 'uppercase',
            letterSpacing: -0.5,          // tracking-tight
            color: '#0f172a',             // text-slate-900
            marginBottom: 1.5,
            lineHeight: 1,
        },
        // <div text-sm font-bold uppercase tracking-wide text-indigo-700 mb-X>
        headline: {
            fontSize: HEADLINE_SIZE,
            fontFamily: 'Outfit',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.3,           // tracking-wide ≈ 0.025em
            color: '#4338ca',             // text-indigo-700
            marginBottom: c.headlineMb,
            lineHeight: 1.15,
        },
        // <div flex flex-wrap gap-x-4 gap-y-1 items-center>
        contactRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: CONTACT_GAP_X,
            marginTop: 2,
        },
        // <div flex items-center gap-1>
        contactItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,                       // gap-1 = 4px = 3pt
        },
        contactText: {
            fontSize: c.contactSize,
            color: '#475569',             // text-slate-600
        },
        contactLink: {
            fontSize: c.contactSize,
            color: '#4338ca',             // text-indigo-600
            textDecoration: 'underline',
        },

        // ── Section wrapper — <section className={sectionGap}>
        section: { marginBottom: c.sectionGap },

        // ── Section title — <h2 text-xs font-bold uppercase tracking-wider text-indigo-800 border-b border-indigo-100 pb-0.5 mb-1.5>
        sectionTitle: {
            fontSize: SEC_TITLE_SIZE,
            fontFamily: 'Outfit',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,           // tracking-wider = 0.05em × 9pt
            color: '#3730a3',             // text-indigo-800
            borderBottomWidth: 0.75,      // border-b = 1px = 0.75pt
            borderBottomColor: '#e0e7ff', // border-indigo-100
            paddingBottom: SEC_TITLE_PB,
            marginBottom: SEC_TITLE_MB,
        },

        // ── Body text — summary paragraph
        bodyText: {
            fontSize: c.bodySize,
            color: '#334155',             // text-slate-700
            textAlign: 'justify',
            lineHeight: c.bodyLead,
        },

        // ── Experience items — <div space-y-2.5>
        expList: { gap: EXP_ITEMS_GAP },
        expItem: {},

        // ── Role / dates row — <div flex justify-between items-baseline mb-0.5>
        jobRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',       // closest to items-baseline
            marginBottom: JOB_ROW_MB,
        },
        // <h3 font-bold text-sm/xs text-slate-900>
        role: {
            fontSize: c.roleSize,
            fontFamily: 'Outfit',
            fontWeight: 700,
            color: '#0f172a',             // text-slate-900
        },
        // <span flex items-center gap-1 text-slate-500>
        datesRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,                       // gap-1
            marginLeft: 12,               // ml-4 = 16px = 12pt (whitespace-nowrap)
        },
        datesText: {
            fontSize: c.smallSize,
            color: '#64748b',             // text-slate-500
        },
        // <div smallText font-bold text-indigo-700 mb-0.5>
        company: {
            fontSize: c.smallSize,
            fontFamily: 'Outfit',
            fontWeight: 700,
            color: '#4338ca',             // text-indigo-700
            marginBottom: COMPANY_MB,
        },

        // ── Bullet list — <ul space-y-0.5>
        bulletList: { gap: BULLET_GAP },
        // <li flex items-start>
        bulletRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
        },
        // <span w-1 h-1 bg-indigo-500 rounded-full mr-1.5 mt-1 flex-shrink-0>
        bulletDotWrap: {
            width: BULLET_DOT_SIZE,
            height: BULLET_DOT_SIZE,
            marginRight: BULLET_DOT_MR,
            marginTop: BULLET_DOT_MT,
            flexShrink: 0,
        },
        bulletText: {
            fontSize: c.bodySize,
            color: '#334155',
            lineHeight: c.bodyLead,
            marginBottom: BULLET_GAP,
        },

        // ── Education items — <div space-y-1.5>
        eduList: { gap: EDU_ITEMS_GAP },
        eduItem: {},
        // <div smallText text-slate-800 font-medium>  (degree)
        eduDegree: {
            fontSize: c.smallSize,
            fontFamily: 'Outfit',
            fontWeight: 700,
            color: '#1e293b',             // text-slate-800
        },
        // <p smallText mt-0.5 text-slate-600>  (location / description)
        eduDesc: {
            fontSize: c.smallSize,
            color: '#475569',             // text-slate-600
            marginTop: 1.5,              // mt-0.5 = 2px = 1.5pt
        },
        // Education dates — no calendar icon, text-slate-500
        eduDates: {
            fontSize: c.smallSize,
            color: '#64748b',
            marginLeft: 12,
        },

        // ── Skills grid — <div grid grid-cols-12 colGap mt-2>
        skillsGrid: {
            flexDirection: 'row',
            gap: c.colGap,
            marginTop: SKILLS_MT,
        },
        // col-span-7 / 12 ≈ 58.3%
        skillsLeft: { flex: 7 },
        // col-span-5 / 12 ≈ 41.7%
        skillsRight: { flex: 5 },

        // Skill block title — same h2 class as sectionTitle
        skillTitle: {
            fontSize: SEC_TITLE_SIZE,
            fontFamily: 'Outfit',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#3730a3',
            borderBottomWidth: 0.75,
            borderBottomColor: '#e0e7ff',
            paddingBottom: SEC_TITLE_PB,
            marginBottom: SEC_TITLE_MB,
        },

        // <div flex flex-wrap gap-1>
        badgesWrap: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: BADGE_GAP,
        },

        // Tech badge: px-1.5 py-0.5 bg-slate-50 text-slate-700 text-[9px] font-semibold border border-slate-200 rounded-md
        badgeTech: {
            backgroundColor: '#f8fafc',   // bg-slate-50
            borderWidth: 0.75,            // border = 1px = 0.75pt
            borderColor: '#e2e8f0',       // border-slate-200
            borderStyle: 'solid',
            borderRadius: BADGE_RADIUS,
            paddingTop: BADGE_PY,
            paddingBottom: BADGE_PY,
            paddingLeft: BADGE_PX,
            paddingRight: BADGE_PX,
        },
        badgeTechText: {
            fontSize: BADGE_SIZE,
            fontFamily: 'Outfit',
            fontWeight: 700, // font-semibold → Bold (closest)
            color: '#334155',             // text-slate-700
        },

        // Soft badge: px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-medium rounded-md  (NO border)
        badgeSoft: {
            backgroundColor: '#eef2ff',   // bg-indigo-50 = #eef2ff  ← was wrong (#e0e7ff)
            borderRadius: BADGE_RADIUS,
            paddingTop: BADGE_PY,
            paddingBottom: BADGE_PY,
            paddingLeft: BADGE_PX,
            paddingRight: BADGE_PX,
        },
        badgeSoftText: {
            fontSize: BADGE_SIZE,
            color: '#4338ca',             // text-indigo-700  ← was wrong (#3730a3)
        },

        // ── Footer row — <div grid grid-cols-3 colGap mt-3 pt-2 border-t border-slate-100>
        footerRow: {
            flexDirection: 'row',
            gap: c.colGap,
            borderTopWidth: 0.75,         // border-t = 1px = 0.75pt
            borderTopColor: '#f1f5f9',    // border-slate-100
            marginTop: FOOTER_MT,
            paddingTop: FOOTER_PT,
        },
        footerCol: { flex: 1 },

        // Footer title — same h2 class as sectionTitle
        footerTitle: {
            fontSize: SEC_TITLE_SIZE,
            fontFamily: 'Outfit',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#3730a3',
            borderBottomWidth: 0.75,
            borderBottomColor: '#e0e7ff',
            paddingBottom: SEC_TITLE_PB,
            marginBottom: SEC_TITLE_MB,
        },

        // <ul space-y-0.5>
        footerList: { gap: FOOTER_ITEM_GAP },
        // <li flex items-center>
        footerItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        // <span w-1 h-1 bg-indigo-400 rounded-full mr-1.5>
        footerDotWrap: {
            width: BULLET_DOT_SIZE,
            height: BULLET_DOT_SIZE,
            marginRight: BULLET_DOT_MR,
            flexShrink: 0,
        },
        footerText: {
            fontSize: c.smallSize,
            color: '#334155',             // text-slate-700
            flex: 1,
        },
        footerLink: {
            fontSize: c.smallSize,
            color: '#4338ca',
            flex: 1,
            textDecoration: 'none',
        },
    });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HEADERS = {
    English: {
        summary: 'Professional Summary', experience: 'Experience', education: 'Education',
        skills: 'Technical Skills', softSkills: 'Soft Skills',
        languages: 'Languages', certifications: 'Certifications', interests: 'Interests',
    },
    French: {
        summary: 'Résumé professionnel', experience: 'Expérience', education: 'Formation',
        skills: 'Compétences techniques', softSkills: 'Compétences comportementales',
        languages: 'Langues', certifications: 'Certifications', interests: "Centres d'intérêt",
    },
};

const ensureHttps = (url: string): string => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return 'https://' + url;
};

// Zero-width non-joiner inserted between ligature pairs so @react-pdf/renderer
// doesn't collapse them into a single missing glyph (fi, fl, ff, ffi, ffl).
const ZWNJ = '‌';
const breakLigatures = (s: string): string =>
    s.replace(/f([flibt])/g, `f${ZWNJ}$1`);

const clean = (text: any): string => {
    if (!text) return '';
    const s = typeof text === 'string' ? text : String(text);
    return breakLigatures(
        s.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').trim()
    );
};

const getBullets = (text: any): string[] => {
    let s = clean(text);
    if (!s) return [];
    if (s.includes('\n')) return s.split('\n').filter(l => l.trim());
    s = s.replace(/(^|\s)([•\-])\s/g, '\n$2 ');
    return s.split('\n').filter(l => l.trim());
};

// ─── Component ───────────────────────────────────────────────────────────────

interface CVDocumentProps {
    data: ParsedCV;
    language?: 'English' | 'French';
}

export const CVDocument: React.FC<CVDocumentProps> = ({ data: rawData, language = 'French' }) => {
    const data    = useMemo(() => normalizeParsedCV(rawData) ?? rawData, [rawData]);
    const headers = HEADERS[language];
    const density = useMemo(() => calculateDensity(data), [data]);
    const s       = useMemo(() => createStyles(density), [density]);
    const ic      = { comfortable: 12, compact: 11, ultra: 10 }[density];

    if (!data?.contact) {
        return (
            <Document>
                <Page size="A4" style={s.page}><Text>Erreur : données manquantes</Text></Page>
            </Document>
        );
    }

    return (
        <Document>
            <Page size="A4" style={s.page}>

                {/* ── Header ── */}
                <View style={s.header}>
                    <Text style={s.name}>{data.contact.firstName} {data.contact.lastName}</Text>
                    {data.headline && <Text style={s.headline}>{clean(data.headline)}</Text>}

                    {/* Contact row — flex flex-wrap gap-x-4 gap-y-1 */}
                    <View style={s.contactRow}>
                        {data.contact.email && (
                            <View style={s.contactItem}>
                                <IconMail size={ic} />
                                <Text style={s.contactText}>{data.contact.email}</Text>
                            </View>
                        )}
                        {data.contact.phone && (
                            <View style={s.contactItem}>
                                <IconPhone size={ic} />
                                <Text style={s.contactText}>{data.contact.phone}</Text>
                            </View>
                        )}
                        {data.contact.location && (
                            <View style={s.contactItem}>
                                <IconMapPin size={ic} />
                                <Text style={s.contactText}>{data.contact.location}</Text>
                            </View>
                        )}
                        {data.contact.linkedin && (
                            <View style={s.contactItem}>
                                <IconLinkedin size={ic} />
                                <Link src={ensureHttps(data.contact.linkedin)} style={s.contactLink}>LinkedIn</Link>
                            </View>
                        )}
                        {data.contact.website && (
                            <View style={s.contactItem}>
                                <IconGlobe size={ic} />
                                <Link src={ensureHttps(data.contact.website)} style={s.contactLink}>Portfolio</Link>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Summary ── */}
                {data.summary && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>{headers.summary}</Text>
                        <Text style={s.bodyText}>{clean(data.summary)}</Text>
                    </View>
                )}

                {/* ── Experience ── */}
                {data.experience && data.experience.length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>{headers.experience}</Text>
                        <View style={s.expList}>
                            {data.experience.map((exp, i) => (
                                <View key={i} style={s.expItem}>
                                    {/* Role + dates row */}
                                    <View style={s.jobRow}>
                                        <Text style={s.role}>{clean(exp.role)}</Text>
                                        <View style={s.datesRow}>
                                            <IconCalendar size={ic - 2} />
                                            <Text style={s.datesText}>{exp.dates}</Text>
                                        </View>
                                    </View>
                                    {/* Company */}
                                    <Text style={s.company}>{clean(exp.company)}</Text>
                                    {/* Lines — no bullet */}
                                    <View>
                                        {getBullets(exp.description).map((line, idx) => (
                                            <Text key={idx} style={s.bulletText}>
                                                {line.trim().replace(/^[-•*]\s*/, '')}
                                            </Text>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── Education ── */}
                {data.education && data.education.length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>{headers.education}</Text>
                        <View style={s.eduList}>
                            {data.education.map((edu, i) => (
                                <View key={i} style={s.eduItem}>
                                    <View style={s.jobRow}>
                                        <Text style={s.role}>{clean(edu.school)}</Text>
                                        <Text style={s.eduDates}>{edu.dates}</Text>
                                    </View>
                                    <Text style={s.eduDegree}>{clean(edu.degree)}</Text>
                                    {edu.description && (
                                        <Text style={s.eduDesc}>{clean(edu.description)}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── Skills grid — col-span-7 / col-span-5 ── */}
                <View style={s.skillsGrid}>
                    <View style={s.skillsLeft}>
                        {data.skills && data.skills.length > 0 && (
                            <View>
                                <Text style={s.skillTitle}>{headers.skills}</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                    {data.skills.map((skill, idx) => (
                                        <Text key={idx} style={[s.bodyText, { width: '50%' }]}>{clean(skill)}</Text>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                    <View style={s.skillsRight}>
                        {data.softSkills && data.softSkills.length > 0 && (
                            <View>
                                <Text style={s.skillTitle}>{headers.softSkills}</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                    {data.softSkills.map((skill, idx) => (
                                        <Text key={idx} style={[s.bodyText, { width: '50%' }]}>{clean(skill)}</Text>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Footer — Languages / Certifications / Interests ── */}
                <View style={s.footerRow}>
                    {data.languages && data.languages.length > 0 && (
                        <View style={s.footerCol}>
                            <Text style={s.footerTitle}>{headers.languages}</Text>
                            <View style={s.footerList}>
                                {data.languages.map((lang, idx) => (
                                    <View key={idx} style={s.footerItem}>
                                        <View style={s.footerDotWrap}><FooterDot /></View>
                                        <Text style={s.footerText}>{clean(lang)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    {data.certifications && data.certifications.length > 0 && (
                        <View style={s.footerCol}>
                            <Text style={s.footerTitle}>{headers.certifications}</Text>
                            <View style={s.footerList}>
                                {data.certifications.map((cert, idx) => {
                                    const isStr = typeof cert === 'string';
                                    const name  = isStr ? cert : (cert as any).name;
                                    const url   = !isStr ? (cert as any).url : null;
                                    return (
                                        <View key={idx} style={s.footerItem}>
                                            <View style={s.footerDotWrap}><FooterDot /></View>
                                            {url
                                                ? <Link src={url} style={s.footerLink}>{clean(name)}</Link>
                                                : <Text style={s.footerText}>{clean(name)}</Text>
                                            }
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                    {data.interests && data.interests.length > 0 && (
                        <View style={s.footerCol}>
                            <Text style={s.footerTitle}>{headers.interests}</Text>
                            <Text style={s.footerText}>{clean(data.interests.join(', '))}</Text>
                        </View>
                    )}
                </View>

            </Page>
        </Document>
    );
};
