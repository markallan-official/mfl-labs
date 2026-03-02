// Shared types for MFL Labs SaaS Platform

export interface UserProfile {
    id: string;
    email: string;
    role: 'super_admin' | 'admin' | 'user' | 'pending';
    approved: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export type UserRole = 'super_admin' | 'admin' | 'user' | 'pending';

export const ROLES: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    user: 'User',
    pending: 'Pending',
};
