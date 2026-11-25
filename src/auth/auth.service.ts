import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PublicUser, User } from '../users/user.model';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_REFRESH = 'Invalid or expired refresh token';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    if (this.users.findByEmail(email)) throw new ConflictException('Email is already registered');

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = this.users.create(email, passwordHash);
    if (!user) throw new ConflictException('Email is already registered');
    return this.toPublicUser(user);
  }

  async login(email: string, password: string) {
    const user = this.users.findByEmail(email.trim().toLowerCase());
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const tokens = await this.createTokenPair(user);
    user.refreshHash = await argon2.hash(tokens.refreshToken, { type: argon2.argon2id });
    return { user: this.toPublicUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload: { sub?: number };
    try {
      payload = await this.jwt.verifyAsync<{ sub?: number }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    if (!Number.isInteger(payload.sub)) throw new UnauthorizedException(INVALID_REFRESH);
    const user = this.users.findById(payload.sub!);
    const currentHash = user?.refreshHash;
    if (!user || !currentHash) throw new UnauthorizedException(INVALID_REFRESH);

    let matches = false;
    try {
      matches = await argon2.verify(currentHash, refreshToken);
    } catch {
      matches = false;
    }
    if (!matches) throw new UnauthorizedException(INVALID_REFRESH);

    const tokens = await this.createTokenPair(user);
    const nextHash = await argon2.hash(tokens.refreshToken, { type: argon2.argon2id });
    if (!this.users.replaceRefreshHash(user.id, currentHash, nextHash)) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }
    return { user: this.toPublicUser(user), ...tokens };
  }

  logout(userId: number) {
    if (!this.users.clearRefreshHash(userId)) throw new UnauthorizedException();
    return { message: 'Logged out. Existing access tokens remain valid until they expire.' };
  }

  private async createTokenPair(user: User) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, roles: user.roles },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
        algorithm: 'HS256',
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
        algorithm: 'HS256',
      },
    );
    return { accessToken, refreshToken };
  }

  private toPublicUser(user: User): PublicUser {
    return { id: user.id, email: user.email, roles: [...user.roles] };
  }
}
