import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Settings, AlertTriangle, Wrench, Activity, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MakineData {
  id: string;
  ad: string;
  tur: string;
  uretim_kapasitesi: number;
  durum: 'aktif' | 'boşta' | 'arızalı' | 'bakımda';
  son_bakim_tarihi: string | null;
  sonraki_bakim_tarihi: string | null;
}

export default function Makine() {
  const { roles } = useAuth();
  const [makineler, setMakineler] = useState<MakineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const isAdmin = roles.includes('sirket_sahibi') || roles.includes('genel_mudur');

  useEffect(() => {
    fetchMakineler();
  }, []);

  const fetchMakineler = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('makine')
        .select('*')
        .order('ad');

      if (error) throw error;
      setMakineler(data || []);
    } catch (error: any) {
      console.error('Makine verileri yüklenirken hata:', error);
      toast.error('Makine verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const updateMakineDurum = async (makineId: string, yeniDurum: 'aktif' | 'boşta' | 'arızalı' | 'bakımda') => {
    try {
      setUpdating(makineId);
      
      const { error } = await supabase
        .from('makine')
        .update({ durum: yeniDurum })
        .eq('id', makineId);

      if (error) throw error;

      toast.success('Makine durumu güncellendi');
      fetchMakineler();
    } catch (error: any) {
      console.error('Makine durumu güncellenirken hata:', error);
      toast.error('Makine durumu güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setUpdating(null);
    }
  };

  const aktifMakineler = makineler.filter(m => m.durum === "aktif").length;
  const arizaliMakineler = makineler.filter(m => m.durum === "arızalı").length;
  const bakimdaMakineler = makineler.filter(m => m.durum === "bakımda").length;

  const exportToExcel = () => {
    // Makineler için worksheet
    const machineData = makineler.map((m) => ({
      "Makine Adı": m.ad,
      "Makine Türü": m.tur,
      "Durum": m.durum,
      "Kapasite (adet/saat)": m.uretim_kapasitesi,
      "Son Bakım": m.son_bakim_tarihi || "-",
      "Sonraki Bakım": m.sonraki_bakim_tarihi || "-",
    }));

    // Bakımlar için worksheet
    const bakimData = mockBakimlar.map((b) => ({
      "Makine": b.makine,
      "Bakım Tarihi": b.bakim_tarihi,
      "Bakım Türü": b.bakim_turu,
      "Maliyet (₺)": b.maliyet,
      "Açıklama": b.aciklama,
    }));

    // Arızalar için worksheet
    const arizaData = mockArizalar.map((a) => ({
      "Makine": a.makine,
      "Başlangıç": a.baslangic_tarihi,
      "Bitiş": a.bitis_tarihi || "Devam ediyor",
      "Süre (Saat)": a.sure_saat || "-",
      "Maliyet (₺)": a.maliyet || "-",
      "Açıklama": a.aciklama,
    }));

    const wb = XLSX.utils.book_new();
    const wsMachines = XLSX.utils.json_to_sheet(machineData);
    const wsBakim = XLSX.utils.json_to_sheet(bakimData);
    const wsAriza = XLSX.utils.json_to_sheet(arizaData);

    XLSX.utils.book_append_sheet(wb, wsMachines, "Makineler");
    XLSX.utils.book_append_sheet(wb, wsBakim, "Bakım Kayıtları");
    XLSX.utils.book_append_sheet(wb, wsAriza, "Arıza Kayıtları");

    const fileName = `Makine_Raporu_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success("Makine raporu başarıyla indirildi!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Makine Yönetimi</h1>
            <p className="text-white/70">Makine durumu, bakım ve arıza takibi</p>
          </div>
          <Button onClick={exportToExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Excel Raporu İndir
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Aktif Makineler"
            value={aktifMakineler}
            icon={Activity}
            variant="success"
            subtitle={`${makineler.length} toplam makine`}
          />
          <KpiCard
            title="Çalışma Oranı"
            value={makineler.length > 0 ? `${Math.round((aktifMakineler / makineler.length) * 100)}%` : '0%'}
            icon={Settings}
            variant="info"
            subtitle="Ortalama"
          />
          <KpiCard
            title="Arızalı"
            value={arizaliMakineler}
            icon={AlertTriangle}
            variant="destructive"
            subtitle="Acil müdahale gerekli"
          />
          <KpiCard
            title="Bakımda"
            value={bakimdaMakineler}
            icon={Wrench}
            variant="warning"
            subtitle="Planlı bakım"
          />
        </div>

        {/* Makine Durum Kartları */}
        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">Makine Durumları</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {makineler.map((makine) => (
                  <Card 
                    key={makine.id}
                    className="bg-card border-2 border-border hover:border-primary/50 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Settings className="w-8 h-8 text-primary" />
                        <div className="flex items-center gap-2">
                          <StatusBadge status={makine.durum} />
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  disabled={updating === makine.id}
                                >
                                  <Wrench className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => updateMakineDurum(makine.id, 'bakımda')}
                                  disabled={makine.durum === 'bakımda' || updating === makine.id}
                                >
                                  Bakıma Al
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateMakineDurum(makine.id, 'arızalı')}
                                  disabled={makine.durum === 'arızalı' || updating === makine.id}
                                >
                                  Arızalı İşaretle
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateMakineDurum(makine.id, 'aktif')}
                                  disabled={makine.durum === 'aktif' || updating === makine.id}
                                >
                                  Aktif Yap
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateMakineDurum(makine.id, 'boşta')}
                                  disabled={makine.durum === 'boşta' || updating === makine.id}
                                >
                                  Boşta Yap
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      <h4 className="font-semibold text-card-foreground mb-1">{makine.ad}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{makine.tur}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kapasite:</span>
                          <span className="text-card-foreground font-medium">{makine.uretim_kapasitesi}/saat</span>
                        </div>
                        {makine.sonraki_bakim_tarihi && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sonraki Bakım:</span>
                            <span className="text-card-foreground font-medium">{makine.sonraki_bakim_tarihi}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {makineler.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    Henüz makine kaydı bulunmamaktadır
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yaklaşan Bakımlar */}
        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">Yaklaşan Bakımlar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Makine</TableHead>
                  <TableHead>Bakım Tarihi</TableHead>
                  <TableHead>Bakım Türü</TableHead>
                  <TableHead>Tahmini Maliyet</TableHead>
                  <TableHead>Açıklama</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {makineler
                  .filter(m => m.sonraki_bakim_tarihi)
                  .map((makine) => (
                    <TableRow key={makine.id}>
                      <TableCell className="font-medium">{makine.ad}</TableCell>
                      <TableCell>{makine.sonraki_bakim_tarihi}</TableCell>
                      <TableCell>
                        <StatusBadge status="bakımda" className="text-xs" />
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-muted-foreground">Planlı bakım</TableCell>
                    </TableRow>
                  ))}
                {makineler.filter(m => m.sonraki_bakim_tarihi).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Yaklaşan bakım kaydı bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Arıza Geçmişi */}
        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">Arızalı Makineler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Makine</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Makine Türü</TableHead>
                  <TableHead>Kapasite</TableHead>
                  {isAdmin && <TableHead>İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {makineler
                  .filter(m => m.durum === 'arızalı')
                  .map((makine) => (
                    <TableRow key={makine.id}>
                      <TableCell className="font-medium">{makine.ad}</TableCell>
                      <TableCell>
                        <StatusBadge status="arızalı" className="text-xs" />
                      </TableCell>
                      <TableCell>{makine.tur}</TableCell>
                      <TableCell>{makine.uretim_kapasitesi}/saat</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMakineDurum(makine.id, 'aktif')}
                            disabled={updating === makine.id}
                          >
                            {updating === makine.id ? 'Güncelleniyor...' : 'Aktif Yap'}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                {makineler.filter(m => m.durum === 'arızalı').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                      Arızalı makine bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPlaceholder 
            title="Günlük Çalışma Süresi" 
            type="bar"
            height="h-80"
          />
          <ChartPlaceholder 
            title="Makine Kullanım Oranı" 
            type="line"
            height="h-80"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
