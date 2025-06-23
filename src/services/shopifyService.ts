import {createAdminApiClient} from '@shopify/admin-api-client';

const shopifyClient = createAdminApiClient({
    storeDomain: process.env.SHOPIFY_API_STORE_NAME ?? 'https://store.myshopify.com',
    apiVersion: process.env.SHOPIFY_API_VERSION ?? '2025-04',
    accessToken: process.env.SHOPIFY_API_ACCESS_TOKEN ?? '123',
});

export default shopifyClient;