import { supabase } from "@/integrations/supabase/client";

export const SUPPORT_WHATSAPP = "https://wa.me/5567998673680";

const DEVICE_KEY = "unify_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export type AccessResult =
  | { ok: true }
  | { ok: false; reason: "blocked" | "expired" | "device" | "missing"; message: string };

/**
 * Validates account status: blocked, expiry date and single-device binding.
 * Admins always pass. Binds the device on first login.
 */
export async function checkAccess(userId: string): Promise<AccessResult> {
  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("profiles")
      .select("blocked, access_expires_at, device_id")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if ((roles ?? []).some((r) => r.role === "admin")) return { ok: true };

  if (!profile) {
    return { ok: false, reason: "missing", message: "Conta sem perfil ativo. Solicite acesso ao desenvolvedor." };
  }

  if (profile.blocked) {
    return { ok: false, reason: "blocked", message: "Sua conta está bloqueada. Fale com o desenvolvedor." };
  }

  if (profile.access_expires_at && new Date(profile.access_expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired", message: "Seu acesso expirou. Solicite renovação ao desenvolvedor." };
  }

  const device = getDeviceId();
  if (!profile.device_id) {
    await supabase.from("profiles").update({ device_id: device }).eq("id", userId);
    return { ok: true };
  }
  if (profile.device_id !== device) {
    return {
      ok: false,
      reason: "device",
      message: "Esta conta já está vinculada a outro dispositivo. Fale com o desenvolvedor.",
    };
  }

  return { ok: true };
}
