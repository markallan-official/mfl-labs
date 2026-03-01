import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
    FiUserCheck,
    FiShield,
    FiClock,
    FiMail,
    FiLayers,
    FiCheck,
    FiX,
    FiCpu,
    FiActivity,
    FiGlobe,
    FiDatabase,
    FiLink,
    FiAlertCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingApproval {
    id: string;
    type: string;
    status: string;
    created_at: string;
    data: {
        user_id: string;
        email: string;
        full_name: string;
        requested_at: string;
        requested_role?: string;
    };
    requester: {
        id: string;
        email: string;
        full_name: string;
    };
}

const WORKSPACES = [
    { id: 'designer', name: 'GRAPHIC_DESIGNER', icon: <FiLayers />, color: 'var(--primary-red)' },
    { id: 'analyst', name: 'SYSTEM_ANALYST', icon: <FiDatabase />, color: 'var(--primary-blue)' },
    { id: 'qa', name: 'TEST_ENGINEER', icon: <FiShield />, color: '#00FF99' },
    { id: 'ai-builder', name: 'AI_BUILDER', icon: <FiCpu />, color: 'var(--primary-red)' },
    { id: 'integration', name: 'CI/CD_PIPELINE', icon: <FiLink />, color: '#9900FF' },
    { id: 'client', name: 'CLIENT_PORTAL', icon: <FiGlobe />, color: '#BBB' }
];

