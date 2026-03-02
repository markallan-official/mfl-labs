import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Pending: React.FC = () => {
    const { signOut, refreshAccount, user, isAdmin, status } = useAuth();
    const [checking, setChecking] = React.useState(false);
    const navigate = useNavigate();

    const handleCheckStatus = async () => {
        setChecking(true);
        await refreshAccount();
        setChecking(false);
    };

    // If suddenly approved or admin, redirect
    React.useEffect(() => {
        if (isAdmin) {
            navigate('/admin');
        } else if (status === 'active') {
            navigate('/dashboard');
        }
    }, [isAdmin, status, navigate]);

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#050507', color: '#F5F5F5', fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#0D0D11', padding: '50px', borderRadius: '16px',
                border: '1px solid #222',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)', width: '100%', maxWidth: '500px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
                <h1 style={{ color: '#0066FF', fontSize: '28px', marginBottom: '16px', fontWeight: 900, letterSpacing: '1px' }}>
                    PENDING_APPROVAL
                </h1>
                <p style={{ color: '#888', lineHeight: 1.6, marginBottom: '10px', fontSize: '14px' }}>
                    Your account request for <strong style={{ color: '#FFF' }}>MFL LABS</strong> has been received.
                    An administrator will review your request.
                </p>
                {user?.email && (
                    <p style={{ color: '#0066FF', fontFamily: 'monospace', fontSize: '12px', marginBottom: '30px' }}>
                        {user.email}
                    </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button
                        onClick={handleCheckStatus}
                        disabled={checking}
                        style={{
                            padding: '16px 24px', borderRadius: '8px', border: 'none',
                            backgroundColor: '#0066FF', color: 'white', fontSize: '14px', fontWeight: 900,
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0, 102, 255, 0.3)',
                            letterSpacing: '1px', opacity: checking ? 0.7 : 1
                        }}
                    >
                        {checking ? 'SYNCHRONIZING...' : 'CHECK_APPROVAL_STATUS'}
                    </button>

                    <button
                        onClick={() => signOut()} // signOut auto-redirects to /signup
                        style={{
                            padding: '12px 24px', borderRadius: '8px', border: '1px solid #333',
                            backgroundColor: 'transparent', color: '#666', fontSize: '12px', fontWeight: 800,
                            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px'
                        }}
                    >
                        DISCONNECT / RETURN TO SIGNUP
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pending;
