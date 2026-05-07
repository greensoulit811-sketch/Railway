import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// SHA-256 hash helper
async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      event_name,
      event_id,
      event_source_url,
      user_data = {},
      custom_data = {},
      test_mode = false,
    } = body;

    if (!event_name || !event_id) {
      return new Response(
        JSON.stringify({ error: "event_name and event_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch site settings to check if CAPI is enabled
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settings, error: settingsError } = await supabase
      .from("site_settings")
      .select("fb_capi_enabled, fb_capi_dataset_id, fb_capi_test_event_code, fb_capi_api_version, fb_pixel_id")
      .eq("id", "global")
      .single();

    if (settingsError || !settings) {
      console.error("[CAPI] Failed to fetch settings:", settingsError);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "settings_unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.fb_capi_enabled) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "capi_disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to read token from capi_secrets table first, fallback to env
    let accessToken = Deno.env.get("FB_CAPI_ACCESS_TOKEN") || null;

    const { data: secretRow } = await supabase
      .from("capi_secrets")
      .select("access_token")
      .eq("id", "global")
      .single();

    if (secretRow?.access_token && secretRow.access_token.trim().length > 0) {
      accessToken = secretRow.access_token;
    }

    if (!accessToken) {
      console.error("[CAPI] No access token configured (env or DB)");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "token_missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const datasetId = settings.fb_capi_dataset_id || settings.fb_pixel_id;
    if (!datasetId) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "dataset_id_missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiVersion = settings.fb_capi_api_version || "v20.0";

    // Build user_data with hashing
    const hashedUserData: Record<string, unknown> = {};

    if (user_data.client_user_agent) {
      hashedUserData.client_user_agent = user_data.client_user_agent;
    }
    if (user_data.fbp) hashedUserData.fbp = user_data.fbp;
    if (user_data.fbc) hashedUserData.fbc = user_data.fbc;
    if (user_data.client_ip_address) {
      hashedUserData.client_ip_address = user_data.client_ip_address;
    }

    // Hash PII fields
    if (user_data.em) {
      hashedUserData.em = [await sha256(user_data.em)];
    }
    if (user_data.ph) {
      hashedUserData.ph = [await sha256(user_data.ph)];
    }
    if (user_data.external_id) {
      hashedUserData.external_id = [await sha256(user_data.external_id)];
    }

    // Build event payload
    const eventPayload: Record<string, unknown> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      action_source: "website",
      user_data: hashedUserData,
    };

    if (event_source_url) {
      eventPayload.event_source_url = event_source_url;
    }

    if (Object.keys(custom_data).length > 0) {
      eventPayload.custom_data = custom_data;
    }

    // Build request body
    const requestBody: Record<string, unknown> = {
      data: [eventPayload],
    };

    // Add test event code if present
    const testEventCode = test_mode
      ? settings.fb_capi_test_event_code
      : null;
    if (testEventCode) {
      requestBody.test_event_code = testEventCode;
    }

    // Send to Meta CAPI
    const url = `https://graph.facebook.com/${apiVersion}/${datasetId}/events?access_token=${accessToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[CAPI] Meta API error:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ success: false, error: result.error?.message || "API error" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[CAPI] Event ${event_name} sent successfully, event_id: ${event_id}`);

    return new Response(
      JSON.stringify({ success: true, events_received: result.events_received }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CAPI] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