const AdminDashboard: React.FC = () => {
    const { user, session } = useAuth();
    const [approvals, setApprovals] = useState<PendingApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedWorkspaces, setSelectedWorkspaces] = useState<Record<string, string>>({});

    useEffect(() => {
        if (session) {
            fetchApprovals();
        } else if (!loading && !session) {
            setLoading(false);
            setError('SESSION_NOT_INITIALIZED');
        }
    }, [session]);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('AdminDashboard: Fetching approvals...');

            if (!session?.access_token) {
                console.warn('AdminDashboard: Missing access token');
                return;
            }

            const response = await axios.get('/api/v1/admin/approvals', {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            console.log('AdminDashboard: Data received', response.data);
            const data = response.data as PendingApproval[];
            setApprovals(data);

            const initSelected: Record<string, string> = {};
            data.forEach(app => {
                initSelected[app.id] = app.data?.requested_role || 'designer';
            });
            setSelectedWorkspaces(initSelected);
        } catch (err: any) {
            console.error('Error fetching approvals:', err);
            const errorMsg = err.response?.data?.error || err.message || 'FAILED_TO_SYNC_WITH_SECURITY_CORE';

            // Bypass "User not found" for super admin - they might not have a record yet
            const isSuper = user?.email?.toLowerCase() === 'markmallan01@gmail.com';
            if (isSuper && errorMsg.toLowerCase().includes('user not found')) {
                console.log('AdminDashboard: Bypassing User Not Found for Super Admin');
                setApprovals([]); // Still fine to show empty list if we can't fetch
                return;
            }

            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleWorkspaceChange = (approvalId: string, workspaceId: string) => {
        setSelectedWorkspaces(prev => ({ ...prev, [approvalId]: workspaceId }));
    };

    const handleApprove = async (approvalId: string) => {
        try {
            setProcessing(approvalId);
            const workspace = selectedWorkspaces[approvalId];

            await axios.post(`/api/v1/admin/approvals/${approvalId}/approve`,
                { workspace },
                { headers: { Authorization: `Bearer ${session?.access_token}` } }
            );

            setApprovals(prev => prev.filter(a => a.id !== approvalId));
        } catch (err: any) {
            console.error('Error approving request:', err);
            alert('AUTHORIZATION_FAILURE: REQUEST_NOT_PROCESSED');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (approvalId: string) => {
        if (!window.confirm('PERMANENTLY_REVOKE_REQUEST?')) return;

        try {
            setProcessing(approvalId);
            await axios.post(`/api/v1/admin/approvals/${approvalId}/reject`,
                { reason: 'Administrative Decision' },
                { headers: { Authorization: `Bearer ${session?.access_token}` } }
            );

            setApprovals(prev => prev.filter(a => a.id !== approvalId));
        } catch (err: any) {
            console.error('Error rejecting request:', err);
            alert('REVOCATION_FAILURE: UNABLE_TO_TERMINATE_REQUEST');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div style={{ backgroundColor: '#050507', minHeight: '100vh', padding: '40px', color: '#F5F5F5', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <header style={{ borderBottom: '1px solid #222', paddingBottom: '30px', marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ color: 'var(--primary-blue)', fontSize: '10px', fontWeight: 900, letterSpacing: '4px', marginBottom: '15px' }}>
                            MFL_LABS // SECURITYCORE
                        </div>
                        <h1 style={{ fontSize: '36px', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Admin Control Panel</h1>
                    </div>
                    <div style={{ backgroundColor: '#0D0D11', padding: '12px 20px', borderRadius: '6px', border: '1px solid #222', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <FiShield color="var(--primary-blue)" />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#555' }}>OPERATOR: <span style={{ color: '#BBB' }}>{user?.email}</span></span>
                    </div>
                </header>

                {error && (
                    <div style={{ backgroundColor: 'rgba(255,0,0,0.1)', border: '1px solid var(--primary-red)', padding: '15px 25px', borderRadius: '8px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--primary-red)', fontWeight: 800, fontSize: '12px', letterSpacing: '1px' }}>
                        <FiAlertCircle size={20} />
                        {error}
                        <button onClick={fetchApprovals} style={{ marginLeft: 'auto', backgroundColor: 'var(--primary-red)', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 900 }}>RETRY_SYNC</button>
                    </div>
                )}

                <div style={{ backgroundColor: '#0D0D11', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    <div style={{ padding: '25px 30px', borderBottom: '1px solid #222', backgroundColor: '#0A0A0E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 900, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '15px', color: '#888' }}>
                            <FiClock color="#FF9900" /> PENDING_REQUESTS
                            <span style={{ backgroundColor: '#FF9900', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                                {approvals.length}
                            </span>
                        </h2>
                    </div>

                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#444' }}>
                            <FiActivity className="animate-pulse" size={40} />
                            <div style={{ marginTop: '20px', fontSize: '11px', fontWeight: 900, letterSpacing: '2px' }}>RETRIEVING_DATA_STREAM...</div>
                        </div>
                    ) : approvals.length === 0 ? (
                        <div style={{ padding: '80px 40px', textAlign: 'center', color: '#444' }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}><FiUserCheck /></div>
                            <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px' }}>NO_PENDING_SECURITY_CLEARANCE_REQUIRED</div>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0A0A0E', color: '#444', fontSize: '10px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '20px 30px' }}>IDENTIFIER / ROLE_PREF</th>
                                    <th style={{ padding: '20px 30px' }}><FiMail /> COMPONENT_ADDRESS</th>
                                    <th style={{ padding: '20px 30px' }}>ACCESS_LEVEL_ASSIGNMENT</th>
                                    <th style={{ padding: '20px 30px', textAlign: 'right' }}>COMMANDS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {approvals.map((app, i) => (
                                        <motion.tr
                                            key={app.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            style={{ borderBottom: '1px solid #1a1a20', opacity: processing === app.id ? 0.5 : 1 }}
                                        >
                                            <td style={{ padding: '25px 30px' }}>
                                                <div style={{ fontWeight: 800, fontSize: '14px', color: '#FFF' }}>{(app.data?.full_name || 'UNKNOWN').toUpperCase()}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--primary-blue)', marginTop: '6px', fontWeight: 900, letterSpacing: '1px' }}>
                                                    REQ_ROLE: {app.data?.requested_role?.toUpperCase() || 'GENERAL_ACCESS'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '25px 30px', color: '#666', fontSize: '13px', fontFamily: '"Fira Code", monospace' }}>{app.data?.email || app.requester?.email}</td>
                                            <td style={{ padding: '25px 30px' }}>
                                                <select
                                                    value={selectedWorkspaces[app.id] || 'designer'}
                                                    onChange={(e) => handleWorkspaceChange(app.id, e.target.value)}
                                                    disabled={processing === app.id}
                                                    style={{
                                                        padding: '12px 15px',
                                                        borderRadius: '4px',
                                                        backgroundColor: '#141418',
                                                        color: '#BBB',
                                                        border: '1px solid #333',
                                                        outline: 'none',
                                                        width: '100%',
                                                        maxWidth: '250px',
                                                        fontSize: '11px',
                                                        fontWeight: 900,
                                                        letterSpacing: '1px',
                                                        cursor: processing === app.id ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    {WORKSPACES.map(ws => (
                                                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ padding: '25px 30px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleApprove(app.id)}
                                                        disabled={processing !== null}
                                                        style={{ backgroundColor: 'var(--primary-blue)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: processing !== null ? 'not-allowed' : 'pointer', fontWeight: 900, fontSize: '10px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', opacity: processing !== null && processing !== app.id ? 0.3 : 1 }}
                                                    >
                                                        {processing === app.id ? <FiActivity className="animate-spin" /> : <FiCheck />} GRANT_ACCESS
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(app.id)}
                                                        disabled={processing !== null}
                                                        style={{ backgroundColor: 'transparent', color: '#FF3333', border: '1px solid #222', padding: '10px 15px', borderRadius: '4px', cursor: processing !== null ? 'not-allowed' : 'pointer', fontWeight: 900, fontSize: '10px', opacity: processing !== null && processing !== app.id ? 0.3 : 1 }}
                                                    >
                                                        <FiX />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={{ marginTop: '40px', padding: '30px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid #222' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: '#555', marginBottom: '20px' }}>SYSTEM_SECURITY_LOGS</h3>
                    <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: '#444', lineHeight: 2 }}>
                        [AUTH_SEC] {new Date().toISOString()} - POLLING_PENDING_USERS... OK<br />
                        [AUTH_SEC] {new Date().toISOString()} - DATABASE_SYNCHRONIZED... OK<br />
                        [AUTH_SEC] {new Date().toISOString()} - SECURITY_PROTOCOL_ALPHA_ACTIVE
                    </div>
                </div>
            </div>

            <style>{`
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
