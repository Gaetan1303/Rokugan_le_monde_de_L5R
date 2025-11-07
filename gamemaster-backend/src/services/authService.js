import { User } from '../models/User.js';
import { AppDataSource } from '../data-source.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_STRONG_SECRET_KEY_MIN_32_CHARS';
export class AuthService {
    async register(email, password, role = 'joueur') {
        const userRepo = AppDataSource.getRepository(User);
        const existing = await userRepo.findOneBy({ email });
        if (existing) {
            return { ok: false, error: 'Email déjà utilisé' };
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = userRepo.create({
            email,
            password: passwordHash,
            role,
        });
        await userRepo.save(user);
        return { ok: true };
    }
    async login(email, password) {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ email });
        if (!user)
            return { ok: false, error: 'Utilisateur non trouvé' };
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return { ok: false, error: 'Mot de passe incorrect' };
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        return { ok: true, token, user: { id: user.id, email: user.email, role: user.role } };
    }
    generateToken(payload) {
        const token = jwt.sign({
            id: payload.userId,
            name: payload.userName,
            type: payload.userType || 'player',
            roomId: payload.roomId || null
        }, JWT_SECRET, { expiresIn: '24h' });
        return token;
    }
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch (e) {
            throw new Error('Token invalide ou expiré');
        }
    }
}
//# sourceMappingURL=authService.js.map