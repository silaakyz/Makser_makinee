import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: MetricCardProps) {
  const variantClasses = {
    default: "border-border",
    success: "border-success/50 bg-success/5",
    warning: "border-warning/50 bg-warning/5",
    destructive: "border-destructive/50 bg-destructive/5",
  };

  return (
    <Card className={cn("shadow-card hover:shadow-hover transition-all", variantClasses[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-sm mt-2",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              variant === "success" && "bg-success/20",
              variant === "warning" && "bg-warning/20",
              variant === "destructive" && "bg-destructive/20",
              variant === "default" && "bg-primary/20"
            )}
          >
            <Icon
              className={cn(
                "w-6 h-6",
                variant === "success" && "text-success",
                variant === "warning" && "text-warning",
                variant === "destructive" && "text-destructive",
                variant === "default" && "text-primary"
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
