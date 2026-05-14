-- Add configuration to forms table
ALTER TABLE public.forms 
ADD COLUMN send_to_crm BOOLEAN NOT NULL DEFAULT true;

-- Add tracking to form_submissions
ALTER TABLE public.form_submissions
ADD COLUMN was_sent_to_crm BOOLEAN DEFAULT false,
ADD COLUMN crm_sync_error TEXT,
ADD COLUMN synced_at TIMESTAMP WITH TIME ZONE;

-- Add sync info to contacts (optional but useful)
ALTER TABLE public.contacts
ADD COLUMN last_crm_sync_at TIMESTAMP WITH TIME ZONE;
