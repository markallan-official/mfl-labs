import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    FiLayers,
    FiDatabase,
    FiShield,
    FiCpu,
    FiLink,
    FiEye,
    FiSettings,
    FiLogOut,
    FiLock
} from 'react-icons/fi';

const Dashboard: React.FC = () => {
    const { user, isAdmin, role, signOut } = useAuth();
    const assignedWorkspace = role && role !== 'pending' && role !== 'super_admin' ? role : null;
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Only auto-redirect assigned staff to their specific terminal
        if (!isAdmin && assignedWorkspace && assignedWorkspace !== 'unassigned') {
            navigate(`/workspaces/${assignedWorkspace}`, { replace: true });
        }
    }, [isAdmin, assignedWorkspace, navigate]);

    const handleLogout = async () => {
        await signOut(); // signOut redirects to /signup automatically
    };

    const modules = [
        { id: 'analyst', title: 'SYSTEM ANALYST', path: '/workspaces/analyst', icon: <FiDatabase />, color: 'var(--primary-blue)', desc: 'Specification Matrix' },
        { id: 'designer', title: 'UX DESIGNER', path: '/workspaces/designer', icon: <FiLayers />, color: 'var(--primary-red)', desc: 'Visual Core' },
        { id: 'qa', title: 'QA TERMINAL', path: '/workspaces/qa', icon: <FiShield />, color: 'var(--primary-blue)', desc: 'Stability Guard' },
        { id: 'ai-builder', title: 'AI BUILDER', path: '/workspaces/ai-builder', icon: <FiCpu />, color: 'var(--primary-red)', desc: 'Neural Engine' },
        { id: 'integration', title: 'INTEGRATOR', path: '/workspaces/integration', icon: <FiLink />, color: 'var(--primary-blue)', desc: 'Assembly Layer' },
        { id: 'client', title: 'CLIENT PORTAL', path: '/client', icon: <FiEye />, color: 'var(--accent-cyan)', desc: 'View Layer' },
    ];

    // Filter based on admin/access
    const visibleModules = modules.filter(m => isAdmin || m.id === assignedWorkspace);

    // Add Admin Panel if super admin
    if (isAdmin) {
        visibleModules.push({ id: 'admin', title: 'ADMIN CONTROL', path: '/admin', icon: <FiSettings />, color: '#666', desc: 'System Core' });
    }

    // Split modules into rows for the honeycomb effect
    // For mobile, we'll use a different grouping or just stack them
    const row1 = isMobile ? visibleModules.slice(0, 2) : visibleModules.slice(0, 3);
    const row2 = isMobile ? visibleModules.slice(2, 4) : visibleModules.slice(3, 5);
    const row3 = isMobile ? visibleModules.slice(4, 6) : visibleModules.slice(5);
    const row4 = isMobile ? visibleModules.slice(6) : [];

    const Hexagon = ({ item }: { item: any }) => (
        <div
            className="hex-container"
            onClick={() => navigate(item.path)}
        >
            <div className="hexagon-shape hex-glow-animation" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(10, 10, 14, 0.9)',
                border: `2px solid ${item.color}`,
                boxShadow: `0 0 30px ${item.color}22`,
                backdropFilter: 'blur(15px)',
                zIndex: 1
            }} />

            <div className="hexagon-shape" style={{
                position: 'absolute',
                top: isMobile ? '4px' : '8px',
                left: isMobile ? '4px' : '8px',
                right: isMobile ? '4px' : '8px',
                bottom: isMobile ? '4px' : '8px',
                border: `1px solid ${item.color}33`,
                zIndex: 2
            }} />

            <div style={{
                position: 'relative',
                zIndex: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '10px' : '20px',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: isMobile ? '32px' : '48px',
                    marginBottom: isMobile ? '8px' : '15px',
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: `drop-shadow(0 0 15px ${item.color}66)`
                }}>
                    {item.icon}
                </div>
                <h3 style={{ margin: 0, fontSize: isMobile ? '10px' : '13px', letterSpacing: isMobile ? '1px' : '3px', fontWeight: 900, color: '#FFF' }}>
                    {item.title}
                </h3>
                <div style={{ fontSize: isMobile ? '7px' : '9px', marginTop: '8px', color: item.color, opacity: 0.8, fontWeight: 700, letterSpacing: '1px' }}>
                    {item.desc.toUpperCase()}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', overflowY: 'auto', backgroundColor: 'var(--bg-deep)' }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
                opacity: 0.5
            }} />

            <div style={{ position: 'absolute', top: '-15%', left: '-15%', width: '50%', height: '50%', backgroundColor: 'var(--primary-blue)', filter: 'blur(180px)', opacity: 0.08 }} className="animate-pulse-slow" />
            <div style={{ position: 'absolute', bottom: '-15%', right: '-15%', width: '50%', height: '50%', backgroundColor: 'var(--primary-red)', filter: 'blur(180px)', opacity: 0.08 }} className="animate-pulse-slow" />

            <nav style={{
                padding: isMobile ? '20px' : '30px 60px',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '20px' : '0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '16px' : '24px' }}>
                    <div className="hexagon-shape hex-glow-animation" style={{ width: isMobile ? '35px' : '45px', height: isMobile ? '40px' : '50px', backgroundColor: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontWeight: 900, color: 'white', fontSize: isMobile ? '16px' : '20px', letterSpacing: '-1px' }}>M</span>
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', letterSpacing: isMobile ? '3px' : '5px', fontWeight: 900, color: '#FFF' }}>
                            ASSEMBLY <span style={{ color: 'var(--primary-red)' }}>MATRIX</span>
                        </h1>
                        <div style={{ fontSize: isMobile ? '7px' : '9px', color: 'var(--primary-blue)', letterSpacing: '2px', fontWeight: 800, marginTop: '2px' }}>
                            ENCRYPTED NEURAL GATEWAY // ACTIVE V.1.0
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: isMobile ? 'space-between' : 'flex-end',
                    gap: isMobile ? '0' : '40px'
                }}>
                    <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', fontWeight: 800 }}>OPS_COMMANDER</div>
                        <div style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 900, color: 'var(--primary-blue)', letterSpacing: '1px' }}>
                            {user?.email?.split('@')[0].toUpperCase()}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            backgroundColor: 'transparent',
                            color: 'var(--primary-red)',
                            border: '2px solid var(--primary-red)',
                            padding: isMobile ? '8px 16px' : '10px 24px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 900,
                            letterSpacing: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.3s'
                        }}
                    >
                        <FiLogOut /> {window.innerWidth > 960 ? 'DISCONNECT' : 'EXIT'}
                    </button>
                </div>
            </nav>

            <main className="assembly-matrix-grid" style={{ position: 'relative', zIndex: 5, paddingBottom: '100px' }}>
                <div style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '80px', marginTop: isMobile ? '10px' : '30px' }}>
                    <h2 style={{ fontSize: isMobile ? '9px' : '11px', letterSpacing: isMobile ? '5px' : '10px', color: 'var(--text-muted)', marginBottom: '15px', fontWeight: 900 }}>
                        SELECT INTERFACE_NODE
                    </h2>
                    <p style={{ fontSize: isMobile ? '13px' : '15px', maxWidth: '700px', margin: '0 auto', opacity: 0.6, fontWeight: 400, lineHeight: 1.6, letterSpacing: '0.5px', padding: '0 20px' }}>
                        Operational environment synchronization confirmed. Authorized credentials detected. Select any active module terminal below to initialize operational protocols.
                    </p>
                </div>

                <div className="hex-grid" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="hex-row">
                        {row1.map(item => <Hexagon key={item.id} item={item} />)}
                    </div>
                    <div className="hex-row" style={{ marginTop: isMobile ? '-40px' : '-65px' }}>
                        {row2.map(item => <Hexagon key={item.id} item={item} />)}
                    </div>
                    <div className="hex-row" style={{ marginTop: isMobile ? '-40px' : '-65px' }}>
                        {row3.map(item => <Hexagon key={item.id} item={item} />)}
                    </div>
                    {row4.length > 0 && (
                        <div className="hex-row" style={{ marginTop: isMobile ? '-40px' : '-65px' }}>
                            {row4.map(item => <Hexagon key={item.id} item={item} />)}
                        </div>
                    )}
                </div>

                {!isAdmin && !assignedWorkspace && (
                    <div style={{
                        marginTop: isMobile ? '60px' : '120px',
                        backgroundColor: 'rgba(255, 26, 26, 0.08)',
                        border: '2px solid var(--primary-red)',
                        padding: isMobile ? '15px 30px' : '25px 50px',
                        borderRadius: '4px',
                        textAlign: 'center',
                        maxWidth: '500px',
                        margin: '0 auto',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ color: 'var(--primary-red)', fontWeight: 900, fontSize: isMobile ? '11px' : '13px', letterSpacing: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                            <FiLock /> ASSIGNMENT PENDING
                        </div>
                        <p style={{ fontSize: isMobile ? '10px' : '11px', marginTop: '12px', opacity: 0.8, lineHeight: 1.6, letterSpacing: '1px' }}>
                            System administrator manual authorization required for terminal access. Please wait for node synchronization.
                        </p>
                    </div>
                )}
            </main>

            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: isMobile ? '10px 20px' : '15px 60px',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: isMobile ? '10px' : '0',
                fontSize: '9px',
                color: 'var(--text-muted)',
                letterSpacing: '2px',
                fontWeight: 700,
                backgroundColor: 'rgba(5, 5, 7, 0.8)',
                backdropFilter: 'blur(10px)',
                zIndex: 20
            }}>
                <div style={{ display: 'flex', gap: isMobile ? '15px' : '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div>STATUS: <span style={{ color: '#00FF00' }}>AUTHORIZED</span></div>
                    <div>LATENCY: 14MS</div>
                    <div>ENCRYPTION: Q_V4</div>
                </div>
                <div style={{ textAlign: 'center' }}>© 2026 MFL LABS // OPERATIONS LOGGED</div>
            </div>
        </div>
    );
};

export default Dashboard;

