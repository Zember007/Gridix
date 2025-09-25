import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string | null;
  slug: string | null;
  theme_color: string | null;
  min_price?: number | null;
}

interface Apartment {
  id: string;
  apartment_number: string;
  floor_number: number;
  rooms: number;
  area: number;
  price: number;
  status: string;
  custom_fields: Record<string, any> | null;
  type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get('projectId')
    const userId = url.searchParams.get('userId')
    const projectSlug = url.searchParams.get('projectSlug')
    const lang = url.searchParams.get('lang') || 'ru'

    if (!projectId && !userId && !projectSlug) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: projectId, userId, or projectSlug' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    let projects: Project[] = []

    if (userId) {
      // Get all projects for a user
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, name, description, address, building_image_url, 
          latitude, longitude, currency, slug, theme_color,
          apartments!inner(price)
        `)
        .eq('created_by', userId)
        .eq('is_published', true)

      if (projectsError) {
        console.error('Projects error:', projectsError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch projects' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Calculate min prices
      projects = (projectsData || []).map(project => {
        const prices = project.apartments?.map((apt: any) => apt.price).filter(Boolean) || []
        const min_price = prices.length > 0 ? Math.min(...prices) : null
        return {
          ...project,
          min_price,
          apartments: undefined // Remove apartments from response
        }
      })

    } else {
      // Get single project
      let query = supabase
        .from('projects')
        .select(`
          id, name, description, address, building_image_url, 
          latitude, longitude, currency, slug, theme_color
        `)
        .eq('is_published', true)

      if (projectSlug) {
        query = query.eq('slug', projectSlug)
      } else if (projectId) {
        query = query.eq('id', projectId)
      }

      const { data: projectData, error: projectError } = await query.single()

      if (projectError) {
        console.error('Project error:', projectError)
        return new Response(
          JSON.stringify({ error: 'Project not found' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      projects = [projectData]
    }

    // Get apartments for single project if needed
    let apartments: Apartment[] = []
    if (projects.length === 1) {
      const { data: apartmentsData, error: apartmentsError } = await supabase
        .from('apartments')
        .select('id, apartment_number, floor_number, rooms, area, price, status, custom_fields, type')
        .eq('project_id', projects[0].id)

      if (apartmentsError) {
        console.error('Apartments error:', apartmentsError)
      } else {
        apartments = apartmentsData || []
      }
    }

    const response = {
      projects,
      apartments: apartments.length > 0 ? apartments : undefined,
      lang,
      success: true
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

