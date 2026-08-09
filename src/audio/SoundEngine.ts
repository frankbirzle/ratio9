import { NOTE_DURATION } from "../config";
import type { ClickTier, SoundId } from "../types";

export class SoundEngine {
	private audioCtx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private noiseBuffer: AudioBuffer | null = null;
	private samples: Map<string, AudioBuffer> = new Map();
	private volumeAccent = 0.8;
	private volumeNormal = 0.5;
	private volumeSubdivision = 0.25;

	get context(): AudioContext | null {
		return this.audioCtx;
	}
	get master(): GainNode | null {
		return this.masterGain;
	}

	async init(): Promise<void> {
		if (this.audioCtx) return;
		this.audioCtx = new AudioContext();
		this.masterGain = this.audioCtx.createGain();
		this.masterGain.connect(this.audioCtx.destination);
		this.noiseBuffer = this.createNoiseBuffer(1);
	}

	async resume(): Promise<void> {
		if (!this.audioCtx) {
			await this.init();
			// Load samples now that AudioContext exists (Fix R2.1)
			await Promise.all([
				this.loadSample("rim-shot", "/samples/rim-shot.wav"),
				this.loadSample("tabla", "/samples/tabla.wav"),
			]);
		}
		if (this.audioCtx && this.audioCtx.state === "suspended") {
			await this.audioCtx.resume();
		}
	}

	setMasterVolume(v: number): void {
		if (this.masterGain) this.masterGain.gain.value = v;
	}

	setVolumeTiers(accent: number, normal: number, subdivision: number): void {
		this.volumeAccent = accent;
		this.volumeNormal = normal;
		this.volumeSubdivision = subdivision;
	}

	async loadSample(id: string, url: string): Promise<void> {
		if (!this.audioCtx) return;
		try {
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
			this.samples.set(id, audioBuffer);
		} catch (err) {
			console.warn(`Failed to load sample ${id} from ${url}:`, err);
		}
	}

	playClick(time: number, tier: ClickTier, soundId: SoundId): void {
		const volume =
			tier === "accent"
				? this.volumeAccent
				: tier === "normal"
					? this.volumeNormal
					: this.volumeSubdivision;
		const pitchMult =
			tier === "accent" ? 1.5 : tier === "subdivision" ? 1.25 : 1.0;
		const durationMult = tier === "subdivision" ? 0.6 : 1.0;

		switch (soundId) {
			case "warm-woodblock":
				this.playWoodblock(time, volume, pitchMult, durationMult);
				break;
			case "sharp-clave":
				this.playClave(time, volume, pitchMult, durationMult);
				break;
			case "cowbell":
				this.playCowbell(time, volume, pitchMult, durationMult);
				break;
			case "soft-chime":
				this.playKarplusStrong(time, volume, pitchMult, durationMult);
				break;
			case "digital-beep":
				this.playSineBeep(time, volume, pitchMult, durationMult);
				break;
			case "rim-shot":
				this.playSample("rim-shot", time, volume, pitchMult, durationMult);
				break;
			case "tabla":
				this.playSample("tabla", time, volume, pitchMult, durationMult);
				break;
			case "analog-click":
				this.playAnalogClick(time, volume, pitchMult, durationMult);
				break;
			case "super-click":
				// Voiced per tier (own pitch, length and attack), so it ignores
				// the generic pitch/duration multipliers
				this.playSuperClick(time, volume, tier);
				break;
		}
	}

