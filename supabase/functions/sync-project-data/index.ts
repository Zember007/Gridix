import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { projectId, syncId } = await req.json();

    console.log('Starting sync for project:', projectId, 'sync:', syncId);

    // Получаем настройки синхронизации
    const { data: syncSettings, error: syncError } = await supabaseClient
      .from('project_sync_settings')
      .select('*')
      .eq('id', syncId)
      .single();

    if (syncError) {
      throw new Error(`Failed to get sync settings: ${syncError.message}`);
    }

    if (!syncSettings.is_active) {
      throw new Error('Sync is not active');
    }

    const startTime = Date.now();

    // Загружаем данные из Excel
    console.log('Fetching Excel data from:', syncSettings.excel_url);
    
    const response = await fetch(syncSettings.excel_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    let excelData = [];
    try {
      // Парсим Excel-файл
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      excelData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    } catch (e) {
      throw new Error("Ошибка парсинга Excel-файла: " + (e?.message || e));
    }

    // Получаем маппинг столбцов из настроек
    const mapping = syncSettings.column_mapping || {};
    // mapping = { apartmentNumber: 'Apt Num', area: 'Apt S', ... }

    let recordsProcessed = 0;
    let recordsAdded = 0;
    let recordsUpdated = 0;
    let recordsDeleted = 0;
    let statusValidationWarnings: string[] = [];

    for (const row of excelData) {
      recordsProcessed++;
      // Используем маппинг для получения значений
      const apartmentNumber = row[mapping.apartmentNumber]?.toString() || row["apartmentNumber"]?.toString();
      const area = parseFloat(row[mapping.area] || row["area"] || 0) || 0;
      const price = parseFloat(row[mapping.price] || row["price"] || 0) || 0;
      const floorNumber = parseInt(row[mapping.floor] || row["floor"] || 1) || 1;
      const rooms = parseInt(row[mapping.rooms] || row["rooms"] || 1) || 1;
      const statusRaw = (row[mapping.status] || row["status"] || "").toString().toLowerCase().trim();
      
      // Улучшенная валидация статусов
      let status = "available";
      let statusValidationWarning = "";
      
      const statusMapping: { [key: string]: string } = {
        // Статус "продана"
        "sold": "sold",
        "продана": "sold", 
        "продано": "sold",
        "нет": "sold",
        "n": "sold",
        "0": "sold",
        "no": "sold",
        // Статус "забронирована"
        "reserved": "reserved",
        "забронирована": "reserved",
        "забронировано": "reserved", 
        "hold": "reserved",
        "резерв": "reserved",
        "1": "reserved",
        // Статус "свободна"
        "available": "available",
        "свободна": "available",
        "свободно": "available",
        "да": "available",
        "yes": "available",
        "2": "available"
      };

      if (statusRaw && statusMapping[statusRaw]) {
        status = statusMapping[statusRaw];
      } else if (statusRaw) {
        // Неизвестный статус - логируем предупреждение
        statusValidationWarning = `Неизвестный статус "${statusRaw}" для квартиры ${apartmentNumber}, используется "available"`;
        console.warn(statusValidationWarning);
        statusValidationWarnings.push(statusValidationWarning);
      }

      if (!apartmentNumber) continue;

      // Проверяем существует ли квартира
      const { data: existingApartment } = await supabaseClient
        .from('apartments')
        .select('id, area, price, status')
        .eq('project_id', projectId)
        .eq('apartment_number', apartmentNumber)
        .eq('floor_number', floorNumber)
        .maybeSingle();

      if (existingApartment) {
        // Обновляем существующую квартиру
        const { error: updateError } = await supabaseClient
          .from('apartments')
          .update({
            area,
            price,
            status,
            rooms,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingApartment.id);

        if (updateError) {
          console.error('Error updating apartment:', updateError);
        } else {
          recordsUpdated++;
        }
      } else {
        // Создаем новую квартиру
        const { error: insertError } = await supabaseClient
          .from('apartments')
          .insert({
            project_id: projectId,
            apartment_number: apartmentNumber,
            floor_number: floorNumber,
            rooms,
            area,
            price,
            status,
            polygon: []
          });

        if (insertError) {
          console.error('Error inserting apartment:', insertError);
        } else {
          recordsAdded++;
        }
      }
    }

    const executionTime = Date.now() - startTime;

    // Обновляем настройки синхронизации
    const nextSync = new Date(Date.now() + syncSettings.sync_interval * 1000);
    
    await supabaseClient
      .from('project_sync_settings')
      .update({
        last_sync: new Date().toISOString(),
        next_sync: nextSync.toISOString(),
        status: 'active',
        error_message: null
      })
      .eq('id', syncId);

    // Записываем лог синхронизации
    await supabaseClient
      .from('sync_logs')
      .insert({
        project_id: projectId,
        sync_settings_id: syncId,
        status: 'success',
        records_processed: recordsProcessed,
        records_added: recordsAdded,
        records_updated: recordsUpdated,
        records_deleted: recordsDeleted,
        execution_time_ms: executionTime
      });

    console.log('Sync completed successfully:', {
      recordsProcessed,
      recordsAdded,
      recordsUpdated,
      recordsDeleted,
      executionTime
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Синхронизация завершена успешно`,
        data: {
          recordsProcessed,
          recordsAdded,
          recordsUpdated,
          recordsDeleted,
          executionTime,
          statusValidationWarnings
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Sync error:', error);

    // Обновляем статус с ошибкой если есть syncId
    try {
      const { syncId } = await req.json();
      if (syncId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabaseClient
          .from('project_sync_settings')
          .update({
            status: 'error',
            error_message: error.message
          })
          .eq('id', syncId);
      }
    } catch (updateError) {
      console.error('Error updating sync status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
