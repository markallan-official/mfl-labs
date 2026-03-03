// Vercel serverless function
// For API routing, use the frontend's environment variable to point to backend
export default function handler(req: any, res: any) {
    res.status(404).json({ error: 'API endpoints are handled by the backend server' });
}
