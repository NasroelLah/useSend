import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  teamProcedure,
  teamAdminProcedure,
} from "~/server/api/trpc";
import { TeamService } from "~/server/service/team-service";
import { encrypt, decrypt } from "~/server/utils/encrypt";
import { PlanConfigService } from "~/server/service/plan-config-service";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { db } from "~/server/db";

const AWS_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ap-south-1",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ca-central-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "sa-east-1",
] as const;

export const teamRouter = createTRPCRouter({
  createTeam: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return TeamService.createTeam(ctx.session.user.id, input.name);
    }),

  getTeams: protectedProcedure.query(async ({ ctx }) => {
    return TeamService.getUserTeams(ctx.session.user.id);
  }),

  getTeamUsers: teamProcedure.query(async ({ ctx }) => {
    return TeamService.getTeamUsers(ctx.team.id);
  }),

  getTeamInvites: teamProcedure.query(async ({ ctx }) => {
    return TeamService.getTeamInvites(ctx.team.id);
  }),

  createTeamInvite: teamAdminProcedure
    .input(
      z.object({
        email: z.string(),
        role: z.enum(["MEMBER", "ADMIN"]),
        sendEmail: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return TeamService.createTeamInvite(
        ctx.team.id,
        input.email,
        input.role,
        ctx.team.name,
        input.sendEmail,
      );
    }),

  updateTeamUserRole: teamAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["MEMBER", "ADMIN"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return TeamService.updateTeamUserRole(
        ctx.team.id,
        input.userId,
        input.role,
      );
    }),

  deleteTeamUser: teamProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return TeamService.deleteTeamUser(
        ctx.team.id,
        input.userId,
        ctx.teamUser.role,
        ctx.session.user.id,
      );
    }),

  resendTeamInvite: teamAdminProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return TeamService.resendTeamInvite(
        ctx.team.id,
        input.inviteId,
        ctx.team.name,
      );
    }),

  deleteTeamInvite: teamAdminProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return TeamService.deleteTeamInvite(ctx.team.id, input.inviteId);
    }),

  // ── BYOS (Bring Your Own SES) ──────────────────────────────────────────────

  getByosStatus: teamAdminProcedure.query(async ({ ctx }) => {
    const planConfig = await PlanConfigService.getPlanConfig();
    const teamPlan = ctx.team.plan as "FREE" | "BASIC";
    const allowByos = planConfig[teamPlan]?.allowByos ?? false;

    const team = await db.team.findUniqueOrThrow({
      where: { id: ctx.team.id },
      select: { byosAccessKeyId: true, byosRegion: true },
    });

    const configured = !!team.byosAccessKeyId;

    return {
      allowByos,
      configured,
      // Return a redacted key preview so the UI can show partial info
      keyIdPreview: configured
        ? `****${team.byosAccessKeyId!.slice(-4)}`
        : null,
      region: team.byosRegion ?? null,
    };
  }),

  setByosCredentials: teamAdminProcedure
    .input(
      z.object({
        accessKeyId: z.string().min(16).max(128),
        secretAccessKey: z.string().min(1),
        region: z.enum(AWS_REGIONS),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Gate: plan must allow BYOS
      const planConfig = await PlanConfigService.getPlanConfig();
      const teamPlan = ctx.team.plan as "FREE" | "BASIC";
      if (!planConfig[teamPlan]?.allowByos) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your current plan does not support Bring Your Own SES.",
        });
      }

      // Validate credentials via STS before storing
      const stsClient = new STSClient({
        region: input.region,
        credentials: {
          accessKeyId: input.accessKeyId,
          secretAccessKey: input.secretAccessKey,
        },
      });

      try {
        await stsClient.send(new GetCallerIdentityCommand({}));
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "AWS credentials are invalid or do not have permission to call STS GetCallerIdentity. Please check your Access Key ID, Secret Access Key, and region.",
        });
      }

      // Encrypt both secrets before persisting
      const encryptedKeyId = encrypt(input.accessKeyId);
      const encryptedSecret = encrypt(input.secretAccessKey);

      await db.team.update({
        where: { id: ctx.team.id },
        data: {
          byosAccessKeyId: encryptedKeyId,
          byosSecretKey: encryptedSecret,
          byosRegion: input.region,
        },
      });

      return { ok: true };
    }),

  removeByosCredentials: teamAdminProcedure.mutation(async ({ ctx }) => {
    await db.team.update({
      where: { id: ctx.team.id },
      data: {
        byosAccessKeyId: null,
        byosSecretKey: null,
        byosRegion: null,
      },
    });
    return { ok: true };
  }),

  getByosRegions: teamProcedure.query(() => AWS_REGIONS),
});
