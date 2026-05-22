import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { WorkerRequest, RenderSettings } from '../types';

let isCanceled = false;

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  if (msg.type === 'cancel') {
    isCanceled = true;
    return;
  }
  if (msg.type === 'start') {
    isCanceled = false;
    try {
      await runJob(msg);
    } catch (err: any) {
      self.postMessage({ type: 'error', message: err.message || 'Unknown error occurred' });
    }
  }
};

async function runJob(data: any) {
  const { imageBitmap, imageWidth, imageHeight, audioData, settings } = data as {
    imageBitmap: ImageBitmap;
    imageWidth: number;
    imageHeight: number;
    audioData: any;
    settings: RenderSettings;
  };

  self.postMessage({ type: 'progress', data: { stage: 'analyzing', value: 0 } });

  if (!globalThis.VideoEncoder || !globalThis.AudioEncoder) {
    throw new Error('WebCodecs API is not supported in this browser. Please use Chrome or Edge.');
  }

  if (isCanceled) return emitCancel();

  const duration = audioData.duration;
  const fps = settings.fps;
  const totalFrames = Math.ceil(duration * fps);
  
  // Mixdown to mono for waveform analyzing
  const numberOfChannels = audioData.numberOfChannels;
  const sampleRate = audioData.sampleRate;
  const monoData = new Float32Array(audioData.length);
  
  for (let c = 0; c < numberOfChannels; c++) {
    const channelData = audioData.channelData[c];
    for (let i = 0; i < channelData.length; i++) {
        monoData[i] += channelData[i] / numberOfChannels;
    }
  }

  // Generate Amplitude Bins (96 lines)
  const binsPerFrame = 96;
  const samplesPerFrame = sampleRate / fps;
  const waveformData: number[][] = []; 
  // waveformData[frameIndex][binIndex] = value (0~1)

  for (let f = 0; f < totalFrames; f++) {
    const frameStartSample = Math.floor(f * samplesPerFrame);
    const frameEndSample = Math.floor((f + 1) * samplesPerFrame);
    const samplesInThisFrame = frameEndSample - frameStartSample;
    const samplesPerBin = Math.max(1, Math.floor(samplesInThisFrame / binsPerFrame));
    
    const bins = new Float32Array(binsPerFrame);
    for (let b = 0; b < binsPerFrame; b++) {
      const binStart = frameStartSample + b * samplesPerBin;
      const binEnd = Math.min(frameEndSample, binStart + samplesPerBin);
      let sum = 0;
      let count = 0;
      for (let i = binStart; i < binEnd; i++) {
        if (i < monoData.length) {
          sum += Math.abs(monoData[i]);
          count++;
        }
      }
      const avg = count > 0 ? sum / count : 0;
      bins[b] = Math.min(1, avg * 1.6);
    }
    waveformData.push(Array.from(bins));
  }

  if (isCanceled) return emitCancel();

  // Determine Output Resolution
  let outWidth = imageWidth;
  let outHeight = imageHeight;
  if (settings.resolution !== 'native') {
    switch (settings.resolution) {
      case '720p': outWidth = 1280; outHeight = 720; break;
      case '1080p': outWidth = 1920; outHeight = 1080; break;
      case '1440p': outWidth = 2560; outHeight = 1440; break;
      case '4k': outWidth = 3840; outHeight = 2160; break;
    }
  }

  // Ensure even dimensions (required by AVC)
  outWidth = Math.floor(outWidth / 2) * 2;
  outHeight = Math.floor(outHeight / 2) * 2;

  // Setup Muxer
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: outWidth,
      height: outHeight
    },
    audio: {
      codec: 'aac',
      numberOfChannels: numberOfChannels,
      sampleRate: sampleRate
    },
    fastStart: 'in-memory',
    firstTimestampMustBeZero: true
  });

  // Setup VideoEncoder
  let videoError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta as any),
    error: (e) => { 
      videoError = e; 
      console.error("Video encoder error:", e); 
      self.postMessage({ type: 'error', message: `Video Encoder Error: ${e.message}` }); 
    }
  });
  
  let codecString = 'avc1.4d002a';
  const totalPixels = outWidth * outHeight;
  if (totalPixels <= 1280 * 720) codecString = 'avc1.42001f'; // Baseline 3.1
  else if (totalPixels <= 1920 * 1080) codecString = 'avc1.4d002a'; // Main 4.2
  else codecString = 'avc1.640034'; // High 5.2

  videoEncoder.configure({
    codec: codecString,
    width: outWidth,
    height: outHeight,
    bitrate: 4000000, 
    framerate: fps,
    avc: { format: 'annexb' } // needed by mp4-muxer
  });

  // Setup AudioEncoder
  let audioError: Error | null = null;
  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta as any),
    error: (e) => { 
      audioError = e; 
      console.error("Audio encoder error:", e); 
      self.postMessage({ type: 'error', message: `Audio Encoder Error: ${e.message}` }); 
    }
  });
  
  audioEncoder.configure({
    codec: 'mp4a.40.2',
    numberOfChannels: numberOfChannels,
    sampleRate: sampleRate,
    bitrate: 128000
  });

  if (isCanceled) return emitCancel();
  
  self.postMessage({ type: 'progress', data: { stage: 'encoding', value: 0 } });

  let audioProgressValue = 0;
  let videoProgressValue = 0;
  let lastReportTime = performance.now();

  const reportProgress = async () => {
    const total = audioProgressValue * 0.1 + videoProgressValue * 0.9;
    if (performance.now() - lastReportTime > 50) {
      self.postMessage({ type: 'progress', data: { stage: 'encoding', value: total } });
      lastReportTime = performance.now();
      await new Promise(r => setTimeout(r, 1));
    }
  };

  const encodeAudio = async () => {
    const AUDIO_FRAME_SIZE = 1024;
    for (let offset = 0; offset < audioData.length; offset += AUDIO_FRAME_SIZE) {
      if (audioError) throw audioError;
      if (isCanceled) return;

      const planarData = new Float32Array(AUDIO_FRAME_SIZE * numberOfChannels);
      for (let c = 0; c < numberOfChannels; c++) {
        const channelData = audioData.channelData[c];
        const actualSize = Math.min(AUDIO_FRAME_SIZE, audioData.length - offset);
        planarData.set(channelData.subarray(offset, offset + actualSize), c * AUDIO_FRAME_SIZE);
      }

      const audioDataFrame = new AudioData({
        format: 'f32-planar',
        sampleRate: sampleRate,
        numberOfFrames: AUDIO_FRAME_SIZE,
        numberOfChannels: numberOfChannels,
        timestamp: Math.round((offset / sampleRate) * 1_000_000),
        data: planarData
      });
      audioEncoder.encode(audioDataFrame);
      audioDataFrame.close();
      
      while (audioEncoder.encodeQueueSize > 20) {
        if (audioError) throw audioError;
        await new Promise(r => setTimeout(r, 2));
      }
      
      if (offset % (AUDIO_FRAME_SIZE * 50) === 0) {
        audioProgressValue = offset / audioData.length;
        await reportProgress();
      }
    }
    await audioEncoder.flush();
    audioEncoder.close();
    audioProgressValue = 1;
    await reportProgress();
  };

  const encodeVideo = async () => {
    // Setup Canvas
    const canvas = new OffscreenCanvas(outWidth, outHeight);
    const ctx = canvas.getContext('2d', { alpha: false }) as OffscreenCanvasRenderingContext2D;

    for (let f = 0; f < totalFrames; f++) {
      if (videoError) throw videoError;
      if (isCanceled) {
        videoEncoder.close();
        return;
      }

      renderFrame(ctx, outWidth, outHeight, imageBitmap, settings, waveformData[f]);

      const videoFrame = new VideoFrame(canvas, {
        timestamp: Math.round((f / fps) * 1_000_000),
        duration: Math.round((1 / fps) * 1_000_000)
      });
      
      const keyFrame = (f % fps === 0);
      videoEncoder.encode(videoFrame, { keyFrame });
      videoFrame.close();

      while (videoEncoder.encodeQueueSize > 5) {
        if (videoError) throw videoError;
        await new Promise(r => setTimeout(r, 2));
      }

      if (f % 5 === 0) {
          videoProgressValue = f / totalFrames;
          await reportProgress();
      }
    }
    await videoEncoder.flush();
    videoEncoder.close();
    videoProgressValue = 1;
    await reportProgress();
  };

  await Promise.all([encodeAudio(), encodeVideo()]);

  if (isCanceled) return emitCancel();

  self.postMessage({ type: 'progress', data: { stage: 'muxing', value: 1 } });
  muxer.finalize();
  
  const buffer = (muxer.target as ArrayBufferTarget).buffer;
  const blob = new Blob([buffer], { type: 'video/mp4' });

  self.postMessage({ type: 'done', blob });
}

