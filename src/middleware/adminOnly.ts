import { supabase } from "@/integrations/supabase/client";

export async function requireAdmin() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "/admin";
    return null;
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (rolesError || !roles || roles.role !== "admin") {
    window.location.href = "/admin";
    return null;
  }

  return user;
}
