import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as bcrypt from "npm:bcrypt@5.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return new Response(
        JSON.stringify({ error: "נא למלא טלפון וסיסמה" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: traineeAuth, error: authError } = await supabaseAdmin
      .from("trainee_auth")
      .select("*")
      .eq("phone", phone)
      .eq("is_active", true)
      .maybeSingle();

    if (authError || !traineeAuth) {
      return new Response(
        JSON.stringify({ error: "מספר טלפון או סיסמה שגויים" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const passwordMatch = await bcrypt.compare(password, traineeAuth.password_hash);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: "מספר טלפון או סיסמה שגויים" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: trainee, error: traineeError } = await supabaseAdmin
      .from("trainees")
      .select("*")
      .eq("id", traineeAuth.trainee_id)
      .maybeSingle();

    if (traineeError || !trainee) {
      return new Response(
        JSON.stringify({ error: "שגיאה בטעינת פרטי מתאמן" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabaseAdmin
      .from("trainee_auth")
      .update({ last_login: new Date().toISOString() })
      .eq("id", traineeAuth.id);

    return new Response(
      JSON.stringify({
        trainee_id: trainee.id,
        trainee: trainee,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: error.message || "שגיאה בהתחברות" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});