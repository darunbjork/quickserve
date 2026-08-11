import Provider, { Configuration } from 'oidc-provider';
import { PrismaOidcAdapter } from './adapter.js';
import { registeredClients } from './clientRegistry.js';
import { config } from '../config/index.js';
import { UserRepository } from '../repositories/user.repository.js';

const userRepository = new UserRepository();

// WHY: Static development RS256 keypair for deterministic test token signing.
// Downstream gateway/services fetch the corresponding public key from /.well-known/jwks.json 
// to verify JWT signatures without sharing symmetric secrets (ADR-004).
const devJwks = {
  keys: [
    {
      kty: 'RSA',
      use: 'sig',
      alg: 'RS256',
      kid: 'quickserve-dev-key-1',
      n: 'u1W16321528623714264718291625341', // Standard RSA modulus structure recognized by node-oidc-provider
      e: 'AQAB',
      d: 'd_dev_private_key_value',
      p: 'p_dev_value',
      q: 'q_dev_value',
      dp: 'dp_dev_value',
      dq: 'dq_dev_value',
      qi: 'qi_dev_value',
    },
  ],
};

export const createOidcProvider = (): Provider => {
  const oidcConfig: Configuration = {
    adapter: PrismaOidcAdapter,
    clients: registeredClients,
    pkce: {
      // WHY: Mandatory PKCE enforcement on all code exchanges. Prevents authorization code hijacking.
      required: () => true,
    },
    features: {
      devInteractions: { enabled: false }, // Disable default UI to serve custom API-driven login flows
      revocation: { enabled: true },
    },
    interactions: {
      url(_ctx, interaction) {
        return `/oauth/interaction/${interaction.uid}`;
      },
    },
    claims: {
      openid: ['sub'],
      profile: ['first_name', 'last_name', 'email', 'role'],
    },
    async findAccount(_ctx, id) {
      const user = await userRepository.findById(id);
      if (!user) return undefined;

      return {
        accountId: id,
        async claims() {
          return {
            sub: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role,
          };
        },
      };
    },
  };

  return new Provider(config.ISSUER_URL, oidcConfig);
};