import argon2 from 'argon2';

export class PasswordService {
  private static readonly ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,       
    parallelism: 1,    
  } as const;

  public static async hash(password: string): Promise<string> {
    return argon2.hash(password, this.ARGON2_OPTIONS);
  }

  public static async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}