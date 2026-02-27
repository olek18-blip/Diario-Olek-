import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Received audio file:", audioFile.name, "size:", audioFile.size, "type:", audioFile.type);

    // Convert audio to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Determine mime type
    let mimeType = audioFile.type || "audio/webm";
    if (mimeType === "audio/webm;codecs=opus") {
      mimeType = "audio/webm";
    }

    console.log("Sending to AI for transcription, mime type:", mimeType);

    // Use Gemini's multimodal capabilities to transcribe
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres un transcriptor de audio profesional. Tu tarea es transcribir el audio proporcionado con la mayor precisión posible.

INSTRUCCIONES:
- Transcribe EXACTAMENTE lo que se dice en el audio, palabra por palabra
- Mantén la puntuación y estructura natural del habla
- Si hay pausas largas, usa puntos suspensivos (...)
- Si no puedes entender algo claramente, usa [inaudible]
- NO añadas comentarios, resúmenes ni interpretaciones
- Responde SOLO con la transcripción literal, nada más
- El idioma es español (España/Latinoamérica)`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcribe este audio de forma literal:"
              },
              {
                type: "input_audio",
                input_audio: {
                  data: base64Audio,
                  format: mimeType.includes("wav") ? "wav" : mimeType.includes("mp3") ? "mp3" : "wav"
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de peticiones excedido, intenta de nuevo más tarde" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI transcription failed: ${errorText}`);
    }

    const aiResponse = await response.json();
    const transcript = aiResponse.choices?.[0]?.message?.content || "";
    
    console.log("Transcription result:", transcript.substring(0, 100) + "...");

    return new Response(JSON.stringify({ 
      success: true, 
      transcript: transcript.trim()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in transcribe-audio:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Error desconocido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
