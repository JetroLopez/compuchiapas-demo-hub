const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token_id, amount, description } = await req.json();

    if (!token_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'token_id and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'amount must be a positive number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const merchantId = Deno.env.get('OPENPAY_MERCHANT_ID');
    const privateKey = Deno.env.get('OPENPAY_PRIVATE_KEY');

    if (!merchantId || !privateKey) {
      console.error('Missing Openpay credentials in environment');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chargeBody = {
      source_id: token_id,
      method: 'card',
      amount: Number(amount.toFixed(2)),
      currency: 'MXN',
      description: description || 'Compra en tienda',
    };

    const basicAuth = btoa(`${privateKey}:`);

    const openpayRes = await fetch(
      `https://sandbox-api.openpay.mx/v1/${merchantId}/charges`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: JSON.stringify(chargeBody),
      }
    );

    const openpayData = await openpayRes.json();

    if (!openpayRes.ok) {
      console.error('Openpay charge failed:', JSON.stringify(openpayData));
      const errorMessage = openpayData?.description || openpayData?.error_code
        ? `Error ${openpayData.error_code}: ${openpayData.description}`
        : 'El cobro con tarjeta fue rechazado';

      return new Response(
        JSON.stringify({ error: errorMessage, openpay_error: openpayData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        charge_id: openpayData.id,
        status: openpayData.status,
        amount: openpayData.amount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
