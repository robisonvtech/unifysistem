export type SubscriptionPlan = "free" | "start" | "pro" | "elite" | "inactive";

const ACTIVE_PLANS = new Set<SubscriptionPlan>(["start", "pro", "elite"]);
const PLAN_VALUES = new Set(["start", "pro", "elite", "free", "inactive"]);

export function normalizeSubscriptionStatus(value: unknown): SubscriptionPlan {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (PLAN_VALUES.has(normalized)) {
      return normalized as SubscriptionPlan;
    }
  }

  return "free";
}

export function hasAccessToApp(value: unknown): boolean {
  return ACTIVE_PLANS.has(normalizeSubscriptionStatus(value));
}

export function getPlanFromCaktoProductId(
  productId: string | undefined | null,
  env: Record<string, string | undefined>,
): SubscriptionPlan {
  const normalizedId = productId?.trim();
  if (!normalizedId) return "free";

  const mappings: Array<[SubscriptionPlan, string | undefined]> = [
    ["start", env.CAKTO_START_PRODUCT_ID],
    ["pro", env.CAKTO_PRO_PRODUCT_ID],
    ["elite", env.CAKTO_ELITE_PRODUCT_ID],
    ["pro", env.CAKTO_PRODUCT_ID],
  ];

  for (const [plan, configuredId] of mappings) {
    if (configuredId && normalizedId === configuredId.trim()) {
      return plan;
    }
  }

  return "free";
}
