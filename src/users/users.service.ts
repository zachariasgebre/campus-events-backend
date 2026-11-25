import { Injectable } from '@nestjs/common';
import { User } from './user.model';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];
  private nextId = 1;

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  findById(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  create(email: string, passwordHash: string): User | undefined {
    if (this.findByEmail(email)) return undefined;
    const user: User = {
      id: this.nextId++,
      email,
      passwordHash,
      refreshHash: null,
      roles: ['student'],
    };
    this.users.push(user);
    return user;
  }

  replaceRefreshHash(id: number, expectedHash: string, nextHash: string): boolean {
    const user = this.findById(id);
    if (!user || user.refreshHash !== expectedHash) return false;
    user.refreshHash = nextHash;
    return true;
  }

  clearRefreshHash(id: number): boolean {
    const user = this.findById(id);
    if (!user) return false;
    user.refreshHash = null;
    return true;
  }
}
