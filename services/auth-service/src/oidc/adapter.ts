import { prisma } from '../db/prisma';
import { Prisma } from '@prisma/client';

interface AdapterPayload {
  grantId?: string | null;
  userCode?: string | null;
  uid?: string | null;
  consumed?: number;
  [key: string]: unknown;
}

interface Adapter {
  upsert(id: string, payload: AdapterPayload, expiresIn?: number): Promise<void>;
  find(id: string): Promise<AdapterPayload | undefined>;
  findByUserCode(userCode: string): Promise<AdapterPayload | undefined>;
  findByUid(uid: string): Promise<AdapterPayload | undefined>;
  destroy(id: string): Promise<void>;
  revokeByGrantId(grantId: string): Promise<void>;
  consume(id: string): Promise<void>;
}

// WHY: Custom storage adapter satisfying node-oidc-provider's Adapter interface.
// This routes all session state, authorization codes, and refresh tokens into auth_db.
export class PrismaOidcAdapter implements Adapter {
  private name: string;

  constructor(name: string) {
    this.name = name; // Model name passed by oidc-provider (e.g. "Grant", "AccessToken", "Session")
  }

  public async upsert(id: string, payload: AdapterPayload, expiresIn?: number): Promise<void> {
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

    // Convert AdapterPayload to Prisma Json-compatible value
    const jsonPayload = payload as unknown as Prisma.InputJsonValue;

    await prisma.oidcModel.upsert({
      where: { id },
      update: {
        payload: jsonPayload,
        grantId: payload.grantId,
        userCode: payload.userCode,
        uid: payload.uid,
        expiresAt,
        consumedAt: payload.consumed ? new Date(payload.consumed * 1000) : undefined,
      },
      create: {
        id,
        type: this.name,
        payload: jsonPayload,
        grantId: payload.grantId,
        userCode: payload.userCode,
        uid: payload.uid,
        expiresAt,
        consumedAt: payload.consumed ? new Date(payload.consumed * 1000) : undefined,
      },
    });
  }

  public async find(id: string): Promise<AdapterPayload | undefined> {
    const doc = await prisma.oidcModel.findUnique({ where: { id } });
    if (!doc || doc.type !== this.name) return undefined;
    return doc.payload as unknown as AdapterPayload;
  }

  public async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    const doc = await prisma.oidcModel.findFirst({ where: { userCode, type: this.name } });
    if (!doc) return undefined;
    return doc.payload as unknown as AdapterPayload;
  }

  public async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    const doc = await prisma.oidcModel.findUnique({ where: { uid } });
    if (!doc || doc.type !== this.name) return undefined;
    return doc.payload as unknown as AdapterPayload;
  }

  public async destroy(id: string): Promise<void> {
    await prisma.oidcModel.deleteMany({ where: { id, type: this.name } });
  }

  public async revokeByGrantId(grantId: string): Promise<void> {
    await prisma.oidcModel.deleteMany({ where: { grantId } });
  }

  public async consume(id: string): Promise<void> {
    await prisma.oidcModel.updateMany({
      where: { id, type: this.name },
      data: { consumedAt: new Date() },
    });
  }
}