import jwt from 'jsonwebtoken';
export declare class AuthService {
    register(email: string, password: string, role?: string): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: never;
    }>;
    login(email: string, password: string): Promise<{
        ok: boolean;
        error: string;
        token?: never;
        user?: never;
    } | {
        ok: boolean;
        token: string;
        user: {
            id: number;
            email: string;
            role: string;
        };
        error?: never;
    }>;
    generateToken(payload: {
        userId: string;
        userName: string;
        userType?: string;
        roomId?: string;
    }): string;
    verifyToken(token: string): string | jwt.JwtPayload;
}
//# sourceMappingURL=authService.d.ts.map