import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmsRequest {
  to: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message }: SmsRequest = await req.json();

    if (!to || !message) {
      console.error("Missing required fields: to or message");
      return new Response(
        JSON.stringify({ error: "Missing required fields: to and message" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format phone number - remove spaces and dashes
    let formattedPhone = to.replace(/\s+/g, "").replace(/-/g, "");
    // Remove leading + if present (Exotel doesn't need it)
    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1);
    }
    // Add 91 prefix if not present (assuming Indian numbers)
    if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }

    console.log(`Sending SMS to ${formattedPhone}: ${message}`);

    const apiKey = Deno.env.get("EXOTEL_API_KEY");
    const apiToken = Deno.env.get("EXOTEL_API_TOKEN");
    const subdomain = Deno.env.get("EXOTEL_SUBDOMAIN");
    const senderId = Deno.env.get("EXOTEL_SENDER_ID");

    if (!apiKey || !apiToken || !subdomain || !senderId) {
      console.error("Missing Exotel credentials");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Exotel SMS API endpoint
    const exotelUrl = `https://${apiKey}:${apiToken}@${subdomain}/v1/Accounts/${apiKey}/Sms/send`;

    const formData = new URLSearchParams();
    formData.append("From", senderId);
    formData.append("To", formattedPhone);
    formData.append("Body", message);

    console.log(`Calling Exotel API: ${subdomain}`);

    const response = await fetch(exotelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const resultText = await response.text();
    console.log("Exotel response:", resultText);

    if (!response.ok) {
      console.error("Exotel error:", resultText);
      return new Response(
        JSON.stringify({ error: "Failed to send SMS", details: resultText }),
        { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("SMS sent successfully via Exotel");

    return new Response(
      JSON.stringify({ success: true, response: resultText }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
