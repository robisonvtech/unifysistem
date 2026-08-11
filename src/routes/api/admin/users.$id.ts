import { createFileRoute } from "@tanstack/react-router";

async function requireAdmin(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin");
  if (!roles || roles.length === 0) return null;
  return data.user;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export const Route = createFileRoute("/api/admin/users/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        if (!(await requireAdmin(request))) return json({ error: "Unauthorized" }, 401);
        try {
          const id = params.id as string;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, display_name, subscription_status, avatar_url, created_at, access_expires_at, blocked, device_id")
            .eq("id", id)
            .maybeSingle();
          const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", id);
          return json({ profile, roles: roles ?? [] });
        } catch (err) {
          console.error("[Admin] get user error", err);
          return json({ error: "Could not fetch user" }, 500);
        }
      },

      PATCH: async ({ params, request }) => {
        if (!(await requireAdmin(request))) return json({ error: "Unauthorized" }, 401);
        try {
          const id = params.id as string;
          const body = (await request.json()) as Record<string, unknown>;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const updates: {
            subscription_status?: string;
            blocked?: boolean;
            device_id?: string | null;
            access_expires_at?: string | null;
          } = {};
          if (typeof body.subscription_status === "string") updates.subscription_status = body.subscription_status;
          if (typeof body.blocked === "boolean") updates.blocked = body.blocked;
          if (body.reset_device === true) updates.device_id = null;
          if (typeof body.days === "number") {
            updates.access_expires_at =
              body.days > 0 ? new Date(Date.now() + Math.min(body.days, 3650) * 86400000).toISOString() : null;
          }

          if (Object.keys(updates).length > 0) {
            await supabaseAdmin.from("profiles").update(updates).eq("id", id);
          }

          return json({ ok: true });
        } catch (err) {
          console.error("[Admin] patch user error", err);
          return json({ error: "Could not update user" }, 500);
        }
      },
    },
  },
});
