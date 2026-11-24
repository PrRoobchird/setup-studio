let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playTone(
  type: 'coin' | 'place' | 'success' | 'click' | 'error',
  enabled: boolean
): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  const playNote = (freq: number, startOffset: number, duration: number, oscType: OscillatorType = 'sine', gainPeak = 0.08) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = oscType;
    osc.frequency.setValueAtTime(freq, now + startOffset);
    gain.gain.setValueAtTime(0.001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + startOffset + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.02);
  };

  if (type === 'coin') {
    playNote(880, 0, 0.11, 'triangle', 0.07);
    playNote(1318.5, 0.08, 0.22, 'triangle', 0.07);
  } else if (type === 'success') {
    playNote(523.25, 0, 0.12, 'triangle', 0.06);
    playNote(659.25, 0.08, 0.12, 'triangle', 0.06);
    playNote(783.99, 0.16, 0.25, 'triangle', 0.07);
  } else if (type === 'place') {
    playNote(320, 0, 0.08, 'sine', 0.07);
    playNote(440, 0.04, 0.1, 'sine', 0.05);
  } else if (type === 'click') {
    playNote(540, 0, 0.045, 'sine', 0.03);
  } else if (type === 'error') {
    playNote(240, 0, 0.14, 'sine', 0.05);
    playNote(195, 0.09, 0.18, 'sine', 0.05);
  }
}
