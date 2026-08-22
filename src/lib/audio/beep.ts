let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

function playTone(
  context: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(context.destination);

  // Ramp gain up/down instead of a hard on/off to avoid an audible click.
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/** Plays a short three-note chime to signal a study timer finishing. */
export function playTimerAlert() {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const notes = [880, 1108.73, 1318.51]; // A5, C#6, E6
  const noteDuration = 0.18;
  const gap = 0.2;

  notes.forEach((frequency, index) => {
    playTone(context, frequency, now + index * gap, noteDuration);
  });
}
