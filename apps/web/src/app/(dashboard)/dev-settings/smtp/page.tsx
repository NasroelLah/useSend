import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@usesend/ui/src/card";
import { TextWithCopyButton } from "@usesend/ui/src/text-with-copy";
import { env } from "~/env";
import { PageHeader } from "~/components/PageHeader";

export const dynamic = "force-dynamic";

export default function SmtpPage() {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;

  return (
    <div>
      <PageHeader
        title="SMTP"
        description="Send emails over SMTP instead of the REST API."
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Connection details</CardTitle>
          <CardDescription>
            Use these credentials with any SMTP client. Your password is any
            active API key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div>
              <strong>Host</strong>
              <TextWithCopyButton
                className="mt-1 w-full rounded-lg border bg-primary/10 p-2 font-mono"
                value={host}
              />
            </div>
            <div>
              <strong>Port</strong>
              <TextWithCopyButton
                className="mt-1 w-full rounded-lg border bg-primary/10 p-2 font-mono"
                value={"465"}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                For encrypted/TLS connections use{" "}
                <strong className="font-mono">2465</strong>,{" "}
                <strong className="font-mono">587</strong> or{" "}
                <strong className="font-mono">2587</strong>
              </p>
            </div>
            <div>
              <strong>User</strong>
              <TextWithCopyButton
                className="mt-1 w-full rounded-lg border bg-primary/10 p-2 font-mono"
                value={user}
              />
            </div>
            <div>
              <strong>Password</strong>
              <TextWithCopyButton
                className="mt-1 w-full rounded-lg border bg-primary/10 p-2 font-mono"
                value={"YOUR_API_KEY"}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Use any active API key as the password.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
