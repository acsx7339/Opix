-- Add 'admin' to user_level check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_level_check;
ALTER TABLE users ADD CONSTRAINT users_level_check 
    CHECK (user_level IN ('trainee', 'member', 'expert', 'moderator', 'admin'));

-- Update the specific admin user to have the new 'admin' role
UPDATE users SET user_level = 'admin' WHERE username = 'admin';
