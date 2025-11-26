import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const sourcePath = '5a7f5773-0c9c-4336-b06b-f2aaaa327764/general/IMG_9978.webp';
    const targetFilename = 'IMG_9978.webp';

    console.log('Copying image from documents to login-media:', sourcePath);

    // Download from documents bucket
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('documents')
      .download(sourcePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw downloadError;
    }

    // Upload to login-media bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('login-media')
      .upload(targetFilename, fileData, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Successfully copied image to login-media');

    // Update app_settings
    const { error: updateError } = await supabaseAdmin
      .from('app_settings')
      .update({
        setting_value: {
          bucket: 'login-media',
          storagePath: targetFilename,
          filename: targetFilename,
          type: 'image',
          cardOpacity: 95,
          cardBorderBlur: 8,
          cardBorderRadius: 8,
          overlayColor: '#ffffff',
          overlayOpacity: 0,
          mediaBlur: 4,
          inputBgColor: '#ffffff',
          inputBgOpacity: 80,
          loginBlockVerticalPositionDesktop: 60,
          loginBlockVerticalPositionTablet: 85,
          loginBlockVerticalPositionMobile: 35,
          loginBlockWidthDesktop: 400,
          loginBlockWidthTablet: 380,
          loginBlockWidthMobile: 350,
          videoOnMobile: false,
          countdownEnabled: false,
          countdownEndDate: '2026-04-22T00:00',
          countdownText: 'bis zur neuen Segelsaison :-)',
          countdownShowDays: false,
          countdownFontSize: 48,
          countdownFontWeight: 300,
          countdownVerticalPositionDesktop: 25,
          countdownVerticalPositionTablet: 60,
          countdownVerticalPositionMobile: 30,
          logoEnabled: false,
          logoFilename: null,
          logoUrl: null,
          logoWidth: 200,
          url: null
        }
      })
      .eq('setting_key', 'login_background')
      .eq('is_global', true);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Successfully updated app_settings');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Image copied and settings updated',
        path: targetFilename
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
