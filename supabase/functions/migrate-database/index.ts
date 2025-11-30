import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Migration başlatılıyor...');

    // Yeni Supabase client (Lovable Cloud)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Eski DB bağlantısı
    const oldDbClient = new Client({
      hostname: Deno.env.get('OLD_DB_HOST'),
      port: 5432,
      user: Deno.env.get('OLD_DB_USER'),
      password: Deno.env.get('OLD_DB_PASSWORD'),
      database: 'postgres',
      tls: { enabled: true, enforce: false, caCertificates: [] }
    });

    await oldDbClient.connect();
    console.log('✅ Eski veritabanına bağlanıldı');

    const results: any = {
      profiles: 0,
      user_roles: 0,
      makine: 0,
      hammadde: 0,
      urun: 0,
      urun_hammadde: 0,
      siparis: 0,
      uretim: 0,
      bakim_kaydi: 0,
      ariza_kaydi: 0,
      hammadde_giris: 0,
      errors: []
    };

    // 1. Profiles ve Auth kullanıcıları
    console.log('📋 Profiles aktarılıyor...');
    try {
      const profilesResult = await oldDbClient.queryObject(
        'SELECT id, ad, soyad, email FROM profiles'
      );
      
      for (const profile of profilesResult.rows as any[]) {
        try {
          // Kullanıcı oluştur (varsayılan şifre: Fabrika2025!)
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: profile.email,
            password: 'Fabrika2025!',
            email_confirm: true,
            user_metadata: {
              ad: profile.ad,
              soyad: profile.soyad
            }
          });

          if (authError) {
            console.error(`❌ Auth hatası (${profile.email}):`, authError);
            results.errors.push(`Auth error for ${profile.email}: ${authError.message}`);
          } else {
            console.log(`✅ Kullanıcı oluşturuldu: ${profile.email}`);
            results.profiles++;
          }
        } catch (err: any) {
          console.error(`❌ Kullanıcı oluşturma hatası:`, err);
          results.errors.push(`Failed to create user ${profile.email}: ${err.message}`);
        }
      }
    } catch (err: any) {
      console.error('❌ Profiles hatası:', err);
      results.errors.push(`Profiles migration error: ${err.message}`);
    }

    // 2. User Roles
    console.log('👥 User roles aktarılıyor...');
    try {
      const rolesResult = await oldDbClient.queryObject(
        'SELECT user_id, role FROM user_roles'
      );
      
      for (const role of rolesResult.rows as any[]) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: role.user_id, role: role.role });
        
        if (error) {
          console.error('❌ Role hatası:', error);
          results.errors.push(`Role error: ${error.message}`);
        } else {
          results.user_roles++;
        }
      }
      console.log(`✅ ${results.user_roles} rol aktarıldı`);
    } catch (err: any) {
      console.error('❌ Roles hatası:', err);
      results.errors.push(`Roles migration error: ${err.message}`);
    }

    // 3. Makine
    console.log('🏭 Makineler aktarılıyor...');
    try {
      const machinesResult = await oldDbClient.queryObject(
        'SELECT id, ad, tur, durum, uretim_kapasitesi, son_bakim_tarihi, sonraki_bakim_tarihi FROM makine'
      );
      
      for (const machine of machinesResult.rows as any[]) {
        const { error } = await supabase
          .from('makine')
          .insert(machine);
        
        if (!error) results.makine++;
      }
      console.log(`✅ ${results.makine} makine aktarıldı`);
    } catch (err: any) {
      console.error('❌ Makine hatası:', err);
      results.errors.push(`Machines migration error: ${err.message}`);
    }

    // 4. Hammadde
    console.log('📦 Hammaddeler aktarılıyor...');
    try {
      const materialsResult = await oldDbClient.queryObject(
        'SELECT id, ad, birim, stok_miktari, kritik_stok_seviyesi, birim_fiyat, tuketim_hizi FROM hammadde'
      );
      
      for (const material of materialsResult.rows as any[]) {
        const { error } = await supabase
          .from('hammadde')
          .insert(material);
        
        if (!error) results.hammadde++;
      }
      console.log(`✅ ${results.hammadde} hammadde aktarıldı`);
    } catch (err: any) {
      console.error('❌ Hammadde hatası:', err);
      results.errors.push(`Materials migration error: ${err.message}`);
    }

    // 5. Ürün
    console.log('🎁 Ürünler aktarılıyor...');
    try {
      const productsResult = await oldDbClient.queryObject(
        'SELECT id, ad, tur, stok_miktari, kritik_stok_seviyesi, satis_fiyati, en, boy, yukseklik, hacim, agirlik, max_basinc, max_sicaklik, resim_url FROM urun'
      );
      
      for (const product of productsResult.rows as any[]) {
        const { error } = await supabase
          .from('urun')
          .insert(product);
        
        if (!error) results.urun++;
      }
      console.log(`✅ ${results.urun} ürün aktarıldı`);
    } catch (err: any) {
      console.error('❌ Ürün hatası:', err);
      results.errors.push(`Products migration error: ${err.message}`);
    }

    // 6. Ürün Hammadde İlişkisi
    console.log('🔗 Ürün-hammadde ilişkileri aktarılıyor...');
    try {
      const relResult = await oldDbClient.queryObject(
        'SELECT id, urun_id, hammadde_id, miktar FROM urun_hammadde'
      );
      
      for (const rel of relResult.rows as any[]) {
        const { error } = await supabase
          .from('urun_hammadde')
          .insert(rel);
        
        if (!error) results.urun_hammadde++;
      }
      console.log(`✅ ${results.urun_hammadde} ilişki aktarıldı`);
    } catch (err: any) {
      console.error('❌ Ürün-hammadde hatası:', err);
      results.errors.push(`Product-materials relation error: ${err.message}`);
    }

    // 7. Sipariş
    console.log('📋 Siparişler aktarılıyor...');
    try {
      const ordersResult = await oldDbClient.queryObject(
        'SELECT id, musteri, urun_id, miktar, durum, siparis_tarihi, teslim_tarihi, siparis_maliyeti, kaynak, uretim_id FROM siparis'
      );
      
      for (const order of ordersResult.rows as any[]) {
        const { error } = await supabase
          .from('siparis')
          .insert(order);
        
        if (!error) results.siparis++;
      }
      console.log(`✅ ${results.siparis} sipariş aktarıldı`);
    } catch (err: any) {
      console.error('❌ Sipariş hatası:', err);
      results.errors.push(`Orders migration error: ${err.message}`);
    }

    // 8. Üretim
    console.log('⚙️ Üretim kayıtları aktarılıyor...');
    try {
      const productionResult = await oldDbClient.queryObject(
        'SELECT id, urun_id, makine_id, hedef_adet, uretilen_adet, durum, baslangic_zamani, bitis_zamani, calisan_personel FROM uretim'
      );
      
      for (const production of productionResult.rows as any[]) {
        const { error } = await supabase
          .from('uretim')
          .insert(production);
        
        if (!error) results.uretim++;
      }
      console.log(`✅ ${results.uretim} üretim kaydı aktarıldı`);
    } catch (err: any) {
      console.error('❌ Üretim hatası:', err);
      results.errors.push(`Production migration error: ${err.message}`);
    }

    // 9. Bakım Kayıtları
    console.log('🔧 Bakım kayıtları aktarılıyor...');
    try {
      const maintenanceResult = await oldDbClient.queryObject(
        'SELECT id, makine_id, bakim_turu, bakim_tarihi, aciklama, maliyet FROM bakim_kaydi'
      );
      
      for (const maintenance of maintenanceResult.rows as any[]) {
        const { error } = await supabase
          .from('bakim_kaydi')
          .insert(maintenance);
        
        if (!error) results.bakim_kaydi++;
      }
      console.log(`✅ ${results.bakim_kaydi} bakım kaydı aktarıldı`);
    } catch (err: any) {
      console.error('❌ Bakım hatası:', err);
      results.errors.push(`Maintenance migration error: ${err.message}`);
    }

    // 10. Arıza Kayıtları
    console.log('⚠️ Arıza kayıtları aktarılıyor...');
    try {
      const failureResult = await oldDbClient.queryObject(
        'SELECT id, makine_id, baslangic_tarihi, bitis_tarihi, aciklama, sure_saat, maliyet FROM ariza_kaydi'
      );
      
      for (const failure of failureResult.rows as any[]) {
        const { error } = await supabase
          .from('ariza_kaydi')
          .insert(failure);
        
        if (!error) results.ariza_kaydi++;
      }
      console.log(`✅ ${results.ariza_kaydi} arıza kaydı aktarıldı`);
    } catch (err: any) {
      console.error('❌ Arıza hatası:', err);
      results.errors.push(`Failure migration error: ${err.message}`);
    }

    // 11. Hammadde Giriş
    console.log('📥 Hammadde giriş kayıtları aktarılıyor...');
    try {
      const entryResult = await oldDbClient.queryObject(
        'SELECT id, hammadde_id, miktar, birim_fiyat, toplam_tutar, giris_tarihi, tedarikci FROM hammadde_giris'
      );
      
      for (const entry of entryResult.rows as any[]) {
        const { error } = await supabase
          .from('hammadde_giris')
          .insert(entry);
        
        if (!error) results.hammadde_giris++;
      }
      console.log(`✅ ${results.hammadde_giris} giriş kaydı aktarıldı`);
    } catch (err: any) {
      console.error('❌ Hammadde giriş hatası:', err);
      results.errors.push(`Material entry migration error: ${err.message}`);
    }

    await oldDbClient.end();
    console.log('✅ Eski veritabanı bağlantısı kapatıldı');

    console.log('🎉 Migration tamamlandı!');
    console.log('📊 Sonuçlar:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration tamamlandı',
        results,
        note: 'Tüm kullanıcılar için varsayılan şifre: Fabrika2025!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Migration hatası:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
