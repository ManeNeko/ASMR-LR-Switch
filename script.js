// HTML要素の取得
const fileInput = document.getElementById("file-upload-button");
const addFilesBtn = document.getElementById("add-files-btn");
const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("play-pause");
const flipChannelsBtn = document.getElementById("flip-channels");
const seekBar = document.getElementById("seek-bar");
const volumeBar = document.getElementById("volume-bar");
const currentTimeDisplay = document.getElementById("current-time");
const currentTrackDisplay = document.getElementById("current-track");
const trackList = document.getElementById("track-list");

// 変数の初期化
let trackFiles = [];
let currentIndex = 0;
let isFlipped = false;
let audioContext, source, splitter, merger, gainNode;

// 「ファイルを追加」ボタンのクリックイベント
addFilesBtn.addEventListener("click", () => {
	fileInput.click();
});

// ファイル選択後のイベント処理
fileInput.addEventListener("change", (event) => {
	trackFiles = Array.from(event.target.files);
	trackList.innerHTML = "";
	// トラックリストに追加
	trackFiles.forEach((file, index) => {
		let listItem = document.createElement("li");
		listItem.textContent = file.name.replace(/\.[^/.]+$/, "");
		listItem.addEventListener("click", () => playTrack(index));
		trackList.appendChild(listItem);
	});
	if (trackFiles.length > 0) playTrack(0);
});

// トラック再生の関数
function playTrack(index) {
	if (index < trackFiles.length) {
		currentIndex = index;
		audio.src = URL.createObjectURL(trackFiles[index]);
		currentTrackDisplay.textContent = trackFiles[index].name.replace(/\.[^/.]+$/, "");
		audio.volume = volumeBar.value;
		audio.play();
		playPauseBtn.textContent = "再生中";
		updateActiveTrack(index);
	}
}

// トラック終了時のイベント - 次のトラックへ自動進行
audio.addEventListener("ended", () => {
	if (currentIndex < trackFiles.length - 1) {
		playTrack(currentIndex + 1);
	}
});

// 再生/停止ボタンのクリックイベント
playPauseBtn.addEventListener("click", () => {
	if (audio.paused) {
		audio.play();  // 一時停止中なら再生
		playPauseBtn.textContent = "再生中";
	} else {
		audio.pause();  // 再生中なら一時停止
		playPauseBtn.textContent = "停止中";
	}
});

// 再生時間の更新イベント
audio.addEventListener("timeupdate", () => {
	seekBar.value = audio.currentTime;  // シークバーの位置更新
	currentTimeDisplay.textContent = formatTime(audio.currentTime, audio.duration);  // 時間表示の更新
});

// シークバーの操作イベント
seekBar.addEventListener("input", () => {
	audio.currentTime = seekBar.value;  // 再生位置を変更
});

// メタデータ読み込み完了時のイベント
audio.addEventListener("loadedmetadata", () => {
	seekBar.max = audio.duration;  // シークバーの最大値を設定
	audio.volume = volumeBar.value;  // 音量設定
	currentTimeDisplay.textContent = formatTime(audio.currentTime, audio.duration);  // 時間表示の初期化
});

// 音量バーの操作イベント
volumeBar.addEventListener("input", () => {
	audio.volume = volumeBar.value;  // 音量を変更
});

// 時間表示のフォーマット関数
function formatTime(currentSeconds, totalSeconds) {
	const currentMin = Math.floor(currentSeconds / 60);
	const currentSec = Math.floor(currentSeconds % 60).toString().padStart(2, "0");
	const totalMin = Math.floor(totalSeconds / 60);
	const totalSec = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
	return `${currentMin}:${currentSec} / ${totalMin}:${totalSec}`;
}

// 反転ボタンのクリックイベント
flipChannelsBtn.addEventListener("click", () => {
	if (!audioContext) {
		// Web Audio API初期化（初回のみ）
		audioContext = new (window.AudioContext || window.webkitAudioContext)();
		source = audioContext.createMediaElementSource(audio);  // オーディオ要素をソースに
		splitter = audioContext.createChannelSplitter(2);  // ステレオチャンネル分割
		merger = audioContext.createChannelMerger(2);  // チャンネル合成
		gainNode = audioContext.createGain();  // ゲインノード（音量調整用）
		source.connect(splitter);  // ソースを分割器に接続
	}
	
	splitter.disconnect();  // 既存の接続を切断
	if (isFlipped) {
		// 通常の接続（左→左、右→右）
		splitter.connect(merger, 0, 0);
		splitter.connect(merger, 1, 1);
		flipChannelsBtn.textContent = "LR";
	} else {
		// チャンネル反転（左→右、右→左）
		splitter.connect(merger, 0, 1);
		splitter.connect(merger, 1, 0);
		flipChannelsBtn.textContent = "RL";
	}
	
	// オーディオグラフの再接続
	merger.connect(gainNode);  // 合成器をゲインノードに接続
	gainNode.connect(audioContext.destination);  // 出力先に接続
	isFlipped = !isFlipped;  // フラグを反転
	audioContext.resume();  // オーディオコンテキスト再開（自動再生ポリシー対応）
});

// 再生中の曲をハイライト
function updateActiveTrack(index) {
	const items = trackList.querySelectorAll('li');
	items.forEach(item => item.classList.remove('active'));
	if (items[index]) items[index].classList.add('active');
}
