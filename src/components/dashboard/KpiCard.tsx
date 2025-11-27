import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "destructive" | "info";
  className?: string;
}

const variantStyles = {
  default: "border-l-4 border-l-primary shadow-card hover:shadow-hover",
  success: "border-l-4 border-l-success shadow-card hover:shadow-hover",
  warning: "border-l-4 border-l-warning shadow-card hover:shadow-hover",
  destructive: "border-l-4 border-l-destructive shadow-card hover:shadow-hover",
  info: "border-l-4 border-l-primary shadow-card hover:shadow-hover",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
};

export function KpiCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  variant = "default",
  className 
}: KpiCardProps) {
  return (
    <Card 
      className={cn(
        "p-6 bg-card transition-all",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-card-foreground mb-1">{value}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          iconVariantStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
