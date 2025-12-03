import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';

interface UserState {
    session: Session | null;
    credits: number;
    loading: boolean;
    setSession: (session: Session | null) => void;
    fetchCredits: () => Promise<void>;
    useCredit: (amount: number) => Promise<boolean>;
    addCredits: (amount: number) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
    session: null,
    credits: 0, // Default to 0, will load from DB
    loading: false,

    setSession: (session) => {
        set({ session });
        if (session) {
            get().fetchCredits();
        } else {
            set({ credits: 0 });
        }
    },

    fetchCredits: async () => {
        const { session } = get();
        if (!session?.user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;
            set({ credits: data?.credits ?? 0 });
        } catch (error) {
            console.error('Error fetching credits:', error);
        }
    },

    useCredit: async (amount: number) => {
        const { session, credits } = get();

        // Admin bypass
        if (session?.user?.email === "espoiradouwekonou20@gmail.com") {
            return true;
        }

        // Optimistic check
        if (credits < amount) return false;

        if (!session?.user) {
            // Fallback for non-logged in users (if we want to allow them limited usage? 
            // For now, let's enforce login for credit usage as per plan, 
            // OR we could keep local storage for guests? 
            // The prompt says "Passer du localStorage à une vraie base de données", 
            // implying we move fully. But maybe we should handle the "not logged in" case gracefully.
            // For this strict migration, let's assume they must be logged in or we return false.
            // However, to not break flow completely if they are just testing, maybe we prompt login.
            return false;
        }

        try {
            const { error } = await supabase.rpc('spend_credits', { amount });
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
}));

