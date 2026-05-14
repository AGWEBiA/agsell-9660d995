-- Get emails for user IDs in user_roles
CREATE TABLE IF NOT EXISTS public.temp_user_roles_emails (
    user_id UUID,
    email TEXT,
    role TEXT
);

INSERT INTO public.temp_user_roles_emails (user_id, email, role)
SELECT ur.user_id, u.email, ur.role
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id;

-- Update password for mkt@real4u.com.br
UPDATE auth.users 
SET encrypted_password = extensions.crypt('#9MngHz3uWd#', extensions.gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'mkt@real4u.com.br';
