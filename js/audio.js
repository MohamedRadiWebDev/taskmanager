/**
 * Audio Manager for Task Manager Application
 * Handles sound effects using Web Audio API
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.isEnabled = true;
    }

    async init() {
        try {
            // Create AudioContext on first user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.createSounds();
        } catch (error) {
            console.warn('Audio not supported or failed to initialize:', error);
            this.isEnabled = false;
        }
    }

    async createSounds() {
        try {
            this.sounds.add = await this.createAddSound();
            this.sounds.complete = await this.createCompleteSound();
            this.sounds.delete = await this.createDeleteSound();
        } catch (error) {
            console.warn('Failed to create sounds:', error);
            this.isEnabled = false;
        }
    }

    async createAddSound() {
        // Create a pleasant "add" sound - rising tone
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const frequency = 440 + (220 * t); // Rising from 440Hz to 660Hz
            const envelope = Math.exp(-t * 3); // Exponential decay
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.1;
        }

        return buffer;
    }

    async createCompleteSound() {
        // Create a "complete" sound - success chime
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // Two-tone success sound
            const freq1 = 523.25; // C5
            const freq2 = 659.25; // E5
            const envelope = Math.exp(-t * 2);
            
            let signal = 0;
            if (t < 0.2) {
                signal = Math.sin(2 * Math.PI * freq1 * t);
            } else {
                signal = Math.sin(2 * Math.PI * freq2 * t);
            }
            
            data[i] = signal * envelope * 0.15;
        }

        return buffer;
    }

    async createDeleteSound() {
        // Create a "delete" sound - descending tone
        const duration = 0.4;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const frequency = 330 - (110 * t); // Descending from 330Hz to 220Hz
            const envelope = Math.exp(-t * 2.5);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.1;
        }

        return buffer;
    }

    async playSound(soundName) {
        if (!this.isEnabled || !this.audioContext || !this.sounds[soundName]) {
            return;
        }

        try {
            // Resume AudioContext if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[soundName];
            source.connect(this.audioContext.destination);
            source.start();
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }

    playAddSound() {
        this.playSound('add');
    }

    playCompleteSound() {
        this.playSound('complete');
    }

    playDeleteSound() {
        this.playSound('delete');
    }
}