import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { PRICING_TIERS, TIME_SLOTS, calculatePrice } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessName,
      contactName,
      contactEmail,
      contactPhone,
      timeSlotId,
      durationValue,
      durationUnit,
      selectedTier,
      requestAdCreation,
      adNotes,
      adFileName,
    } = body;

    // Validate required fields
    if (!businessName || !contactName || !contactEmail || !timeSlotId || !selectedTier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tier = PRICING_TIERS.find((t) => t.name === selectedTier);
    if (!tier) {
      return NextResponse.json({ error: "Invalid pricing tier" }, { status: 400 });
    }

    const slot = TIME_SLOTS.find((s) => s.id === timeSlotId);
    if (!slot) {
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
    }

    // Server-side price calculation to prevent client tampering
    const totalPrice = calculatePrice(selectedTier, durationValue, durationUnit);
    if (totalPrice <= 0) {
      return NextResponse.json({ error: "Invalid price calculation" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: contactEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: totalPrice * 100, // cents
            product_data: {
              name: `Billboard TV — ${tier.name} Plan`,
              description: `${slot.label} · ${durationValue} ${durationUnit} · Mission Beach`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        businessName,
        contactName,
        contactEmail,
        contactPhone: contactPhone || "",
        timeSlotId,
        durationValue: String(durationValue),
        durationUnit,
        selectedTier,
        requestAdCreation: String(requestAdCreation),
        adNotes: adNotes || "",
        adFileName: adFileName || "",
        totalPrice: String(totalPrice),
      },
      success_url: `${origin}/advertise/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/advertise/book?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
