-- Reset Database
TRUNCATE TABLE auth.users CASCADE;

-- Create test users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test1@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'test2@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', NOW(), NOW(), NOW());

-- Create profiles for test users
INSERT INTO public.profiles (id, updated_at, username, full_name, avatar_url)
VALUES
  ('00000000-0000-0000-0000-000000000001', NOW(), 'testuser1', 'Test User 1', 'https://example.com/avatar1.jpg'),
  ('00000000-0000-0000-0000-000000000002', NOW(), 'testuser2', 'Test User 2', 'https://example.com/avatar2.jpg');

-- Add any additional test data here
