import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sendAccessRequestEmail } from '../services/emailService.js';

const router = express.Router();

// POST /api/v1/auth/signup - Request account access
router.post('/signup', async (req: Request, res: Response) => {
    const { email, password, full_name, requested_role } = req.body;

    try {
        // Validate input
        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if profile already exists
        const { data: existingProfile } = await supabase!
            .from('profiles')
            .select('id, approved')
            .eq('email', email)
            .single();

        if (existingProfile) {
            if (existingProfile.approved) {
                return res.status(409).json({ error: 'Email already registered and approved. Please log in.' });
            } else {
                // Return 200 to acknowledge the re-request gracefully
                return res.status(200).json({
                    success: true,
                    message: 'Your request is already being reviewed. Please wait for administrator approval.'
                });
            }
        }

        // Create user in Supabase Auth
        const { data: signUpData, error: signUpErr } = await supabase!.auth.signUp({
            email,
            password,
            options: {
                data: { full_name, requested_role },
                emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:4002'}/login`
            }
        });

        if (signUpErr) {
            // Check if user already exists in Auth but not in profiles
            if (signUpErr.message.toLowerCase().includes('already registered')) {
                const { data: signInData, error: signInErr } = await supabase!.auth.signInWithPassword({
                    email,
                    password
                });

                if (signInErr) {
                    return res.status(409).json({ error: 'User already exists in Auth, but verification failed. Please check credentials.' });
                }

                // If sign-in works, we ensure the profile exists (trigger should have handled it, but let's be safe)
                await supabase!.from('profiles').upsert({
                    id: signInData.user.id,
                    email: email,
                    role: 'pending',
                    approved: email.toLowerCase() === 'markmallan01@gmail.com'
                });

                return res.status(200).json({ success: true, message: 'Account status checked. Please wait for approval.' });
            }
            throw signUpErr;
        }

        res.status(201).json({
            success: true,
            message: 'Signup request submitted. Awaiting admin approval.',
            user: {
                id: signUpData.user!.id,
                email: signUpData.user!.email,
                full_name
            }
        });
    } catch (error: any) {
        console.error('Signup error:', error);
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

        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Authentication failed');

        const isSuperByEmail = authData.user.email?.toLowerCase() === 'markmallan01@gmail.com';

        // Fetch profile
        const { data: profile, error: profileError } = await supabase!
            .from('profiles')
            .select('id, email, role, approved')
            .eq('id', authData.user.id)
            .single();

        if ((profileError || !profile) && !isSuperByEmail) {
            return res.status(401).json({ error: 'User profile not found. Please contact support.' });
        }

        const finalUser = profile || {
            id: authData.user.id,
            email: authData.user.email,
            role: 'super_admin',
            approved: true
        };

        if (!finalUser.approved && !isSuperByEmail) {
            return res.status(403).json({
                error: 'Account not approved',
                message: 'Your account is pending administrator approval.'
            });
        }

        res.json({
            success: true,
            user: finalUser,
            session: authData.session,
            access_token: authData.session?.access_token
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message });
    }
});

// POST /api/v1/auth/logout - Logout user
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { error } = await supabase!.auth.signOut();
        if (error) throw error;

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// POST /api/v1/auth/verify-email - Verify email token
router.post('/verify-email', async (req: Request, res: Response) => {
    const { token, type } = req.body;

    try {
        if (!token || !type) {
            return res.status(400).json({ error: 'Token and type required' });
        }

        const { data, error } = await supabase!.auth.verifyOtp({
            token_hash: token,
            type: type as any
        });

        if (error) throw error;

        // Update user email verified status
        if (data.user) {
            await supabase!
                .from('users')
                .update({ email_verified: true })
                .eq('id', data.user.id);
        }

        res.json({
            success: true,
            message: 'Email verified successfully',
            user: data.user
        });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
});

// POST /api/v1/auth/refresh - Refresh session token
router.post('/refresh', async (req: Request, res: Response) => {
    const { refresh_token } = req.body;

    try {
        if (!refresh_token) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const { data, error } = await supabase!.auth.refreshSession({
            refresh_token
        });

        if (error) throw error;

        res.json({
            success: true,
            session: data.session,
            access_token: data.session?.access_token
        });
    } catch (error) {
        res.status(401).json({ error: (error as Error).message });
    }
});

// GET /api/v1/auth/me - Get current user
router.get('/me', authMiddleware, async (req: any, res: Response) => {
    try {
        res.json({
            user: req.user
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;


