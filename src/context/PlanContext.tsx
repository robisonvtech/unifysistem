import React, { createContext, useContext, useEffect, useState } from "react";

export type PlanType = "start" | "pro" | "elite";

interface PlanContextType {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (show: boolean) => void;
  activeMascotState: string;
  setActiveMascotState: (state: string) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlanState] = useState<PlanType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("unify_plan") as PlanType;
      if (saved && ["start", "pro", "elite"].includes(saved)) return saved;
    }
    return "pro"; // default to PRO as shown in middle mockup
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [activeMascotState, setActiveMascotState] = useState<string>("idle");

  const setPlan = (newPlan: PlanType) => {
    setPlanState(newPlan);
    if (typeof window !== "undefined") {
      localStorage.setItem("unify_plan", newPlan);
    }
  };

  useEffect(() => {
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = plan === "elite" || plan === "pro" || prefersDark;

    document.documentElement.classList.toggle("dark", shouldUseDark);
    document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";

    if (typeof window !== "undefined") {
      localStorage.setItem("unify_theme", shouldUseDark ? "dark" : "light");
    }
  }, [plan]);

  return (
    <PlanContext.Provider
      value={{
        plan,
        setPlan,
        isAdmin,
        setIsAdmin,
        showAdminPanel,
        setShowAdminPanel,
        activeMascotState,
        setActiveMascotState,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be used within a PlanProvider");
  }
  return context;
}
