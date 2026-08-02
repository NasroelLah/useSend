"use client";

import { useEffect } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, RotateCcw, Save, Server } from "lucide-react";
import { Button } from "@usesend/ui/src/button";
import { Input } from "@usesend/ui/src/input";
import { Badge } from "@usesend/ui/src/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@usesend/ui/src/form";
import Spinner from "@usesend/ui/src/spinner";
import { Switch } from "@usesend/ui/src/switch";
import { toast } from "@usesend/ui/src/toaster";

import { api } from "~/trpc/react";
import { LIMIT_LABELS, planLimitKeys } from "~/lib/constants/plan-config";
import type { Plan } from "@prisma/client";

// ── Zod schema ──────────────────────────────────────────────────────────────

const limitSchema = z.object(
  Object.fromEntries(planLimitKeys.map((k) => [k, z.number().int()])) as Record<
    (typeof planLimitKeys)[number],
    z.ZodNumber
  >,
);

const planSchema = z.object({
  displayName: z.string().min(1, "Required"),
  price: z.object({
    monthly: z.number().min(0),
    currency: z.string().min(1).max(3),
  }),
  perks: z.array(z.object({ value: z.string() })),
  limits: limitSchema,
  allowByos: z.boolean(),
});

const formSchema = z.object({
  FREE: planSchema,
  BASIC: planSchema,
});

type FormValues = z.infer<typeof formSchema>;

// ── Helper ───────────────────────────────────────────────────────────────────

function configToForm(config: {
  FREE: { displayName: string; price: { monthly: number; currency: string }; perks: string[]; limits: Record<string, number>; allowByos: boolean };
  BASIC: { displayName: string; price: { monthly: number; currency: string }; perks: string[]; limits: Record<string, number>; allowByos: boolean };
}): FormValues {
  const mapPlan = (plan: typeof config.FREE) => ({
    displayName: plan.displayName,
    price: plan.price,
    perks: plan.perks.map((v) => ({ value: v })),
    limits: plan.limits as FormValues["FREE"]["limits"],
    allowByos: plan.allowByos,
  });
  return { FREE: mapPlan(config.FREE), BASIC: mapPlan(config.BASIC) };
}

function formToPayload(values: FormValues) {
  const mapPlan = (plan: FormValues["FREE"]) => ({
    displayName: plan.displayName,
    price: plan.price,
    perks: plan.perks.map((p) => p.value).filter(Boolean),
    limits: plan.limits,
    allowByos: plan.allowByos,
  });
  return { FREE: mapPlan(values.FREE), BASIC: mapPlan(values.BASIC) };
}

// ── Sub-component: plan card ─────────────────────────────────────────────────

function PlanCard({
  planKey,
  form,
}: {
  planKey: Plan;
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  const prefix = planKey as "FREE" | "BASIC";
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `${prefix}.perks`,
  });

  const isBasic = planKey === "BASIC";

  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Badge variant={isBasic ? "default" : "secondary"} className="text-xs">
          {planKey}
        </Badge>
        <FormField
          control={form.control}
          name={`${prefix}.displayName`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  {...field}
                  placeholder="Display name"
                  className="h-8 text-base font-semibold"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Pricing */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pricing
        </p>
        <div className="flex gap-3">
          <FormField
            control={form.control}
            name={`${prefix}.price.monthly`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-xs">Monthly price</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      {...field}
                      value={Number.isNaN(field.value) ? 0 : field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="pl-7"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.price.currency`}
            render={({ field }) => (
              <FormItem className="w-24">
                <FormLabel className="text-xs">Currency</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="USD"
                    maxLength={3}
                    className="uppercase"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Limits */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Limits
        </p>
        <div className="grid grid-cols-2 gap-3">
          {planLimitKeys.map((limitKey) => (
            <FormField
              key={limitKey}
              control={form.control}
              name={`${prefix}.limits.${limitKey}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">{LIMIT_LABELS[limitKey]}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min={-1}
                        step={1}
                        {...field}
                        value={Number.isNaN(field.value) ? -1 : field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                      {field.value === -1 && (
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                          unlimited
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Set <code className="rounded bg-muted px-1 py-0.5">-1</code> to grant unlimited access.
        </p>
      </div>

      {/* Perks */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Perks (shown on the upgrade page)
        </p>
        <div className="flex flex-col gap-2">
          {fields.map((f, idx) => (
            <div key={f.id} className="flex items-center gap-2">
              <Controller
                control={form.control}
                name={`${prefix}.perks.${idx}.value`}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={`Perk ${idx + 1}`}
                    className="flex-1 text-sm"
                  />
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(idx)}
                aria-label="Remove perk"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 w-full gap-1.5"
            onClick={() => append({ value: "" })}
          >
            <Plus className="h-3.5 w-3.5" />
            Add perk
          </Button>
        </div>
      </div>

      {/* BYOS toggle */}
      <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-background p-1.5 shadow-sm border">
            <Server className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium leading-none">Bring Your Own SES</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Allow teams on this plan to use their own AWS SES credentials for sending.
            </p>
          </div>
        </div>
        <FormField
          control={form.control}
          name={`${prefix}.allowByos`}
          render={({ field }) => (
            <FormItem className="flex items-center">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Allow Bring Your Own SES"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPlansPage() {
  const configQuery = api.admin.getPlanConfig.useQuery();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      FREE: {
        displayName: "Free",
        price: { monthly: 0, currency: "USD" },
        perks: [],
        limits: { emailsPerMonth: 3000, emailsPerDay: 100, domains: 1, contactBooks: 1, teamMembers: 1, webhooks: 1 },
        allowByos: false,
      },
      BASIC: {
        displayName: "Basic",
        price: { monthly: 0, currency: "USD" },
        perks: [],
        limits: { emailsPerMonth: -1, emailsPerDay: -1, domains: -1, contactBooks: -1, teamMembers: -1, webhooks: -1 },
        allowByos: true,
      },
    },
  });

  // Populate form when config loads
  useEffect(() => {
    if (configQuery.data) {
      form.reset(configToForm(configQuery.data));
    }
  }, [configQuery.data, form]);

  const saveMutation = api.admin.setPlanConfig.useMutation({
    onSuccess: () => {
      toast.success("Plan configuration saved");
      void configQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to save plan configuration");
    },
  });

  const resetMutation = api.admin.resetPlanConfig.useMutation({
    onSuccess: () => {
      toast.success("Plan configuration reset to defaults");
      void configQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to reset plan configuration");
    },
  });

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(formToPayload(values));
  };

  const isPending = saveMutation.isPending || resetMutation.isPending;

  if (configQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-6 w-6" innerSvgClass="stroke-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Changes are stored in Redis and take effect within 60 seconds
              across all running workers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => resetMutation.mutate()}
            >
              {resetMutation.isPending ? (
                <Spinner className="mr-1.5 h-3.5 w-3.5" innerSvgClass="stroke-foreground" />
              ) : (
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Reset to defaults
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {saveMutation.isPending ? (
                <Spinner className="mr-1.5 h-3.5 w-3.5" innerSvgClass="stroke-primary-foreground" />
              ) : (
                <Save className="mr-1.5 h-3.5 w-3.5" />
              )}
              Save plans
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PlanCard planKey="FREE" form={form} />
          <PlanCard planKey="BASIC" form={form} />
        </div>
      </form>
    </Form>
  );
}
