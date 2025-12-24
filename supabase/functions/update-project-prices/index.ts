import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  projectId: string
  operation: 'increase' | 'decrease'
  type: 'percentage' | 'fixed'
  value: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { projectId, operation, type, value } = await req.json() as RequestBody

    if (!projectId || !operation || !type || value === undefined) {
      throw new Error('Missing required fields')
    }

    if (value < 0) {
      throw new Error('Value must be positive')
    }

    // Verify user has access to the project
    // This is a simplified check. Ideally, you should check specific project permissions.
    // For now, we assume if the user can call this, they might have access, but let's double check project ownership/access via RLS if we query, but here we are using service role or standard client.
    // Since we initialized with the user's auth header, RLS will apply.
    
    // However, for mass update, fetching all rows and updating them might be slow if done one by one.
    // A better approach is to use a SQL query via rpc or direct update if Supabase supports arithmetic updates directly on columns via JS client (it doesn't directly for "all rows based on current value" easily without a stored procedure or raw SQL).
    
    // Since we need to update based on current value, and doing it efficiently:
    // Option 1: Fetch all apartments, calculate in JS, update in batches. (Safe, respects RLS)
    // Option 2: Use a stored procedure (RPC). (Fast, atomic)

    // Let's go with Option 1 for now to keep logic in the Edge Function, unless the dataset is huge (thousands).
    // The user mentioned "dynamic change of price", "mass update".
    // 712 rows in apartments table (from schema list). Fetching 712 rows is fine.
    
    // Fetch all apartments for the project
    const { data: apartments, error: fetchError } = await supabaseClient
      .from('apartments')
      .select('id, price')
      .eq('project_id', projectId)

    if (fetchError) throw fetchError
    if (!apartments || apartments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No apartments found for this project' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate new prices
    const updates = apartments.map((apt) => {
      let newPrice = Number(apt.price) || 0
      
      if (type === 'percentage') {
        const factor = value / 100
        if (operation === 'increase') {
          newPrice = newPrice * (1 + factor)
        } else {
          newPrice = newPrice * (1 - factor)
        }
      } else {
        // Fixed amount
        if (operation === 'increase') {
          newPrice = newPrice + value
        } else {
          newPrice = newPrice - value
        }
      }

      // Ensure no negative prices
      newPrice = Math.max(0, Math.round(newPrice))

      return {
        id: apt.id,
        price: newPrice,
      }
    })

    // Perform updates in batches to avoid payload limits
    // Since we need to update different values for each apartment, we'll use individual updates
    // or upsert with proper handling
    const BATCH_SIZE = 100
    let updatedCount = 0
    
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE)
      
      // Use upsert to update existing records by ID
      // This will only update if the ID exists (which it should for all apartments)
      const { error: updateError } = await supabaseClient
        .from('apartments')
        .upsert(batch.map(u => ({ id: u.id, price: u.price })), {
          onConflict: 'id'
        })
      
      if (updateError) {
        throw new Error(`Failed to update batch: ${updateError.message}`)
      }
      
      updatedCount += batch.length
    }

    return new Response(
      JSON.stringify({ 
        message: `Updated ${updatedCount} apartments successfully`,
        count: updatedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

