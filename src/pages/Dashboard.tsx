import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Factory,
  Package,
  ShoppingCart,
  AlertTriangle,
  Activity,
  TrendingUp,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

interface DashboardStats {
  activeProduction: number;
  activeMachines: number;
  criticalStock: number;
  pendingOrders: number;
  totalMachines: number;
  productionRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeProduction: 0,
    activeMachines: 0,
    criticalStock: 0,
    pendingOrders: 0,
    totalMachines: 0,
    productionRate: 0,
  });

  const [recentProductions, setRecentProductions] = useState<any[]>([]);
  const [machineStatus, setMachineStatus] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Aktif üretimler
    const { data: activeProductions } = await supabase
      .from("uretim")
      .select("*")
      .eq("durum", "devam_ediyor");

    // Makineler
    const { data: machines } = await supabase.from("makine").select("*");
    const activeMachines = machines?.filter((m) => m.durum === "aktif").length || 0;

    // Kritik stok
    const { data: products } = await supabase.from("urun").select("*");
    const criticalStock =
      products?.filter((p) => p.stok_miktari <= p.kritik_stok_seviyesi).length || 0;

    // Bekleyen siparişler
    const { data: orders } = await supabase
      .from("siparis")
      .select("*")
      .eq("durum", "beklemede");

    // Son üretimler
    const { data: productions } = await supabase
      .from("uretim")
      .select(`*, urun(ad), makine(ad)`)
      .order("created_at", { ascending: false })
      .limit(5);

    setStats({
      activeProduction: activeProductions?.length || 0,
      activeMachines: activeMachines,
      criticalStock: criticalStock,
      pendingOrders: orders?.length || 0,
      totalMachines: machines?.length || 0,
      productionRate: 85,
    });

    setRecentProductions(productions || []);
    setMachineStatus(machines || []);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Üretim yönetim sistemi genel görünümü</p>
        </div>

        {/* Metrik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Üretim Verimliliği"
            value={`${stats.productionRate}%`}
            icon={TrendingUp}
            variant="success"
            trend={{ value: 5, isPositive: true }}
          />
          <MetricCard
            title="Aktif Üretimler"
            value={stats.activeProduction}
            icon={Factory}
            variant="default"
          />
          <MetricCard
            title="Çalışan Makineler"
            value={`${stats.activeMachines}/${stats.totalMachines}`}
            icon={Activity}
            variant="default"
          />
          <MetricCard
            title="Kritik Stok"
            value={stats.criticalStock}
            icon={AlertTriangle}
            variant={stats.criticalStock > 0 ? "warning" : "success"}
          />
          <MetricCard
            title="Bekleyen Siparişler"
            value={stats.pendingOrders}
            icon={ShoppingCart}
            variant={stats.pendingOrders > 10 ? "warning" : "default"}
          />
          <MetricCard
            title="Ürün Stok Durumu"
            value="İyi"
            icon={Package}
            variant="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Son Üretimler */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-xl">Üretimdeki İşler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProductions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Henüz üretim kaydı bulunmuyor
                  </p>
                ) : (
                  recentProductions.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {prod.urun?.ad || "Bilinmeyen Ürün"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {prod.makine?.ad || "Bilinmeyen Makine"}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={prod.durum} />
                        <p className="text-sm text-muted-foreground mt-1">
                          {prod.uretilen_adet}/{prod.hedef_adet} adet
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Makine Durumu */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-xl">Makine Bakım Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {machineStatus.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Henüz makine kaydı bulunmuyor
                  </p>
                ) : (
                  machineStatus.slice(0, 5).map((machine) => (
                    <div
                      key={machine.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">{machine.ad}</p>
                        <p className="text-sm text-muted-foreground">{machine.tur}</p>
                      </div>
                      <StatusBadge status={machine.durum} />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
