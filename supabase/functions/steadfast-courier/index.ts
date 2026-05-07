import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    let action = url.pathname.split('/').pop();
    
    // If action is the function name, try to get it from query or body
    if (action === 'steadfast-courier') {
      action = url.searchParams.get('action');
    }

    // Read body if method is POST/PUT
    let body: any = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        body = await req.json();
        if (!action && body.action) {
          action = body.action;
        }
      } catch (e) {
        // Ignore JSON parse error if body is empty
      }
    }

    const { data: settings } = await supabase
      .from('courier_settings')
      .select('*')
      .eq('provider', 'steadfast')
      .maybeSingle();

    if (action === 'test-connection') {
      if (!settings) {
        return new Response(JSON.stringify({ success: false, error: 'Please save settings first before testing' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!settings.api_base_url || !settings.api_key || !settings.api_secret) {
        return new Response(JSON.stringify({ success: false, error: 'API configuration is incomplete' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(`${settings.api_base_url}/get_balance`, {
        headers: { 'Api-Key': settings.api_key, 'Secret-Key': settings.api_secret, 'Content-Type': 'application/json' },
      });
      const resText = await res.text();
      let data: any;
      try { data = JSON.parse(resText); } catch { 
        return new Response(JSON.stringify({ success: false, error: 'Invalid response from Steadfast API: ' + resText.substring(0, 200) }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (res.ok && data.status === 200) {
        return new Response(JSON.stringify({ success: true, balance: data.current_balance }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: false, error: data.message || 'Failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create-parcel') {
      if (!settings?.enabled) {
        return new Response(JSON.stringify({ success: false, error: 'Steadfast not enabled' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const payload = {
        invoice: body.invoice,
        recipient_name: body.recipient_name,
        recipient_phone: body.recipient_phone,
        recipient_address: body.recipient_address,
        cod_amount: body.cod_amount,
        note: body.note || '',
      };

      const res = await fetch(`${settings.api_base_url}/create_order`, {
        method: 'POST',
        headers: { 'Api-Key': settings.api_key, 'Secret-Key': settings.api_secret, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resText = await res.text();
      let data: any;
      try { data = JSON.parse(resText); } catch {
        return new Response(JSON.stringify({ success: false, error: 'Invalid response from Steadfast API: ' + resText.substring(0, 200) }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('courier_logs').insert({
        order_id: body.order_id, provider: 'steadfast', action: 'create_parcel',
        status: res.ok ? 'success' : 'failed', message: data.message || '',
        request_payload: payload, response_payload: data,
      });

      if (res.ok && data.status === 200) {
        await supabase.from('orders').update({
          courier_provider: 'steadfast', courier_status: 'created',
          courier_tracking_id: data.consignment?.tracking_code,
          courier_consignment_id: data.consignment?.consignment_id?.toString(),
          courier_reference: body.invoice, courier_payload: payload, courier_response: data,
          courier_created_at: new Date().toISOString(), courier_updated_at: new Date().toISOString(),
        }).eq('id', body.order_id);

        return new Response(JSON.stringify({ 
          success: true, tracking_code: data.consignment?.tracking_code,
          consignment_id: data.consignment?.consignment_id,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: false, error: data.message || data.errors || 'Failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'track-status') {
      if (!settings?.enabled) {
        return new Response(JSON.stringify({ success: false, error: 'Steadfast not enabled' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { consignment_id, order_id } = body;
      if (!consignment_id) {
        return new Response(JSON.stringify({ success: false, error: 'Consignment ID required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(`${settings.api_base_url}/status_by_cid/${consignment_id}`, {
        headers: { 'Api-Key': settings.api_key, 'Secret-Key': settings.api_secret, 'Content-Type': 'application/json' },
      });
      const resText = await res.text();
      let data: any;
      try { data = JSON.parse(resText); } catch {
        return new Response(JSON.stringify({ success: false, error: 'Invalid response from Steadfast API: ' + resText.substring(0, 200) }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('courier_logs').insert({
        order_id, provider: 'steadfast', action: 'track_status',
        status: res.ok ? 'success' : 'failed', message: data.delivery_status || '',
        request_payload: { consignment_id }, response_payload: data,
      });

      if (res.ok && data.status === 200) {
        let courierStatus = 'created';
        const ds = data.delivery_status?.toLowerCase();
        if (ds === 'delivered') courierStatus = 'delivered';
        else if (ds === 'cancelled') courierStatus = 'cancelled';
        else if (ds === 'pending' || ds === 'in_review') courierStatus = 'pending';
        else if (ds) courierStatus = 'in_transit';

        const updateData: Record<string, any> = { courier_status: courierStatus, courier_updated_at: new Date().toISOString() };
        if (courierStatus === 'delivered') updateData.status = 'delivered';
        else if (courierStatus === 'in_transit') updateData.status = 'shipped';
        
        await supabase.from('orders').update(updateData).eq('id', order_id);

        return new Response(JSON.stringify({ 
          success: true, courier_status: courierStatus, delivery_status: data.delivery_status 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: false, error: data.message || 'Failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-settings') {
      return new Response(JSON.stringify({ 
        success: true,
        settings: settings ? {
          enabled: settings.enabled, api_base_url: settings.api_base_url,
          pickup_address: settings.pickup_address, pickup_phone: settings.pickup_phone,
          default_weight: settings.default_weight, cod_enabled: settings.cod_enabled,
          has_api_key: !!settings.api_key, has_api_secret: !!settings.api_secret,
        } : null
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
