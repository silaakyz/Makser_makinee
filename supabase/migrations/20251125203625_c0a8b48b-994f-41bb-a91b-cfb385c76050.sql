-- Hammadde (Raw Materials) tablosu
CREATE TABLE public.hammadde (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  birim_fiyat DECIMAL(10,2) NOT NULL,
  stok_miktari DECIMAL(10,2) NOT NULL DEFAULT 0,
  birim TEXT NOT NULL DEFAULT 'kg',
  tuketim_hizi DECIMAL(10,2) DEFAULT 0,
  kritik_stok_seviyesi DECIMAL(10,2) DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ürün tablosu
CREATE TABLE public.urun (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  tur TEXT NOT NULL,
  satis_fiyati DECIMAL(10,2) NOT NULL,
  stok_miktari INTEGER NOT NULL DEFAULT 0,
  kritik_stok_seviyesi INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ürün-Hammadde ilişkisi (recipe/formül)
CREATE TABLE public.urun_hammadde (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urun_id UUID REFERENCES public.urun(id) ON DELETE CASCADE,
  hammadde_id UUID REFERENCES public.hammadde(id) ON DELETE CASCADE,
  miktar DECIMAL(10,2) NOT NULL,
  UNIQUE(urun_id, hammadde_id)
);

-- Makine tablosu
CREATE TABLE public.makine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  tur TEXT NOT NULL,
  uretim_kapasitesi INTEGER NOT NULL,
  durum TEXT NOT NULL DEFAULT 'boşta' CHECK (durum IN ('aktif', 'boşta', 'arızalı', 'bakımda')),
  son_bakim_tarihi DATE,
  sonraki_bakim_tarihi DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bakım kayıtları
CREATE TABLE public.bakim_kaydi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  makine_id UUID REFERENCES public.makine(id) ON DELETE CASCADE,
  bakim_tarihi DATE NOT NULL,
  bakim_turu TEXT NOT NULL,
  maliyet DECIMAL(10,2) DEFAULT 0,
  aciklama TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Arıza kayıtları
CREATE TABLE public.ariza_kaydi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  makine_id UUID REFERENCES public.makine(id) ON DELETE CASCADE,
  baslangic_tarihi TIMESTAMPTZ NOT NULL,
  bitis_tarihi TIMESTAMPTZ,
  sure_saat DECIMAL(10,2),
  maliyet DECIMAL(10,2) DEFAULT 0,
  aciklama TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Üretim kayıtları
CREATE TABLE public.uretim (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urun_id UUID REFERENCES public.urun(id) ON DELETE CASCADE,
  makine_id UUID REFERENCES public.makine(id) ON DELETE CASCADE,
  baslangic_zamani TIMESTAMPTZ NOT NULL,
  bitis_zamani TIMESTAMPTZ,
  uretilen_adet INTEGER DEFAULT 0,
  hedef_adet INTEGER NOT NULL,
  calisan_personel TEXT,
  durum TEXT NOT NULL DEFAULT 'devam_ediyor' CHECK (durum IN ('devam_ediyor', 'tamamlandi', 'iptal')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sipariş tablosu
CREATE TABLE public.siparis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musteri TEXT NOT NULL,
  urun_id UUID REFERENCES public.urun(id) ON DELETE CASCADE,
  miktar INTEGER NOT NULL,
  siparis_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
  teslim_tarihi DATE,
  durum TEXT NOT NULL DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'uretimde', 'tamamlandi', 'iptal')),
  kaynak TEXT NOT NULL DEFAULT 'stok' CHECK (kaynak IN ('stok', 'uretim')),
  siparis_maliyeti DECIMAL(10,2) DEFAULT 0,
  uretim_id UUID REFERENCES public.uretim(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hammadde giriş kayıtları
CREATE TABLE public.hammadde_giris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hammadde_id UUID REFERENCES public.hammadde(id) ON DELETE CASCADE,
  miktar DECIMAL(10,2) NOT NULL,
  birim_fiyat DECIMAL(10,2) NOT NULL,
  toplam_tutar DECIMAL(10,2) NOT NULL,
  giris_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
  tedarikci TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS politikaları - şimdilik herkese açık (authentication eklenince güncellenecek)
ALTER TABLE public.hammadde ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urun ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urun_hammadde ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.makine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bakim_kaydi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ariza_kaydi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uretim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siparis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hammadde_giris ENABLE ROW LEVEL SECURITY;

-- Geçici politikalar (tüm işlemler için izin ver)
CREATE POLICY "Enable all for hammadde" ON public.hammadde FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for urun" ON public.urun FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for urun_hammadde" ON public.urun_hammadde FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for makine" ON public.makine FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for bakim_kaydi" ON public.bakim_kaydi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for ariza_kaydi" ON public.ariza_kaydi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for uretim" ON public.uretim FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for siparis" ON public.siparis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for hammadde_giris" ON public.hammadde_giris FOR ALL USING (true) WITH CHECK (true);

-- Trigger fonksiyonu updated_at için
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.hammadde FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.urun FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.makine FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.uretim FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.siparis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();