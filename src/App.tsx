import { useEffect, useRef, useState } from 'react';
import { Play, Download, Settings, Loader2, StopCircle, Image as ImageIcon, Music, Pause } from 'lucide-react';
import { RenderSettings, WorkerRequest, WorkerResponse } from './types';

const LANGUAGES = {
  en: {
    title: 'WaveformGen',
    mediaAssets: 'Media Assets',
    backgroundImage: 'Background Image',
    audioTrack: 'Audio Track',
    canvasSettings: 'Canvas Settings',
    resolution: 'Resolution',
    fps: 'FPS',
    bgMode: 'BG Mode',
    bgColor: 'BG Color',
    waveformStyle: 'Waveform Style',
    position: 'Position',
    waveformColor: 'Waveform Color',
    awaitingArtwork: 'Awaiting Artwork',
    cancelOutput: 'Cancel Output',
    exportMp4: 'Export MP4',
    renderComplete: 'Render Complete',
    resultReady: 'Result Ready',
    downloadMp4: 'Download MP4',
    statusLabel: 'Status',
    statusIdle: 'Idle',
    statusRendering: 'Rendering',
    bgModeBlur: 'Blur',
    bgModeCrop: 'Crop (Cover)',
    bgModeSolid: 'Solid Color',
    wfTypeLine: 'Line',
    wfTypeMirror: 'Mirror Line',
    wfTypeStep: 'Step',
    wfTypeBar: 'Bar',
    wfTypeDot: 'Dot',
    wfTypeFill: 'Fill',
    wfTypeCircle: 'Circle',
    wfTypeRadial: 'Radial Bars',
    posTop: 'Top',
    posCenter: 'Center',
    posBottom: 'Bottom',
    webcodecsOk: 'WEBCODECS: OK'
  },
  ja: {
    title: 'WaveformGen',
    mediaAssets: 'メディア素材',
    backgroundImage: '背景画像',
    audioTrack: 'オーディオトラック',
    canvasSettings: 'キャンバス設定',
    resolution: '解像度',
    fps: 'FPS',
    bgMode: '背景モード',
    bgColor: '背景色',
    waveformStyle: '波形スタイル',
    position: '配置位置',
    waveformColor: '波形カラー',
    awaitingArtwork: 'アートワーク待機中',
    cancelOutput: '出力をキャンセル',
    exportMp4: 'MP4出力',
    renderComplete: 'レンダリング完了',
    resultReady: '動画が完成しました！',
    downloadMp4: 'MP4をダウンロード',
    statusLabel: 'ステータス',
    statusIdle: '待機中',
    statusRendering: 'レンダリング中',
    bgModeBlur: 'ぼかし',
    bgModeCrop: 'クロップ (カバー)',
    bgModeSolid: '単色カラー',
    wfTypeLine: 'ライン',
    wfTypeMirror: 'ミラーライン',
    wfTypeStep: 'ステップ',
    wfTypeBar: 'バー',
    wfTypeDot: 'ドット',
    wfTypeFill: '塗りつぶし',
    wfTypeCircle: 'サークル',
    wfTypeRadial: 'ラジアルバー',
    posTop: '上部',
    posCenter: '中央',
    posBottom: '下部',
    webcodecsOk: 'WEBCODECS: OK'
  },
  ko: {
    title: 'WaveformGen',
    mediaAssets: '미디어 에셋',
    backgroundImage: '배경 이미지',
    audioTrack: '오디오 트랙',
    canvasSettings: '캔버스 설정',
    resolution: '해상도',
    fps: 'FPS',
    bgMode: '배경 모드',
    bgColor: '배경 색상',
    waveformStyle: '파형 스타일',
    position: '파형 위치',
    waveformColor: '파형 색상',
    awaitingArtwork: '아트워크 대기 중',
    cancelOutput: '출력 취소',
    exportMp4: 'MP4 내보내기',
    renderComplete: '렌더링 완료',
    resultReady: '비디오가 완성되었습니다!',
    downloadMp4: 'MP4 다운로드',
    statusLabel: '상태',
    statusIdle: '대기 중',
    statusRendering: '렌더링 중',
    bgModeBlur: '블러',
    bgModeCrop: '크롭 (커버)',
    bgModeSolid: '단색 색상',
    wfTypeLine: '라인',
    wfTypeMirror: '미러 라인',
    wfTypeStep: '스텝',
    wfTypeBar: '막대형',
    wfTypeDot: '도트',
    wfTypeFill: '채우기',
    wfTypeCircle: '원형',
    wfTypeRadial: '방사형 막대',
    posTop: '상단',
    posCenter: '중앙',
    posBottom: '하단',
    webcodecsOk: 'WEBCODECS: 지원됨'
  },
  zh: {
    title: 'WaveformGen',
    mediaAssets: '媒体资源',
    backgroundImage: '背景图片',
    audioTrack: '音频轨道',
    canvasSettings: '画布设置',
    resolution: '分辨率',
    fps: '帧率 (FPS)',
    bgMode: '背景模式',
    bgColor: '背景颜色',
    waveformStyle: '波形样式',
    position: '波形位置',
    waveformColor: '波形颜色',
    awaitingArtwork: '等待上传图片',
    cancelOutput: '取消导出',
    exportMp4: '导出 MP4',
    renderComplete: '渲染完成',
    resultReady: '视频已生成！',
    downloadMp4: '下载 MP4',
    statusLabel: '状态',
    statusIdle: '空闲',
    statusRendering: '正在渲染',
    bgModeBlur: '模糊',
    bgModeCrop: '裁剪 (填充)',
    bgModeSolid: '纯色',
    wfTypeLine: '线条',
    wfTypeMirror: '镜像线条',
    wfTypeStep: '阶梯',
    wfTypeBar: '柱状图',
    wfTypeDot: '点状',
    wfTypeFill: '填充',
    wfTypeCircle: '圆环',
    wfTypeRadial: '放射柱状',
    posTop: '顶部',
    posCenter: '居中',
    posBottom: '底部',
    webcodecsOk: 'WEBCODECS: 正常'
  },
  ru: {
    title: 'WaveformGen',
    mediaAssets: 'Медиафайлы',
    backgroundImage: 'Фоновое изображение',
    audioTrack: 'Аудиодорожка',
    canvasSettings: 'Настройки холста',
    resolution: 'Разрешение',
    fps: 'FPS (Кадры/с)',
    bgMode: 'Режим фона',
    bgColor: 'Цвет фона',
    waveformStyle: 'Стиль волны',
    position: 'Позиция волны',
    waveformColor: 'Цвет волны',
    awaitingArtwork: 'Ожидание изображения',
    cancelOutput: 'Отменить рендеринг',
    exportMp4: 'Экспорт в MP4',
    renderComplete: 'Рендеринг завершен',
    resultReady: 'Видео готово к скачиванию!',
    downloadMp4: 'Скачать MP4',
    statusLabel: 'Статус',
    statusIdle: 'Ожидание',
    statusRendering: 'Рендеринг',
    bgModeBlur: 'Размытие',
    bgModeCrop: 'Обрезать (Заполнение)',
    bgModeSolid: 'Сплошной цвет',
    wfTypeLine: 'Линия',
    wfTypeMirror: 'Зеркальная линия',
    wfTypeStep: 'Ступеньки',
    wfTypeBar: 'Столбцы',
    wfTypeDot: 'Точки',
    wfTypeFill: 'Заливка',
    wfTypeCircle: 'Круг',
    wfTypeRadial: 'Радиальные столбцы',
    posTop: 'Сверху',
    posCenter: 'По центру',
    posBottom: 'Снизу',
    webcodecsOk: 'WEBCODECS: OK'
  }
};

