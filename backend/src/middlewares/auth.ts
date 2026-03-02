import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export interface AuthRequest extends Request {
    user?: any;
    workspace?: any;
}

// Verify JWT token and attach user to request
export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token' });
        }

        const token = authHeader.substring(7);

        // Verify token with Supabase
        const { data: { user }, error } = await supabase!.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const isSuperByEmail = user.email?.toLowerCase() === 'markmallan01@gmail.com';

        // Fetch profile from profiles table
        const { data: profileData, error: profileError } = await supabase!
            .from('profiles')
            .select('id, email, role, approved')
            .eq('id', user.id)
            .single();

        if (profileError || !profileData) {
            // Super admin fallback if profile is somehow missing
            if (isSuperByEmail) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    full_name: 'Super Admin',
                    status: 'active',
                    approved: true,
                    role: 'super_admin'
                };
                return next();
            }
            console.error('[AUTH] Profile not found for user:', user.id, profileError);
            return res.status(401).json({ error: 'User profile not found. Please contact support.' });
        }

        req.user = {
            ...profileData,
            status: profileData.approved ? 'active' : 'pending'
        };

        // Block unapproved users (super admin always passes)
        if (!profileData.approved && !isSuperByEmail) {
            return res.status(403).json({ error: 'Account awaiting administrator approval' });
        }

        next();
    } catch (error) {
        console.error('[AUTH] Middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// FIXED: Check permissions via profile role — no user_roles table needed
export const rbacMiddleware = (requiredPermission: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            // Super Admin always has all permissions
            const isSuper =
                req.user.email?.toLowerCase() === 'markmallan01@gmail.com' ||
                req.user.role === 'super_admin';

            if (isSuper) {
                return next();
            }

            // For non-super admins, check role
            const adminRoles = ['admin', 'super_admin'];
            if (requiredPermission === 'users:manage') {
                if (!adminRoles.includes(req.user.role)) {
                    return res.status(403).json({ error: 'Admin access required' });
                }
                return next();
            }

            // For all other permissions, allow approved users through
            if (req.user.approved) {
                return next();
            }

            return res.status(403).json({ error: 'Insufficient permissions' });
        } catch (error) {
            console.error('[RBAC] Middleware error:', error);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

// Workspace access middleware (kept for compatibility)
export const workspaceAccessMiddleware = (workspaceType: string, minLevel?: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        // Super admin always has full workspace access
        const isSuper =
            req.user?.email?.toLowerCase() === 'markmallan01@gmail.com' ||
            req.user?.role === 'super_admin';

        if (isSuper) return next();

        // For approved users, allow access
        if (req.user?.approved) {
            req.workspace = { type: workspaceType };
            return next();
        }

        return res.status(403).json({ error: 'Workspace access denied' });
    };
};
