import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../services/supabase';

export function DebugCredits() {
    const { user, isSignedIn } = useUser();
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    useEffect(() => {
        if (!isSignedIn || !user) return;

        const checkProfile = async () => {
            addLog(`Checking profile for user: ${user.id}`);

            // 1. Try to select
            const { data, error: selectError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (selectError) {
                addLog(`Select Error: ${selectError.message} (${selectError.code})`);

                if (selectError.code === 'PGRST116') {
                    addLog("Profile not found. Attempting to create...");

                    // 2. Try to insert
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert([{ id: user.id, credits: 5 }]);

                    if (insertError) {
                        addLog(`Insert Error: ${insertError.message} (${insertError.code})`);
                        addLog("POSSIBLE CAUSE: RLS Policy. Supabase doesn't know you are this user.");
                    } else {
                        addLog("Insert Success! Profile created.");
                    }
                }
            } else {
                addLog(`Profile found! Credits: ${data.credits}`);
            }
        };

        checkProfile();
    }, [isSignedIn, user]);

    if (!isSignedIn) return null;

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-black/90 text-green-400 p-4 rounded-lg font-mono text-xs shadow-xl z-[100] max-h-96 overflow-auto border border-green-500/30">
            <h3 className="font-bold border-b border-green-500/30 mb-2 pb-1">Supabase Debugger</h3>
            {logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
            ))}
        </div>
    );
}
