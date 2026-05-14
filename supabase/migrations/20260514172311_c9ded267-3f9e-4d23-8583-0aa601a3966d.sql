CREATE TABLE IF NOT EXISTS public.temp_user_check (
    email TEXT,
    exists BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.temp_user_check (email, exists)
SELECT 'mkt@real4u.com.br', EXISTS (SELECT 1 FROM auth.users WHERE email = 'mkt@real4u.com.br');

INSERT INTO public.temp_user_check (email, exists)
SELECT 'agomes78@gmail.com', EXISTS (SELECT 1 FROM auth.users WHERE email = 'agomes78@gmail.com');
