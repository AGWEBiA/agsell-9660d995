-- Create a function to increment form submissions count safely
CREATE OR REPLACE FUNCTION public.increment_form_submissions(form_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.forms
  SET submissions_count = submissions_count + 1,
      updated_at = now()
  WHERE id = form_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the forms table has a default for submissions_count if missing
ALTER TABLE public.forms ALTER COLUMN submissions_count SET DEFAULT 0;
UPDATE public.forms SET submissions_count = 0 WHERE submissions_count IS NULL;
