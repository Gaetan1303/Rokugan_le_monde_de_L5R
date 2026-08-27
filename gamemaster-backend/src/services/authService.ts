import bcrypt from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { AppDataSource } from '../data-source.js';
import { User } from '../models/User.js';

const configuredSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && !configuredSecret) {
  throw new Error('JWT_SECRET doit être configuré en production.');
}

const JWT_SECRET = configuredSecret || 'development-only-secret-change-me';

export interface AuthTokenPayload extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
}

export class AuthService {
  async register(name: string, email: string, password: string, role: string = 'joueur') {
    const userRepo = AppDataSource.getRepository(User);
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await userRepo.findOneBy({ email: normalizedEmail });

    if (existing) {
      return { ok: false, error: 'Email déjà utilisé' };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = userRepo.create({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      role
    });

    await userRepo.save(user);

    return {
      ok: true,
      token: this.signAccessToken(user),
      user: this.toPublicUser(user)
    };
  }

  async login(email: string, password: string) {
    const userRepo = AppDataSource.getRepository(User);
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepo.findOneBy({ email: normalizedEmail });

    if (!user) return { ok: false, error: 'Utilisateur non trouvé' };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { ok: false, error: 'Mot de passe incorrect' };

    return {
      ok: true,
      token: this.signAccessToken(user),
      user: this.toPublicUser(user)
    };
  }

  generateToken(payload: { userId: string; userName: string; userType?: string; roomId?: string }) {
    return jwt.sign(
      {
        id: payload.userId,
        name: payload.userName,
        role: payload.userType === 'gm' ? 'GM' : 'joueur',
        roomId: payload.roomId || null
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token: string): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (typeof decoded === 'string' || !decoded.id) {
        throw new Error('Payload JWT invalide');
      }
      return decoded as AuthTokenPayload;
    } catch {
      throw new Error('Token invalide ou expiré');
    }
  }

  private signAccessToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
}
