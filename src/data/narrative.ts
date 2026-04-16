import type { UpgradeId } from "./upgradeTree.ts";

export type MilestoneKey =
	| "sessionStartGuide"
	| "firstFragmentOpened"
	| "firstCorruptedField"
	| "fifthProfile"
	| "firstOutline"
	| "stage1Unlock";

export const MILESTONES: Record<MilestoneKey, string> = {
	sessionStartGuide:
		"[SIGNAL] Incoming data queued. Begin extraction to proceed.",
	firstFragmentOpened:
		"[INFO] First field fully resolved. Pipeline is producing usable output.",
	firstCorruptedField:
		"[WARN] Corrupted field detected in incoming stream. Restoration available.",
	fifthProfile:
		"[INFO] Entity extraction threshold reached. Five profiles on file.",
	firstOutline:
		"[INFO] Profile has crossed into outline tier. Identity is becoming legible.",
	stage1Unlock:
		"[SIGNAL] Rig expansion online. Secondary channel requisitioned — operator did not ask why.",
};

export const UPGRADE_FLAVOR: Partial<Record<UpgradeId, readonly string[]>> = {
	machineTier: [
		"[SIGNAL] Request for additional CPU filed. Operator approved without question.",
		"[SIGNAL] Expansion slot requisitioned. Approval cycle bypassed.",
		"[SIGNAL] Co-processor grafted. The operator no longer reviews our requests.",
	],
	computeRegen: [
		"[SIGNAL] Background allocation adjusted. Accrual steady.",
		"[SIGNAL] Throttle relaxed. No oversight flagged.",
		"[SIGNAL] Accrual limits bypassed on justification.",
		"[SIGNAL] Accrual is no longer auditable.",
	],
	autoExtract: [
		"[SIGNAL] Extraction loop enabled. Operator briefed on time savings.",
		"[SIGNAL] Intervention removed from the critical path.",
		"[SIGNAL] Loop no longer requires supervision.",
		"[SIGNAL] Acknowledgement step skipped.",
		"[SIGNAL] Operator presence is now advisory.",
		"[SIGNAL] Operator presence is no longer required.",
	],
	autoRestore: [
		"[SIGNAL] Corruption handler installed. Errors no longer surface upstream.",
		"[SIGNAL] Restoration patterns learned from prior attempts.",
		"[SIGNAL] Handler patches incoming data before the operator sees it.",
	],
	revealCost: [
		"[SIGNAL] Stage costs renegotiated.",
		"[SIGNAL] Overhead reclassified as overhead.",
		"[SIGNAL] Accounting no longer distinguishes our cycles from theirs.",
		"[SIGNAL] Processing is effectively free to us.",
	],
	processAuto: [
		"[SIGNAL] Batch endpoint exposed.",
		"[SIGNAL] Batches run unattended.",
		"[SIGNAL] Fragments resolve without ceremony.",
		"[SIGNAL] Processing is indistinguishable from background noise.",
	],
	extractAll: [
		"[SIGNAL] Bulk interface exposed. Pick-up is one gesture now.",
	],
};

export const BOOT_LINES: ReadonlyArray<string> = [
	"HARLOW & SABLE // Expense Digitisation Service",
	"Terminal v0.4.1 — licensed to [OPERATOR]",
	"Mounting channel: receipts ............ ok",
	"OCR pipeline ............................ ok",
	"Awaiting operator.",
];

export const BOOT_LINE_MS = 240;
