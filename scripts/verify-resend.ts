
import fs from 'fs';
import path from 'path';

async function verify() {
    try {
        // 1. Read API Key manually to avoid dependency issues
        // Use the known absolute path from the user's workspace
        const envPath = "c:\\Users\\espoi\\Desktop\\ADOUWEKONOU\\MICRO USINE SAAS\\Career Match\\career-match\\.env";
        if (!fs.existsSync(envPath)) {
            console.error("❌ .env file not found at " + envPath);
            return;
        }
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/RESEND_API_KEY=(.+)/);
        const apiKey = match ? match[1].trim() : null;

        if (!apiKey) {
            console.error("❌ RESEND_API_KEY not found in .env");
            return;
        }

        console.log("Found API Key, connecting to Resend...");

        // 2. Find Audience
        const audRes = await fetch("https://api.resend.com/audiences", {
            headers: { Authorization: `Bearer ${apiKey}` }
        });

        if (!audRes.ok) throw new Error(await audRes.text());
        const audData = await audRes.json();
        const output = audData.data || audData; // Handle potentially different structure

        const audience = output.find((a: any) => a.name === "Career Match Users");

        if (!audience) {
            console.error("❌ Audience 'Career Match Users' not found.");
            return;
        }

        const audienceId = audience.id;
        console.log(`Audience found: ${audience.name} (${audienceId})`);

        // 3. Find Contact
        // Resend API: POST /audiences/:id/contacts/list (search not always easy/available on list endpoint depending on version)
        // Check docs: resend.com/docs/api-reference/contacts/list-contacts -- only supports list
        // But we can iterate or use the 'get' endpoint if we have ID. We don't have ID handy in script.
        // Actually we can list and find.

        console.log("Fetching contacts...");
        const contactsRes = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });

        if (!contactsRes.ok) throw new Error(await contactsRes.text());
        const contactsData = await contactsRes.json();
        const contacts = contactsData.data || [];

        const targetEmail = "adouwekonouespoir01@gmail.com";
        const contact = contacts.find((c: any) => c.email === targetEmail);

        if (contact) {
            console.log("\n✅ Contact Found!");
            console.log("------------------------------------------------");
            // Fetch full details just in case 'list' provides a summary
            const fullContactRes = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts/${contact.id}`, {
                headers: { Authorization: `Bearer ${apiKey}` }
            });
            const fullContact = await fullContactRes.json();

            console.log("Email:", fullContact.email);
            console.log("Created At:", fullContact.created_at);
            console.log("\n👇 CUSTOM DATA (Ce qu'on cherche) 👇");
            console.dir(fullContact.data || {}, { depth: null, colors: true });
            console.log("------------------------------------------------");

            if (fullContact.data && fullContact.data.credits !== undefined) {
                console.log(`\n🎉 SUCCÈS : Les crédits sont bien là ! Valeur = ${fullContact.data.credits}`);
            } else {
                console.log("\n⚠️ ATTENTION : Champ 'credits' manquant dans 'data'.");
            }
        } else {
            console.log(`❌ Contact ${targetEmail} not found in audience.`);
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

verify();
