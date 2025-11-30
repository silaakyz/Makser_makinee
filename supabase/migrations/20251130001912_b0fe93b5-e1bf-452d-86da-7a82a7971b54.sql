-- Ürün tablosuna kazan ölçüleri ve resim alanları ekleniyor
ALTER TABLE urun 
ADD COLUMN IF NOT EXISTS en numeric,
ADD COLUMN IF NOT EXISTS boy numeric,
ADD COLUMN IF NOT EXISTS yukseklik numeric,
ADD COLUMN IF NOT EXISTS hacim numeric,
ADD COLUMN IF NOT EXISTS agirlik numeric,
ADD COLUMN IF NOT EXISTS max_basinc numeric,
ADD COLUMN IF NOT EXISTS max_sicaklik numeric,
ADD COLUMN IF NOT EXISTS resim_url text;

-- Kolonlara açıklama ekleniyor
COMMENT ON COLUMN urun.en IS 'Genişlik (cm)';
COMMENT ON COLUMN urun.boy IS 'Uzunluk (cm)';
COMMENT ON COLUMN urun.yukseklik IS 'Yükseklik (cm)';
COMMENT ON COLUMN urun.hacim IS 'Hacim/Kapasite (L veya m³)';
COMMENT ON COLUMN urun.agirlik IS 'Ağırlık (kg)';
COMMENT ON COLUMN urun.max_basinc IS 'Maksimum Basınç';
COMMENT ON COLUMN urun.max_sicaklik IS 'Maksimum Sıcaklık (°C)';
COMMENT ON COLUMN urun.resim_url IS 'Ürün resim URL adresi';