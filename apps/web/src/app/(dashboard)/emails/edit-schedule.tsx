"use client";

import { Button } from "@usesend/ui/src/button";
import { Input } from "@usesend/ui/src/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@usesend/ui/src/dialog";
import * as chrono from "chrono-node";
import { api } from "~/trpc/react";
import { useRef, useState } from "react";
import { Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@usesend/ui/src/toaster";

export const EditSchedule: React.FC<{
  emailId: string;
  scheduledAt: string | null;
}> = ({ emailId, scheduledAt }) => {
  const [open, setOpen] = useState(false);
  const [scheduleInput, setScheduleInput] = useState(scheduledAt || "");
  const [scheduledAtTime, setScheduledAtTime] = useState<Date | null>(
    scheduledAt ? new Date(scheduledAt) : null
  );
  const updateEmailScheduledAtMutation =
    api.email.updateEmailScheduledAt.useMutation();

  const utils = api.useUtils();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScheduleUpdate = () => {
    const parsedDate = chrono.parseDate(scheduleInput);
    if (!parsedDate) {
      toast.error("Invalid date and time");
      return;
    }

    updateEmailScheduledAtMutation.mutate(
      {
        id: emailId,
        scheduledAt: parsedDate.toISOString(),
      },
      {
        onSuccess: () => {
          utils.email.getEmail.invalidate({ id: emailId });
          setOpen(false);
          toast.success("Email schedule updated successfully");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleInput(e.target.value);
    setScheduledAtTime(chrono.parseDate(e.target.value));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(_open) => (_open !== open ? setOpen(_open) : null)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="scheduleInput" className="block mb-2">
                Schedule at
              </label>
              <Input
                id="scheduleInput"
                ref={inputRef}
                value={scheduleInput}
                onChange={onInputChange}
                placeholder="Enter date and time (e.g., tomorrow at 3pm)"
                aria-describedby="scheduleInputHint"
              />
              <p
                id="scheduleInputHint"
                className="mt-2 text-sm text-muted-foreground"
                aria-live="polite"
              >
                {scheduledAtTime
                  ? `Will send ${scheduledAtTime.toLocaleString()}`
                  : "Accepts natural language, e.g. \u201Ctomorrow at 3pm\u201D."}
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                className="w-[100px]"
                onClick={handleScheduleUpdate}
                disabled={
                  updateEmailScheduledAtMutation.isPending || !scheduledAtTime
                }
              >
                {updateEmailScheduledAtMutation.isPending
                  ? "Updating..."
                  : "Update"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditSchedule;
