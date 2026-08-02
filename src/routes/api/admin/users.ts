import { createFileRoute } from "@tanstack/react-router";

type CreateUserBody = {
  email?: string;
  password?: string;
  display_name?: string;
  role?: string | null;
};

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: profiles } = await supabaseAdmin.from("profiles").select("id, display_name, subscription_status, avatar_url, created_at");
          const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");

          const roleMap = new Map<string, string[]>();
          (roles ?? []).forEach((r: any) => {
            const arr = roleMap.get(r.user_id) ?? [];
            arr.push(r.role);
            roleMap.set(r.user_id, arr);
          });

          const users = (profiles ?? []).map((p: any) => ({
            id: p.id,
            display_name: p.display_name,
            subscription_status: p.subscription_status,
            avatar_url: p.avatar_url,
            created_at: p.created_at,
            roles: roleMap.get(p.id) ?? [],
          }));

          return new Response(JSON.stringify({ users }), { status: 200, headers: { "content-type": "application/json" } });
        } catch (err: any) {
          console.error("[Admin] list users error", err?.message ?? err);
          return new Response(JSON.stringify({ error: "Could not list users" }), { status: 500, headers: { "content-type": "application/json" } });
        }
      },

      POST: async ({ request }) => {
        let body: CreateUserBody;
        try {
          body = (await request.json()) as CreateUserBody;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "content-type": "application/json" } });
        }

        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : undefined;
        const display_name = typeof body.display_name === "string" ? body.display_name : null;
        const role = typeof body.role === "string" ? body.role : null;

        if (!email || !password) return new Response(JSON.stringify({ error: "email and password are required" }), { status: 400, headers: { "content-type": "application/json" } });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Create auth user (service role)
          // supabase-js admin API used here
          const created = await (supabaseAdmin as any).auth.admin.createUser({
            email,
            password,
            user_metadata: { display_name },
          });

          if (created?.error) {
            console.error("[Admin] create user error", created.error);
            return new Response(JSON.stringify({ error: created.error.message ?? "Could not create user" }), { status: 500, headers: { "content-type": "application/json" } });
          }

          const user = created?.user ?? created?.data ?? null;
          if (!user || !user.id) {
            return new Response(JSON.stringify({ error: "No user returned from auth" }), { status: 500, headers: { "content-type": "application/json" } });
          }

          // ensure profile exists
          await supabaseAdmin.from("profiles").upsert({ id: user.id, display_name, subscription_status: "free" });

          // optional role insert
          if (role) {
            await supabaseAdmin.from("user_roles").insert({ user_id: user.id, role: role as "admin" | "user" });
          }

          return new Response(JSON.stringify({ user: { id: user.id, email } }), { status: 201, headers: { "content-type": "application/json" } });
        } catch (err: any) {
          console.error("[Admin] create user unexpected error", err?.message ?? err);
          return new Response(JSON.stringify({ error: "Could not create user" }), { status: 500, headers: { "content-type": "application/json" } });
        }
      },
    },
  },
});