	private createNoiseBuffer(seconds: number): AudioBuffer {
		const sampleRate = this.audioCtx!.sampleRate;
		const length = Math.floor(sampleRate * seconds);
		const buffer = this.audioCtx!.createBuffer(1, length, sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
		return buffer;
	}

	private playWoodblock(
		time: number,
		volume: number,
		pitchMult: number,
		durationMult: number,
	): void {
		const freq = 1000 * pitchMult;
		const duration = NOTE_DURATION * durationMult;
		// Noise transient
		const noiseSrc = this.audioCtx!.createBufferSource();
		noiseSrc.buffer = this.noiseBuffer;
		const bandpass = this.audioCtx!.createBiquadFilter();
		bandpass.type = "bandpass";
		bandpass.frequency.value = freq;
		bandpass.Q.value = 4;
		const noiseEnv = this.audioCtx!.createGain();
		noiseEnv.gain.setValueAtTime(volume * 0.6, time);
		noiseEnv.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.5);
		noiseSrc.connect(bandpass);
		bandpass.connect(noiseEnv);
		noiseEnv.connect(this.masterGain!);
		noiseSrc.start(time);
		noiseSrc.stop(time + duration * 0.5);
		noiseSrc.onended = () => {
			noiseSrc.disconnect();
			bandpass.disconnect();
			noiseEnv.disconnect();
		};
		// Tonal body
		const osc = this.audioCtx!.createOscillator();
		osc.type = "sine";
		osc.frequency.value = freq * 0.75;
		const oscEnv = this.audioCtx!.createGain();
		oscEnv.gain.setValueAtTime(0, time);
		oscEnv.gain.linearRampToValueAtTime(volume * 0.4, time + 0.001);
		oscEnv.gain.exponentialRampToValueAtTime(0.001, time + duration);
		osc.connect(oscEnv);
		oscEnv.connect(this.masterGain!);
		osc.start(time);
		osc.stop(time + duration);
		osc.onended = () => {
			osc.disconnect();
			oscEnv.disconnect();
		};
	}

	private playClave(
		time: number,
		volume: number,
		pitchMult: number,
		durationMult: number,
	): void {
		const freq = 2500 * pitchMult;
		const duration = 0.03 * durationMult;
		const carrier = this.audioCtx!.createOscillator();
		carrier.type = "triangle";
		carrier.frequency.value = freq;
		const modulator = this.audioCtx!.createOscillator();
		modulator.type = "sine";
		modulator.frequency.value = freq * 3.5;
		const modGain = this.audioCtx!.createGain();
		modGain.gain.value = freq * 2;
		modulator.connect(modGain);
		modGain.connect(carrier.frequency);
		const highpass = this.audioCtx!.createBiquadFilter();
		highpass.type = "highpass";
		highpass.frequency.value = 1500;
		const env = this.audioCtx!.createGain();
		env.gain.setValueAtTime(volume, time);
		env.gain.exponentialRampToValueAtTime(0.001, time + duration);
		carrier.connect(highpass);
		highpass.connect(env);
		env.connect(this.masterGain!);
		modulator.start(time);
		carrier.start(time);
		modulator.stop(time + duration);
		carrier.stop(time + duration);
		const cleanup = () => {
			carrier.disconnect();
			modulator.disconnect();
			modGain.disconnect();
			highpass.disconnect();
			env.disconnect();
		};
		carrier.onended = cleanup;
	}

	private playCowbell(
		time: number,
		volume: number,
		pitchMult: number,
		durationMult: number,
	): void {
		const carrierFreq = 560 * pitchMult;
		const modulatorFreq = 840 * pitchMult;
		const modIndex = 300 * pitchMult;
		const duration = 0.15 * durationMult;
		const modulator = this.audioCtx!.createOscillator();
		modulator.type = "sine";
		modulator.frequency.value = modulatorFreq;
		const modGain = this.audioCtx!.createGain();
		modGain.gain.value = modIndex;
		modGain.gain.setValueAtTime(modIndex, time);
		modGain.gain.exponentialRampToValueAtTime(1, time + duration);
		const carrier = this.audioCtx!.createOscillator();
		carrier.type = "sine";
		carrier.frequency.value = carrierFreq;
		modulator.connect(modGain);
		modGain.connect(carrier.frequency);
		const env = this.audioCtx!.createGain();
		env.gain.setValueAtTime(0, time);
		env.gain.linearRampToValueAtTime(volume, time + 0.001);
		env.gain.exponentialRampToValueAtTime(0.001, time + duration);
		carrier.connect(env);
		env.connect(this.masterGain!);
		modulator.start(time);
		carrier.start(time);
		modulator.stop(time + duration);
		carrier.stop(time + duration);
		const cleanup = () => {
			carrier.disconnect();
			modulator.disconnect();
			modGain.disconnect();
			env.disconnect();
		};
		carrier.onended = cleanup;
	}

