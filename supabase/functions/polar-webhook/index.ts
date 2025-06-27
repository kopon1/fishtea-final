// supabase/functions/polar-webhook/index.ts

import { serve } from 'https://deno.land/std/http/server.ts'

serve(async (req) => {
  try {
    const body = await req.json()
    console.log("Incoming webhook:", JSON.stringify(body, null, 2))

    const eventType = body.event
    const data = body.data
    const userId = data?.metadata?.supabase_uid
    const planId = data?.plan_id

    if (!userId || !planId) {
      console.error("Missing userId or planId")
      return new Response("Missing user_id or plan_id", { status: 400 })
    }

    const planToRole: Record<string, string> = {
      'polar_basic': 'basic',
      'polar_premium': 'premium',
    }

    const role = planToRole[planId] || 'free'
    console.log("Mapped role:", role)

    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_metadata: { role },
      }),
    })

    const result = await res.text()
    console.log("Supabase response:", res.status, result)

    if (!res.ok) {
      throw new Error(`Supabase update failed: ${res.status}`)
    }

    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error("Webhook handler error:", err)
    return new Response("Internal error", { status: 500 })
  }
})
