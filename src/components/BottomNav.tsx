import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, GraduationCap, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifyMascot } from "./UnifyMascot";

const leftItems = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/orders", label: "Ordens", icon: ClipboardList },
] as const;

const rightItems = [
  { to: "/courses", label: "Cursos", icon: GraduationCap },
  { to: "/profile", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const chatActive = pathname === "/chat" || pathname.startsWith("/chat/");

  const NavLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: typeof User }) => {
    const active = pathname === to || pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        className={cn(
          "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className={cn("h-5 w-5 transition-transform", active && "stroke-[2.5] scale-110")} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background via-background/80 to-transparent" />
      <div className="relative mx-auto flex max-w-2xl items-end">
        <div className="glass-card mx-3 mb-3 flex flex-1 items-stretch rounded-full px-2 shadow-[0_10px_40px_-20px_oklch(0_0_0/0.3)]">
          {leftItems.map((i) => <NavLink key={i.to} {...i} />)}
          <div className="w-16" aria-hidden />
          {rightItems.map((i) => <NavLink key={i.to} {...i} />)}
        </div>
        <Link
          to="/chat"
          className={cn(
            "absolute left-1/2 -translate-x-1/2 -top-3 flex h-16 w-16 items-center justify-center rounded-full",
            "gradient-primary shadow-[0_10px_30px_-8px_oklch(0.505_0.235_27.5/0.5)] transition-transform",
            "hover:scale-105 active:scale-95",
            chatActive && "elite-glow",
          )}
          aria-label="Falar com a Unify"
        >
          <UnifyMascot size={44} state={chatActive ? "celebrating" : "idle"} />
        </Link>
      </div>
    </nav>
  );
}
