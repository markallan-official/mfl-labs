import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/v1/auth/signup - Request account access
router.post('/signup', async (req: Request, res: Response) => {
    const { email, password, full_name, requested_role } = req.body;

    try {
        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Missing required fields: email, password, full_name' });
        }

        console.log('[SIGNUP] Attempt for email:', email);

        // Check if a profile exists for this email
        const { data: existingProfile } = await supabase!
            .from('profiles')
            .select('id, approved, role')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (existingProfile) {
            console.log('[SIGNUP] Existing profile found:', existingProfile.id, 'approved:', existingProfile.approved);
            // Always return 200 — never block re-registration attempts
            return res.status(200).json({
                success: true,
                message: existingProfile.approved
                    ? 'This email already has an approved account. Please login instead.'
                    : 'Your request is already being reviewed by an administrator.'
            });
        }

        // Attempt to create user in Supabase Auth
        const { data: signUpData, error: signUpErr } = await supabase!.auth.signUp({
            email: email.toLowerCase().trim(),
            password,
            options: {
                data: { full_name, requested_role: requested_role || 'user' },
                emailRedirectTo: `${process.env.FRONTEND_URL || 'https://mfl-labs.vercel.app'}/login`
            }
        });

        if (signUpErr) {
            console.error('[SIGNUP] Supabase Auth error:', signUpErr.message);
            // If Supabase says "already registered", return success anyway
            // (rate-limit or existing-but-deleted user scenario)
            if (
                signUpErr.message.toLowerCase().includes('already registered') ||
                signUpErr.message.toLowerCase().includes('already been registered') ||
                signUpErr.message.toLowerCase().includes('user already exists') ||
                signUpErr.message.toLowerCase().includes('email rate limit')
            ) {
                return res.status(200).json({
                    success: true,
                    message: 'Request received. An administrator will review your application shortly.'
                });
            }
            throw signUpErr;
        }

        if (!signUpData.user) {
            return res.status(500).json({ error: 'Signup failed: no user returned' });
        }

        console.log('[SIGNUP] User created in Auth:', signUpData.user.id);

        // Manually ensure profile exists (trigger should handle this, but belt-and-suspenders)
        const isSuperAdmin = email.toLowerCase().trim() === 'markmallan01@gmail.com';
        const { error: profileErr } = await supabase!
            .from('profiles')
            .upsert({
                id: signUpData.user.id,
                email: email.toLowerCase().trim(),
                role: isSuperAdmin ? 'super_admin' : 'pending',
                approved: isSuperAdmin
            }, { onConflict: 'id' });

        if (profileErr) {
            console.warn('[SIGNUP] Profile upsert warning (trigger may have handled it):', profileErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Signup request submitted. Please check your email to confirm, then await admin approval.',
            user: {
                id: signUpData.user.id,
                email: signUpData.user.email,
                full_name
            }
        });
    } catch (error: any) {
        console.error('[SIGNUP] Unexpected error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// POST /api/v1/auth/login - Authenticate user
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        console.log('[LOGIN] Attempt for email:', email);

        const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password
        });

        if (authError) {
            console.error('[LOGIN] Auth error:', authError.message);
            throw authError;
        }
        if (!authData.user) throw new Error('Authentication failed: no user returned');

        const isSuperByEmail = authData.user.email?.toLowerCase() === 'markmallan01@gmail.com';
        console.log('[LOGIN] Auth success for:', authData.user.id, 'isSuper:', isSuperByEmail);

        // Fetch profile
        let { data: profile, error: profileError } = await supabase!
            .from('profiles')
            .select('id, email, role, approved')
            .eq('id', authData.user.id)
            .single();

        if ((profileError || !profile) && isSuperByEmail) {
            // Auto-create super admin profile if missing
            const { data: created } = await supabase!
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: authData.user.email,
                    role: 'super_admin',
                    approved: true
                }, { onConflict: 'id' })
                .select()
                .single();
            profile = created;
        }

        if (!profile && !isSuperByEmail) {
            console.error('[LOGIN] No profile found for user:', authData.user.id);
            return res.status(403).json({
                error: 'Profile not found',
                message: 'Your account exists but has no profile. Please contact support.'
            });
        }

        const finalProfile = profile || {
            id: authData.user.id,
            email: authData.user.email,
            role: 'super_admin',
            approved: true
        };

        if (!finalProfile.approved && !isSuperByEmail) {
            return res.status(403).json({
                error: 'Account not approved',
                message: 'Your account is pending administrator approval.'
            });
        }

        console.log('[LOGIN] Success for:', finalProfile.id, 'role:', finalProfile.role);

        res.json({
            success: true,
            user: finalProfile,
            session: authData.session,
            access_token: authData.session?.access_token
        });
    } catch (error: any) {
        console.error('[LOGIN] Unexpected error:', error.message);
        res.status(401).json({ error: error.message });
    }
});

// POST /api/v1/auth/logout - Logout user
router.post('/logout', async (req: Request, res: Response) => {
    try {
        await supabase!.auth.signOut();
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        // Always return success to allow client-side cleanup
        res.json({ success: true, message: 'Session cleared' });
    }
});

// GET /api/v1/auth/me - Get current user
router.get('/me', authMiddleware, async (req: any, res: Response) => {
    try {
        res.json({ user: req.user });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// POST /api/v1/auth/confirm - Auto-approve after email confirmation
router.post('/confirm', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token' });
        }
        const token = authHeader.substring(7);

        const { data: { user }, error } = await supabase!.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const { data: profile, error: profileError } = await supabase!
            .from('profiles')
            .select('id, email, role, approved')
            .eq('id', user.id)
            .single();

        if (profileError) {
            return res.status(500).json({ error: profileError.message });
        }

        const requestedRole = (user.user_metadata as any)?.requested_role || profile?.role || 'user';
        const isConfirmed = (user as any)?.email_confirmed_at || (user as any)?.confirmed_at || null;

        // If already approved, just return success
        if (profile?.approved) {
            return res.json({ success: true, approved: true, role: profile.role });
        }

        // Approve only if email is confirmed
        if (!isConfirmed) {
            return res.status(400).json({ error: 'Email not confirmed yet' });
        }

        const { error: updateError } = await supabase!
            .from('profiles')
            .update({ approved: true, role: requestedRole })
            .eq('id', user.id);

        if (updateError) {
            return res.status(500).json({ error: updateError.message });
        }

        return res.json({ success: true, approved: true, role: requestedRole });
    } catch (error: any) {
        console.error('[CONFIRM] Unexpected error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
