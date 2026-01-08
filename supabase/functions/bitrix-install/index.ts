import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const queryParams = new URL(req.url).searchParams

  const data = queryParams.get('data')

  if (data) {
    return new Response(data, { status: 200 })
  }


  return Response.redirect(`${Deno.env.get("SITE_URL")}admin/`, 302);


  if (req.method === 'GET') {
    return new Response('OK', { status: 200 })
  }


  const subdomain = queryParams.get('DOMAIN')?.replace('.bitrix24.ru', '')


  // Читаем POST form-urlencoded тело
  const formData = await req.formData()
  const params: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    params[key] = value.toString()
  }

  console.log('Bitrix install query params:', queryParams)

  console.log('Bitrix install request:', params)

  // Правильно извлекаем токены и идентификаторы
  const accessToken = params['AUTH_ID']
  const refreshToken = params['REFRESH_ID']
  const memberId = params['member_id']

  // Опционально: можно извлечь домен из SERVER_ENDPOINT, если нужно
  // Пример: https://oauth.bitrix24.tech/rest/ → не содержит домен
  // Но домен можно получить позже по REST: /rest/methods/crm.status.list с токеном

  if (!accessToken || !refreshToken || !memberId) {
    return new Response('Invalid install request: missing tokens or member_id', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error } = await supabase
    .from('crm_connections')
    .upsert({
      crm_type: 'bitrix24',
      access_token: accessToken,
      refresh_token: refreshToken,
      subdomain: subdomain, 
    })

  if (error) {
    console.error('Supabase upsert error:', error)
    return new Response('Internal error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
})