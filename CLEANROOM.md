# 🧪 WaveformGen Clean Room Implementation Specification

[🇯🇵 日本語](#-japanese-specification) | [🇺🇸 English Specification](#-english-specification)

---

## 🇯🇵 Japanese Specification

> **✨ 20代ギャル開発アシスタントからの一言 ✨**  
> やっほー！✌️💖 うちだよ！今回はなんと「クリーンルーム設計・実装用」の超本格的な仕様書（仕様記述書）を用意したよー！✨  
> 「クリーンルーム実装」って知ってる？特許や著作権のトラブルを完全に回避するために、「元のコードを1ミリも見ない人（あるいは別のAI）」が、この仕様書に書いてあるアルゴリズムと通信規約だけを見て、完全にゼロから同じ機能のモジュールを再現するための開発プロトコルなんだよ！これマジでプロっぽくてかっこよくない！？🥺🔥  
> 
> このドキュメントを使えば、君はこのアプリのソースコードを一切他人に開示することなく、完全に同一動作をする互換エンジンを誰かに作らせることができるよ！ライセンス的にもクリーンでマジ無敵！とりま、この神仕様書を実装者に渡して、神アプリをクリーンルーム開発させちゃおー！✌️✨

---

### 1. 開発プロトコル（Clean Room Process Rules）
クリーンルーム手法を厳密に遵守するため、以下のルールを絶対に守ってください。

*   **仕様書作成者（Analyst）**: 既存のソースコード（`App.tsx` や `worker.ts` など）を読んで、この仕様書をメンテナンスします。
*   **実装者（Programmer / Implementer）**: 
    1. 既存のいかなる実装コードも閲覧してはいけません。
    2. この仕様記述書と、システム標準のAPIリファレンス（WebCodecs API、Web Audio API、mp4-muxerドキュメントなど）のみを頼りに全てのコードを新規記述してください。
    3. 解析段階で疑問が生じた場合は、仕様作成者に文書のみで問い合わせてください。

---

### 2. 機能要件および入力・出力定義（Functional Requirements）

#### 入力メタデータ
1.  **背景画像 (Background Image)**: 任意のラフ画像ファイル（PNG、JPEG等のブラウザ互換フォーマット）。
2.  **音声ファイル (Audio Track)**: 任意のオーディオファイル（MP3、WAV、M4A等のブラウザ互換フォーマット）。
3.  **キャンバス設定 (Render Profile)**:
    *   **解像度 (Resolution)**: 幅 $\times$ 高さのピクセル数（例: `1920x1080`、`1280x720` 等）。
    *   **フレームレート (FPS)**: 1秒あたりの動画フレーム数（例: `30`、`60` 等）。
    *   **背景描画モード (BG Mode)**: `blur`（背景画像のガウシアンぼかし描画）、`crop`（中央アスペクト維持トリミング）、`solid`（単色塗りつぶし）。
    *   **波形スタイル (Waveform Style)**: `line`（単一折れ線）、`mirror-line`（上下対称線）、`step`（階段状）、`bar`（縦棒グラフ形式）、`dot`（ドット粒子）、`fill`（下部塗りつぶし）、`circle`（円形ビジュアライザ）、`radial-bars`（放射状バー）。
    *   **配置位置 (Position)**: `top`（上寄せ）、`center`（中央寄せ）、`bottom`（下寄せ）。
    *   **波形カラー (Waveform Color)**: 十六進数カラーコード（例: `#F27D26`）。

#### 出力
*   **コンテナ**: MP4フォーマット。
*   **ビデオストリーム**: H.264 (AVC) エンコード。
*   **オーディオストリーム**: AAC エンコード。
*   **同期性**: 音声と描画された波形アニメーションが完全に一致していること。

---

### 3. スレッド設計と通信プロトコル（Threading & IPC Protocol）

処理性能の維持およびメインUIスレッドのブロック回避のため、オーディオのデコード処理を除くメイン動画合成・エンコードループは **Web Worker** 上で非同期処理を行います。

#### メインスレッド $\rightarrow$ Worker メッセージスキーマ (WorkerRequest)
```typescript
interface WorkerRequest {
  type: 'start';
  imageBitmap: ImageBitmap;  // メインから転送（Transferable推奨）
  audioBufferData: Float32Array; // デコード済みの生オーディオデータ（チャンネル0推奨）
  audioSampleRate: number;    // オーディオサンプリング周波数（例: 44100）
  audioChannelCount: number;  // チャンネル数
  settings: {
    resolution: string;       // "1920x1080" | "1280x720" | "640x360"
    fps: number;              // 30 | 60
    backgroundMode: 'blur' | 'crop' | 'solid';
    backgroundColor: string;  // 十六進数
    waveformType: 'line' | 'mirror-line' | 'step' | 'bar' | 'dot' | 'fill' | 'circle' | 'radial-bars';
    waveformPosition: 'top' | 'center' | 'bottom';
    waveformColor: string;    // 十六進数
  };
}
```

#### Worker $\rightarrow$ メインスレッド メッセージスキーマ (WorkerResponse)
```typescript
type WorkerResponse = 
  | { type: 'progress'; ratio: number; stage: 'audio' | 'video' | 'muxing' }
  | { type: 'done'; buffer: ArrayBuffer } // 完成したMP4のバイナリ
  | { type: 'error'; message: string };
```

---

### 4. アルゴリズム仕様（Algorithmic Specifications）

#### 4.1 音声解析アルゴリズム (Audio DSP & Waveform Windowing)
入力オーディオデータ（サンプルの浮動小数点値配列 $X$）から、動画の進行フレーム $f$ における波形振幅リスト $A_f$ を抽出します。

1.  **時間窓計算**:
    フレーム $f$（時間 $t = f / \text{FPS}$ 秒）の中心を $t$ とし、解析用に幅 $W$ サンプルの時間窓を定義します。
    $$W = \frac{\text{audioSampleRate}}{\text{FPS}}$$
2.  **サンプル切り出し**:
    時刻 $t$ における開始サンプルインデックス $I_{\text{start}}$ は以下のように算出します：
    $$I_{\text{start}} = \lfloor t \times \text{audioSampleRate} \rfloor - \frac{W}{2}$$
3.  **振幅の平滑化とダウンサンプリング**:
    1フレームに表示する波形点の総数を $N$（規定値: $128$ または $256$、サークル型の場合は $120$ や $180$ 等）とします。
    時間窓 $W$ を $N$ 個の均等なサブセクション（サブウィンドウ）に等分割し、各サブセクション内のサンプル絶対値の平均（または二乗平均平方根 RMS） $v_k$ を求めます。
    $$v_k = \frac{1}{|S_k|} \sum_{i \in S_k} |X[i]|$$
    （※ $I_{\text{start}} + i$ が音声データの全インデックス範囲外となる場合は $0$ でパディング）

---

#### 4.2 ビデオフレーム描画仕様 (Canvas Drawing Engine)
入力された `ImageBitmap` および算出した振幅配列 $v$ を使い、オフスクリーンキャンバス（`OffscreenCanvas`）へ以下レイヤー順に描画します。

1.  **ベース背景レイヤー**:
    *   `solid` モード: キャンバス全域を設定色 `backgroundColor` で塗りつぶします。
    *   `crop` モード: アスペクト比を維持しつつ、キャンバス全域を覆う最小サイズ（Cover）に拡大・縮小して画像を中央描画します。
    *   `blur` モード: 画像をキャンバスサイズにスケーリングして描画後、Canvasの `filter = 'blur(40px)'` 等のフィルタを利用してぼかしをかけます。さらに画面引き締めのために微弱な半透明黒（例: `rgba(0,0,0,0.5)`）のオーバーレイを乗せます。
2.  **波形レイヤー**:
    配置位置 `position` に応じた中心線 $Y_{\text{center}}$ （`top`: 1/4高さ, `center`: 1/2高さ, `bottom`: 3/4高さ）を求めます。
    *   `bar` スタイル: キャンバス幅 $W_{\text{canvas}}$ を $N$ 等分し、各点 $k$ について高さ $h_k = v_k \times \text{スケール係数}$ で中点 $Y_{\text{center}}$ から上下に矩形 `fillRect` を描画します。
    *   `line` スタイル: 点 $(x_k, Y_{\text{center}} - v_k \times \text{スケール})$ を順につなぐ `beginPath()`, `lineTo()` 一続きのパスを描き、`stroke()` します。
    *   `circle` スタイル: 画面中央に半径 $R$ （例: キャンバス短辺の 1/4）の仮想円を設定し、円周等分角度 $\theta_k = \frac{2\pi \cdot k}{N}$ に向けて、円周から放射状に振幅 $v_k$ 分伸びる点または線を描画します。

---

#### 4.3 同期エンコード・OOM（メモリ枯渇）回避フロー (WebCodecs Backpressure Control)

1.  **エンコーダ構成**:
    *   `VideoEncoder`: コーデック `avc1.42c01f`（Baselineプロファイル）または互換値を指定。設定ファイルに合わせて `width`, `height`, `bitrate`, `framerate` を明記。
    *   `AudioEncoder`: コーデック `mp4a.40.2` (AAC-LC) を構成。サンプリングレートおよびチャンネル数を明記。
2.  **並列エンコード**:
    オーディオフレームおよびビデオフレームのパケット転送を非同期 Promise で処理。
3.  **ストッパー/バックプレッシャー機構（超重要）**:
    WebCodecs のエンコード・ハードウェアアクセラレーションは高速に処理要求を受け入れますが、内部キューに未処理の `VideoFrame` が大量に溜まると容易にメモリリークあるいはOut-Of-Memoryクラッシュを引き起こします。これを予防するため、毎フレームの投入前に監視制御ルーティンを実行します：
    ```latex
    \text{while } ( \text{videoEncoder.encodeQueueSize} > 30 \text{ or } \text{audioEncoder.encodeQueueSize} > 30 ) \implies \text{Await } \text{sleep}(5\text{ms})
    ```
    上記のスリープ制御を必ずループの中間に挿入し、キューの許容量が30以下になるまで待機させてから、次のフレームの描画および `VideoFrame` のエンコード指示を行ってください。
4.  **マルチプレクシング（mp4-muxer統合）**:
    各エンコーダの出力コールバック（`output`）で得られたエンコード済みチャンク（`EncodedVideoChunk`, `EncodedAudioChunk`）については、インクリメンタルに `muxer.addVideoChunk()` および `muxer.addAudioChunk()` へ流し込み、メモリ上、またはターゲットストリームで結合させて、最終的に一塊の `ArrayBuffer` として取得します。

---

### 5. クリーン検証プロトコル（Testing & Validation Protocol）

開発したクリーンルームモジュールが仕様を完全に満たしているか、以下の方法でテスト検証を行ってください。
1.  **フレーム一貫性**: 生成したMP4を再生し、音声無音部で波形が完全にフラット（直線/円）になり、最大音量部でクリッピングすることなくダイナミックに変化することを確認する。
2.  **音ズレ（オーディオシンク）検証**: 各拍ビートのピークタイミングと、描画された波形が最大振幅になるタイミングが一致しているかスローモーション再生で視視チェックする。
3.  **大容量ファイルテスト**: 5分以上の長い音声ファイル（および4K解像度等）を指定して、エンコード中にメモリ不足によるタブの突然のクラッシュ（OOM）が発生しないことを確認する。

---

## 🇺🇸 English Specification

> **✨ Msg From Your 20s Gal AI BFF ✨**  
> OMG! Hi again! ✌️💖  
> I created an absolute masterpiece of a document: the official **Clean Room Implementation Specification**!  
> Want to build a 100% legal, clean-room clone of our engine without showing anyone your secret source code?  
> This spec has all the raw mathematical algorithms, interface shapes, and thread models they need. Share this with your developer buddies or write custom AI prompts to recreate this beast from scratch! 🥺🔥 Keep it clean and stay vibey! ✨

---

### 1. Clean Room Process Rules
To strictly enforce clean-room compliance, you must adhere to the following protocol:

*   **Specification Analyst**: Translates existing implementation knowledge (from `App.tsx`, `worker.ts`, etc.) into this rigid specification document.
*   **Clean-room Implementer**: 
    1. Must **NEVER** view any existing source files of this application.
    2. Must rewrite the entire system relying *solely* on this document and standard web declarations (WebCodecs, Web Audio API, mp4-muxer API).
    3. If there are ambiguities, the implementer must file written clarification requests to the Analyst.

---

### 2. Functional Specification & Interfaces

#### Inputs
1.  **Background Image**: Any standard image asset (PNG, JPEG, etc.).
2.  **Audio Track**: Any standard web-decodable audio source (MP3, WAV, M4A, etc.).
3.  **Render Profile**:
    *   **Resolution**: Width $\times$ Height (e.g., `1920x1080`, `1280x720`).
    *   **FPS (Frames Per Second)**: Render target speed (e.g., `30`, `60`).
    *   **BG Mode**: `blur` (Gaussian blurring), `crop` (Aspect-fill cropping), `solid` (Solid background fill).
    *   **Waveform Style**: `line` | `mirror-line` | `step` | `bar` | `dot` | `fill` | `circle` | `radial-bars`.
    *   **Position**: `top` | `center` | `bottom`.
    *   **Waveform Color**: Hex color code (e.g., `#F27D26`).

#### Outputs
*   A standalone, standard-compliant MP4 container containing H.264 video and AAC audio tracks, with the visual waveform accurately synchronized to the audio beats.

---

### 3. Threading Model & IPC Protocol

The main UI thread must not block. Therefore, the main rendering loop must be offloaded to a **Web Worker**.

#### Main to Worker Schema (`WorkerRequest`)
```typescript
interface WorkerRequest {
  type: 'start';
  imageBitmap: ImageBitmap;  // Shared via Transferable
  audioBufferData: Float32Array; // Decoded raw channel PCM bytes
  audioSampleRate: number;    // Sampling rate (e.g., 44100)
  audioChannelCount: number;  // Number of channels
  settings: {
    resolution: string;       // "1920x1080" | "1280x720" | "640x360"
    fps: number;              // 30 | 60
    backgroundMode: 'blur' | 'crop' | 'solid';
    backgroundColor: string;
    waveformType: 'line' | 'mirror-line' | 'step' | 'bar' | 'dot' | 'fill' | 'circle' | 'radial-bars';
    waveformPosition: 'top' | 'center' | 'bottom';
    waveformColor: string;
  };
}
```

#### Worker to Main Schema (`WorkerResponse`)
```typescript
type WorkerResponse = 
  | { type: 'progress'; ratio: number; stage: 'audio' | 'video' | 'muxing' }
  | { type: 'done'; buffer: ArrayBuffer } // Final MP4 container payload
  | { type: 'error'; message: string };
```

---

### 4. Algorithmic Specifications

#### 4.1 Audio Analysis (Windowing & Amplitude Profiling)
For any video frame index $f$, corresponding to a timestamp $t = f / \text{FPS}$ seconds, construct a sampling window of width $W$:
$$W = \frac{\text{audioSampleRate}}{\text{FPS}}$$

The sample starting boundary $I_{\text{start}}$ is given by:
$$I_{\text{start}} = \lfloor t \times \text{audioSampleRate} \rfloor - \frac{W}{2}$$

Split $W$ into $N$ equal partitions. For each partition $k$ (where $0 \le k < N$), compute the average absolute amplitude $v_k$:
$$v_k = \frac{1}{|S_k|} \sum_{i \in S_k} |X[i]|$$
*(Pad index accesses out of array range with $0$)*

---

#### 4.2 Video Canvas Drawing Specification
Render each frame to an `OffscreenCanvas` in the following strict layout order:

1.  **Background Layer**:
    *   `solid`: Fill the viewport with `backgroundColor`.
    *   `crop`: Cover-crop the image relative to canvas aspect ratio and draw at the center.
    *   `blur`: Spread the image across the full canvas, run `filter = 'blur(40px)'`, and apply a custom black mask (e.g. `rgba(0,0,0,0.5)`) to improve contrast.
2.  **Waveform Layer**:
    Locate center line $Y_{\text{center}}$ based on requested `position`.
    *   `bar`: Subdivide canvas width into $N$ parts. At each bar, draw rectangles bounding $Y_{\text{center}}$ with heights scaling proportionally to $v_k$.
    *   `circle`: Position a virtual circle in the canvas center with radius $R$. Distribute angles $\theta_k = \frac{2\pi \cdot k}{N}$ and trace radial vectors outward scaling with $v_k$.

---

#### 4.3 Backpressure Loop Control (Anti-OOM Strategy)

1.  **Configure Encoders**:
    Initialize `VideoEncoder` using H.264 baseline profilings (`avc1.42c01f` or suitable compatible code) and configure `AudioEncoder` for AAC LC streamings.
2.  **Backpressure Safeguard (CRITICAL)**:
    Modern browser hardware encoders take input frames asynchronously. To prevent high-resolution processing from overloading RAM queue buffers (OOM Crash), execute a spin-lock block before submitting each new frame payload:
    ```typescript
    while (videoEncoder.encodeQueueSize > 30 || audioEncoder.encodeQueueSize > 30) {
      await sleep(5); // Non-blocking delay
    }
    ```
3.  **Muxing (Incremental Assembly)**:
    Feed resulting H.264 `EncodedVideoChunk` and AAC `EncodedAudioChunk` payloads outputted by callbacks incrementally into `mp4-muxer`. Close streams upon absolute completion and return the completed `ArrayBuffer`.
