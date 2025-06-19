import {createAdminApiClient} from '@shopify/admin-api-client';

const shopifyClient = createAdminApiClient({
    storeDomain: process.env.SHOPIFY_API_STORE_NAME,
    apiVersion: process.env.SHOPIFY_API_VERSION,
    accessToken: process.env.SHOPIFY_API_ACCESS_TOKEN,
});

export default shopifyClient;