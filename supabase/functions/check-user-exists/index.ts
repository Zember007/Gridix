import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts'

interface CheckUserRequest {
  email: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }

  try {
    // Создаем клиент с service role key для административных операций
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { email }: CheckUserRequest = await req.json()
    
    console.log('Checking if user exists:', email)

    // Получаем список всех пользователей
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    // Проверяем, существует ли пользователь с таким email
    const userExists = existingUsers?.users?.some(u => u.email === email) || false
    
    console.log('User exists:', userExists)

    return createJsonResponse({
      success: true,
      exists: userExists
    }, 200, origin);

  } catch (error) {
    console.error('Error checking user existence:', error)
    
    return createJsonResponse({ 
      success: false, 
      error: error.message || 'Failed to check user existence' 
    }, 400, origin);
  }
})
