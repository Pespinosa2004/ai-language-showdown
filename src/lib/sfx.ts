"use client";

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export function playHeartBreak(): void {
  const audio = context();
  if (!audio) return;
  void audio.resume();
  const now = audio.currentTime;
  const noiseTime = 0.16;

  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * noiseTime), audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = audio.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 1200;
  const noiseGain = audio.createGain();
  noiseGain.gain.setValueAtTime(0.28, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseTime);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audio.destination);
  noise.start(now);
  noise.stop(now + noiseTime);

  const osc = audio.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
  const oscGain = audio.createGain();
  oscGain.gain.setValueAtTime(0.12, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(oscGain);
  oscGain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.22);
}
