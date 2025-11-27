import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Factory,
  Settings,
  Package,
  ShoppingCart,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Üretim", url: "/uretim", icon: Factory },
  { title: "Makine", url: "/makine", icon: Settings },
  { title: "Stoklar", url: "/stoklar", icon: Package },
  { title: "Siparişler", url: "/siparisler", icon: ShoppingCart },
  { title: "Finansal Özet", url: "/finansal", icon: DollarSign },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border bg-gradient-to-b from-[#0A1128] to-[#0D1533]">
      <SidebarContent>
        <SidebarGroup className="pt-6">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-4 py-3 rounded-full mx-3 transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-glow"
                            : "text-sidebar-foreground hover:bg-sidebar-border hover:shadow-[0_0_10px_rgba(93,199,243,0.2)]"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
