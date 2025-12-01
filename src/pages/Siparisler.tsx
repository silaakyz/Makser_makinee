import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { ShoppingCart, Clock, CheckCircle, Loader, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SiparisData {
  id: string;
  musteri: string;
  urun_id: string | null;
  miktar: number;
  durum: "beklemede" | "uretimde" | "tamamlandi";
  kaynak: string | null;
  siparis_tarihi: string;
  teslim_tarihi: string | null;
  siparis_maliyeti: number;
  urun?: {
    id: string;
    ad: string;
  } | null;
}

const KPI_DEFAULT = {
  sipariseTamamlamaOrani: 85,
};

export default function Siparisler() {
  const { roles } = useAuth();
  const [siparisler, setSiparisler] = useState<SiparisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManageOrders = roles.some(role =>
    ["sirket_sahibi", "genel_mudur", "uretim_sefi"].includes(role)
  );

  useEffect(() => {
    fetchSiparisler();
  }, []);

  const fetchSiparisler = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("siparis")
        .select(`
          *,
          urun:urun_id (
            id,
            ad
          )
        `)
        .order("siparis_tarihi", { ascending: false });

      if (error) throw error;
      setSiparisler(data || []);
    } catch (error: any) {
      console.error("Sipariş listesi yüklenirken hata:", error);
      toast.error("Sipariş listesi yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const bekleyenSiparisler = siparisler.filter(s => s.durum === "beklemede");
  const uretimdeSiparisler = siparisler.filter(s => s.durum === "uretimde");
  const tamamlananSiparisler = siparisler.filter(s => s.durum === "tamamlandi");
  const toplamTutar = siparisler.reduce((sum, s) => sum + (s.siparis_maliyeti || 0), 0);

  const handleApproveOrder = async (order: SiparisData) => {
    try {
      setActionLoading(order.id);
      const { error } = await supabase
        .from("siparis")
        .update({ durum: "uretimde" })
        .eq("id", order.id);

      if (error) throw error;
      toast.success("Sipariş üretim sürecine alındı");
      fetchSiparisler();
    } catch (error: any) {
      console.error("Sipariş onaylanırken hata:", error);
      toast.error("Sipariş onaylanamadı");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteOrder = async (order: SiparisData) => {
    if (!order.urun_id) {
      toast.error("Siparişe ait ürün bulunamadı");
      return;
    }

    try {
      setActionLoading(order.id);

      const { data: product, error: productError } = await supabase
        .from("urun")
        .select("stok_miktari")
        .eq("id", order.urun_id)
        .maybeSingle();

      if (productError) throw productError;
      const newProductStock = Math.max(0, (product?.stok_miktari || 0) - order.miktar);

      const { error: updateProductError } = await supabase
        .from("urun")
        .update({ stok_miktari: newProductStock })
        .eq("id", order.urun_id);

      if (updateProductError) throw updateProductError;

      const { data: recipe, error: recipeError } = await supabase
        .from("urun_hammadde")
        .select("hammadde_id, miktar")
        .eq("urun_id", order.urun_id);

      if (recipeError) throw recipeError;

      for (const row of recipe || []) {
        const usage = (row.miktar || 0) * order.miktar;
        const { data: material, error: materialError } = await supabase
          .from("hammadde")
          .select("stok_miktari")
          .eq("id", row.hammadde_id)
          .maybeSingle();

        if (materialError) throw materialError;

        const newMaterialStock = Math.max(0, (material?.stok_miktari || 0) - usage);
        const { error: updateMaterialError } = await supabase
          .from("hammadde")
          .update({ stok_miktari: newMaterialStock })
          .eq("id", row.hammadde_id);

        if (updateMaterialError) throw updateMaterialError;
      }

      const { error: orderError } = await supabase
        .from("siparis")
        .update({
          durum: "tamamlandi",
          teslim_tarihi: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      toast.success("Sipariş tamamlandı, stoklar güncellendi");
      fetchSiparisler();
    } catch (error: any) {
      console.error("Sipariş tamamlanırken hata:", error);
      toast.error("Sipariş tamamlanamadı");
    } finally {
      setActionLoading(null);
    }
  };

  const exportToExcel = () => {
    const siparisData = siparisler.map((s) => ({
      "Müşteri": s.musteri,
      "Ürün": s.urun?.ad || "Bilinmiyor",
      "Miktar": s.miktar,
      "Durum": s.durum,
      "Kaynak": s.kaynak,
      "Sipariş Tarihi": s.siparis_tarihi,
      "Teslim Tarihi": s.teslim_tarihi || "-",
      "Sipariş Maliyeti (₺)": s.siparis_maliyeti,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(siparisData);
    XLSX.utils.book_append_sheet(wb, ws, "Siparişler");

    const fileName = `Siparis_Raporu_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Sipariş raporu başarıyla indirildi!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Sipariş Yönetimi</h1>
            <p className="text-white/70">Sipariş takibi ve durum kontrolü</p>
          </div>
          <div className="flex gap-2">
            <CreateOrderDialog />
            <Button onClick={exportToExcel} className="gap-2" variant="outline">
              <Download className="w-4 h-4" />
              Excel Raporu İndir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Bekleyen Siparişler"
            value={bekleyenSiparisler.length}
            icon={Clock}
            variant="warning"
            subtitle="Onay bekleyen"
          />
          <KpiCard
            title="Üretimde"
            value={uretimdeSiparisler.length}
            icon={Loader}
            variant="info"
            subtitle="Devam eden"
          />
          <KpiCard
            title="Tamamlanan"
            value={tamamlananSiparisler.length}
            icon={CheckCircle}
            variant="success"
            subtitle={`%${KPI_DEFAULT.sipariseTamamlamaOrani} tamamlama`}
          />
          <KpiCard
            title="Toplam Tutar"
            value={`₺${(toplamTutar / 1000).toFixed(0)}K`}
            icon={ShoppingCart}
            variant="default"
            subtitle="Aylık sipariş değeri"
          />
        </div>

        <Card className="bg-card border-l-4 border-l-warning shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Bekleyen Siparişler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Sipariş Tarihi</TableHead>
                  <TableHead>Teslim Tarihi</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead>Durum</TableHead>
                  {canManageOrders && <TableHead>İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bekleyenSiparisler.map((siparis) => (
                  <TableRow key={siparis.id}>
                    <TableCell className="font-medium">{siparis.musteri}</TableCell>
                    <TableCell>{siparis.urun?.ad || "-"}</TableCell>
                    <TableCell>{siparis.miktar}</TableCell>
                    <TableCell>{siparis.siparis_tarihi}</TableCell>
                    <TableCell>{siparis.teslim_tarihi || "-"}</TableCell>
                    <TableCell>₺{siparis.siparis_maliyeti.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.durum} />
                    </TableCell>
                    {canManageOrders && (
                      <TableCell>
                        <Button
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          size="sm"
                          onClick={() => handleApproveOrder(siparis)}
                          disabled={actionLoading === siparis.id}
                        >
                          {actionLoading === siparis.id ? "Onaylanıyor..." : "Onayla"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {bekleyenSiparisler.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManageOrders ? 8 : 7} className="text-center text-muted-foreground py-6">
                      Bekleyen sipariş bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-l-4 border-l-primary shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Loader className="w-5 h-5 text-primary" />
              Üretimdeki Siparişler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Kaynak</TableHead>
                  <TableHead>Teslim Tarihi</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead>Durum</TableHead>
                  {canManageOrders && <TableHead>İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {uretimdeSiparisler.map((siparis) => (
                  <TableRow key={siparis.id}>
                    <TableCell className="font-medium">{siparis.musteri}</TableCell>
                    <TableCell>{siparis.urun?.ad || "-"}</TableCell>
                    <TableCell>{siparis.miktar}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.kaynak} />
                    </TableCell>
                    <TableCell>{siparis.teslim_tarihi || "-"}</TableCell>
                    <TableCell>₺{siparis.siparis_maliyeti.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.durum} />
                    </TableCell>
                    {canManageOrders && (
                      <TableCell>
                        <Button
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          size="sm"
                          onClick={() => handleCompleteOrder(siparis)}
                          disabled={actionLoading === siparis.id}
                        >
                          {actionLoading === siparis.id ? "Tamamlanıyor..." : "Tamamla"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {uretimdeSiparisler.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManageOrders ? 8 : 7} className="text-center text-muted-foreground py-6">
                      Üretimde sipariş bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Tamamlanan Siparişler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Sipariş Tarihi</TableHead>
                  <TableHead>Teslim Tarihi</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tamamlananSiparisler.map((siparis) => (
                  <TableRow key={siparis.id}>
                    <TableCell className="font-medium">{siparis.musteri}</TableCell>
                    <TableCell>{siparis.urun?.ad || "-"}</TableCell>
                    <TableCell>{siparis.miktar}</TableCell>
                    <TableCell>{siparis.siparis_tarihi}</TableCell>
                    <TableCell>{siparis.teslim_tarihi || "-"}</TableCell>
                    <TableCell>₺{siparis.siparis_maliyeti.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.durum} />
                    </TableCell>
                  </TableRow>
                ))}
                {tamamlananSiparisler.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      Tamamlanan sipariş bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPlaceholder
            title="Sipariş Durum Dağılımı"
            type="pie"
            height="h-80"
          />
          <ChartPlaceholder
            title="Aylık Sipariş Trendi"
            type="line"
            height="h-80"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

