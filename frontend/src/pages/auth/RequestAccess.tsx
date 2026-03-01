import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../../config/supabase';

const RequestAccess: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [requestedRole, setRequestedRole] = useState('designer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const roles = [
        { id: 'designer', name: 'Graphic Designer' },
        { id: 'analyst', name: 'System Analyst' },
        { id: 'qa', name: 'Tester / QA' },
        { id: 'ai-builder', name: 'AI Builder' },
        { id: 'integration', name: 'Integration Expert' },
    ];

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/v1/auth/signup', {
                email,
                password,
                full_name: fullName,
                requested_role: requestedRole
            });

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/pending');
                }, 3000);
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            const errorData = err.response?.data;
            if (errorData?.error === 'DATABASE_SETUP_REQUIRED') {
                setError('CRITICAL: Database schema is missing. The system administrator must run FINAL_DATABASE_SETUP.sql in the Supabase SQL Editor.');
            } else {
                setError(errorData?.error || err.message || 'Failed to submit request. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E1E24', color: '#F5F5F5' }}>
                <div style={{ textAlign: 'center', backgroundColor: '#2A2A35', padding: '40px', borderRadius: '16px', maxWidth: '500px', boxShadow: '0 0 40px rgba(0, 102, 255, 0.2)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                    <h2 style={{ color: '#00AA00', marginBottom: '16px' }}>Request Submitted</h2>
                    <p style={{ color: '#A0A0A0' }}>Your account has been created and is pending administrator approval. You will be redirected shortly.</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#1E1E24', color: '#F5F5F5', fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#2A2A35', padding: '40px', borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)', width: '100%', maxWidth: '400px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <h1 style={{ color: '#0066FF', fontSize: '28px', textAlign: 'center', marginBottom: '8px', letterSpacing: '1px' }}>
                    MFL LABS
                </h1>
                <p style={{ color: '#FF0000', textAlign: 'center', marginBottom: '32px', fontSize: '14px', fontWeight: 600 }}>
                    ENTER THE ASSEMBLY MATRIX
                </p>

                {error && <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#FF3333', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid rgba(255,51,51,0.2)' }}>{error}</div>}

                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#A0A0A0' }}>Full Name</label>
                        <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444',
                                backgroundColor: '#1E1E24', color: '#F5F5F5', fontSize: '16px', outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#A0A0A0' }}>Work Email</label>
                        <input
                            type="email"
                            required
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444',
                                backgroundColor: '#1E1E24', color: '#F5F5F5', fontSize: '16px', outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#A0A0A0' }}>Discipline Selection</label>
                        <select
                            value={requestedRole}
                            onChange={(e) => setRequestedRole(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444',
                                backgroundColor: '#1E1E24', color: '#F5F5F5', fontSize: '16px', outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#A0A0A0' }}>Secure Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444',
                                backgroundColor: '#1E1E24', color: '#F5F5F5', fontSize: '16px', outline: 'none'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '10px', padding: '14px', borderRadius: '8px', border: 'none',
                            backgroundColor: '#FF0000', color: 'white', fontSize: '16px', fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(255,0,0,0.3)'
                        }}
                    >
                        {loading ? 'Submitting...' : 'Request Access'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '30px', color: '#A0A0A0', fontSize: '14px' }}>
                    Already have access? <Link to="/login" style={{ color: '#0066FF', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default RequestAccess;