	private playKarplusStrong(
		time: number,
		volume: number,
		pitchMult: number,
		durationMult: number,
	): void {
		const baseFreq = 660 * pitchMult;
		const sampleRate = this.audioCtx!.sampleRate;
		const delaySeconds = 1 / baseFreq;
		const duration = 0.15 * durationMult;
		const burstLength = Math.ceil(sampleRate * delaySeconds);
		const burstBuffer = this.audioCtx!.createBuffer(1, burstLength, sampleRate);
		const burstData = burstBuffer.getChannelData(0);
		for (let i = 0; i < burstLength; i++) burstData[i] = Math.random() * 2 - 1;
		const noiseSrc = this.audioCtx!.createBufferSource();
		noiseSrc.buffer = burstBuffer;
		const delay = this.audioCtx!.createDelay(1.0);
		delay.delayTime.value = delaySeconds;
		const lowpass = this.audioCtx!.createBiquadFilter();
		lowpass.type = "lowpass";
		lowpass.frequency.value = 3000;
		lowpass.Q.value = 0.5;
		const feedback = this.audioCtx!.createGain();
		feedback.gain.value = 0.85;
		const outputGain = this.audioCtx!.createGain();
		outputGain.gain.setValueAtTime(volume, time);
		outputGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
		noiseSrc.connect(delay);
		delay.connect(lowpass);
		lowpass.connect(feedback);
		feedback.connect(delay);
		lowpass.connect(outputGain);
		outputGain.connect(this.masterGain!);
		noiseSrc.start(time);
		noiseSrc.stop(time + delaySeconds);
		setTimeout(
			() => {
				delay.disconnect();
				lowpass.disconnect();
				feedback.disconnect();
				outputGain.disconnect();
				noiseSrc.disconnect();
			},
			(duration + 0.1) * 1000,
		);
	}

	private playSineBeep(
		time: number,
		volume: number,
		pitchMult: number,
		durationMult: number,
	): void {
		const freq = 880 * pitchMult;
		const duration = NOTE_DURATION * durationMult;
		const osc = this.audioCtx!.createOscillator();
		osc.type = "sine";
		osc.frequency.value = freq;
		const env = this.audioCtx!.createGain();
		env.gain.setValueAtTime(volume, time);
		env.gain.exponentialRampToValueAtTime(0.001, time + duration);
		osc.connect(env);
		env.connect(this.masterGain!);
		osc.start(time);
		osc.stop(time + duration);
		osc.onended = () => {
			osc.disconnect();
			env.disconnect();
		};
	}

	private playSample(
		sampleId: string,
		time: number,
		volume: number,
		pitchMult: number,
		durationMult: number,
	): void {
		const buffer = this.samples.get(sampleId);
		if (!buffer) {
			this.playSineBeep(time, volume, pitchMult, durationMult);
			return;
		}
		const src = this.audioCtx!.createBufferSource();
		src.buffer = buffer;
		src.playbackRate.value = pitchMult;
		const env = this.audioCtx!.createGain();
		env.gain.value = volume;
		src.connect(env);
		env.connect(this.masterGain!);
		src.start(time);
		const maxDuration = 0.2 * durationMult;
		src.stop(time + Math.min(buffer.duration / pitchMult, maxDuration));
		src.onended = () => {
			src.disconnect();
			env.disconnect();
		};
	}

	// Modelled on the metronome in NathanGuitar's speed-building video.
	//
	// Its three clicks were measured from the video at 1237 Hz (count-in),
	// 996 Hz (on-beat) and 825 Hz (off-beat) — count-in to off-beat is exactly
	// a 3:2 fifth. Each is a short FM beep: carrier at the tier's pitch,
	// modulator at 3x (an integer ratio, so the sidebands stay harmonic and
	// the sound reads as digital rather than wooden), plus a 7 kHz spike on
	// the attack for the mechanical tick.
	private static readonly SUPER_CLICK = {
		accent: { freq: 1237, index: 1.3, hold: 0.042, fall: 0.012, edge: 0.3 },
		normal: { freq: 996, index: 1.1, hold: 0.032, fall: 0.01, edge: 0.22 },
		subdivision: { freq: 825, index: 0.9, hold: 0.022, fall: 0.009, edge: 0.12 },
	} as const;

