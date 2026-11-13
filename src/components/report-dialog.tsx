import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const REASONS = [
  { value: "fake", label: "Fake or impersonating account" },
  { value: "spam", label: "Spam or scam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Something else" },
] as const;

export function ReportDialog({
  targetId, targetName, roomId, children,
}: { targetId: string; targetName: string; roomId?: string | undefined; children: ReactNode }) {
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("fake");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: userId!, reported_id: targetId, reason, details: details.trim().slice(0, 500), room_id: roomId ?? null,
    });
    setBusy(false);
    if (error) {
      if (error.code === "23505") toast.info("You've already reported this member. Thank you.");
      else toast.error(error.message);
    } else toast.success("Report sent. Thanks for keeping ConnectTogether real.");
    setOpen(false);
    setDetails("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Report {targetName}</DialogTitle>
          <DialogDescription>Accounts reported by 3 different members are paused automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as typeof reason)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Details (optional)</Label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} className="rounded-xl" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>Send report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
