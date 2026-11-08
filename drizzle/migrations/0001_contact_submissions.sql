CREATE TABLE public.contact_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 full_name text NOT NULL,
 email text NOT NULL,
 subject text NOT NULL,
 message text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT contact_name_length CHECK (char_length(full_name) BETWEEN 2 AND 120),
 CONSTRAINT contact_email_length CHECK (char_length(email) BETWEEN 3 AND 254),
 CONSTRAINT contact_subject_length CHECK (char_length(subject) BETWEEN 3 AND 160),
 CONSTRAINT contact_message_length CHECK (char_length(message) BETWEEN 10 AND 4000)
);
GRANT SELECT, INSERT ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_insert_own ON public.contact_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY contact_select_own ON public.contact_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY contact_select_admin ON public.contact_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX contact_submissions_created_idx ON public.contact_submissions (created_at DESC);
CREATE INDEX contact_submissions_user_created_idx ON public.contact_submissions (user_id, created_at DESC);