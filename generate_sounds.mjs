import fs from 'fs';
import path from 'path';

function writeWav(filename, frequency1, frequency2, durationSecs, isPulsing) {
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = numChannels * bitsPerSample / 8;
    const byteRate = sampleRate * blockAlign;
    const numSamples = sampleRate * durationSecs;
    const dataSize = numSamples * blockAlign;
    const chunkSize = 36 + dataSize;
    
    const buffer = Buffer.alloc(44 + dataSize);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(chunkSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); 
    buffer.writeUInt16LE(1, 20); 
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-3 * t / durationSecs);
        let pulseEnv = 1;
        if (isPulsing) {
            pulseEnv = Math.sin(t * Math.PI * 15) > 0 ? 1 : 0.2; 
        }
        let sample = Math.sin(2 * Math.PI * frequency1 * t);
        if (frequency2) {
            sample += Math.sin(2 * Math.PI * frequency2 * t);
            sample /= 2;
        }
        sample *= env * pulseEnv * 0.6; // volume
        let val = Math.max(-1, Math.min(1, sample)) * 32767;
        buffer.writeInt16LE(Math.round(val), 44 + i * 2);
    }
    
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, buffer);
}

const publicDir = './public/sounds';
writeWav(`${publicDir}/alert.wav`, 880, 1320, 2, false);
writeWav(`${publicDir}/kitchen.wav`, 1100, 1600, 2.5, true);
writeWav(`${publicDir}/confirm.wav`, 550, 700, 0.5, false);

console.log('Sonidos generados con éxito.');
