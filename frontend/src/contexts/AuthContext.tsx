import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    assignedWorkspace: string | null;
    status: string | null;
    signOut: () => Promise<void>;
    refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    isAdmin: false,
    assignedWorkspace: null,
    status: null,
    signOut: async () => { },
    refreshAccount: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [assignedWorkspace, setAssignedWorkspace] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        // Force-clear loading after a long delay (7s) as a safety latch
        const safetyLatch = setTimeout(() => {
            if (mounted && loading) {
                console.warn('AuthContext: Safety latch triggered. Forcing loading to false.');
                setLoading(false);
            }
        }, 7000);

        console.log('AuthContext: Initializing...');

        // Unified session checker
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('AuthContext: Initial session check completed', !!session);
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    await fetchUserDetails(session?.user);
                }
            } catch (err) {
                console.error('AuthContext: Init failed', err);
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('AuthContext: State change detected:', event);
            if (mounted) {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                    await fetchUserDetails(newSession?.user);
                } else {
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyLatch);
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserDetails = async (user: User | undefined | null) => {
        if (!user) {
            console.log('AuthContext: No user to fetch details for');
            if (isAdmin || assignedWorkspace || status) {
                setIsAdmin(false);
                setAssignedWorkspace(null);
                setStatus(null);
            }
            setLoading(false);
            return;
        }

        console.log('AuthContext: Fetching DB details for', user.email);

        // Hardcoded Super Admin check
        const isSuperAdmin = user.email?.toLowerCase() === 'markmallan01@gmail.com';
        setIsAdmin(isSuperAdmin);

        try {
            const { data, error } = await supabase
                .from('users')
                .select('status')
                .eq('id', user.id)
                .single();

            if (error) {
                console.warn('AuthContext: DB fetch error', error);
                if (isSuperAdmin) {
                    setStatus('active');
                    setAssignedWorkspace('unassigned');
                }
            } else if (data) {
                console.log('AuthContext: DB Data retrieved', data.status);
                // For Super Admin, we force 'active' to ensure they can manage the platform
                if (isSuperAdmin) {
                    setStatus('active');
                    setAssignedWorkspace('unassigned');
                } else {
                    setStatus(data.status);
                    if (data.status.startsWith('active:')) {
                        setAssignedWorkspace(data.status.split(':')[1]);
                    } else if (data.status === 'active') {
                        setAssignedWorkspace('unassigned');
                    }
                }
            } else if (isSuperAdmin) {
                // If no record but is super admin
                setStatus('active');
                setAssignedWorkspace('unassigned');
            }
        } catch (e) {
            console.error('AuthContext: Unexpected detail fetch error', e);
            if (isSuperAdmin) {
                setStatus('active');
                setAssignedWorkspace('unassigned');
            }
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const handleHardReset = async () => {
        localStorage.clear();
        await supabase.auth.signOut();
        window.location.reload();
    };

    const value = {
        session,
        user,
        loading,
        isAdmin,
        assignedWorkspace,
        status,
        signOut,
        refreshAccount: async () => await fetchUserDetails(user),
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: '#050507', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#0066FF', textAlign: 'center', padding: '20px' }}>
                <div
                    style={{
                        width: '50px',
                        height: '55px',
                        backgroundColor: '#0066FF',
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
                    onClick={handleHardReset}
                    style={{
                        marginTop: '40px',
                        backgroundColor: 'transparent',
                        color: 'rgba(255,255,255,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '8px 16px',
                        fontSize: '9px',
                        cursor: 'pointer',
                        letterSpacing: '2px'
                    }}
                >
                    FORCE SESSION RESET
                </button>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
