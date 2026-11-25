export interface User {
  id: number;
  email: string;
  passwordHash: string;
  refreshHash: string | null;
  roles: string[];
}

export type PublicUser = Pick<User, 'id' | 'email' | 'roles'>;
