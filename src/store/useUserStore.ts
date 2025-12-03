import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
    credits: number;
    useCredit: (amount: number) => boolean;
    addCredits: (amount: number) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            credits: 10000, // Initial state: 10000 credits (Unlimited for User)

            useCredit: (amount: number) => {
                const currentCredits = get().credits;
                if (currentCredits >= amount) {
                    set({ credits: currentCredits - amount });
                    return true; // Success
                }
                return false; // Insufficient credits
            },

            addCredits: (amount: number) => {
                set((state) => ({ credits: state.credits + amount }));
            },
        }),
        {
            name: 'user-storage', // unique name for localStorage key
        }
    )
);
