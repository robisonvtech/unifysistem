import { useEffect } from "react";
import { useEntitlements } from "./useEntitlements";

export type Plan = "start" | "pro" | "elite";

export interface PlanTheme {
  plan: Plan;
  label: string;
  badgeClass: string;
  isDark: boolean;
}

/**
 * Derives the user's plan from entitlements and applies the `data-plan`
 * attribute to the <html> element so global tokens switch instantly.
 */
export function usePlan(): PlanTheme {
  const { isAdmin, isPro, loading } = useEntitlements();

  const plan: Plan = isAdmin ? "elite" : isPro ? "pro" : "start";

  useEffect(() => {
    if (loading) return;
    const root = document.documentElement;
    root.setAttribute("data-plan", plan);
    if (plan === "elite") root.classList.add("dark");
    else root.classList.remove("dark");
    return () => {
      root.removeAttribute("data-plan");
      root.classList.remove("dark");
    };
  }, [plan, loading]);

  return {
    plan,
    label: plan === "elite" ? "ELITE" : plan === "pro" ? "PRO" : "START",
    badgeClass:
      plan === "elite"
        ? "bg-primary text-primary-foreground shadow-[0_0_20px_oklch(0.62_0.26_27.5/0.6)]"
        : plan === "pro"
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
    isDark: plan === "elite",
  };
}
