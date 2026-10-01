import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { resend } from "@/lib/email/resend";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TEMPLATE_ID = "c3761b4f-a0e3-4983-aa5d-11a7c174bace";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || !("email" in body)) {
      return NextResponse.json(
        { error: "Email field is required." },
        { status: 400 }
      );
    }

    const email = (body as { email: unknown }).email;

    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const actionCodeSettings = {
      url: `${baseUrl.replace(/\/$/, "")}/auth`,
      handleCodeInApp: true,
    };

    // Generate sign-in link via Firebase Admin SDK
    const link = await adminAuth.generateSignInWithEmailLink(
      cleanEmail,
      actionCodeSettings
    );

    // Send email via Resend using specified template ID
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const templateId = process.env.RESEND_TEMPLATE_ID || DEFAULT_TEMPLATE_ID;

    const { error: resendError } = await resend.emails.send({
      from: fromEmail,
      to: cleanEmail,
      subject: "Sign in to GFG BNB",
      template: {
        id: templateId,
        variables: {
          link,
          url: link,
          magic_link: link,
          magicLink: link,
          signin_url: link,
          signInUrl: link,
          action_url: link,
          actionUrl: link,
          email: cleanEmail,
        },
      },
    });

    if (resendError) {
      console.error("Resend API error:", resendError.message);
      return NextResponse.json(
        { error: "Failed to send email. Please verify your Resend configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Check your email for a sign-in link.",
    });
  } catch (error: unknown) {
    console.error(
      "Error generating/sending magic link:",
      error instanceof Error ? error.message : "Unknown error"
    );
    const message =
      error instanceof Error ? error.message : "Failed to generate sign-in link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
