import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
  aktif: { label: "Aktif", variant: "default", className: "bg-primary text-primary-foreground" },
  boşta: { label: "Boşta", variant: "secondary", className: "bg-secondary text-white" },
  arızalı: { label: "Arızalı", variant: "destructive", className: "bg-destructive text-destructive-foreground" },
  bakımda: { label: "Bakımda", variant: "default", className: "bg-warning text-warning-foreground" },
  devam_ediyor: { label: "Devam Ediyor", variant: "default", className: "bg-primary text-primary-foreground" },
  tamamlandi: { label: "Tamamlandı", variant: "default", className: "bg-success text-success-foreground" },
  iptal: { label: "İptal", variant: "destructive", className: "bg-destructive text-destructive-foreground" },
  beklemede: { label: "Beklemede", variant: "secondary", className: "bg-warning text-warning-foreground" },
  uretimde: { label: "Üretimde", variant: "default", className: "bg-primary text-primary-foreground" },
  stok: { label: "Stok", variant: "default", className: "bg-primary text-primary-foreground" },
  uretim: { label: "Üretim", variant: "default", className: "bg-primary text-primary-foreground" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary", className: "" };
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
