import { createClerkSupabaseClient, supabase } from './supabase';
import type { CVHistoryEntry } from '../types';

const MAX_HISTORY = 10;

function toRow(userId: string, entry: CVHistoryEntry) {
    return {
        id: entry.id,
        user_id: userId,
        created_at: entry.createdAt,
        cv_data: entry.cvData,
        job_data: entry.jobData,
        match_score: entry.matchScore,
        analysis_language: entry.analysisLanguage,
        optimized_cv: entry.optimizedCV,
        full_analysis: entry.fullAnalysis,
        full_job_data: entry.fullJobData,
    };
}

function fromRow(row: Record<string, unknown>): CVHistoryEntry {
    return {
        id: row.id as string,
        createdAt: row.created_at as string,
        cvData: row.cv_data as CVHistoryEntry['cvData'],
        jobData: row.job_data as CVHistoryEntry['jobData'],
        matchScore: row.match_score as number,
        analysisLanguage: row.analysis_language as CVHistoryEntry['analysisLanguage'],
        optimizedCV: row.optimized_cv as CVHistoryEntry['optimizedCV'],
        fullAnalysis: row.full_analysis as CVHistoryEntry['fullAnalysis'],
        fullJobData: row.full_job_data as CVHistoryEntry['fullJobData'],
    };
}

export const cvHistoryService = {
    async getAll(userId: string, token?: string): Promise<CVHistoryEntry[]> {
        const client = token ? createClerkSupabaseClient(token) : supabase;
        const { data, error } = await client
            .from('cv_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(MAX_HISTORY);

        if (error) {
            console.error('cvHistoryService.getAll error:', error);
            return [];
        }
        return (data ?? []).map(fromRow);
    },

    async add(userId: string, entry: CVHistoryEntry, token?: string): Promise<void> {
        const client = token ? createClerkSupabaseClient(token) : supabase;

        // Remove existing entry for same job+company+cv owner (deduplication)
        await client
            .from('cv_history')
            .delete()
            .eq('user_id', userId)
            .eq('job_data->>title', entry.jobData.title)
            .eq('job_data->>company', entry.jobData.company)
            .eq('cv_data->contact->>firstName', entry.cvData.contact.firstName)
            .eq('cv_data->contact->>lastName', entry.cvData.contact.lastName);

        // Insert new entry
        const { error: insertError } = await client
            .from('cv_history')
            .insert(toRow(userId, entry));

        if (insertError) {
            console.error('cvHistoryService.add error:', insertError);
            return;
        }

        // Prune to MAX_HISTORY: delete oldest entries beyond the limit
        const { data: allRows } = await client
            .from('cv_history')
            .select('id, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (allRows && allRows.length > MAX_HISTORY) {
            const toDelete = allRows.slice(MAX_HISTORY).map((r: { id: string }) => r.id);
            await client
                .from('cv_history')
                .delete()
                .eq('user_id', userId)
                .in('id', toDelete);
        }
    },

    async remove(userId: string, entryId: string, token?: string): Promise<void> {
        const client = token ? createClerkSupabaseClient(token) : supabase;
        const { error } = await client
            .from('cv_history')
            .delete()
            .eq('user_id', userId)
            .eq('id', entryId);

        if (error) console.error('cvHistoryService.remove error:', error);
    },
};
