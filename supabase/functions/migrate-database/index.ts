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

    // Önce eski DB'deki tabloları listele
    console.log('📋 Eski veritabanındaki tablolar sorgulanıyor...');
    const tablesResult = await oldDbClient.queryObject(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('📊 Bulunan tablolar ve kolonlar:');
    const tableStructure: any = {};
    for (const row of tablesResult.rows as any[]) {
      if (!tableStructure[row.table_name]) {
        tableStructure[row.table_name] = [];
      }
      tableStructure[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable
      });
    }
    
    console.log(JSON.stringify(tableStructure, null, 2));


    const results: any = {
      tables_discovered: Object.keys(tableStructure),
      table_structure: tableStructure,
      migration_status: 'Schema discovery completed'
    };

    await oldDbClient.end();
    console.log('✅ Eski veritabanı bağlantısı kapatıldı');

    console.log('🎉 Schema discovery tamamlandı!');
    console.log('📊 Sonuçlar:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schema discovery tamamlandı',
        results
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
