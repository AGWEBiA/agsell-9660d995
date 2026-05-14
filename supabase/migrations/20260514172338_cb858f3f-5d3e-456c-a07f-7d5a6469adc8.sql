CREATE TABLE IF NOT EXISTS public.temp_user_confirmation (
    email TEXT,
    email_confirmed_at TIMESTAMP WITH TIME ZONE
);

INSERT INTO public.temp_user_confirmation (email, email_confirmed_at)
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'mkt@real4u.com.br';

-- Also cleanup other temp tables
DROP TABLE IF EXISTS public.temp_user_check;
DROP TABLE IF EXISTS public.temp_user_roles_emails;
