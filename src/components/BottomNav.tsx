import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, Users, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/orders", label: "OS", icon: ClipboardList },
  { to: "/customers", label: "Clientes", icon: Users },
  { to: "/chat", label: "IA", icon: MessageSquare },
  { to: "/profile", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