function emitCancel() {
  self.postMessage({ type: 'progress', data: { stage: 'canceled', value: 0 } });
}

function renderFrame(ctx: OffscreenCanvasRenderingContext2D, w: number, h: number, img: ImageBitmap, settings: RenderSettings, bins: number[]) {
  // 1. Background
  if (settings.backgroundMode === 'solid') {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, w, h);
    drawContain(ctx, img, w, h);
  } else if (settings.backgroundMode === 'blur') {
    ctx.save();
    ctx.filter = 'blur(26px) brightness(0.65)';
    drawCover(ctx, img, w, h);
    ctx.restore();
    drawContain(ctx, img, w, h);
  } else if (settings.backgroundMode === 'crop') {
    drawCover(ctx, img, w, h);
  }

  // 2. Waveform
  let yAxis = h * 0.5;
  if (settings.waveformPosition === 'top') yAxis = h * 0.2;
  else if (settings.waveformPosition === 'bottom') yAxis = h * 0.8;

  // Circle / radial positions are fixed to center
  if (settings.waveformType === 'circle' || settings.waveformType === 'radial-bars') {
    yAxis = h * 0.5;
  }

  const baseAmp = h * 0.25;

  ctx.fillStyle = settings.waveformColor;
  ctx.strokeStyle = settings.waveformColor;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const n = bins.length;

  if (settings.waveformType === 'line' || settings.waveformType === 'mirror-line' || settings.waveformType === 'step' || settings.waveformType === 'fill') {
    ctx.beginPath();
    const isStep = settings.waveformType === 'step';
    const isFill = settings.waveformType === 'fill';
    const isMirror = settings.waveformType === 'mirror-line';
    
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w;
      const y = yAxis - bins[i] * baseAmp;
      if (i === 0) ctx.moveTo(x, y);
      else {
        if (isStep) {
          ctx.lineTo(x, yAxis - bins[i - 1] * baseAmp);
        }
        ctx.lineTo(x, y);
      }
    }
    
    if (isMirror) {
        for (let i = n - 1; i >= 0; i--) {
            const x = (i / (n - 1)) * w;
            const y = yAxis + bins[i] * baseAmp;
            if (isStep && i < n - 1) {
                ctx.lineTo(x, yAxis + bins[i+1] * baseAmp);
            }
            ctx.lineTo(x, y);
        }
        ctx.closePath();
    } else if (isFill) {
         ctx.lineTo(w, yAxis);
         ctx.lineTo(0, yAxis);
         ctx.closePath();
    }
    
    if (isFill || isMirror) {
       ctx.globalAlpha = 0.6;
       ctx.fill();
       ctx.globalAlpha = 1.0;
    }
    ctx.stroke();

  } else if (settings.waveformType === 'bar') {
     const barW = w / n * 0.6;
     for (let i = 0; i < n; i++) {
       const x = (i / n) * w + (w/n - barW)/2;
       const barH = bins[i] * baseAmp * 2;
       ctx.fillRect(x, yAxis - barH/2, barW, barH);
     }
  } else if (settings.waveformType === 'dot') {
     for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * w;
        const radius = Math.max(2, bins[i] * baseAmp * 0.2);
        ctx.beginPath();
        ctx.arc(x, yAxis, radius, 0, Math.PI * 2);
        ctx.fill();
     }
  } else if (settings.waveformType === 'circle' || settings.waveformType === 'radial-bars') {
    const cx = w / 2;
    const cy = h / 2;
    const minRadius = Math.min(w, h) * 0.15;
    const maxVar = Math.min(w, h) * 0.2;

    if (settings.waveformType === 'circle') {
       ctx.beginPath();
       for (let i = 0; i <= n; i++) {
         const idx = i % n;
         const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
         const r = minRadius + bins[idx] * maxVar;
         const px = cx + Math.cos(angle) * r;
         const py = cy + Math.sin(angle) * r;
         if (i === 0) ctx.moveTo(px, py);
         else ctx.lineTo(px, py);
       }
       ctx.closePath();
       ctx.stroke();
    } else {
       // radial bars
       ctx.lineWidth = 3;
       for (let i = 0; i < n; i++) {
         const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
         const r0 = minRadius;
         const r1 = minRadius + bins[i] * maxVar;
         ctx.beginPath();
         ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0);
         ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
         ctx.stroke();
       }
    }
  }
}

function drawContain(ctx: OffscreenCanvasRenderingContext2D, img: ImageBitmap, targetW: number, targetH: number) {
   const imgRatio = img.width / img.height;
   const targetRatio = targetW / targetH;
   let drawW = targetW;
   let drawH = targetH;
   if (imgRatio > targetRatio) {
     drawH = targetW / imgRatio;
   } else {
     drawW = targetH * imgRatio;
   }
   ctx.drawImage(img, (targetW - drawW)/2, (targetH - drawH)/2, drawW, drawH);
}

function drawCover(ctx: OffscreenCanvasRenderingContext2D, img: ImageBitmap, targetW: number, targetH: number) {
  const imgRatio = img.width / img.height;
  const targetRatio = targetW / targetH;
  let sW = img.width;
  let sH = img.height;
  let sX = 0;
  let sY = 0;

  if (imgRatio > targetRatio) {
    sW = img.height * targetRatio;
    sX = (img.width - sW) / 2;
  } else {
    sH = img.width / targetRatio;
    sY = (img.height - sH) / 2;
  }
  ctx.drawImage(img, sX, sY, sW, sH, 0, 0, targetW, targetH);
}
