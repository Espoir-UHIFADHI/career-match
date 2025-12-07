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

        const client = token ? createClerkSupabaseClient(token) : supabase;

        try {
            // STRATEGY 1: Direct Table Access (Faster & Bypasses potential RPC wrapping issues)
            const { data: directData, error: directError } = await client
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (!directError && directData) {
                set({ credits: directData.credits });
                return;
            }

            // STRATEGY 2: RPC Fallback (Atomic "Get or Create" logic)
            const { data, error } = await client.rpc('get_user_credits', {
                p_user_id: userId
            });

            if (error) {
                console.error("Error fetching credits:", error);
            } else {
                set({ credits: data ?? 0 });
            }
        } catch (error) {
            console.error('Error fetching credits:', error);
            set({ credits: 0 });
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
            // Call RPC to decrease credits atomically
            const { data: newBalance, error: rpcError } = await client.rpc('decrease_user_credits', {
                p_user_id: userId,
                p_amount: amount
            });

            if (rpcError) {
                console.error("Error decreasing credits (RPC):", rpcError);
                return { success: false, error: rpcError.message || "update_error" };
            }

            // Update local state on success
            set({ credits: newBalance });
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
