import { prisma } from '../db/prisma.js';
import { Prisma } from '@prisma/client';
import { Adapter, AdapterPayload } from 'oidc-provider';

export class PrismaOidcAdapter implements Adapter {
  private name: string;

  constructor(name: string) {
    this.name = name; 
  }

  public async upsert(id: string, payload: AdapterPayload, expiresIn?: number): Promise<void> {
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

    const jsonPayload = payload as unknown as Prisma.InputJsonValue;

    await prisma.oidcModel.upsert({
      where: { id },
      update: {
        payload: jsonPayload,
        grantId: payload.grantId ?? undefined,
        userCode: payload.userCode ?? undefined,
        uid: payload.uid ?? undefined,
        expiresAt,
        consumedAt: payload.consumed ? new Date(payload.consumed * 1000) : undefined,
      },
      create: {
        id,
        type: this.name,
        payload: jsonPayload,
        grantId: payload.grantId ?? undefined,
        userCode: payload.userCode ?? undefined,
        uid: payload.uid ?? undefined,
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