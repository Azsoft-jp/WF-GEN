export type Resolution = 'native' | '720p' | '1080p' | '1440p' | '4k';
export type BackgroundMode = 'crop' | 'blur' | 'solid';
export type WaveformType = 'line' | 'mirror-line' | 'step' | 'bar' | 'dot' | 'fill' | 'circle' | 'radial-bars';
export type WaveformPosition = 'top' | 'center' | 'bottom';

export interface RenderSettings {
  resolution: Resolution;
  backgroundMode: BackgroundMode;
  backgroundColor: string;
  waveformType: WaveformType;
  waveformColor: string;
  waveformPosition: WaveformPosition;
  fps: number;
}

export interface AudioDataPayload {
  sampleRate: number;
  numberOfChannels: number;
  length: number;
  duration: number;
  channelData: Float32Array[];
}

export interface WorkerStartMessage {
  type: 'start';
  imageBitmap: ImageBitmap;
  imageWidth: number;
  imageHeight: number;
  audioData: AudioDataPayload;
  settings: RenderSettings;
}

export interface WorkerCancelMessage {
  type: 'cancel';
}

export type WorkerRequest = WorkerStartMessage | WorkerCancelMessage;

export interface ProgressData {
  value: number;
  stage: string;
}

export type WorkerResponse =
  | { type: 'progress'; data: ProgressData }
  | { type: 'done'; blob: Blob }
  | { type: 'error'; message: string };
