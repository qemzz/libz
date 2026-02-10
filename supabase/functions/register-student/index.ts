import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { student_id, password } = await req.json();

    if (!student_id || !password) {
      return new Response(
        JSON.stringify({ error: "Student ID and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if student_id exists in students table
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, name, user_id, is_active")
      .eq("student_id", student_id)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: "Student ID not found. Please contact your librarian." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!student.is_active) {
      return new Response(
        JSON.stringify({ error: "This student account is inactive." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (student.user_id) {
      return new Response(
        JSON.stringify({ error: "This student ID already has an account. Please log in instead." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user with synthetic email
    const syntheticEmail = `${student_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.library`;
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
      user_metadata: { student_id, name: student.name },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link auth user to student record
    const { error: linkError } = await supabaseAdmin
      .from("students")
      .update({ user_id: authUser.user.id })
      .eq("id", student.id);

    if (linkError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to link account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: "Account created successfully",
        email: syntheticEmail,
        name: student.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
