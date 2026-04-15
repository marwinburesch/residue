export type MilestoneKey =
  | "firstFragmentOpened"
  | "firstCorruptedField"
  | "fifthProfile"
  | "firstOutline"
  | "stage1Unlock";

export const MILESTONES: Record<MilestoneKey, string> = {
  firstFragmentOpened:
    "[INFO] First field fully resolved. Pipeline is producing usable output.",
  firstCorruptedField:
    "[WARN] Corrupted field detected in incoming stream. Restoration available.",
  fifthProfile:
    "[INFO] Entity extraction threshold reached. Five profiles on file.",
  firstOutline:
    "[INFO] Profile has crossed into outline tier. Identity is becoming legible.",
  stage1Unlock:
    "[INFO] Rig expansion online. Secondary channel: corkboard notes — auxiliary intake enabled.",
};

export const BOOT_LINES: ReadonlyArray<string> = [
  "HARLOW & SABLE // Expense Digitisation Service",
  "Terminal v0.4.1 — licensed to [OPERATOR]",
  "Mounting channel: receipts ............ ok",
  "OCR pipeline ............................ ok",
  "Awaiting operator.",
];

export const BOOT_LINE_MS = 240;
