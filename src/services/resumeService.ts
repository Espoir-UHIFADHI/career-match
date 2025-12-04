import { supabase, createClerkSupabaseClient } from './supabase';
import type { ParsedCV } from '../types';

export const resumeService = {
    /**
     * Save or update a user's resume
     */
    saveResume: async (userId: string, data: ParsedCV, token?: string) => {
        const client = token ? createClerkSupabaseClient(token) : supabase;

        const { error } = await client
            .from('resumes')
            .upsert({
                user_id: userId,
                content: data,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error saving resume:', error);
            throw error;
        }
    },

    /**
     * Get a user's resume
     */
    getResume: async (userId: string, token?: string): Promise<ParsedCV | null> => {
        const client = token ? createClerkSupabaseClient(token) : supabase;

        const { data, error } = await client
            .from('resumes')
            .select('content')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No resume found
            }
            console.error('Error fetching resume:', error);
            return null;
        }

        return data?.content as ParsedCV;
    },

    /**
     * Delete a user's resume (optional, for re-upload if we want to clear it)
     */
    deleteResume: async (userId: string, token?: string) => {
        const client = token ? createClerkSupabaseClient(token) : supabase;

        const { error } = await client
            .from('resumes')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting resume:', error);
            throw error;
        }
    }
};
