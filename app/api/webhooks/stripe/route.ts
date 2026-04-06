import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { getResend } from "@/lib/resend";
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};

    try {
      // Save booking to Supabase
      const { data: booking, error: dbError } = await getSupabase()
        .from("bookings")
        .insert({
          business_name: meta.businessName,
          contact_name: meta.contactName,
          contact_email: meta.contactEmail,
          contact_phone: meta.contactPhone || null,
          time_slot_id: meta.timeSlotId,
          duration_value: parseInt(meta.durationValue),
          duration_unit: meta.durationUnit,
          pricing_tier: meta.selectedTier,
          total_price: parseInt(meta.totalPrice),
          request_ad_creation: meta.requestAdCreation === "true",
          ad_notes: meta.adNotes || null,
          ad_file_name: meta.adFileName || null,
          stripe_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          status: "pending_review",
        })
        .select()
        .single();

      if (dbError) {
        console.error("Failed to save booking:", dbError);
      }

      // Send confirmation email
      const emailResult = await getResend().emails.send({
        from: "Mission Beach Billboard TV <noreply@dailyeventinsurance.com>",
        to: meta.contactEmail,
        subject: `Booking Confirmed — ${meta.selectedTier} Plan`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Your Billboard TV Ad Is Booked!</h1>
            <p>Hey ${meta.contactName},</p>
            <p>Thanks for booking with Mission Beach Billboard TV. Here are your details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Plan</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${meta.selectedTier}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Time Slot</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${meta.timeSlotId}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Duration</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${meta.durationValue} ${meta.durationUnit}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Total</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">$${meta.totalPrice}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Ad Creative</td><td style="padding: 8px; font-weight: bold;">${meta.requestAdCreation === "true" ? "Our team will create your ad" : "You provided your own"}</td></tr>
            </table>
            <h2 style="color: #333; font-size: 16px;">What's Next?</h2>
            <ol style="color: #555; line-height: 1.8;">
              <li>Our team will review your booking</li>
              <li>${meta.requestAdCreation === "true" ? "We'll design your ad and send a proof for approval" : "We'll verify your ad meets our display specs"}</li>
              <li>Once approved, your ad goes live on the billboard!</li>
            </ol>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Questions? Reply to this email or contact julian@aiacrobatics.com
            </p>
          </div>
        `,
      });

      if (emailResult.error) {
        console.error("Failed to send confirmation email:", emailResult.error);
      }

      console.log("Booking saved:", booking?.id, "Email sent to:", meta.contactEmail);
    } catch (err) {
      console.error("Webhook handler error:", err);
    }
  }

  return NextResponse.json({ received: true });
}