	private playSuperClick(time: number, volume: number, tier: ClickTier): void {
		const v = SoundEngine.SUPER_CLICK[tier];
		const ctx = this.audioCtx!;

		// Carrier
		const carrier = ctx.createOscillator();
		carrier.type = "sine";
		carrier.frequency.value = v.freq;

		// Modulator at 3x the carrier. Peak deviation is index * modulator
		// frequency, and it decays fast so the sparkle sits on the attack only.
		const modulator = ctx.createOscillator();
		modulator.type = "sine";
		modulator.frequency.value = v.freq * 3;
		const modGain = ctx.createGain();
		const deviation = v.index * v.freq * 3;
		modGain.gain.setValueAtTime(deviation, time);
		modGain.gain.exponentialRampToValueAtTime(deviation * 0.001, time + 0.014);
		modulator.connect(modGain);
		modGain.connect(carrier.frequency);

		// Beep envelope: 0.3 ms attack, flat hold, then fall. The hold is what
		// makes it read as a tone rather than a knock.
		const env = ctx.createGain();
		env.gain.setValueAtTime(0, time);
		env.gain.linearRampToValueAtTime(volume, time + 0.0003);
		env.gain.setValueAtTime(volume, time + v.hold);
		env.gain.exponentialRampToValueAtTime(0.001, time + v.hold + v.fall);
		carrier.connect(env);
		env.connect(this.masterGain!);

		// Attack tick
		const edge = ctx.createOscillator();
		edge.type = "sine";
		edge.frequency.value = 7000;
		const edgeEnv = ctx.createGain();
		edgeEnv.gain.setValueAtTime(volume * v.edge, time);
		edgeEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.002);
		edge.connect(edgeEnv);
		edgeEnv.connect(this.masterGain!);

		const stop = time + v.hold + v.fall;
		carrier.start(time);
		modulator.start(time);
		edge.start(time);
		carrier.stop(stop);
		modulator.stop(stop);
		edge.stop(time + 0.002);
		carrier.onended = () => {
			carrier.disconnect();
			modulator.disconnect();
			modGain.disconnect();
			env.disconnect();
			edge.disconnect();
			edgeEnv.disconnect();
		};
	}


	private playAnalogClick(
		time: number,
		volume: number,
		pitchMult: number,
		durationMult: number,
	): void {
		const freq = 600 * pitchMult;
		const duration = 0.05 * durationMult;
		const osc = this.audioCtx!.createOscillator();
		osc.type = "triangle";
		osc.frequency.value = freq;
		const lowpass = this.audioCtx!.createBiquadFilter();
		lowpass.type = "lowpass";
		lowpass.frequency.value = 2000;
		lowpass.Q.value = 1;
		const noiseSrc = this.audioCtx!.createBufferSource();
		noiseSrc.buffer = this.noiseBuffer;
		const noiseEnv = this.audioCtx!.createGain();
		noiseEnv.gain.setValueAtTime(volume * 0.2, time);
		noiseEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.005);
		const env = this.audioCtx!.createGain();
		env.gain.setValueAtTime(0, time);
		env.gain.linearRampToValueAtTime(volume, time + 0.001);
		env.gain.exponentialRampToValueAtTime(0.001, time + duration);
		osc.connect(lowpass);
		lowpass.connect(env);
		env.connect(this.masterGain!);
		noiseSrc.connect(noiseEnv);
		noiseEnv.connect(this.masterGain!);
		osc.start(time);
		osc.stop(time + duration);
		noiseSrc.start(time);
		noiseSrc.stop(time + 0.005);
		const cleanup = () => {
			osc.disconnect();
			lowpass.disconnect();
			env.disconnect();
			noiseSrc.disconnect();
			noiseEnv.disconnect();
		};
		osc.onended = cleanup;
	}
}
