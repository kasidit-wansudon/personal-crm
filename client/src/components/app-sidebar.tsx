import { LayoutDashboard, Users, UserPlus } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { PerplexityAttribution } from "./PerplexityAttribution";

// Sidebar navigation items
const navItems = [
  { title: "แดชบอร์ด", url: "/", icon: LayoutDashboard },
  { title: "รายชื่อติดต่อ", url: "/contacts", icon: Users },
];

// CRM logo as inline SVG
function CrmLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-label="Personal CRM"
    >
      <rect
        x="2"
        y="2"
        width="24"
        height="24"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
      />
      <circle cx="14" cy="11" r="4" stroke="currentColor" strokeWidth="1.8" className="text-primary" />
      <path
        d="M8 22c0-3.314 2.686-6 6-6s6 2.686 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-primary"
      />
    </svg>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <CrmLogo />
          <span className="font-semibold text-sm tracking-tight">Personal CRM</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>เมนู</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                // Check active state for nested routes
                const isActive =
                  item.url === "/"
                    ? location === "/" || location === ""
                    : location.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive}>
                      <Link href={item.url} data-testid={`nav-${item.url.replace("/", "") || "dashboard"}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <PerplexityAttribution />
      </SidebarFooter>
    </Sidebar>
  );
}
