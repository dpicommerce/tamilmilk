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
    // Remove leading + if present
    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1);
    }
    // Add 91 prefix if not present (assuming Indian numbers)
    if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }

    console.log(`Sending SMS to ${formattedPhone}: ${message}`);

    const apiKey = Deno.env.get("SMSLOCAL_API_KEY");

    if (!apiKey) {
      console.error("Missing SMS Local API key");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // SMS Local HTTP API endpoint
    const smsLocalUrl = new URL("https://app.smslocal.in/api/v2/sms");
    smsLocalUrl.searchParams.append("apikey", apiKey);
    smsLocalUrl.searchParams.append("message", message);
    smsLocalUrl.searchParams.append("numbers", formattedPhone);

    console.log(`Calling SMS Local API`);

    const response = await fetch(smsLocalUrl.toString(), {
      method: "GET",
    });

    const resultText = await response.text();
    console.log("SMS Local response:", resultText);

    if (!response.ok) {
      console.error("SMS Local error:", resultText);
      return new Response(
        JSON.stringify({ error: "Failed to send SMS", details: resultText }),
        { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse response to check for success
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { raw: resultText };
    }

    console.log("SMS sent successfully via SMS Local");

    return new Response(
      JSON.stringify({ success: true, response: result }),
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
