# Prisma Configuration Issue

## Issue
The Prisma schema initially used a datasource URL directly inside the schema file:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("AUTH_DATABASE_URL")
}
```

With the newer Prisma setup, this pattern is no longer supported in the schema file for the datasource configuration.

## Root Cause
Prisma 7+ expects the datasource connection settings to be provided through a Prisma config file instead of the schema file.

## Solution
The schema was updated to remove the `url` property from the datasource block, and a new Prisma config file was added:

- [services/auth-service/prisma/schema.prisma](services/auth-service/prisma/schema.prisma)
- [services/auth-service/prisma.config.ts](services/auth-service/prisma.config.ts)

This keeps the schema valid and allows Prisma to use the connection URL from the environment.

## Verification
The configuration was validated successfully with:

```bash
npx prisma validate
```
