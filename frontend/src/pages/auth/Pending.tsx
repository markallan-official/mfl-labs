import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Pending: React.FC = () => {
    const { signOut, refreshAccount, user } = useAuth();
    const [checking, setChecking] = React.useState(false);
    const navigate = useNavigate();

    const handleCheckStatus = async () => {
        setChecking(true);
        await refreshAccount();
        setChecking(false);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    // If suddenly active, redirect
    React.useEffect(() => {
        if (user?.email?.toLowerCase() === 'markmallan01@gmail.com') {
            navigate('/admin');
        }
    }, [user, navigate]);

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
                <p style={{ color: '#888', lineHeight: 1.6, marginBottom: '30px', fontSize: '14px' }}>
                    Your account request for <strong style={{ color: '#FFF' }}>MFL LABS</strong> has been received, but it requires administrator approval before you can access the platform.
                    <br /><br />
                    You will be notified once an administrator has reviewed your request.
                </p>

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
                        onClick={handleLogout}
                        style={{
                            padding: '12px 24px', borderRadius: '8px', border: '1px solid #222',
                            backgroundColor: 'transparent', color: '#555', fontSize: '12px', fontWeight: 800,
                            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px'
                        }}
                    >
                        SIGN_OUT / RETURN_TO_LOGIN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pending;
