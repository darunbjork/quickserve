import { ClientMetadata } from 'oidc-provider';

// WHY: First-party client registry enforcing strict auth profiles per client type.
// Public clients (SPA web app, native mobile) MUST NOT hold client secrets because 
// client binaries/code can be decompiled; they strictly rely on PKCE (S256).
// Confidential clients (KDS kiosk on internal network) authenticate with credentials.
export const registeredClients: ClientMetadata[] = [
  {
    client_id: 'quickserve-web',
    client_name: 'QuickServe Web Client',
    token_endpoint_auth_method: 'none', // Public client - PKCE mandatory
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    redirect_uris: ['http://localhost:3000/callback', 'http://localhost/api/auth/callback'],
  },
  {
    client_id: 'quickserve-mobile',
    client_name: 'QuickServe Mobile App',
    token_endpoint_auth_method: 'none', // Public client - binary cannot protect secret
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    redirect_uris: ['quickserve://oauth/callback'],
  },
  {
    client_id: 'kds-kiosk',
    client_name: 'Kitchen Display System Kiosk',
    token_endpoint_auth_method: 'client_secret_basic', // Confidential client on isolated network
    client_secret: 'kds_kiosk_secret_dev_only',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    redirect_uris: ['http://localhost:3004/kds/callback'],
  },
];