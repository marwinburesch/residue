import { DP, PROFILE } from "../data/tuning.ts";
import type { ExtractedField, GameState, Profile, ProfileTier } from "./state.ts";
import { logInfo, nextId } from "./state.ts";
import { awardDp } from "./resources.ts";

const IDENTITY_KINDS = ["name", "loyaltyId"] as const;

export function ingestBatch(state: GameState, batch: ExtractedField[]): void {
  if (batch.length === 0) return;
  const match = findMatch(state, batch);
  const profile = match ?? createProfile(state, batch[0]!.extractedAt);

  for (const field of batch) {
    if (!profile.fields[field.kind]) profile.fields[field.kind] = field.value;
    if (!profile.sources.includes(field.channel)) profile.sources.push(field.channel);
  }

  const prevTier = profile.tier;
  profile.tier = tierFor(profile);
  if (!match) {
    logInfo(state, `[INFO] Entity extracted: profile #${profile.id}.`);
  } else if (prevTier !== profile.tier && profile.tier === "outline") {
    logInfo(state, `[INFO] Profile #${profile.id} resolved to outline tier.`);
  }
}

export function tickProfileDp(state: GameState, dtMs: number): void {
  const sec = dtMs / 1000;
  let gain = 0;
  for (const p of state.profiles) {
    const rate =
      p.tier === "outline"
        ? DP.perFieldPerSecondOutline
        : DP.perFieldPerSecondGhost;
    gain += rate * Object.keys(p.fields).length * sec;
  }
  if (gain > 0) awardDp(state, gain);
}

function findMatch(state: GameState, batch: ExtractedField[]): Profile | null {
  for (const kind of IDENTITY_KINDS) {
    const f = batch.find((x) => x.kind === kind);
    if (!f) continue;
    const hit = state.profiles.find((p) => p.fields[kind] === f.value);
    if (hit) return hit;
  }
  const nameField = batch.find((b) => b.kind === "name");
  const postcodeField = batch.find((b) => b.kind === "postcode");
  if (nameField && postcodeField) {
    const hit = state.profiles.find(
      (p) =>
        p.fields.name === nameField.value &&
        (p.fields.postcode === undefined ||
          p.fields.postcode === postcodeField.value),
    );
    if (hit) return hit;
  }
  return null;
}

function createProfile(state: GameState, at: number): Profile {
  const profile: Profile = {
    id: nextId(state),
    createdAt: at,
    fields: {},
    sources: [],
    tier: "ghost",
  };
  state.profiles.push(profile);
  return profile;
}

function tierFor(profile: Profile): ProfileTier {
  const count = Object.keys(profile.fields).length;
  return count >= PROFILE.outlineFieldThreshold ? "outline" : "ghost";
}
