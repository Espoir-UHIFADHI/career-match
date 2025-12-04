import { create } from 'zustand';
import { supabase, createClerkSupabaseClient } from '../services/supabase';

interface UserState {
    credits: number;
    loading: boolean;
    fetchCredits: (userId: string, token?: string) => Promise<void>;
    useCredit: (userId: string, amount: number, token?: string, email?: string) => Promise<{ success: boolean; error?: string }>;
    addCredits: (amount: number) => void;
    setCredits: (amount: number) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
    credits: 0,
    loading: false,

    fetchCredits: async (userId: string, token?: string) => {
        if (!userId) return;

        // Use authenticated client if token is provided, otherwise fallback to anon
        const client = token ? createClerkSupabaseClient(token) : supabase;

        try {
            const { data, error } = await client
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (error) {
                console.log("Profile check error:", error.message, error.code);

                // If profile not found (PGRST116), create it
                if (error.code === 'PGRST116') {
                    console.log("Creating new profile for user:", userId);
                    const { error: insertError } = await client
                        .from('profiles')
                        .insert([
                            { id: userId, credits: 20 } // Default to 20 credits
                        ]);

                    if (insertError) {
                        console.error("Error creating profile:", insertError);
                        set({ credits: 0 });
                    } else {
                        console.log("Profile created successfully with 20 credits");
                        set({ credits: 20 });
                    }
                } else {
                    set({ credits: 0 });
                }
            } else {
                set({ credits: data?.credits ?? 0 });
            }
        } catch (error) {
            console.error('Error fetching credits:', error);
        }
    },

    useCredit: async (userId: string, amount: number, token?: string, email?: string) => {
        // Admin Bypass
        if (email === 'espoiradouwekonou20@gmail.com') {
            console.log("Admin bypass: Unlimited credits for", email);
            return { success: true };
        }

        const { credits } = get();

        if (credits < amount) return { success: false, error: "insufficient_funds_local" };
        if (!userId) return { success: false, error: "no_user" };

        // Use authenticated client if token is provided
        const client = token ? createClerkSupabaseClient(token) : supabase;

        try {
            // DIRECT UPDATE: Bypass RPC to avoid potential type mismatch issues
            // We first verify we have enough credits (double check)
            const { data: currentProfile, error: fetchError } = await client
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (fetchError || !currentProfile) {
                console.error("Error fetching current credits:", fetchError);
                return { success: false, error: "fetch_error" };
            }

            if (currentProfile.credits < amount) {
                console.warn("Not enough credits on server side");
                // Sync local state
                set({ credits: currentProfile.credits });
                return { success: false, error: "insufficient_funds_server" };
            }

            // Perform the update
            // Using upsert (POST) instead of update (PATCH) to avoid CORS issues with PATCH method
            const { error: updateError } = await client
                .from('profiles')
                .upsert({ id: userId, credits: currentProfile.credits - amount });

            if (updateError) {
                console.error("Error updating credits:", updateError);
                return { success: false, error: "update_error" };
            }

            // Update local state on success
            set((state) => ({ credits: state.credits - amount }));
            return { success: true };
        } catch (error) {
            console.error('Error spending credits:', error);
            return { success: false, error: "exception" };
        }
    },

    addCredits: (amount: number) => {
        set((state) => ({ credits: state.credits + amount }));
    },

    setCredits: (amount: number) => {
        set({ credits: amount });
    }
}));
