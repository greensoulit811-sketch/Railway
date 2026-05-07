import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role using service role client
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await serviceClient.rpc("is_admin", { _user_id: user.id });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { access_token } = body;

      if (!access_token || typeof access_token !== "string" || access_token.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Access token is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert token into capi_secrets table (only service role can access)
      const { error: upsertError } = await serviceClient
        .from("capi_secrets")
        .upsert({ id: "global", access_token: access_token.trim(), updated_at: new Date().toISOString() });

      if (upsertError) {
        console.error("[manage-capi-token] Upsert error:", upsertError.message);
        return new Response(
          JSON.stringify({ error: "Failed to save token" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Access token saved securely" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "GET") {
      // Check if token exists (never return the actual token)
      const { data, error } = await serviceClient
        .from("capi_secrets")
        .select("updated_at, access_token")
        .eq("id", "global")
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ has_token: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const hasToken = !!data?.access_token && data.access_token.trim().length > 0;

      return new Response(
        JSON.stringify({
          has_token: hasToken,
          updated_at: hasToken ? data.updated_at : null,
          // Show masked preview (first 4 chars + dots)
          masked: hasToken ? data.access_token.substring(0, 4) + "••••••••" : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[manage-capi-token] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
