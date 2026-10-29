/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.6;
  private ambientGain: GainNode | null = null;
  private trafficOsc: OscillatorNode | null = null;
  private isPlayingAmbience: boolean = false;

  constructor() {
    const savedMute = localStorage.getItem('board237_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
    const savedVol = localStorage.getItem('board237_volume');
    if (savedVol !== null) {
      this.volume = parseFloat(savedVol);
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('board237_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('board237_volume', String(this.volume));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public startAmbience() {
    if (this.isPlayingAmbience) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    try {
      this.isPlayingAmbience = true;
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.05;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.masterGain);

      whiteNoise.start();
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public stopAmbience() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      } catch {
        // Ignore
      }
    }
    this.isPlayingAmbience = false;
  }

  public playFootstep(type: 'walk' | 'sprint' | 'drag') {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'sprint') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'drag') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.14);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.14);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.07);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  }

  public playPant(intensity: 'medium' | 'heavy') {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(intensity === 'heavy' ? 700 : 900, now);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    const peak = intensity === 'heavy' ? 0.35 : 0.22;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.3);
  }

  public playTurnSwoosh() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playCarPass() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.4);
    osc.frequency.linearRampToValueAtTime(90, now + 1.0);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.0);
  }

  public playBusApproaching() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.linearRampToValueAtTime(75, now + 1.2);
    osc.frequency.linearRampToValueAtTime(45, now + 2.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 2.2);
  }

  public playAirBrake() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.7;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.6);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.7);
  }

  public playBusDoors() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Ding-ding
    const ding1 = this.ctx.createOscillator();
    const dingGain1 = this.ctx.createGain();
    ding1.type = 'sine';
    ding1.frequency.setValueAtTime(1174.66, now); // D6
    dingGain1.gain.setValueAtTime(0.2, now);
    dingGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    ding1.connect(dingGain1);
    dingGain1.connect(this.masterGain);
    ding1.start(now);
    ding1.stop(now + 0.35);

    const ding2 = this.ctx.createOscillator();
    const dingGain2 = this.ctx.createGain();
    ding2.type = 'sine';
    ding2.frequency.setValueAtTime(880, now + 0.16); // A5
    dingGain2.gain.setValueAtTime(0.2, now + 0.16);
    dingGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    ding2.connect(dingGain2);
    dingGain2.connect(this.masterGain);
    ding2.start(now + 0.16);
    ding2.stop(now + 0.5);
  }

  public playCollision() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Thump
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(180, now);
    thump.frequency.exponentialRampToValueAtTime(30, now + 0.25);
    thumpGain.gain.setValueAtTime(0.5, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    thump.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thump.start(now);
    thump.stop(now + 0.25);

    // Groceries scattering rattle
    const count = 4;
    for (let i = 0; i < count; i++) {
      const dropTime = now + 0.08 + i * 0.05;
      const rattle = this.ctx.createOscillator();
      const rattleGain = this.ctx.createGain();
      rattle.type = 'triangle';
      rattle.frequency.setValueAtTime(300 + Math.random() * 200, dropTime);
      rattle.frequency.exponentialRampToValueAtTime(80, dropTime + 0.08);
      rattleGain.gain.setValueAtTime(0.18, dropTime);
      rattleGain.gain.exponentialRampToValueAtTime(0.001, dropTime + 0.08);
      rattle.connect(rattleGain);
      rattleGain.connect(this.masterGain);
      rattle.start(dropTime);
      rattle.stop(dropTime + 0.09);
    }
  }

  public playSuccess() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;
    notes.forEach((freq, index) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);
      gain.gain.setValueAtTime(0.25, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.35);
    });
  }

  public playFailure() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [293.66, 277.18, 261.63, 220.0]; // D4, C#4, C4, A3
    const now = this.ctx.currentTime;
    notes.forEach((freq, index) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + index * 0.14);
      gain.gain.setValueAtTime(0.2, now + index * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.14 + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + index * 0.14);
      osc.stop(now + index * 0.14 + 0.25);
    });
  }

  public playAchievement() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    const now = this.ctx.currentTime;
    notes.forEach((freq, index) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.07);
      gain.gain.setValueAtTime(0.28, now + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.4);
    });
  }
}

export const soundManager = new SoundSystem();
