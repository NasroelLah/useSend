"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@usesend/ui/src/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@usesend/ui/src/dialog";
import { Button } from "@usesend/ui/src/button";
import { Input } from "@usesend/ui/src/input";
import { Spinner } from "@usesend/ui/src/spinner";
import { toast } from "@usesend/ui/src/toaster";
import { SidebarMenuButton, useSidebar } from "@usesend/ui/src/sidebar";
import { api } from "~/trpc/react";
import { useTeam } from "~/providers/team-context";
import { isCloud } from "~/utils/common";

export function TeamSwitcher() {
  const { currentTeam, teams, setActiveTeam, isLoading } = useTeam();
  const { isMobile } = useSidebar();
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading || !currentTeam) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="border border-sidebar-border data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent">
              <Users className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{currentTeam.name}</span>
              <span className="truncate text-xs text-muted-foreground capitalize">
                {currentTeam.plan.toLowerCase()} plan
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-xl"
          side={isMobile ? "bottom" : "right"}
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Teams
          </DropdownMenuLabel>
          {teams.map((team) => (
            <DropdownMenuItem
              key={team.id}
              onClick={() => setActiveTeam(team.id)}
              className="gap-2"
            >
              <span className="truncate flex-1">{team.name}</span>
              {team.id === currentTeam.id ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : null}
            </DropdownMenuItem>
          ))}
          {isCloud() ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create team
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function CreateTeamDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const createTeam = api.team.createTeam.useMutation();
  const utils = api.useUtils();
  const { setActiveTeam } = useTeam();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Team name must be at least 2 characters.");
      return;
    }
    createTeam.mutate(
      { name: name.trim() },
      {
        onSuccess: (team) => {
          utils.team.invalidate();
          if (team?.id) {
            setActiveTeam(team.id);
          }
          setName("");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            Teams have their own domains, API keys, contacts and billing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            placeholder="Team name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button type="submit" disabled={createTeam.isPending}>
              {createTeam.isPending ? (
                <Spinner className="w-5 h-5" />
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
