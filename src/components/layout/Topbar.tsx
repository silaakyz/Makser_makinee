import { LogOut, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockKPIs } from "@/lib/mockData";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ROLE_NAMES } from "@/config/rolePermissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="h-20 bg-gradient-to-r from-[#0A1128] to-[#122044] border-b border-sidebar-border px-6">
      <div className="h-full flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <img 
            src="/logo.png" 
            alt="Makser Makina Logo" 
            className="h-12 w-auto object-contain"
          />
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

        {/* User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium text-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {roles.map(r => ROLE_NAMES[r]).join(', ')}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}