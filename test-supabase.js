
import { createClient } from '@supabase/supabase-js';

try {
    console.log("Attempting to create client with dummy valid URL...");
    const client = createClient("https://placeholder.supabase.co", "placeholder-key");

    console.log("Testing onAuthStateChange...");
    const { data } = client.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event);
    });

    console.log("Subscription data:", data);

    if (data && data.subscription && typeof data.subscription.unsubscribe === 'function') {
        console.log("Subscription has unsubscribe method.");
        data.subscription.unsubscribe();
    } else {
        console.error("Subscription missing or invalid structure.");
    }

} catch (error) {
    console.error("Caught error:", error.message);
}
