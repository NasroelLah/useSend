import { env } from "~/env";
import { getOtp } from "~/server/dev-otp-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (env.NODE_ENV !== "development") {
    return Response.json({ error: "Not available" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return Response.json({ error: "Email required" }, { status: 400 });
  }

  const otp = getOtp(email);

  if (!otp) {
    return Response.json({ error: "No OTP found" }, { status: 404 });
  }

  return Response.json({ otp });
}
