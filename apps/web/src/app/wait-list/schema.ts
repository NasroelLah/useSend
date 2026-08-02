import { z } from "zod";

export const WAITLIST_EMAIL_TYPES = [
  "transactional",
  "marketing",
] as const;

export const waitlistSubmissionSchema = z.object({
 domain: z
  .string({ message: "Domain is required" })
  .trim()
  .min(1, "Domain is required")
  .max(255, "Domain must be 255 characters or fewer")
  .regex(
    /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
    "Please enter a valid domain (e.g. example.com)"
  ),
  emailTypes: z
    .array(z.enum(WAITLIST_EMAIL_TYPES))
    .min(1, "Select at least one email type"),
  emailVolume: z
    .string({ message: "Share your expected volume" })
    .trim()
    .min(1, "Tell us how many emails you expect to send")
    .max(500, "Keep the volume details under 500 characters"),
  description: z
    .string({ message: "Provide a short description" })
    .trim()
    .min(10, "Please share a bit more detail")
    .max(2000, "Description must be under 2000 characters"),
});

export type WaitlistSubmissionInput = z.infer<typeof waitlistSubmissionSchema>;
