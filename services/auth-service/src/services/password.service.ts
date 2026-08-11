import argon2 from 'argon2';

// WHY: Argon2id configuration per project security specifications.
// Argon2id combines memory-hardness (64MB) and time cost (3 iterations) to resist
// both side-channel attacks and specialized GPU cracking hardware.
export class PasswordService {
  private static readonly ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 1,    // 1 thread
  } as const;

  public static async hash(password: string): Promise<string> {
    return argon2.hash(password, this.ARGON2_OPTIONS);
  }

  public static async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      // Return false on internal format errors to prevent unhandled throws
      return false;
    }
  }
}