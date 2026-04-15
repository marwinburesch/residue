import type { StageId } from "../data/stageConfig.ts";

const STAGE_HZ: Record<StageId, number> = {
  0: 110,
  1: 98,
};

type Drone = {
  ctx: AudioContext;
  osc: OscillatorNode;
  gain: GainNode;
};

let drone: Drone | null = null;

export function startDrone(initialStage: StageId): void {
  if (drone) return;
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return;
  const ctx = new Ctor();
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.value = STAGE_HZ[initialStage];
  filter.type = "lowpass";
  filter.frequency.value = 320;
  gain.gain.value = 0;

  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start();
  gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5);
  drone = { ctx, osc, gain };
}

export function setStage(stage: StageId): void {
  if (!drone) return;
  const target = STAGE_HZ[stage];
  drone.osc.frequency.linearRampToValueAtTime(target, drone.ctx.currentTime + 1.2);
}
