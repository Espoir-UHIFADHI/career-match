import { z } from "zod";

// CV Schema
export const CVSchema = z.object({
    contact: z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        location: z.string().optional(),
        linkedin: z.string().optional(),
        website: z.string().optional(),
    }),
    headline: z.string().optional(), // [Poste] | [Expertise] | [Différenciant]
    summary: z.string().optional(),
    skills: z.array(z.string()),
    experience: z.array(
        z.object({
            company: z.string(),
            role: z.string(),
            dates: z.string(),
            description: z.string(),
        })
    ),
    education: z.array(
        z.object({
            school: z.string(),
            degree: z.string(),
            dates: z.string(),
            description: z.string().optional(),
        })
    ).optional(),
    languages: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
});

export type ParsedCV = z.infer<typeof CVSchema>;

// Job Analysis Schema
export const JobAnalysisSchema = z.object({
    title: z.string(),
    company: z.string(),
    description: z.string(),
    requirements: z.object({
        hardSkills: z.array(z.string()),
        softSkills: z.array(z.string()),
        culture: z.array(z.string()),
        experienceLevel: z.string(),
    }),
});

export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;

// Matching Result Schema
export const MatchResultSchema = z.object({
    score: z.number().min(0).max(100),
    analysis: z.object({
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        missingKeywords: z.array(z.string()),
        cultureFit: z.string(),
    }),
    optimizedCV: CVSchema, // The rewritten CV
    recommendations: z.array(z.string()),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;
