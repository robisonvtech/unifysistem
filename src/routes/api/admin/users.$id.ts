import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/users/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const id = params.id as string;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: profile } = await supabaseAdmin.from("profiles").select("id, display_name, subscription_status, avatar_url, created_at").eq("id", id).maybeSingle();
          const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", id);

          // recent actions — use service_order_events as basic activity log
          const { data: events } = await supabaseAdmin.from("service_order_events").select("id, type, payload, created_at").eq("actor_id", id).order("created_at", { ascending: false }).limit(50);

          return new Response(JSON.stringify({ profile, roles: roles ?? [], events: events ?? [] }), { status: 200, headers: { "content-type": "application/json" } });
        } catch (err: any) {
          console.error("[Admin] get user error", err?.message ?? err);
          return new Response(JSON.stringify({ error: "Could not fetch user" }), { status: 500, headers: { "content-type": "application/json" } });
        }
      },

      PATCH: async ({ params, request }) => {
        try {
          const id = params.id as string;
          const body = await request.json();
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const updates: any = {};
          if (typeof body.subscription_status === "string") updates.subscription_status = body.subscription_status;

          if (Object.keys(updates).length > 0) {
            await supabaseAdmin.from("profiles").update(updates).eq("id", id);
          }

          if (Array.isArray(body.roles)) {
            // replace roles: simple approach — delete existing and insert provided
            await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
            const toInsert = body.roles.map((r: string) => ({ user_id: id, role: r }));
            if (toInsert.length) await supabaseAdmin.from("user_roles").insert(toInsert);
          }

          return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
        } catch (err: any) {
          console.error("[Admin] patch user error", err?.message ?? err);
          return new Response(JSON.stringify({ error: "Could not update user" }), { status: 500, headers: { "content-type": "application/json" } });
        }
      },
    },
  },
});
