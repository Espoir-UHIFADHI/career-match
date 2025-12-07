import fetch from 'node-fetch';

// CONFIGURATION
const PROJECT_REF = "hzzeoxkenxyjtpazshgp"; // From your deployment output
const FUNCTION_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/gumroad-webhook`;

// TEST DATA
// ID from your screenshot (Gumroad URL)
const TEST_USER_ID = "user_36TYc1GRrtYx6Tsn3lx8swHbb2N";
const TEST_EMAIL = "espoir.adouwekonou@uhifadhi.com";

async function testWebhook() {
    console.log(`🚀 Sending Fake Gumroad Webhook to Production...`);
    console.log(`   Target: ${FUNCTION_URL}`);
    console.log(`   User ID: ${TEST_USER_ID}`);

    const params = new URLSearchParams();
    params.append('custom_user_id', TEST_USER_ID);
    params.append('email', TEST_EMAIL);
    params.append('permalink', 'pack-booster'); // triggers 20 credits
    params.append('seller_id', 'TEST_SELLER');
    params.append('product_id', 'TEST_PRODUCT');

    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            body: params,
            // Gumroad sends x-www-form-urlencoded
        });

        const text = await response.text();

        console.log(`\n📡 Status: ${response.status}`);
        console.log(`📝 Response: ${text}`);

        if (response.status === 200) {
            console.log(`\n✅ TEST SUCCESS!`);
            console.log(`   A new profile should have been created for ID: ${TEST_USER_ID}`);
            console.log(`   Or if you used your real ID, you should have +20 credits.`);
        } else {
            console.log(`\n❌ TEST FAILED.`);
        }

    } catch (error) {
        console.error("Error sending request:", error);
    }
}

testWebhook();
