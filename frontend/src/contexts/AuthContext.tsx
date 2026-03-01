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
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    isAdmin: false,
    assignedWorkspace: null,
    status: null,
    signOut: async () => { },
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
        // Fetch initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            fetchUserDetails(session?.user);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // If the user just signed in or state changed, we MUST be in a loading state 
            // until fetchUserDetails finishes to prevent race condition redirects
            setLoading(true);
            setSession(session);
            setUser(session?.user ?? null);
            await fetchUserDetails(session?.user);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserDetails = async (user: User | undefined | null) => {
        if (!user) {
            setIsAdmin(false);
            setAssignedWorkspace(null);
            setStatus(null);
            setLoading(false);
            return;
        }

        // Hardcoded Super Admin check
        const isSuperAdmin = user.email?.toLowerCase() === 'markmallan01@gmail.com';
        setIsAdmin(isSuperAdmin);

        // If Super Admin, we can skip DB check for status if we want, 
        // but let's do it anyway to get any potential metadata
        try {
            const { data, error } = await supabase
                .from('users')
                .select('status')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                setStatus(data.status);
                if (data.status.startsWith('active:')) {
                    setAssignedWorkspace(data.status.split(':')[1]);
                } else if (data.status === 'active' || isSuperAdmin) {
                    setAssignedWorkspace('unassigned');
                }
            } else if (isSuperAdmin) {
                // If it's the admin but record is missing in DB yet
                setStatus('active');
                setAssignedWorkspace('unassigned');
            }
        } catch (e) {
            console.error(e);
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

    const value = {
        session,
        user,
        loading,
        isAdmin,
        assignedWorkspace,
        status,
        signOut,
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: '#050507', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#0066FF' }}>
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
                <div style={{ letterSpacing: '8px', fontWeight: 900, fontSize: '12px', color: '#FFF', textAlign: 'center' }}>
                    SYNCHRONIZING NEURAL GATEWAY
                </div>
                <div style={{ marginTop: '15px', fontSize: '9px', color: '#0066FF', opacity: 0.8, letterSpacing: '3px', fontWeight: 700 }}>
                    VERIFYING_CREDENTIALS // STANDBY
                </div>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