type LangKey = 'en' | 'ja' | 'ko' | 'zh' | 'ru';

export default function App() {
  const [lang, setLang] = useState<LangKey>('en');

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (['ja', 'ko', 'zh', 'ru', 'en'].includes(browserLang)) {
      setLang(browserLang as LangKey);
    } else {
      setLang('en');
    }
  }, []);

  const t = (key: keyof typeof LANGUAGES['en']) => {
    return LANGUAGES[lang][key] || LANGUAGES['en'][key];
  };

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);

  const [settings, setSettings] = useState<RenderSettings>({
    resolution: '1080p',
    backgroundMode: 'blur',
    backgroundColor: '#000000',
    waveformType: 'line',
    waveformColor: '#f27d26',
    waveformPosition: 'center',
    fps: 30
  });

  const [worker, setWorker] = useState<Worker | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressData, setProgressData] = useState({ stage: 'queued', value: 0 });
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const isPlayingPreviewRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.onended = () => {
      isPlayingPreviewRef.current = false;
      setIsPlayingPreview(false);
    };
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioFile && audioRef.current) {
      const url = URL.createObjectURL(audioFile);
      audioRef.current.src = url;
      isPlayingPreviewRef.current = false;
      setIsPlayingPreview(false);
      return () => URL.revokeObjectURL(url);
    } else if (!audioFile && audioRef.current) {
      audioRef.current.src = "";
      isPlayingPreviewRef.current = false;
      setIsPlayingPreview(false);
    }
  }, [audioFile]);

  useEffect(() => {
    if (isGenerating && audioRef.current && isPlayingPreviewRef.current) {
      audioRef.current.pause();
      isPlayingPreviewRef.current = false;
      setIsPlayingPreview(false);
    }
  }, [isGenerating]);

  const togglePreviewPlay = () => {
    if (!audioFile || !audioRef.current || isGenerating) return;
    if (isPlayingPreviewRef.current) {
      audioRef.current.pause();
      isPlayingPreviewRef.current = false;
      setIsPlayingPreview(false);
    } else {
      if (!audioContextRef.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 2048; 
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(ctx.destination);
          analyserRef.current = analyser;
        } catch (e) {
          console.error("AudioContext initialization failed", e);
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.play().then(() => {
        isPlayingPreviewRef.current = true;
        setIsPlayingPreview(true);
      }).catch(e => console.error(e));
    }
  };

  useEffect(() => {
    const w = new Worker(new URL('./lib/worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgressData(msg.data);
        if (msg.data.stage === 'canceled') {
          setIsGenerating(false);
        }
      } else if (msg.type === 'done') {
        setIsGenerating(false);
        setProgressData({ stage: 'done', value: 1 });
        setResultBlobUrl(URL.createObjectURL(msg.blob));
      } else if (msg.type === 'error') {
        setIsGenerating(false);
        setErrorMsg(msg.message);
      }
    };
    setWorker(w);
    return () => {
      w.terminate();
    };
  }, []);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageObjectUrl(null);
    }
  }, [imageFile]);

  // Preview animation
  useEffect(() => {
    let active = true;
    let time = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let imgElement: HTMLImageElement | null = null;
    if (imageObjectUrl) {
      imgElement = new Image();
      imgElement.src = imageObjectUrl;
    }

    const render = () => {
      if (!active) return;
      time += 0.05;

      const w = canvas.width;
      const h = canvas.height;

      // Draw background
      if (settings.backgroundMode === 'solid') {
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, w, h);
        if (imgElement && imgElement.complete) drawContain(ctx, imgElement, w, h);
      } else if (settings.backgroundMode === 'blur') {
        if (imgElement && imgElement.complete) {
          ctx.save();
          ctx.filter = 'blur(10px) brightness(0.65)';
          drawCover(ctx, imgElement, w, h);
          ctx.restore();
          drawContain(ctx, imgElement, w, h);
        } else {
          ctx.fillStyle = '#222';
          ctx.fillRect(0, 0, w, h);
        }
      } else if (settings.backgroundMode === 'crop') {
        if (imgElement && imgElement.complete) {
          drawCover(ctx, imgElement, w, h);
        } else {
          ctx.fillStyle = '#222';
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Draw Waveform logic
      const bins = new Array(96).fill(0);
      
      if (isPlayingPreviewRef.current && analyserRef.current) {
        const analyser = analyserRef.current;
        const dataArray = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(dataArray);

        const n = 96;
        const samplesPerBin = Math.floor(dataArray.length / n);
        for (let b = 0; b < n; b++) {
          let sum = 0;
          const start = b * samplesPerBin;
          const end = start + samplesPerBin;
          for (let i = start; i < end; i++) {
            const val = (dataArray[i] - 128) / 128; // -1.0 to 1.0
            sum += Math.abs(val);
          }
          const avg = sum / samplesPerBin;
          bins[b] = Math.min(1, avg * 3.0); 
        }
      } else {
        if (audioFile) {
          for (let i = 0; i < 96; i++) {
            bins[i] = 0.01;
          }
        } else {
          for (let i = 0; i < 96; i++) {
            const t = (i / 96) * Math.PI * 4 + time * 5;
            let val = Math.sin(t) * 0.5 + Math.sin(t * 2.3 + time) * 0.3 + 0.5;
            val = Math.max(0.1, val * Math.sin(time*0.5 + i*0.1));
            bins[i] = Math.min(1, Math.max(0, val));
          }
        }
      }

      drawWaveform(ctx, w, h, settings, bins);

      requestRef.current = requestAnimationFrame(render);
    };
    requestRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      cancelAnimationFrame(requestRef.current);
    };
  }, [settings, imageObjectUrl]);

  const handleStart = async () => {
    if (!worker || !imageFile || !audioFile) return;
    setIsGenerating(true);
    setResultBlobUrl(null);
    setErrorMsg(null);
    setProgressData({ stage: 'queued', value: 0 });

    try {
      const imgBitmap = await createImageBitmap(imageFile);
      const arrayBuffer = await audioFile.arrayBuffer();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 44100 });
      const decodedAudio = await ctx.decodeAudioData(arrayBuffer);

      const channelData = [];
      for (let c = 0; c < decodedAudio.numberOfChannels; c++) {
         channelData.push(decodedAudio.getChannelData(c).slice());
      }

      const audioData = {
        sampleRate: decodedAudio.sampleRate,
        numberOfChannels: decodedAudio.numberOfChannels,
        length: decodedAudio.length,
        duration: decodedAudio.duration,
        channelData
      };

      const msg: WorkerRequest = {
        type: 'start',
        imageBitmap: imgBitmap,
        imageWidth: imgBitmap.width,
        imageHeight: imgBitmap.height,
        audioData,
        settings
      };
      // We don't transfer channelData buffers because they might share the same underlying arraybuffer
      worker.postMessage(msg, [imgBitmap]);
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMsg(err.message || 'Failed to start encoding');
    }
  };

  const handleCancel = () => {
    if (!worker) return;
    worker.postMessage({ type: 'cancel' });
    setIsGenerating(false);
  };

  const canStart = !!imageFile && !!audioFile && !isGenerating;

  return (
    <div className="flex flex-col h-screen w-full bg-[#0c0c0e] text-[#e0e0e0] font-sans overflow-hidden selection:bg-[#f27d26]/30">
      <nav className="flex flex-shrink-0 items-center justify-between px-6 lg:px-8 py-3 border-b border-white/5 bg-[#121214]">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#f27d26] rounded flex items-center justify-center">
            <div className="w-1 h-4 bg-white mx-[1px]"></div>
            <div className="w-1 h-2 bg-white mx-[1px]"></div>
            <div className="w-1 h-5 bg-white mx-[1px]"></div>
          </div>
          <span className="text-lg font-medium tracking-tight text-white">Waveform<span className="font-light opacity-60">Gen</span></span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LangKey)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer font-medium"
          >
            <option value="en" className="bg-[#121214]">🇺🇸 English</option>
            <option value="ja" className="bg-[#121214]">🇯🇵 日本語</option>
            <option value="ko" className="bg-[#121214]">🇰🇷 한국어</option>
            <option value="zh" className="bg-[#121214]">🇨🇳 简体中文</option>
            <option value="ru" className="bg-[#121214]">🇷🇺 Русский</option>
          </select>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0f0f11] flex flex-col p-6 lg:overflow-y-auto flex-shrink-0">
          
          <div className="mb-8">
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#f27d26] font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> {t('mediaAssets')}
            </label>
            <div className="space-y-4">
              <div className="p-3 bg-white/5 border border-dashed border-white/20 rounded-lg">
                <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2">{t('backgroundImage')}</label>
                <input 
                  type="file" accept="image/*"
                  disabled={isGenerating}
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-neutral-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-xs file:font-medium
                    file:bg-white/10 file:text-[#e0e0e0]
                    hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
                />
              </div>
              <div className="p-3 bg-white/5 border border-dashed border-white/20 rounded-lg">
                <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2">{t('audioTrack')}</label>
                <input 
                  type="file" accept="audio/*"
                  disabled={isGenerating}
                  onChange={e => setAudioFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-neutral-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-xs file:font-medium
                    file:bg-white/10 file:text-[#e0e0e0]
                    hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-[#f27d26] font-bold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" /> {t('canvasSettings')}
              </label>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2">{t('resolution')}</label>
                    <select
                      disabled={isGenerating}
                      value={settings.resolution}
                      onChange={e => setSettings({...settings, resolution: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#f27d26] outline-none"
                    >
                      <option value="native" className="bg-[#121214]">Native</option>
                      <option value="720p" className="bg-[#121214]">720p</option>
                      <option value="1080p" className="bg-[#121214]">1080p</option>
                      <option value="1440p" className="bg-[#121214]">1440p</option>
                      <option value="4k" className="bg-[#121214]">4K</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2">{t('fps')}</label>
                    <input
                      type="number"
                      disabled={isGenerating}
                      value={settings.fps}
                      onChange={e => setSettings({...settings, fps: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#f27d26] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                     <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2">{t('bgMode')}</label>
                     <select
                      disabled={isGenerating}
                      value={settings.backgroundMode}
                      onChange={e => setSettings({...settings, backgroundMode: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#f27d26] outline-none"
                    >
                      <option value="blur" className="bg-[#121214]">{t('bgModeBlur')}</option>
                      <option value="crop" className="bg-[#121214]">{t('bgModeCrop')}</option>
                      <option value="solid" className="bg-[#121214]">{t('bgModeSolid')}</option>
                    </select>
                  </div>
                  {settings.backgroundMode === 'solid' && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2">{t('bgColor')}</label>
                      <input
                        type="color"
                        disabled={isGenerating}
                        value={settings.backgroundColor}
                        onChange={e => setSettings({...settings, backgroundColor: e.target.value})}
                        className="h-9 w-full bg-transparent outline-none cursor-pointer p-0 border-0 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <hr className="border-white/5" />

                <div>
                   <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2">{t('waveformStyle')}</label>
                   <select
                    disabled={isGenerating}
                    value={settings.waveformType}
                    onChange={e => setSettings({...settings, waveformType: e.target.value as any})}
                    className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#f27d26] outline-none"
                  >
                    <option value="line" className="bg-[#121214]">{t('wfTypeLine')}</option>
                    <option value="mirror-line" className="bg-[#121214]">{t('wfTypeMirror')}</option>
                    <option value="step" className="bg-[#121214]">{t('wfTypeStep')}</option>
                    <option value="bar" className="bg-[#121214]">{t('wfTypeBar')}</option>
                    <option value="dot" className="bg-[#121214]">{t('wfTypeDot')}</option>
                    <option value="fill" className="bg-[#121214]">{t('wfTypeFill')}</option>
                    <option value="circle" className="bg-[#121214]">{t('wfTypeCircle')}</option>
                    <option value="radial-bars" className="bg-[#121214]">{t('wfTypeRadial')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2">{t('position')}</label>
                    <select
                      disabled={isGenerating || settings.waveformType === 'circle' || settings.waveformType === 'radial-bars'}
                      value={settings.waveformPosition}
                      onChange={e => setSettings({...settings, waveformPosition: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#f27d26] outline-none disabled:opacity-30"
                    >
                      <option value="top" className="bg-[#121214]">{t('posTop')}</option>
                      <option value="center" className="bg-[#121214]">{t('posCenter')}</option>
                      <option value="bottom" className="bg-[#121214]">{t('posBottom')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2">{t('waveformColor')}</label>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-md px-2 text-sm h-9">
                      <input
                        type="color"
                        disabled={isGenerating}
                        value={settings.waveformColor}
                        onChange={e => setSettings({...settings, waveformColor: e.target.value})}
                        className="h-5 w-5 bg-transparent outline-none cursor-pointer p-0 border-0 flex-shrink-0 rounded"
                      />
                      <input 
                        type="text" 
                        value={settings.waveformColor}
                        onChange={e => setSettings({...settings, waveformColor: e.target.value})}
                        className="w-full bg-transparent py-1 outline-none font-mono text-[10px] uppercase"
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 p-6 lg:p-8 bg-[#080809] flex flex-col items-center justify-start lg:justify-center lg:overflow-y-auto flex-shrink-0 min-h-max lg:min-h-0">
          
          <div className="w-full max-w-4xl flex flex-col gap-8">
            <div 
              className={`relative aspect-video bg-black rounded shadow-2xl overflow-hidden border border-white/10 flex items-center justify-center group ${audioFile && !isGenerating ? 'cursor-pointer' : ''}`}
              onClick={togglePreviewPlay}
            >
               <canvas ref={canvasRef} width={800} height={450} className="w-full h-full object-contain relative z-10 pointer-events-none"></canvas>
               {!imageFile && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 pointer-events-none z-20">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                    <p className="font-medium tracking-wide">{t('awaitingArtwork')}</p>
                 </div>
               )}
               {audioFile && !isGenerating && (
                  <div className={`absolute inset-0 z-30 flex items-center justify-center bg-black/40 transition-opacity ${isPlayingPreview ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                     <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-md text-white border border-white/20 shadow-lg">
                        {isPlayingPreview ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                     </div>
                  </div>
               )}
            </div>

            <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
              {isGenerating ? (
                <button
                  onClick={handleCancel}
                  className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <StopCircle className="w-5 h-5" /> {t('cancelOutput')}
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={!canStart}
                  className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-[#f27d26] hover:bg-[#d96a1a] disabled:bg-white/5 disabled:text-white/30 text-white px-8 py-3 rounded-lg font-medium transition-colors cursor-pointer disabled:cursor-not-allowed shadow-[0_0_15px_rgba(242,125,38,0.2)]"
                >
                  <Play className="w-5 h-5 fill-current" /> {t('exportMp4')}
                </button>
              )}

              <div className="flex-grow flex flex-col justify-center w-full">
                 {isGenerating && (
                    <div className="space-y-3 w-full">
                       <div className="flex justify-between text-xs font-mono">
                         <span className="text-[#f27d26] uppercase tracking-widest flex items-center gap-2">
                           <Loader2 className="w-3 h-3 animate-spin" />
                           {progressData.stage.replace('-', ' ')}
                         </span>
                         <span className="opacity-50">{Math.round(progressData.value * 100)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                          <div 
                            className="absolute inset-y-0 left-0 bg-[#f27d26] transition-all duration-300 ease-out" 
                            style={{width: `${progressData.value * 100}%`}}
                          />
                       </div>
                    </div>
                 )}
                 {!isGenerating && errorMsg && (
                    <div className="text-red-400 text-sm font-medium">{errorMsg}</div>
                 )}
                 {!isGenerating && progressData.stage === 'done' && !errorMsg && (
                    <div className="text-green-500 text-sm font-medium uppercase tracking-widest">{t('renderComplete')}</div>
                 )}
              </div>
            </div>

            {resultBlobUrl && (
              <div className="bg-[#121214] border border-[#f27d26]/20 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-sm font-bold tracking-widest uppercase mb-4 text-[#f27d26] flex items-center gap-2">
                  <Download className="w-4 h-4" /> {t('resultReady')}
                </h3>
                <video src={resultBlobUrl} controls className="w-full rounded-lg bg-black aspect-video mb-6 outline-none border border-white/10"></video>
                <a
                  href={resultBlobUrl}
                  download="waveform-output.mp4"
                  className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" /> {t('downloadMp4')}
                </a>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="px-6 py-3 bg-[#121214] border-t border-white/5 flex items-center gap-6 flex-shrink-0">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#f27d26]">
          {t('statusLabel')}: {isGenerating ? t('statusRendering') : t('statusIdle')}
        </div>
        <div className="flex-1 h-1 bg-white/5 rounded-full relative overflow-hidden">
          {isGenerating && (
             <div className="absolute inset-0 bg-[#f27d26] rounded-full opacity-40 transition-all duration-300" style={{width: `${progressData.value * 100}%`}}></div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono opacity-50">
          <span>{t('webcodecsOk')}</span>
        </div>
      </footer>
    </div>
  );
}


// --- Canvas Helpers ---

function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, targetW: number, targetH: number) {
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

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, targetW: number, targetH: number) {
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

function drawWaveform(ctx: CanvasRenderingContext2D, w: number, h: number, settings: RenderSettings, bins: number[]) {
  const n = bins.length;

  let yAxis = h * 0.5;
  if (settings.waveformPosition === 'top') yAxis = h * 0.2;
  else if (settings.waveformPosition === 'bottom') yAxis = h * 0.8;

  if (settings.waveformType === 'circle' || settings.waveformType === 'radial-bars') {
    yAxis = h * 0.5;
  }

  const baseAmp = h * 0.25;

  ctx.fillStyle = settings.waveformColor;
  ctx.strokeStyle = settings.waveformColor;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

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

