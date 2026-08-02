"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2,
  Server,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@usesend/ui/src/button";
import { Input } from "@usesend/ui/src/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@usesend/ui/src/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@usesend/ui/src/select";
import Spinner from "@usesend/ui/src/spinner";
import { toast } from "@usesend/ui/src/toaster";
import { Badge } from "@usesend/ui/src/badge";

import { api } from "~/trpc/react";
import { PageHeader } from "~/components/PageHeader";

// ── Constants ────────────────────────────────────────────────────────────────

const AWS_REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-northeast-2", label: "Asia Pacific (Seoul)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ca-central-1", label: "Canada (Central)" },
  { value: "eu-central-1", label: "Europe (Frankfurt)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "eu-west-2", label: "Europe (London)" },
  { value: "eu-west-3", label: "Europe (Paris)" },
  { value: "eu-north-1", label: "Europe (Stockholm)" },
  { value: "sa-east-1", label: "South America (São Paulo)" },
] as const;

// ── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z.object({
  accessKeyId: z
    .string()
    .min(16, "Access Key ID must be at least 16 characters")
    .max(128, "Access Key ID too long"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  region: z.string().min(1, "Region is required"),
});

type FormValues = z.infer<typeof formSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ByosSettingsPage() {
  const [showSecret, setShowSecret] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const utils = api.useUtils();

  const statusQuery = api.team.getByosStatus.useQuery();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accessKeyId: "",
      secretAccessKey: "",
      region: "us-east-1",
    },
  });

  const setCredsMutation = api.team.setByosCredentials.useMutation({
    onSuccess: () => {
      toast.success("AWS credentials saved and verified.");
      form.reset();
      void utils.team.getByosStatus.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const removeCredsMutation = api.team.removeByosCredentials.useMutation({
    onSuccess: () => {
      toast.success("AWS credentials removed. Emails will now use platform SES.");
      void utils.team.getByosStatus.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const onSubmit = (values: FormValues) => {
    setCredsMutation.mutate({
      accessKeyId: values.accessKeyId,
      secretAccessKey: values.secretAccessKey,
      region: values.region as Parameters<typeof setCredsMutation.mutate>[0]["region"],
    });
  };

  if (statusQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-6 w-6" innerSvgClass="stroke-primary" />
      </div>
    );
  }

  const status = statusQuery.data;

  // Plan doesn't allow BYOS
  if (!status?.allowByos) {
    return (
      <div>
        <PageHeader
          as="h2"
          title="Custom SES Credentials"
          description="Use your own AWS SES account to send emails."
        />
        <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Server className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="max-w-sm">
            <p className="font-medium">Not available on your plan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Bring Your Own SES is available on the Basic plan and above. Upgrade to
              connect your own AWS account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        as="h2"
        title="Custom SES Credentials"
        description="Connect your own AWS SES account. All emails sent by this team will use your credentials and quota."
      />

      <div className="mt-8 flex flex-col gap-6">
        {/* Current status card */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${
                  status?.configured
                    ? "bg-green-500/10 text-green-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {status?.configured ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Server className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium leading-none">
                  {status?.configured ? "Custom credentials active" : "Using platform SES"}
                </p>
                {status?.configured ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {status.keyIdPreview}
                    </Badge>
                    {status.region && (
                      <Badge variant="outline" className="text-xs">
                        {status.region}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No custom credentials configured.
                  </p>
                )}
              </div>
            </div>

            {status?.configured && (
              <div className="flex items-center gap-2">
                {confirmRemove ? (
                  <>
                    <p className="text-xs text-muted-foreground">Are you sure?</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={removeCredsMutation.isPending}
                      onClick={() => {
                        removeCredsMutation.mutate();
                        setConfirmRemove(false);
                      }}
                    >
                      {removeCredsMutation.isPending ? (
                        <Spinner className="h-3.5 w-3.5" innerSvgClass="stroke-current" />
                      ) : (
                        "Yes, remove"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRemove(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setConfirmRemove(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Credential form */}
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-5 flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              Credentials are validated against AWS STS before being saved, then
              encrypted at rest with AES-256-GCM. The IAM user must have{" "}
              <code className="rounded bg-muted px-1 py-0.5">ses:SendEmail</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5">ses:SendRawEmail</code>{" "}
              permissions in the selected region.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="accessKeyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Key ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="AKIAIOSFODNN7EXAMPLE"
                        className="font-mono text-sm"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secretAccessKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Access Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showSecret ? "text" : "password"}
                          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                          className="pr-10 font-mono text-sm"
                          autoComplete="new-password"
                          spellCheck={false}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                          onClick={() => setShowSecret((v) => !v)}
                          aria-label={showSecret ? "Hide secret key" : "Show secret key"}
                        >
                          {showSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AWS Region</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AWS_REGIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={setCredsMutation.isPending}
                  className="gap-2"
                >
                  {setCredsMutation.isPending ? (
                    <>
                      <Spinner className="h-4 w-4" innerSvgClass="stroke-primary-foreground" />
                      Validating…
                    </>
                  ) : (
                    "Validate and save"
                  )}
                </Button>
                {status?.configured && (
                  <p className="text-xs text-muted-foreground">
                    Saving will overwrite the existing credentials.
                  </p>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
