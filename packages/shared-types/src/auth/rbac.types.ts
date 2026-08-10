export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN'
}

export interface JwtPayload {
  sub: string; // The user ID
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}