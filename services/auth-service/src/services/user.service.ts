import { UserRepository } from '../repositories/user.repository.js';
import { PasswordService } from '../services/password.service.js';
import { AppError } from '@quickserve/shared-utils';
import { ErrorCode } from '@quickserve/shared-types';
import { User, UserRole } from '../generated/prisma-client';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public async registerUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<User> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('Email address already registered', 409, ErrorCode.VALIDATION_ERROR);
    }

    const passwordHash = await PasswordService.hash(data.password);
    return this.userRepository.createUser({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    });
  }

  public async authenticateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401, ErrorCode.UNAUTHORIZED);
    }

    const isValid = await PasswordService.verify(user.passwordHash, password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, ErrorCode.UNAUTHORIZED);
    }

    return user;
  }
}