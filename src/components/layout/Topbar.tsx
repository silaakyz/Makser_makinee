import { Factory } from "lucide-react";
import { Card } from "@/components/ui/card";
import { mockKPIs } from "@/lib/mockData";

export function Topbar() {
  const kpiData = [
    {
      title: "Üretim Verimliliği",
      value: `${mockKPIs.uretimVerimlilik}%`,
      subtitle: "Günlük OEE Ortalaması",
    },
    {
      title: "Ürün Stok Durumu",
      value: "124.500 adet",
      subtitle: "Toplam stok",
    },
    {
      title: "Üretimde / Tamamlanan",
      value: "12 / 48 sipariş",
      subtitle: "Güncel üretim yükü",
    },
    {
      title: "Makine Bakım Geçmişi",
      value: "4 gün önce",
      subtitle: "27 bakım kaydı",
    },
  ];

  return (
    <div className="h-20 bg-gradient-to-r from-[#0A1128] to-[#122044] border-b border-sidebar-border px-6">
      <div className="h-full flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Factory className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">ÜRETİM</h1>
            <p className="text-xs text-muted-foreground">Yönetim Sistemi</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="flex-1 grid grid-cols-4 gap-4 max-w-5xl">
          {kpiData.map((kpi, index) => (
            <Card 
              key={index}
              className="relative p-4 bg-card border-l-2 border-l-primary shadow-sm hover:shadow-md transition-all"
            >
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{kpi.title}</p>
                <p className="text-xl font-bold text-card-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
