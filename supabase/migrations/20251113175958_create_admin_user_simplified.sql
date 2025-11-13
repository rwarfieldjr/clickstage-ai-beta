/*
  # Create Admin User

  ## Changes
  1. Create bootstrap admin user in auth.users
  2. Add admin role to user_roles table
  3. Create admin profile
  4. Add helper function to check admin status
  
  ## Security
  - Admin user: admin@clickstagepro.com
  - Password: 12345678 (CHANGE IN PRODUCTION!)
*/

-- Create admin auth user
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@clickstagepro.com';
  
  IF admin_user_id IS NULL THEN
    -- Insert admin user into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@clickstagepro.com',
      crypt('12345678', gen_salt('bf')),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"],"role":"admin"}',
      '{"name":"Admin User","role":"admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;
    
    -- Insert admin profile
    INSERT INTO profiles (id, name, email, created_at, updated_at)
    VALUES (
      admin_user_id,
      'Admin User',
      'admin@clickstagepro.com',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert admin role
    INSERT INTO user_roles (user_id, role, created_at)
    VALUES (
      admin_user_id,
      'admin',
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    
    -- Create initial credits for admin
    INSERT INTO user_credits (user_id, credits, created_at, updated_at)
    VALUES (
      admin_user_id,
      1000,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET credits = 1000;
    
    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
  ELSE
    -- Update existing user to admin
    INSERT INTO user_roles (user_id, role, created_at)
    VALUES (admin_user_id, 'admin', NOW())
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Existing user promoted to admin with ID: %', admin_user_id;
  END IF;
END $$;

-- Add helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;