import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface UserState {
    credits: number;
    loading: boolean;
    fetchCredits: (userId: string) => Promise<void>;
    useCredit: (userId: string, amount: number) => Promise<boolean>;
    addCredits: (amount: number) => void;
    setCredits: (amount: number) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
    credits: 0,
    loading: false,

    fetchCredits: async (userId: string) => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (error) {
                // If profile doesn't exist, maybe create it? 
                // For now, just default to 0 or handle error silently
                console.log("Profile check:", error.message);
                set({ credits: 0 });
            } else {
                set({ credits: data?.credits ?? 0 });
            }
        } catch (error) {
            console.error('Error fetching credits:', error);
        }
    },

    useCredit: async (userId: string, amount: number) => {
        const { credits } = get();

        // Admin bypass
        // Note: We should probably fetch the user email from Clerk if we want to keep this check
        // For now, let's assume we pass email or handle it differently.
        // Simplified for migration:

        if (credits < amount) return false;

        if (!userId) return false;

        try {
            const { error } = await supabase.rpc('spend_credits', { amount, user_id: userId });
            if (error) throw error;

            // Update local state on success
            set((state) => ({ credits: state.credits - amount }));
            return true;
        } catch (error) {
            console.error('Error spending credits:', error);
            return false;
        }
    },

    addCredits: (amount: number) => {
        set((state) => ({ credits: state.credits + amount }));
    },

    setCredits: (amount: number) => {
        set({ credits: amount });
    }
}));

