declare global {
    interface Window {
        clarity: (command: string, ...args: any[]) => void;
    }
}

export function trackEvent(eventName: string, details?: Record<string, any>) {
    if (window.clarity) {
        // Clarity expects "event" as the first argument, then the event name
        // It doesn't natively support a details object in the same way as others for custom tags in the same call traditionally,
        // but custom labels/tags can be set via "set".
        // However, for simple custom events: clarity("event", "EventName")
        // If you need key-value pairs, Clarity uses 'set', or upgrade" events.
        // For this specific request, we follow the prompt's instruction:
        // window.clarity("event", eventName, details);

        // Note: Clarity's API for "event" is strictly clarity("event", "name"). 
        // Passing an object might not rely do anything in standard Clarity, but we will pass it as the user requested
        // or maybe they map it on the backend.
        // To be safe and useful, we can also try to set tags if details exist.

        window.clarity("event", eventName);

        if (details) {
            // Attempt to log details as tags if possible, or just ignore if Clarity doesn't support it directly in this call
            // But strictly following the USER PROMPT example:
            // window.clarity("event", eventName, details);
            window.clarity("event", eventName, details);
        }
    } else {
        if (import.meta.env.DEV) {
            console.log(`[Analytics] ${eventName}`, details);
        }
    }
}
