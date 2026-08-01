import { createFileRoute } from "@tanstack/react-router";
import { getPlanFromCaktoProductId } from "@/lib/subscription";

type CaktoWebhook = {
  secret?: unknown;
  event?: unknown;
  data?: {
    customer?: { email?: unknown };
    product?: { id?: unknown };
    subscription?: { id?: unknown; status?: unknown };
    status?: unknown;
  };
};

const ACTIVE_EVENTS = new Set(["purchase_approved", "subscription_renewed"]);
const REVOKED_EVENTS = new Set(["refund", "chargeback", "subscription_canceled"]);

export const Route = createFileRoute("/api/cakto/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const configuredSecret = process.env.CAKTO_WEBHOOK_SECRET;
        if (!configuredSecret) {
          console.error("[Cakto] CAKTO_WEBHOOK_SECRET is not configured.");
          return new Response("Webhook not configured", { status: 503 });
        }

        let payload: CaktoWebhook;
        try {
          payload = (await request.json()) as CaktoWebhook;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (payload.secret !== configuredSecret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const event = typeof payload.event === "string" ? payload.event : "";
        const email = typeof payload.data?.customer?.email === "string"
          ? payload.data.customer.email.trim().toLowerCase()
          : "";
        const productId = typeof payload.data?.product?.id === "string" ? payload.data.product.id : "";
        const configuredProductId = process.env.CAKTO_PRODUCT_ID;
        const startProductId = process.env.CAKTO_START_PRODUCT_ID;
        const proProductId = process.env.CAKTO_PRO_PRODUCT_ID;
        const eliteProductId = process.env.CAKTO_ELITE_PRODUCT_ID;
        const knownProductIds = [configuredProductId, startProductId, proProductId, eliteProductId].filter(Boolean) as string[];

        if (!email || !event || knownProductIds.length === 0 || !knownProductIds.includes(productId)) {
          // Returning success avoids needless retries for unrelated products or incomplete events.
          return new Response(null, { status: 204 });
        }

        const subscriptionId = typeof payload.data?.subscription?.id === "string"
          ? payload.data.subscription.id
          : null;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const status = ACTIVE_EVENTS.has(event) ? getPlanFromCaktoProductId(productId, {
          CAKTO_PRODUCT_ID: configuredProductId,
          CAKTO_START_PRODUCT_ID: startProductId,
          CAKTO_PRO_PRODUCT_ID: proProductId,
          CAKTO_ELITE_PRODUCT_ID: eliteProductId,
        }) : "inactive";

        if (!ACTIVE_EVENTS.has(event) && !REVOKED_EVENTS.has(event)) return new Response(null, { status: 204 });

        const { error } = await (supabaseAdmin.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>)("set_cakto_subscription_status", {
          _email: email,
          _status: status === "inactive" ? "inactive" : status,
          _product_id: productId,
          _subscription_id: subscriptionId,
        });

        if (error) {
          console.error("[Cakto] Could not update subscription:", error.message);
          return new Response("Could not update subscription", { status: 500 });
        }

        return new Response(null, { status: 204 });
      },
    },
  },
});
