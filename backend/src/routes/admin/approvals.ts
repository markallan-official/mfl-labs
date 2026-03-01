import express, { Response } from 'express';
import { AuthRequest, authMiddleware, rbacMiddleware } from '../../middlewares/auth.js';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// GET /api/v1/admin/approvals - List pending approvals
router.get('/', authMiddleware, rbacMiddleware('users:manage'), async (req: AuthRequest, res: Response) => {
    try {
        const { status = 'pending' } = req.query;

        let query = supabase!
            .from('approvals')
            .select(`
        id,
        type,
        status,
        data,
        created_at,
        requester:requester_id(id, email, full_name),
        approver:approver_id(id, full_name)
      `)
            .eq('status', status || 'pending')
            .order('created_at', { ascending: false });

        // If not super admin, filter by org
        const isSuper = req.user?.email?.toLowerCase() === 'markmallan01@gmail.com';
        if (!isSuper) {
            query = query.eq('org_id', req.user?.org_id);
        }

        const { data: approvals, error } = await query;

        if (error) throw error;

        res.json(approvals || []);
    } catch (error) {
        console.error('Get approvals error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// GET /api/v1/admin/approvals/:id - Get single approval
router.get('/:id', authMiddleware, rbacMiddleware('users:manage'), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const { data: approval, error } = await supabase!
            .from('approvals')
            .select(`
        id,
        type,
        status,
        data,
        created_at,
        requester:requester_id(id, email, full_name),
        approver:approver_id(id, full_name)
      `)
            .eq('id', id)
            .eq('org_id', req.user?.org_id)
            .single();

        if (error) throw error;

        res.json(approval);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// POST /api/v1/admin/approvals/:id/approve - Approve request
router.post('/:id/approve', authMiddleware, rbacMiddleware('users:manage'), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role_level = 'workspace_user' } = req.body;

        // Get approval
        const isSuper = req.user?.email?.toLowerCase() === 'markmallan01@gmail.com';
        const query = supabase!
            .from('approvals')
            .select('*')
            .eq('id', id);

        if (!isSuper) {
            query.eq('org_id', req.user?.org_id);
        }

        const { data: approval, error: fetchError } = await query.single();

        if (fetchError) throw fetchError;
        if (!approval) throw new Error('Approval not found');

        if (approval.type === 'user_join') {
            const { workspace = 'designer' } = req.body;
            const compositeStatus = workspace ? `active:${workspace}` : 'active';

            // Update user to active with workspace assignment
            const { error: userError } = await supabase!
                .from('users')
                .update({
                    status: compositeStatus,
                    email_verified: true
                })
                .eq('id', approval.data.user_id);

            if (userError) throw userError;

            // Get default role for level
            const { data: role, error: roleError } = await supabase!
                .from('roles')
                .select('id')
                .eq('org_id', approval.org_id)
                .eq('role_level', role_level)
                .single();

            if (roleError || !role) {
                // Use system role as fallback
                const { data: systemRole, error: sysError } = await supabase!
                    .from('roles')
                    .select('id')
                    .eq('role_level', role_level)
                    .eq('is_system', true)
                    .single();

                if (sysError || !systemRole) throw new Error('No role found');

                // Assign role
                await supabase!.from('user_roles').insert({
                    user_id: approval.data.user_id,
                    role_id: systemRole.id,
                    assigned_by: req.user?.id
                });
            } else {
                // Assign role
                await supabase!.from('user_roles').insert({
                    user_id: approval.data.user_id,
                    role_id: role.id,
                    assigned_by: req.user?.id
                });
            }

            // Grant workspace access
            const { data: workspaces, error: wsError } = await supabase!
                .from('workspaces')
                .select('id')
                .eq('org_id', approval.org_id);

            if (!wsError && workspaces) {
                const accessLevel = ['workspace_user', 'workspace_lead'].includes(role_level) ? 'editor' : 'viewer';

                for (const ws of workspaces) {
                    try {
                        await supabase!.from('workspace_access').insert({
                            workspace_id: ws.id,
                            user_id: approval.data.user_id,
                            access_level: accessLevel,
                            granted_by: req.user?.id
                        });
                    } catch (e) { } // Ignore duplicates
                }
            }
        }

        // Update approval status
        const { error: updateError } = await supabase!
            .from('approvals')
            .update({
                status: 'approved',
                approver_id: req.user?.id,
                approved_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;

        // Log audit
        try {
            await supabase!.from('audit_logs').insert({
                org_id: approval.org_id,
                user_id: req.user?.id,
                action: 'approval_approved',
                resource_type: 'approval',
                resource_id: id,
                change_summary: { type: approval.type, approved_user: approval.data.user_id }
            });
        } catch (e) { }

        res.json({
            success: true,
            message: 'Approval processed successfully'
        });
    } catch (error) {
        console.error('Approve error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// POST /api/v1/admin/approvals/:id/reject - Reject request
router.post('/:id/reject', authMiddleware, rbacMiddleware('users:manage'), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const isSuper = req.user?.email?.toLowerCase() === 'markmallan01@gmail.com';
        const query = supabase!
            .from('approvals')
            .update({
                status: 'rejected',
                approver_id: req.user?.id,
                rejection_reason: reason,
                approved_at: new Date().toISOString()
            })
            .eq('id', id);

        if (!isSuper) {
            query.eq('org_id', req.user?.org_id);
        }

        const { error } = await query;

        if (error) throw error;

        try {
            await supabase!.from('audit_logs').insert({
                org_id: req.user?.org_id,
                user_id: req.user?.id,
                action: 'approval_rejected',
                resource_type: 'approval',
                resource_id: id
            });
        } catch (e) { }

        res.json({
            success: true,
            message: 'Approval rejected'
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;


