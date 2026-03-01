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
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Check if this is the super admin by email from Auth
        const isSuperByEmail = user.email?.toLowerCase() === 'markmallan01@gmail.com';

        // Fetch user data from database
        const { data: userData, error: userError } = await supabase!
            .from('users')
            .select('id, email, full_name, org_id, status')
            .eq('id', user.id)
            .single();

        if ((userError || !userData) && !isSuperByEmail) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Prepare request user object
        const finalUserData = userData || {
            id: user.id,
            email: user.email,
            full_name: 'Super Admin',
            status: 'active',
            org_id: null
        };

        // Check if user is active - Always allow super admin
        const isSuper = finalUserData.email?.toLowerCase() === 'markmallan01@gmail.com';
        if (!isSuper && (!finalUserData.status || !finalUserData.status.startsWith('active'))) {
            return res.status(403).json({ error: 'User account is not active' });
        }

        req.user = finalUserData;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Check user has required role/permission
export const rbacMiddleware = (requiredPermission: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            // Fetch user roles and check permissions
            const { data: userRoles, error } = await supabase!
                .from('user_roles')
                .select(`
          role_id,
          roles!inner(permissions)
        `)
                .eq('user_id', req.user.id);

            if (error) throw error;

            // Super Admin Bypass
            const isSuper = req.user.email?.toLowerCase() === 'markmallan01@gmail.com';
            if (isSuper) {
                return next();
            }

            // Check if user has the required permission
            const hasPermission = userRoles?.some((ur: any) => {
                const permissions = ur.roles?.permissions || {};
                return permissions[requiredPermission] === true || permissions['*'] === true;
            });

            if (!hasPermission) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            next();
        } catch (error) {
            console.error('RBAC middleware error:', error);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

// Check user has access to workspace
export const workspaceAccessMiddleware = (workspaceType: string, minLevel?: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            // find workspace of type
            const { data: workspace, error: wsError } = await supabase!
                .from('workspaces')
                .select('id')
                .eq('org_id', req.user.org_id)
                .eq('type', workspaceType)
                .single();

            if (wsError || !workspace) {
                return res.status(404).json({ error: 'Workspace not found' });
            }

            // Check access level
            const { data: access, error: accessError } = await supabase!
                .from('workspace_access')
                .select('access_level')
                .eq('workspace_id', workspace.id)
                .eq('user_id', req.user.id)
                .single();

            if (accessError || !access) {
                return res.status(403).json({ error: 'No workspace access' });
            }

            // Check minimum level if specified
            const levels = ['viewer', 'editor', 'manager', 'admin'];
            if (minLevel) {
                const currentIndex = levels.indexOf(access.access_level);
                const requiredIndex = levels.indexOf(minLevel);
                if (currentIndex < requiredIndex) {
                    return res.status(403).json({ error: 'Insufficient workspace permissions' });
                }
            }

            req.workspace = { id: workspace.id, type: workspaceType };
            next();
        } catch (error) {
            console.error('Workspace access middleware error:', error);
            res.status(500).json({ error: 'Workspace access check failed' });
        }
    };
};
