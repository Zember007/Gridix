import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface Project {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  image_url?: string;
  min_price?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Remove 'widget-api' from path parts if present
    const apiIndex = pathParts.indexOf('widget-api');
    if (apiIndex !== -1) {
      pathParts.splice(0, apiIndex + 1);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Route handling
    if (pathParts[0] === 'projects' && pathParts[1]) {
      // GET /api/widget/projects/:userId
      const userId = pathParts[1];
      const lang = url.searchParams.get('lang') || 'ru';
      
      return await handleProjectsRequest(supabase, userId, lang);
      
    } else if (pathParts[0] === 'project') {
      const lang = url.searchParams.get('lang') || 'ru';
      
      if (pathParts[1] === 'id' && pathParts[2]) {
        // GET /api/widget/project/id/:projectId
        const projectId = pathParts[2];
        return await handleProjectRequest(supabase, projectId, null, lang);
        
      } else if (pathParts[1]) {
        // GET /api/widget/project/:projectSlug
        const projectSlug = pathParts[1];
        return await handleProjectRequest(supabase, null, projectSlug, lang);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Widget API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleProjectsRequest(supabase: any, userId: string, lang: string) {
  try {
    // Get projects for user with price information
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        slug,
        image_url,
        apartments (
          price
        )
      `)
      .eq('user_id', userId)
      .eq('is_published', true);

    if (error) {
      throw error;
    }

    // Calculate min price for each project
    const projectsWithPrices = projects?.map((project: any) => {
      const prices = project.apartments
        ?.map((apt: any) => apt.price)
        .filter((price: number) => price && price > 0) || [];
      
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        slug: project.slug,
        image_url: project.image_url,
        min_price: minPrice
      };
    }) || [];

    return new Response(
      JSON.stringify({ projects: projectsWithPrices }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching projects:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch projects',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleProjectRequest(supabase: any, projectId: string | null, projectSlug: string | null, lang: string) {
  try {
    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        slug,
        image_url,
        apartments (
          price
        )
      `)
      .eq('is_published', true);

    if (projectId) {
      query = query.eq('id', projectId);
    } else if (projectSlug) {
      query = query.eq('slug', projectSlug);
    }

    const { data: projects, error } = await query;

    if (error) {
      throw error;
    }

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const project = projects[0];
    
    // Calculate min price
    const prices = project.apartments
      ?.map((apt: any) => apt.price)
      .filter((price: number) => price && price > 0) || [];
    
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    
    const projectData = {
      id: project.id,
      name: project.name,
      description: project.description,
      slug: project.slug,
      image_url: project.image_url,
      min_price: minPrice
    };

    return new Response(
      JSON.stringify({ projects: [projectData] }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching project:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch project',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
