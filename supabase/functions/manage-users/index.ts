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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: caller.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST USERS
    if (req.method === "GET" && action === "list") {
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .in("role", ["admin", "manager", "order_handler"])
        .order("created_at");

      const userIds = (roles || []).map((r: any) => r.user_id);
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, email, full_name, is_active")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      const users = (roles || []).map((r: any) => {
        const profile = profileMap.get(r.user_id);
        return {
          id: r.id,
          user_id: r.user_id,
          role: r.role,
          created_at: r.created_at,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          is_active: profile?.is_active ?? true,
        };
      });

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE USER
    if (req.method === "POST" && action === "create") {
      const { email, password, full_name, role } = await req.json();

      if (!email || !password || !role) {
        return new Response(JSON.stringify({ error: "Email, password, and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const validRoles = ["admin", "manager", "order_handler"];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile with full_name
      if (full_name && newUser.user) {
        await adminClient
          .from("profiles")
          .update({ full_name, is_active: true })
          .eq("user_id", newUser.user.id);
      }

      // Set role (trigger creates 'customer' role, update it)
      if (newUser.user) {
        await adminClient
          .from("user_roles")
          .update({ role })
          .eq("user_id", newUser.user.id);
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE ROLE
    if (req.method === "POST" && action === "update-role") {
      const { user_id, role } = await req.json();

      const validRoles = ["admin", "manager", "order_handler"];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent removing last admin
      if (role !== "admin") {
        const { data: admins } = await adminClient
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        const isLastAdmin = admins?.length === 1 && admins[0].user_id === user_id;
        if (isLastAdmin) {
          return new Response(JSON.stringify({ error: "Cannot remove the last admin" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const { error } = await adminClient
        .from("user_roles")
        .update({ role })
        .eq("user_id", user_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TOGGLE ACTIVE
    if (req.method === "POST" && action === "toggle-active") {
      const { user_id, is_active } = await req.json();

      // Prevent deactivating self
      if (user_id === caller.id && !is_active) {
        return new Response(JSON.stringify({ error: "Cannot deactivate yourself" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent deactivating last admin
      if (!is_active) {
        const { data: adminRole } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user_id)
          .maybeSingle();

        if (adminRole?.role === "admin") {
          const { data: admins } = await adminClient
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");

          const activeAdmins = [];
          for (const a of admins || []) {
            const { data: p } = await adminClient
              .from("profiles")
              .select("is_active")
              .eq("user_id", a.user_id)
              .maybeSingle();
            if (p?.is_active && a.user_id !== user_id) activeAdmins.push(a);
          }

          if (activeAdmins.length === 0) {
            return new Response(JSON.stringify({ error: "Cannot deactivate the last active admin" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      const { error } = await adminClient
        .from("profiles")
        .update({ is_active })
        .eq("user_id", user_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
