-- Önce mevcut rolleri geçici bir tabloya kopyala
CREATE TEMP TABLE temp_user_roles AS 
SELECT user_id, role::text as role_text 
FROM public.user_roles;

-- user_roles tablosunu sil
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Eski ENUM'u sil
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Yeni ENUM oluştur
CREATE TYPE public.app_role AS ENUM (
  'sirket_sahibi',
  'genel_mudur', 
  'muhasebe',
  'uretim_sefi',
  'teknisyen',
  'servis_personeli',
  'saha_montaj',
  'uretim_personeli'
);

-- user_roles tablosunu yeniden oluştur
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- RLS'i etkinleştir
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role fonksiyonunu oluştur
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS politikalarını oluştur
CREATE POLICY "Kullanıcılar kendi rollerini görebilir"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Şirket sahibi ve genel müdür roller ekleyebilir"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'sirket_sahibi'::app_role) OR
  has_role(auth.uid(), 'genel_mudur'::app_role)
);

CREATE POLICY "Şirket sahibi ve genel müdür roller güncelleyebilir"
ON public.user_roles
FOR UPDATE
USING (
  has_role(auth.uid(), 'sirket_sahibi'::app_role) OR
  has_role(auth.uid(), 'genel_mudur'::app_role)
);

CREATE POLICY "Şirket sahibi ve genel müdür roller silebilir"
ON public.user_roles
FOR DELETE
USING (
  has_role(auth.uid(), 'sirket_sahibi'::app_role) OR
  has_role(auth.uid(), 'genel_mudur'::app_role)
);

-- handle_new_user fonksiyonunu oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, ad, soyad, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'ad',
    NEW.raw_user_meta_data->>'soyad',
    NEW.email
  );
  
  -- Şirket sahibi email kontrolü
  IF NEW.email = 'sahib@fabrika.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'sirket_sahibi');
  -- Genel müdür email kontrolü
  ELSIF NEW.email = 'mudur@fabrika.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'genel_mudur');
  ELSE
    -- Diğer kullanıcılar varsayılan olarak üretim personeli
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'uretim_personeli');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger'ı oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();