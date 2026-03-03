// Backend Server Entry Point
// SaaS Collaborative Platform - Express.js + Supabase API Server

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';
import authRoutes from './routes/auth.js';
import adminApprovalsRoutes from './routes/admin/approvals.js';
import adminUsersRoutes from './routes/admin/users.js';
import assemblyRoutes from './routes/assembly.js';
import designerRoutes from './routes/workspaces/designer.js';
import analystRoutes from './routes/workspaces/analyst.js';
import qaRoutes from './routes/workspaces/qa.js';
import aiBuilderRoutes from './routes/workspaces/ai_builder.js';
import integrationRoutes from './routes/workspaces/integration.js';

// Load environment variables (optional for zero-config)
dotenv.config();

// Initialize Express application
const app: Express = express();
const PORT = Number(process.env.PORT) || Number(process.env.API_PORT) || 3000;
const CORS_ORIGIN = '*';

// ============================================
// TypeScript Interfaces
// ============================================

interface AuthenticatedRequest extends Request {
    user?: any;
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}

// Verify Supabase is configured
if (!supabase) {
    console.warn('WARNING: Supabase is not configured. Auth endpoints will not work.');
}

// Helper function to check Supabase
const ensureSupabase = () => {
    if (!supabase) {
        throw new Error('Supabase is not configured');
    }
    return supabase;
};

// ============================================
// Middleware Setup
// ============================================

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// ============================================
// Authentication Middleware
// ============================================

// Verify Supabase token from Supabase
const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!supabase) {
            // If Supabase not configured, allow request through for testing
            return next();
        }

        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            // Allow some endpoints without token
            return next();
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
                timestamp: new Date().toISOString(),
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
            timestamp: new Date().toISOString(),
        });
    }
};

app.use(verifyToken);

// ============================================
// Health Check Endpoint
// ============================================

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// ============================================
// API Routes with Supabase Integration
// ============================================

// Mount all route modules
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/approvals', adminApprovalsRoutes);
app.use('/api/v1/admin/users', adminUsersRoutes);
app.use('/api/v1/assembly', assemblyRoutes);
app.use('/api/v1/workspaces/designer', designerRoutes);
app.use('/api/v1/workspaces/analyst', analystRoutes);
app.use('/api/v1/workspaces/qa', qaRoutes);
app.use('/api/v1/workspaces/ai_builder', aiBuilderRoutes);
app.use('/api/v1/workspaces/integration', integrationRoutes);

// API Documentation
app.get('/api/docs', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        data: {
            message: 'SaaS Platform API Documentation',
            version: '1.0.0',
            endpoints: {
                auth: [
                    'POST /api/v1/auth/signup',
                    'POST /api/v1/auth/login',
                    'POST /api/v1/auth/logout',
                    'POST /api/v1/auth/verify-email',
                    'POST /api/v1/auth/refresh',
                    'GET /api/v1/auth/me',
                ],
                admin: {
                    approvals: [
                        'GET /api/v1/admin/approvals',
                        'GET /api/v1/admin/approvals/:id',
                        'POST /api/v1/admin/approvals/:id/approve',
                        'POST /api/v1/admin/approvals/:id/reject',
                    ],
                    users: [
                        'GET /api/v1/admin/users',
                        'POST /api/v1/admin/users/:id/approve',
                        'POST /api/v1/admin/users/:id/reject',
                        'PUT /api/v1/admin/users/:id/role',
                    ]
                },
                workspaces: {
                    designer: [
                        'GET /api/v1/workspaces/designer/projects',
                        'POST /api/v1/workspaces/designer/projects',
                        'GET /api/v1/workspaces/designer/projects/:projectId',
                        'PUT /api/v1/workspaces/designer/projects/:projectId',
                        'GET /api/v1/workspaces/designer/projects/:projectId/assets',
                        'POST /api/v1/workspaces/designer/assets',
                        'PUT /api/v1/workspaces/designer/assets/:assetId',
                        'DELETE /api/v1/workspaces/designer/assets/:assetId',
                        'GET /api/v1/workspaces/designer/assets/:assetId/comments',
                        'POST /api/v1/workspaces/designer/assets/:assetId/comments',
                    ],
                    analyst: [
                        'GET /api/v1/workspaces/analyst/documents',
                        'POST /api/v1/workspaces/analyst/documents',
                        'PUT /api/v1/workspaces/analyst/documents/:docId',
                        'GET /api/v1/workspaces/analyst/data-models',
                        'POST /api/v1/workspaces/analyst/data-models',
                        'GET /api/v1/workspaces/analyst/api-specs',
                        'POST /api/v1/workspaces/analyst/api-specs',
                    ],
                    qa: [
                        'GET /api/v1/workspaces/qa/test-cases',
                        'POST /api/v1/workspaces/qa/test-cases',
                        'PUT /api/v1/workspaces/qa/test-cases/:testCaseId',
                        'GET /api/v1/workspaces/qa/test-results/:testCaseId',
                        'POST /api/v1/workspaces/qa/test-results',
                        'GET /api/v1/workspaces/qa/builds',
                        'POST /api/v1/workspaces/qa/builds',
                        'GET /api/v1/workspaces/qa/defects',
                        'POST /api/v1/workspaces/qa/defects',
                        'PUT /api/v1/workspaces/qa/defects/:defectId',
                    ],
                    ai_builder: [
                        'GET /api/v1/workspaces/ai_builder/models',
                        'POST /api/v1/workspaces/ai_builder/models',
                        'PUT /api/v1/workspaces/ai_builder/models/:modelId',
                        'GET /api/v1/workspaces/ai_builder/training-jobs',
                        'POST /api/v1/workspaces/ai_builder/training-jobs',
                        'PUT /api/v1/workspaces/ai_builder/training-jobs/:jobId',
                        'GET /api/v1/workspaces/ai_builder/deployments',
                        'POST /api/v1/workspaces/ai_builder/deployments',
                        'PUT /api/v1/workspaces/ai_builder/deployments/:deploymentId',
                    ],
                    integration: [
                        'GET /api/v1/workspaces/integration/builds',
                        'POST /api/v1/workspaces/integration/builds',
                        'PUT /api/v1/workspaces/integration/builds/:buildId',
                        'GET /api/v1/workspaces/integration/builds/:buildId/artifacts',
                        'POST /api/v1/workspaces/integration/artifacts',
                        'DELETE /api/v1/workspaces/integration/artifacts/:artifactId',
                        'GET /api/v1/workspaces/integration/workspace-integrations',
                        'POST /api/v1/workspaces/integration/workspace-integrations',
                        'POST /api/v1/workspaces/integration/:integrationId/sync',
                    ],
                }
            },
        },
        timestamp: new Date().toISOString(),
    });
});

// ============================================
// Error Handling
// ============================================

app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        timestamp: new Date().toISOString(),
    });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
        timestamp: new Date().toISOString(),
    });
});

// ============================================
// Start Server
// ============================================

// Only listen if not in a serverless environment (like Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        const portStr = String(PORT);
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║         SaaS Collaborative Platform - Backend API             ║
╠════════════════════════════════════════════════════════════════╣
║ Environment: ${String(process.env.NODE_ENV).padEnd(40)}║
║ Port: ${portStr.padEnd(50)}║
║ API Docs: http://localhost:${PORT}/api/docs${' '.repeat(28 - portStr.length)}║
║ Health Check: http://localhost:${PORT}/health${' '.repeat(21 - portStr.length)}║
╚════════════════════════════════════════════════════════════════╝
  `);
    });
}

export default app;
