import { prisma } from '../db/prisma.js';
import { User, UserRole } from '../generated/prisma-client';

export class UserRepository {
  public async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  public async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  public async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.CUSTOMER,
      },
    });
  }
}