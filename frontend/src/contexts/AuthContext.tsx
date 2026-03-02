import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    status: string | null;
    role: string | null;
    signOut: () => Promise<void>;
    refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    isAdmin: false,
    status: null,
    role: null,
    signOut: async () => { },
    refreshAccount: async () => { },
});

export const useAuth = () => useContext(AuthContext);

// Helper to fully reset state
const INITIAL_STATE = {
    session: null as Session | null,
    user: null as User | null,
    isAdmin: false,
    status: null as string | null,
    role: null as string | null,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);

    const resetState = useCallback(() => {
        console.log('[AUTH] Resetting auth state');
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setStatus(null);
        setRole(null);
    }, []);

    const fetchUserDetails = useCallback(async (currentUser: User | undefined | null) => {
        if (!currentUser) {
            resetState();
            setLoading(false);
            return;
        }

        console.log('[AUTH] Fetching profile for:', currentUser.email);
        const isSuperAdmin = currentUser.email?.toLowerCase() === 'markmallan01@gmail.com';
        setIsAdmin(isSuperAdmin);

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role, approved')
                .eq('id', currentUser.id)
                .single();

            if (error || !profile) {
                console.warn('[AUTH] Profile fetch failed:', error?.message);
                if (isSuperAdmin) {
                    setStatus('active');
                    setRole('super_admin');
                } else {
                    setStatus('pending');
                    setRole('pending');
                }
            } else {
                console.log('[AUTH] Profile loaded — approved:', profile.approved, 'role:', profile.role);
                setStatus(profile.approved ? 'active' : 'pending');
                setRole(profile.role);
                // Grant admin if role from profile indicates admin
                if (profile.role === 'admin' || profile.role === 'super_admin' || isSuperAdmin) {
                    setIsAdmin(true);
                }
            }
        } catch (e) {
            console.error('[AUTH] Unexpected profile fetch error:', e);
            if (isSuperAdmin) {
                setStatus('active');
                setRole('super_admin');
            }
        } finally {
            setLoading(false);
        }
    }, [resetState]);

    useEffect(() => {
        let mounted = true;

        // Safety timeout — never stay loading more than 8 seconds
        const safetyLatch = setTimeout(() => {
            if (mounted) {
                console.warn('[AUTH] Safety latch triggered — forcing loading=false');
                setLoading(false);
            }
        }, 8000);

        const initAuth = async () => {
            try {
                // Ensure code exchange for email magic links before reading session
                const url = new URL(window.location.href);
                if (url.searchParams.get('code')) {
                    try {
                        await supabase.auth.exchangeCodeForSession(window.location.href);
                        // Clean up URL params to avoid re-exchange
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } catch (ex) {
                        console.warn('[AUTH] exchangeCodeForSession failed:', ex);
                    }
                }
                const { data: { session: existingSession } } = await supabase.auth.getSession();
                console.log('[AUTH] Initial session:', existingSession ? '✅ Found' : '❌ None');
                if (mounted) {
                    setSession(existingSession);
                    setUser(existingSession?.user ?? null);
                    await fetchUserDetails(existingSession?.user);
                }
            } catch (err) {
                console.error('[AUTH] Init error:', err);
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('[AUTH] State change:', event);
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
                resetState();
                setLoading(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                await fetchUserDetails(newSession?.user);
                try {
                    // Attempt auto-approve after email confirmation
                    const token = newSession?.access_token;
                    if (token) {
                        await fetch('/api/v1/auth/confirm', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        // Refresh profile after potential approval
                        await fetchUserDetails(newSession?.user);
                    }
                } catch (e) {
                    console.warn('[AUTH] Auto-approve failed or not needed');
                }
            } else {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyLatch);
            subscription.unsubscribe();
        };
    }, [fetchUserDetails, resetState]);

    // Proper signOut: clear Supabase session, reset state, redirect
    const signOut = useCallback(async () => {
        console.log('[AUTH] Signing out...');
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn('[AUTH] signOut error (ignoring):', e);
        }
        // Clear any lingering localStorage keys
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('mfl-labs-auth') || key.startsWith('sb-')) {
                localStorage.removeItem(key);
            }
        });
        // Hard redirect — guarantees clean state regardless of React router state
        window.location.href = '/login';
    }, []);

    const value = {
        session,
        user,
        loading,
        isAdmin,
        status,
        role,
        signOut,
        refreshAccount: async () => {
            setLoading(true);
            await fetchUserDetails(user);
        },
    };

    if (loading) {
        return (
            <div style={{
                backgroundColor: '#050507', height: '100vh', width: '100vw',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', color: '#0066FF', textAlign: 'center', padding: '20px'
            }}>
                <div
                    style={{
                        width: '50px', height: '55px', backgroundColor: '#0066FF',
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                        marginBottom: '30px'
                    }}
                    className="hex-glow-animation"
                />
                <div style={{ letterSpacing: '8px', fontWeight: 900, fontSize: '12px', color: '#FFF' }}>
                    SYNCHRONIZING NEURAL GATEWAY
                </div>
                <div style={{ marginTop: '15px', fontSize: '9px', color: '#0066FF', opacity: 0.8, letterSpacing: '3px', fontWeight: 700 }}>
                    VERIFYING_CREDENTIALS // STANDBY
                </div>
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = '/signup';
                    }}
                    style={{
                        marginTop: '40px', backgroundColor: 'transparent',
                        color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '8px 20px', fontSize: '9px', cursor: 'pointer', letterSpacing: '2px'
                    }}
                >
                    FORCE SESSION RESET
                </button>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
