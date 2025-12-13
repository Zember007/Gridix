/**
 * Shared functions for AmoCRM funnel management
 */

export interface AmoCRMPipeline {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_archive: boolean;
  statuses: AmoCRMStatus[];
}

export interface AmoCRMStatus {
  id: number;
  name: string;
  sort: number;
  color: string;
  type: number;
  pipeline_id: number;
}

/**
 * Creates or updates a local funnel based on AmoCRM pipeline data
 */
export async function createOrUpdateLocalFunnel(
  projectId: string,
  userId: string,
  amoPipeline: AmoCRMPipeline,
  svc: any
): Promise<void> {
  try {
    // Check if funnel already exists for this project and AmoCRM pipeline
    const { data: existingFunnel } = await svc
      .from('crm_funnels')
      .select('id, name')
      .eq('project_id', projectId)
      .eq('amocrm_pipeline_id', amoPipeline.id)
      .single();

    // Sort statuses by sort order for comparison
    const sortedStatuses = [...amoPipeline.statuses].sort((a, b) => a.sort - b.sort);

    // If funnel exists, check if name and statuses match
    if (existingFunnel) {
      // Get existing stages with full details
      const { data: existingStages } = await svc
        .from('crm_funnel_stages')
        .select('id, name, amocrm_status_id, order_index, color')
        .eq('funnel_id', existingFunnel.id)
        .order('order_index', { ascending: true });

      // Check if name matches
      const nameMatches = existingFunnel.name === amoPipeline.name;

      // Check if statuses match (same count, same IDs, same names, same order)
      const statusesMatch = 
        existingStages?.length === sortedStatuses.length &&
        existingStages.every((stage: any, index: number) => {
          const expectedStatus = sortedStatuses[index];
          return (
            stage.amocrm_status_id === expectedStatus.id &&
            stage.name === expectedStatus.name &&
            stage.order_index === index
          );
        });

      // If both name and statuses match exactly, skip update
      if (nameMatches && statusesMatch) {
        console.log(`Funnel already synchronized for project ${projectId}, AmoCRM pipeline ${amoPipeline.id} - skipping update`);
        return;
      }
    }

    let funnelId: string;

    if (existingFunnel) {
      funnelId = existingFunnel.id;
      // Update funnel name if it changed
      if (existingFunnel.name !== amoPipeline.name) {
        await svc
          .from('crm_funnels')
          .update({ 
            name: amoPipeline.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', funnelId);
      }
    } else {
      // Create new funnel
      const { data: newFunnel, error: funnelError } = await svc
        .from('crm_funnels')
        .insert({
          user_id: userId,
          project_id: projectId,
          name: amoPipeline.name,
          amocrm_pipeline_id: amoPipeline.id,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (funnelError || !newFunnel) {
        throw new Error('Failed to create funnel');
      }

      funnelId = newFunnel.id;
    }

    // Get existing stages for this funnel
    const { data: existingStages } = await svc
      .from('crm_funnel_stages')
      .select('id, amocrm_status_id')
      .eq('funnel_id', funnelId);

    const existingStageMap = new Map(
      (existingStages || []).map(s => [s.amocrm_status_id, s.id])
    );

    // Process each status
    for (let i = 0; i < sortedStatuses.length; i++) {
      const status = sortedStatuses[i];
      const existingStageId = existingStageMap.get(status.id);

      // Map AmoCRM color to Tailwind color
      const color = mapAmoCRMColorToTailwind(status.color);

      if (existingStageId) {
        // Update existing stage
        await svc
          .from('crm_funnel_stages')
          .update({
            name: status.name,
            color: color,
            order_index: i,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStageId);

        existingStageMap.delete(status.id);
      } else {
        // Create new stage
        await svc
          .from('crm_funnel_stages')
          .insert({
            funnel_id: funnelId,
            name: status.name,
            color: color,
            order_index: i,
            amocrm_status_id: status.id,
            amocrm_pipeline_id: amoPipeline.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    }

    // Delete stages that no longer exist in AmoCRM
    if (existingStageMap.size > 0) {
      const stageIdsToDelete = Array.from(existingStageMap.values());
      await svc
        .from('crm_funnel_stages')
        .delete()
        .in('id', stageIdsToDelete);
    }

    console.log(`Local funnel synchronized for project ${projectId}, AmoCRM pipeline ${amoPipeline.id}`);
  } catch (error) {
    console.error('Error creating/updating local funnel:', error);
    throw error;
  }
}

/**
 * Maps AmoCRM color hex codes to Tailwind color names
 */
export function mapAmoCRMColorToTailwind(amoColor: string): string {
  // AmoCRM uses hex colors, we map them to Tailwind color names
  const colorMap: Record<string, string> = {
    '#fffeb2': 'yellow',    // light yellow
    '#fffd7f': 'yellow',    // yellow
    '#ff8a00': 'orange',    // orange
    '#e6e8ff': 'blue',      // light blue/purple
    '#c1e0ff': 'blue',      // blue
    '#99ccff': 'blue',      // blue
    '#d6f9dd': 'green',     // light green
    '#ccff66': 'green',     // green
    '#ace2ce': 'green',     // teal/green
    '#ffc8c8': 'red',       // light red
    '#ff8f92': 'red',       // red
    '#eb93ff': 'purple',    // purple
    '#ccc8f9': 'purple',    // light purple
    '#d5d8dd': 'slate',     // grey
  };

  return colorMap[amoColor.toLowerCase()] || 'slate';
}

