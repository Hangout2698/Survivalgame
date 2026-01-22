import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import * as pdfParse from 'npm:pdf-parse@1.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: files, error: listError } = await supabase
      .storage
      .from('game-documents')
      .list('documents', {
        limit: 1,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (listError || !files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No PDF found in storage' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const fileName = files[0].name;
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('game-documents')
      .download(`documents/${fileName}`);

    if (downloadError || !pdfData) {
      return new Response(
        JSON.stringify({ error: 'Failed to download PDF' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const arrayBuffer = await pdfData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const pdfData_parsed = await pdfParse.default(buffer);
    const extractedText = pdfData_parsed.text;

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content extracted from PDF');
    }

    await supabase
      .from('survival_guide_content')
      .update({ is_active: false })
      .eq('is_active', true);

    const { error: insertError } = await supabase
      .from('survival_guide_content')
      .insert({
        file_name: fileName,
        file_path: `documents/${fileName}`,
        raw_text: extractedText,
        is_active: true
      });

    if (insertError) {
      console.error('Failed to save extracted content:', insertError);
    }

    return new Response(
      JSON.stringify({
        text: extractedText,
        pages: pdfData_parsed.numpages || 1,
        stored: !insertError
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});