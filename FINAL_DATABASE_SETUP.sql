-- ESSENTIAL DATABASE SETUP FOR MFL LABS
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  owner_id UUID NOT NULL, -- References auth.users(id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users (extending Supabase Auth)
CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive', 'suspended');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, -- References auth.users(id)
  org_id UUID REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- Using VARCHAR for more flexible statuses like 'active:designer'
  email_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Approvals
CREATE TYPE approval_type AS ENUM ('user_join', 'role_change', 'client_access', 'workspace_access', 'budget_approval');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  requester_id UUID,
  approver_id UUID,
  data JSONB NOT NULL,
  reason TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- 4. Enable RLS (Simplified for now)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Basic Public Access (Adjust as needed)
CREATE POLICY "Allow All" ON organizations FOR ALL USING (true);
CREATE POLICY "Allow All" ON users FOR ALL USING (true);
CREATE POLICY "Allow All" ON approvals FOR ALL USING (true);
