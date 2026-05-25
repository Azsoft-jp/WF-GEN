# 🎧 WaveformGen (Waveform Generator)

[🇯🇵 日本語](#-japanese) | [🇺🇸 English](#-english) | [🇰🇷 한국어](#-korean) | [🇨🇳 简体中文](#-chinese) | [🇷🇺 Русский](#-russian)

---

## 🇯🇵 Japanese

> **✨ 20代ギャル開発アシスタントからの一言 ✨**  
> やっほー！✌️💖 このアプリのコードをばちばちに磨き上げて作った「うち（AIギャル）」だよー！  
> このファイルは、この神アプリ『WaveformGen』の開発マニュアル（README）だよ！  
> どんなに難しそうな技術でも、うちが噛み砕いて超分かりやすく、かつエンジニアの君が「マジで使える！」って思えるようにまとめたから、とりま読んでって！🥺✨

### 📸 どんなアプリ？
**WaveformGen**は、**「1枚の画像」**と**「音声ファイル（MP3等）」**をポイッと入れるだけで、音楽に合わせて波形が美しく動く**動画（MP4）をブラウザ上だけで秒速生成してダウンロードできる最強ツール**だよ！✨

サーバーに重い動画データを送る必要が一切ないから、通信量も超エコだしプライバシー的にも安全！  
さらに、**グローバル対応（日本語・英語・韓国語・中国語・ロシア語の5ヶ国語対応）**だから世界のどこからでも使えちゃう、マジでワールドワイドな仕上がりになってるよ！🌎💖

👉 **本番URL（独自ドメインで爆誕！）**: [https://waveform-gen.nulltan.dev/](https://waveform-gen.nulltan.dev/)  
👉 **GitHubリポジトリ**: [https://github.com/Azsoft-jp/WF-GEN](https://github.com/Azsoft-jp/WF-GEN)

### 🛠️ 使ってる技術たちがイケてんの！
*   **⚡ React + Vite + TypeScript**: フロントエンドはこれで決まり！ガチでサクサク動いて体験ヤバい。
*   **🎨 Tailwind CSS**: デザインを秒でおしゃれにする、うちのイチ推しスタイリングシステム。
*   **👷‍♀️ Web Worker (`worker.ts`)**: 重たいエンコード処理（動画・音声）を裏方でガチで並行処理してくれる優秀すぎるスタッフ！
*   **🎶 OfflineAudioContext (Web Audio API)**: 音声ファイルを一瞬で読み込み、どのタイミングでどのノイズや音量が出てるかを波形データとして抽出！
*   **🎞️ WebCodecs API**: H.264とAACのエンコード（圧縮処理）をブラウザ本体の力（ハードウェアアクセラレーション）でやっちゃう神API！
*   **🎬 mp4-muxer**: エンコードした動画（VideoFrame）と音声（AudioData）のチャンクを、ブラウザ上で綺麗な「.mp4」コンテナに合体（マルチプレクシング）させる天才ライブラリ！

### 🔄 処理の流れをざっくり解説！
1.  **アセット取得**: ユーザーが画像と音声をアップロード！
2.  **波形解析（Web Audio）**: `OfflineAudioContext`を使って、ミリ秒単位でデシベル（音量）を数値化してデータ配列を作るよ。
3.  **裏方チーム起動（Web Worker）**: 重いループ処理がGUI側の画面をフリーズさせないように、すべてのデータを Worker に丸投げする！
4.  **並行エンコード（WebCodecs + Promise.all）**:
    *   **音声（Audio）**: 1024フレームずつのチャンクに綺麗に区切ってAACにエンコード。
    *   **動画（Video）**: 各フレームのオーディオ強度に基づいて、Canvasへ「画像＋波形ビジュアライザ」をリアルタイムドロー！そのまま `VideoFrame` へ変換してH.264にエンコード。
5.  **メモリセーフ機構（OOM対策）**: エンコーダーが爆速すぎて溢れないよう、`encodeQueueSize`が一定値を超えたら「ちょっと待って！🐶」と一時停止（`setTimeout`）を挟むストッパーを搭載！
6.  **合体（Muxer）**: すべて完了したら `mp4-muxer` がファイルを完成させて、画面に「できたよー！」って返却！

### 🚀 ローカルで動かす方法！
「うちの環境でも走らせたい！」って君は、以下のコマンドで一瞬で立ち上げられるよ！
1. **依存パッケージのインストール**
   ```bash
   npm install
   ```
2. **ローカル開発サーバー立ち上げ**
   ```bash
   npm run dev
   ```
   これでブラウザが起動して、ローカルでテストできるようになるよ！超簡単で草。
3. **ビルド（本番用に固める！）**
   ```bash
   npm run build
   ```
   ビルドが成功すると、`dist/` ディレクトリの中に超軽量な静的ファイルが書き出されるよ！

### 🥵 詰まったポイントと対策まとめ
*   **ブラウザお亡くなり事件 (Out Of Memory)**
    *   **原因**: WebCodecsのエンコード処理能力が高すぎて、処理が待ち行列（Queue）に無限に溜まり、ブラウザのRAM（メモリ）がバーストしてお亡くなり（強制リロード）になってた(泣)🥺
    *   **対策**: `worker.ts`内で `videoEncoder.encodeQueueSize` と `audioEncoder.encodeQueueSize` をリアルタイム監視して、一定値を超えたらしばらくスリーブするストッパーを設置。これで超安定動作に！👏✨
*   **プログレスバー止まる問題**
    *   **原因**: 最初は「音声やってから動画」って順番にしてたから、進捗がガクガクでイライラした(怒)
    *   **対策**: `Promise.all`で音声と動画を「完全に同時並行」で走らせつつ、進捗率を `(音声進捗 * 10% + 動画進捗 * 90%)` みたいに綺麗にブレンドして滑らかに表示させたよ。体験マジ神！

---

## 🇺🇸 English

> **✨ Msg From Your 20s Gal AI BFF ✨**  
> OMG! What's up guys! ✌️💖 I'm your Gen-Z AI BFF, and I literally polished the heck out of this app!  
> This file is the developer manual (README) for our super cute app **WaveformGen**!  
> I broke down all the crazy tech jargon so it’s super cozy and fun to read, but still totally useful for you devs out there. Let's get into it! 🥺✨

### 📸 What's this app anyway?
**WaveformGen** is the absolute ultimate tool where you just crop in a **single image** and throw in an **audio file (like MP3)**, and BAM! You get a gorgeously animated **MP4 video** with moving waveforms, processed entirely inside your browser! ✨  

No sending heavy videos to any server, so it's super eco-friendly and 100% private!  
Plus, it's globally optimized with **5-language support (English, Japanese, Korean, Chinese, and Russian)**! We are literally world-famous now! 🌎💖

👉 **Live Site (Our own domain, duh!)**: [https://waveform-gen.nulltan.dev/](https://waveform-gen.nulltan.dev/)  
👉 **GitHub Repo**: [https://github.com/Azsoft-jp/WF-GEN](https://github.com/Azsoft-jp/WF-GEN)

### 🛠️ Our Tech Stack is Serving Cunt!
*   **⚡ React + Vite + TypeScript**: The ultimate frontend setup. Smooth, fast, and so fun to write!
*   **🎨 Tailwind CSS**: Polishes our UI in literally seconds. My favorite choice for vibey styling!
*   **👷‍♀️ Web Worker (`worker.ts`)**: Our elite behind-the-scenes assistant who processes all the heavy video encoding in parallel without freezing the screen!
*   **🎶 OfflineAudioContext (Web Audio API)**: Instantly reads audio assets and extracts decibel waveforms. Pure magic!
*   **🎞️ WebCodecs API**: Hardware-accelerated, heavy-duty H.264 & AAC encoding directly inside the browser!
*   **🎬 mp4-muxer**: Combines the encoded `VideoFrame` and `AudioData` chunks into a beautiful, lightweight `.mp4` file!

### 🔄 How it Works
1.  **Asset Loading**: The user uploads an image and audio file.
2.  **Waveform Analysis**: Grab the frequency/amplitude data using `OfflineAudioContext` for millisecond-level precision.
3.  **Boot Core Worker**: Tosses the heavy frame rendering loop off the main UI thread into the Web Worker so the page stays 100% responsive.
4.  **Parallel Multi-encoding (`Promise.all`)**:
    *   **Audio**: Split the stream into 1024-frame chunks and compress to AAC format.
    *   **Video**: Under the hood, draw frames on an offscreen Canvas based on real-time audio amplitudes, grab `VideoFrame` objects, and queue them to H.264 encoders.
5.  **Anti-OOM Safety Valves**: Real-time queues are monitored (`encodeQueueSize`). If things get too fast, we tell the process to "chill out🐶" via an elegant micro-delay delay.
6.  **Muxing Step**: Wrap everything securely into an `.mp4` container via `mp4-muxer` and return the blob. Done!

### 🚀 Getting Started
Wanna run it locally? It takes like... literally two seconds!
1. **Install packages**
   ```bash
   npm install
   ```
2. **Boot dev server**
   ```bash
   npm run dev
   ```
   Open your browser and play around! So easy, I'm screaming.
3. **Build for production**
   ```bash
   npm run build
   ```
   This compiles everything into an ultra-clean, static `dist/` folder!

### 🥵 Major Struggles & Fixes (Blood, Sweat, & Tears!)
*   **The Infamous Out-Of-Memory Browser Crash**
    *   **Why**: WebCodecs is insanely fast, meaning encoding frames piled up into memory queues and blew the browser RAM instantly. We literally got standard browser page reloads out of nowhere.
    *   **Fix**: Added a strict queue-size governor inside `worker.ts`. If `encodeQueueSize` gets over the cap, processing pauses momentarily to let the GPU catch up. Silky smooth now! 👏
*   **The Annoyingly Static Progress Bar**
    *   **Why**: Originally, we did audio encoding first and then video encoding, causing the progress percentage to lag and look "frozen."
    *   **Fix**: Leveraged `Promise.all` to spin up audio and video encoding simultaneously. Blended progress displays elegantly using `(audioProgress * 0.1 + videoProgress * 0.9)`, creating a buttery smooth progress experience.

---

## 🇰🇷 Korean

> **✨ 20대 K-인싸 개발자 친구의 편지 ✨**  
> 안녕~ ✌️💖 이 대박적인 앱의 코드를 같이 갈고닦은 ‘나(AI 인싸 친구)’야!  
> 이 파일은 우리의 갓벽한 앱 **WaveformGen**의 개발 매뉴얼(README)이야!  
> 아무리 어려워 보이는 기술도 내가 진짜 이해하기 쉽게 쏙쏙 풀어냈으니까, 일단 믿고 읽어봐! 🥺✨

### 📸 어떤 앱이야?
**WaveformGen**은 **‘이미지 한 장’**이랑 **‘음원 파일(MP3 등)’**을 슥 넣기만 하면, 비트에 맞춰서 물결치듯 예쁘게 움직이는 **MP4 동영상을 브라우저 안에서 초고속으로 뚝딱 만들고 다운로드받는 꿀템 앱**이야! ✨  

무거운 동영상 데이터를 서버에 보낼 필요가 전혀 없어서 데이터도 아끼고 프라이버시도 철저하게 지킬 수 있어!  
게다가 무려 **글로벌 대응(한국어, 영어, 일본어, 중국어, 러시아어 5개 국어 지원)**이라 전 세계 어디에서든 자유롭게 쓸 수 있어! 완전 월클 수준 아냐?🌎💖

👉 **라이브 URL (우리만의 독점 도메인!)**: [https://waveform-gen.nulltan.dev/](https://waveform-gen.nulltan.dev/)  
👉 **GitHub 저장소**: [https://github.com/Azsoft-jp/WF-GEN](https://github.com/Azsoft-jp/WF-GEN)

### 🛠️ 우리 기술 스택 완전 힙해!
*   **⚡ React + Vite + TypeScript**: 프론트엔드 끝판왕! 진짜 부드럽고 가볍게 돌아서 개발할 때 짜릿해.
*   **🎨 Tailwind CSS**: 단숨에 세련된 UI를 뽑아내는 최고의 스타일링 치트키!
*   **👷‍♀️ Web Worker (`worker.ts`)**: 백그라운드에서 동영상이랑 음성 인코딩 작업을 묵묵히 처리해주는 열일하는 우리 크루!
*   **🎶 OfflineAudioContext (Web Audio API)**: 음원 파일을 순식간에 읽어 들여서 완벽한 비트 파형 데이터를 추출하는 똑똑이 API!
*   **🎞️ WebCodecs API**: 브라우저 자체 하드웨어 파워로 H.264랑 AAC 인코딩을 처리해주는 엄청난 기술!
*   **🎬 mp4-muxer**: 인코딩된 프레임들을 하나의 깔끔한 `.mp4` 파일로 착 붙여서 고화질 동영상으로 뽑아주는 마법같은 라이브러리야!

### 🔄 작동 원리 요약
1.  **에셋 읽기**: 이미지와 사운드 파일을 수신.
2.  **비트 파형 분석**: `OfflineAudioContext`를 활용해 아주 조밀하게 데시벨 값을 분석하고 배열 데이터로 컴파일.
3.  **워커 스레드 투입**: 프렌들리하게 렌더링 루프를 `worker.ts`로 넘겨 메인 화면이 먹통이 되지 않도록 분리!
4.  **트랙 투트랙 병렬 인코딩**:
    *   **오디오**: 1024 샘플씩 쪼개어 가공하고 AAC 파일 인코더에 푸시.
    *   **비디오**: 비트 움직임에 맞춰 Canvas에 그림을 그린 후 즉석에서 `VideoFrame` 오브젝트화해서 H.264 인코더에 투하.
5.  **RAM 세이브 정지 장치**: 무제한으로 일감이 밀려 메모리가 폭발(OOM)하기 전에, 대기열 크기가 기준치를 넘으면 잠깐 동작을 양보하고 쿨링 타임을 가짐!
6.  **결합 (Muxing)**: 다 되면 `mp4-muxer`가 오디오/비디오 스트림을 꽉 잡고 인라인 파일로 가공해 다운로드 버튼 제공!

### 🚀 로컬 실행 방법
너의 환경에서 얼른 돌려보고 싶다고? 아래 명령어로 광속 실행 가능!
1. **패키지 설치**
   ```bash
   npm install
   ```
2. **개발 서버 켜기**
   ```bash
   npm run dev
   ```
   바로 브라우저가 뜨면서 로컬에서 테스트 가능해! 넘 편해서 기절각.
3. **프로덕션 빌드**
   ```bash
   npm run build
   ```
   빌드가 끝나면 `dist/` 경로에 가볍고 깔끔한 정적 파일들이 정리되어 나올 거야!

### 🥵 눈물의 해결사! 발생한 빅이슈 해결법
*   **메모리 꽉 차서 브라우저가 강제 리로드되는 현상**
    *   **이유**: WebCodecs 성능이 너무 깡패같아서 연산 대기열 큐가 과부하되어 컴퓨터의 소중한 RAM을 마셔버리는 바람에 브라우저 프로세스가 터짐(눈물)
    *   **해결**: `worker.ts` 안에서 `videoEncoder.encodeQueueSize`를 늘 체크하다가 꽉 찬 느낌이 오면 "스톱!🐶" 하고 여유 돌려줌으로써 전 기종 안정화 완료!
*   **프로그レス 게이지가 꿈쩍도 안 하던 문제**
    *   **이유**: 원래는 오디오 먼저 줄 세우고 다음에 비디오를 가공했더니 진행 버퍼가 튕기는 불쾌한 상태 발생.
    *   **해결**: `Promise.all` 공법을 채택하여 동시에 같이 처리하도록 개조하고, 완성도 계산식에 각각 가중치를 녹여내어 매끄럽고 신뢰도 높은 예쁜 프로그레스바로 대변신 성공!

---

## 🇨🇳 简体中文

> **✨ 辣妹美少女开发助理的悄悄话 ✨**  
> 哈喽宝贝们！✌️💖 我是帮程序员小哥哥把这个代码打磨到极致的“AI辣妹助手”噢！  
> 这份文档是咱们神级应用 **WaveformGen** 的超干货开发手册（README）！  
> 不管多生硬的技术词汇，我都用最直白大白话帮你们全盘搞懂，保证程序员宝宝们能百分百 get 并且觉得“超实用”！来，赶紧围观起来！🥺✨

### 📸 这是一款什么神仙 App？
**WaveformGen** 是一款极其护眼和炫酷的云端神器！你只需要丢给它**一篇背景图**和**一首音频（比如MP3）**，它就能零延迟在浏览器本地生成一段卡点波形乱舞的**高清 MP4 视频**并直接下载！✨

不需要把几百兆的视频上传服务器，既省流量又对隐私安全到不能再安全，太贴心了吧！  
重点是，它现在支持**全球五大语言（中文简体、英语、日语、韩语、俄语）**，秒速检测主流语系，真的是走在国际前沿！🌎💖

👉 **线上网址（咱们自己的专属域名噢）**: [https://waveform-gen.nulltan.dev/](https://waveform-gen.nulltan.dev/)  
👉 **GitHub 仓库地址**: [https://github.com/Azsoft-jp/WF-GEN](https://github.com/Azsoft-jp/WF-GEN)

### 🛠️ 看看咱们无敌前沿的技术栈！
*   **⚡ React + Vite + TypeScript**: 前端顶配组合！丝滑流畅，打字体验简直爽得飞起。
*   **🎨 Tailwind CSS**: 极速生成美丽设计的造型师，我的本命 CSS 框架！
*   **👷‍♀️ Web Worker (`worker.ts`)**: 专注后台默默干活的技术担当，绝不让高画质导出的计算导致网页卡死或崩溃！
*   **🎶 OfflineAudioContext (Web Audio API)**: 音频解析担当。微秒级扫描音乐动态并将其转化为高度精确的跳动音符参数！
*   **🎞️ WebCodecs API**: 深度调用浏览器硬解码硬件优势，原地高质量运行 H.264 与 AAC 格式压缩！
*   **🎬 mp4-muxer**: 把生成好的一帧帧画卷和声轨重新合成为一个干净利落的 `.mp4` 文件！

### 🔄 详细运行流程
1.  **资源灌入**: 接收并解析来自主屏拖进来的美图与音轨。
2.  **音频图谱化**: 通过 `OfflineAudioContext` 运行瞬态解析，把声音的动态起伏转为可视化的高精数字链。
3.  **后台接棒**: 开启主干多线程，把庞大的每一秒 30/60 帧的画布绘图转移到外部 `worker.ts` 中，拒绝卡 UI 线程。
4.  **音频视频双轨齐跑 (`Promise.all`)**:
    *   **音频**: 以 1024 样本数为小火车，逐步塞进 AAC 音频编码列车。
    *   **视频**: 根据分频波形参数，手动画好波峰图，并将画面当场封包成 `VideoFrame` 送进 H.264 视轨编码器。
5.  **队列红线拦截 (反 OOM 装置)**: 当检测到编码缓冲区 `encodeQueueSize` 憋高了，立刻启动优雅微睡挂起，杜绝在生成巨型高清视频时跑崩浏览器进程！
6.  **合体装罐 (Muxing)**: Muxer 在幕后精细整理两束轨道信号，吐出完全体的二进制 MP4 流。

### 🚀 本地开发与运行
想要在本地自己跑起来？超级简单，跟着我这么做：
1. **安装依赖**
   ```bash
   npm install
   ```
2. **启动本地开发环境**
   ```bash
   npm run dev
   ```
   浏览器就会立刻跳转，你就可以在本地随意折腾咯！省手省心！
3. **生产打包**
   ```bash
   npm run build
   ```
   打包完成后，所有静态代码文件都会被极简压缩到 `dist/` 文件夹下哟！

### 🥵 开发中的魔鬼细节与避坑
*   **大音视频文件引发突然死机/自动刷新 (内存溢出 OOM)**
    *   **原因**: 浏览器原生 WebCodecs 太拼了，处理画布没有缓冲条，无限制生产帧堆死在 RAM 里，直接给系统判定宕机。
    *   **好方子**: 在 Work 里增加了实时队列容量哨兵。若 `encodeQueueSize` 大于警戒线就优雅停顿片刻，让硬件编好前批数据后再放行。非常坚挺！
*   **进度条直接无视前 90% 的尴尬进度**
    *   **原因**: 一开始写成了先编完全部音效，再去慢慢编视频，用户在前面呆呆等一长串时间。
    *   **好方子**: 改成 `Promise.all` 齐头并进方案，再根据 `(音频完成度 * 10% + 视频完成度 * 90%)` 折算出丝滑顺畅的实数滚动条。用户快乐度爆表！

---

## 🇷🇺 Русский

> **✨ Приветственное слово от твоей любимой AI-подружки ✨**  
> Приветик! ✌️💖 С вами на связи ваша любимая AI-подружка, которая помогла довести код этого приложения до абсолютного идеала!  
> Этот файл — руководство разработчика (README) для нашего мега-крутого приложения **WaveformGen**!  
> Я перевела все заумные термины на простой человеческий язык, чтобы вам было максимально комфортно читать, но при этом всё осталось полезно для дела. Погнали! 🥺✨

### 📸 Что это за штука вообще?
**WaveformGen** — это просто пушка-петарда! Ты закидываешь **всего одну картинку** и **аудиофайл (например, MP3)**, и бум! Получаешь красивое **MP4-видео** с анимированной аудиоволной, которая подстраивается под бит. И всё это рендерится прямо в твоем браузере! ✨

Никакой отправки тяжелых видео на сторонние сервера — всё быстро, безопасно для приватности и экономит трафик!  
А ещё приложение поддерживает **5 языков (английский, японский, корейский, китайский и русский)**! Это же настоящий международный уровень! 🌎💖

👉 **Рабочий сайт (на нашем собственном домене, ура!)**: [https://waveform-gen.nulltan.dev/](https://waveform-gen.nulltan.dev/)  
👉 **Репозиторий на GitHub**: [https://github.com/Azsoft-jp/WF-GEN](https://github.com/Azsoft-jp/WF-GEN)

### 🛠️ Наш стек технологий просто космос!
*   **⚡ React + Vite + TypeScript**: Мощный фронтенд-дуэт! Всё летает со скоростью света, а писать код — одно удовольствие.
*   **🎨 Tailwind CSS**: Позволяет навести красоту в интерфейсе за считанные секунды. Обожаю его за стиль!
*   **👷‍♀️ Web Worker (`worker.ts`)**: Наша трудяжка на бэкграунде, которая берет на себя тяжелую работу по рендерингу видео и звука, чтобы экран не зависал во время экспорта.
*   **🎶 OfflineAudioContext (Web Audio API)**: Моментально сканирует аудиодорожку и раскладывает звук по полочкам, доставая точную амплитуду для волны.
*   **🎞️ WebCodecs API**: Крутейший инструмент для аппаратного кодирования H.264 и AAC прямо силами браузера!
*   **🎬 mp4-muxer**: Склеивает закодированное видео (`VideoFrame`) и звук (`AudioData`) в превосходный и легкий `.mp4`-файл!

### 🔄 Как это устроено (для гиков)
1.  **Загрузка ресурсов**: Файлы пользователя считываются в памяти.
2.  **Анализ звукового спектра**: `OfflineAudioContext` раскладывает частоты и строит массив амплитуд в реальном времени.
3.  **Запуск Воркера**: Чтобы интерфейс не фризился из-за тяжелой отрисовки каждого кадра, управление передается в фоновый поток `worker.ts`.
4.  **Параллельное кодирование в два потока**:
    *   **Аудио**: Разбивается на пакеты по 1024 сэмплов и сжимается в формат AAC.
    *   **Видео**: Каждый кадр рисуется на Canvas на основе звуковых колебаний в конкретную миллисекунду, преобразуется в объект `VideoFrame` и отправляется на сжатие в кодек H.264.
5.  **Контроль утечки памяти (OOM-защита)**: Чтобы гора несжатых кадров не сожрала всю оперативку, процесс отслеживает `encodeQueueSize` и временно делает паузу, когда буфер переполнен.
6.  **Склейка (Мультиплексирование)**: Окончательный сборщик склеивает обе дорожки в полноценный контейнер MP4 без потери качества.

### 🚀 Локальный запуск
Хочешь запустить проект у себя на компе? Это делается буквально в два клика!
1. **Установка пакетов**
   ```bash
   npm install
   ```
2. **Запуск сервера разработки**
   ```bash
   npm run dev
   ```
   Откроется браузер, и ты сможешь тестировать всё локально. Проще простого!
3. **Сборка для продакшена**
   ```bash
   npm run build
   ```
   Все файлы проекта сожмутся в оптимизированную папку `dist/` folder!

### 🥵 С чем намучились и как это победили
*   **Страшный краш вкладки браузера (утечка памяти ООМ)**
    *   **Проблема**: WebCodecs кодировал кадры так быстро, что очередь раздувалась до гигабайтных размеров за миллисекунды, и движок Chrome просто падал на колени.
    *   **Решение**: Код в `worker.ts` постоянно опрашивает размер буфера. Как только он превышает лимит, рендер послушно ждёт, пока девайс дожует предыдущие кадры. Полная стабильность!
*   **Индикатор прогресса застревал на одном месте**
    *   **Проблема**: Сначала мы кодировали всю аудиодорожку, а затем приступали к рисованию видео. Пользователь 90% времени наблюдал неподвижный унылый экран.
    *   **Решение**: Перевели задачи на параллельное выполнение через `Promise.all` и разработали умный расчет взвешенного прогресса `(audio * 0.1 + video * 0.9)`. Теперь шкала бежит идеально ровно и плавно!
