import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { question } = await req.json();
    console.log("User question:", question);

    // Fetch all user entries for context
    const { data: entries, error: entriesError } = await supabase
      .from('voice_entries')
      .select('transcript, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (entriesError) {
      console.error("Error fetching entries:", entriesError);
      throw new Error("Failed to fetch entries");
    }

    // Fetch user events
    const { data: events, error: eventsError } = await supabase
      .from('diary_events')
      .select('title, description, event_date')
      .eq('user_id', user.id)
      .order('event_date', { ascending: false });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
    }

    // Build context from entries
    const entriesContext = entries?.map(e => 
      `[${new Date(e.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}]: ${e.transcript || ''}`
    ).join('\n\n') || 'No hay entradas en el diario.';

    const eventsContext = events?.map(e => 
      `- ${e.title} (${new Date(e.event_date).toLocaleDateString('es-ES')}): ${e.description || ''}`
    ).join('\n') || 'No hay eventos registrados.';

    // Update user stats for questions
    await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_questions: 1
      }, {
        onConflict: 'user_id'
      });
    
    // Increment questions count
    await supabase.rpc('increment_questions', { p_user_id: user.id }).catch(() => {
      // If RPC doesn't exist, update directly
      supabase
        .from('user_stats')
        .update({ total_questions: entries?.length || 1 })
        .eq('user_id', user.id);
    });

    // Call Lovable AI to answer the question
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Eres un asistente personal que ayuda a analizar el diario de voz del usuario. 
Tienes acceso a todas las entradas del diario y eventos registrados.
Responde de forma concisa y útil en español.
Puedes hacer resúmenes, contar días, analizar patrones, buscar información específica, etc.

La fecha de hoy es: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

ENTRADAS DEL DIARIO:
${entriesContext}

EVENTOS REGISTRADOS:
${eventsContext}`
          },
          {
            role: "user",
            content: question
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiResponse = await response.json();
    const answer = aiResponse.choices?.[0]?.message?.content || "No pude procesar tu pregunta.";

    // Update questions count in user_stats
    const { error: statsError } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_questions: 1,
      }, {
        onConflict: 'user_id',
      });

    if (!statsError) {
      await supabase
        .from('user_stats')
        .update({ 
          total_questions: supabase.rpc ? undefined : 1 
        })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      answer
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ask-diary:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
