import { ClientMetadata } from 'oidc-provider';

export const registeredClients: ClientMetadata[] = [
  {
    client_id: 'quickserve-web',
    client_name: 'QuickServe Web Client',
    token_endpoint_auth_method: 'none', 
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    redirect_uris: ['http://localhost:3000/callback', 'http://localhost/api/auth/callback'],
  },
  {
    client_id: 'quickserve-mobile',
    client_name: 'QuickServe Mobile App',
    token_endpoint_auth_method: 'none', 
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    redirect_uris: ['quickserve://oauth/callback'],
  },
  {
    client_id: 'kds-kiosk',
    client_name: 'Kitchen Display System Kiosk',
    token_endpoint_auth_method: 'client_secret_basic',
    client_secret: 'kds_kiosk_secret_dev_only',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    redirect_uris: ['http://localhost:3004/kds/callback'],
  },
];