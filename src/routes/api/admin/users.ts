import { createFileRoute } from "@tanstack/react-router";

type CreateUserBody = {
  email?: string;
  password?: string;
  display_name?: string;
  role?: string | null;
  days?: number | null;
};

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

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await requireAdmin(request))) return json({ error: "Unauthorized" }, 401);
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("id, display_name, subscription_status, avatar_url, created_at, access_expires_at, blocked, device_id")
            .order("created_at", { ascending: false });
          const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");

          const roleMap = new Map<string, string[]>();
          (roles ?? []).forEach((r) => {
            const arr = roleMap.get(r.user_id) ?? [];
            arr.push(r.role);
            roleMap.set(r.user_id, arr);
          });

          const users = (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
          return json({ users });
        } catch (err) {
          console.error("[Admin] list users error", err);
          return json({ error: "Could not list users" }, 500);
        }
      },

      POST: async ({ request }) => {
        if (!(await requireAdmin(request))) return json({ error: "Unauthorized" }, 401);

        let body: CreateUserBody;
        try {
          body = (await request.json()) as CreateUserBody;
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }

        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const display_name = typeof body.display_name === "string" ? body.display_name : null;
        const role = body.role === "admin" || body.role === "user" ? body.role : null;
        const days = typeof body.days === "number" && body.days > 0 ? Math.min(body.days, 3650) : null;

        if (!email || password.length < 6) {
          return json({ error: "Informe e-mail e senha com no mínimo 6 caracteres." }, 400);
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { display_name },
          });

          if (error || !created?.user) {
            return json({ error: error?.message ?? "Não foi possível criar o usuário." }, 400);
          }

          const expires = days ? new Date(Date.now() + days * 86400000).toISOString() : null;

          await supabaseAdmin.from("profiles").upsert({
            id: created.user.id,
            display_name,
            subscription_status: "free",
            access_expires_at: expires,
            blocked: false,
            device_id: null,
          });

          if (role) {
            await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role });
          }

          return json({ user: { id: created.user.id, email, access_expires_at: expires } }, 201);
        } catch (err) {
          console.error("[Admin] create user error", err);
          return json({ error: "Could not create user" }, 500);
        }
      },
    },
  },
});
