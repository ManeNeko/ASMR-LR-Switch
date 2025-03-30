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

let trackFiles = [];
let currentIndex = 0;
let isFlipped = false;
let audioContext, source, splitter, merger, gainNode;

addFilesBtn.addEventListener("click", () => {
	fileInput.click();
});

fileInput.addEventListener("change", (event) => {
	trackFiles = Array.from(event.target.files);
	trackList.innerHTML = "";
	trackFiles.forEach((file, index) => {
		let listItem = document.createElement("li");
		listItem.textContent = file.name.replace(/\.[^/.]+$/, "");
		listItem.addEventListener("click", () => playTrack(index));
		trackList.appendChild(listItem);
	});
	if (trackFiles.length > 0) playTrack(0);
});

function playTrack(index) {
	if (index < trackFiles.length) {
		currentIndex = index;
		audio.src = URL.createObjectURL(trackFiles[index]);
		currentTrackDisplay.textContent = trackFiles[index].name.replace(/\.[^/.]+$/, "");
		audio.volume = volumeBar.value;
		audio.play();
		playPauseBtn.textContent = "再生中";
	}
}

audio.addEventListener("ended", () => {
	if (currentIndex < trackFiles.length - 1) {
		playTrack(currentIndex + 1);
	}
});

playPauseBtn.addEventListener("click", () => {
	if (audio.paused) {
		audio.play();
		playPauseBtn.textContent = "再生中";
	} else {
		audio.pause();
		playPauseBtn.textContent = "停止中";
	}
});

audio.addEventListener("timeupdate", () => {
	seekBar.value = audio.currentTime;
	currentTimeDisplay.textContent = formatTime(audio.currentTime, audio.duration);
});

seekBar.addEventListener("input", () => {
	audio.currentTime = seekBar.value;
});

audio.addEventListener("loadedmetadata", () => {
	seekBar.max = audio.duration;
	audio.volume = volumeBar.value;
	currentTimeDisplay.textContent = formatTime(audio.currentTime, audio.duration);
});

volumeBar.addEventListener("input", () => {
	audio.volume = volumeBar.value;
});

function formatTime(currentSeconds, totalSeconds) {
	const currentMin = Math.floor(currentSeconds / 60);
	const currentSec = Math.floor(currentSeconds % 60).toString().padStart(2, "0");
	const totalMin = Math.floor(totalSeconds / 60);
	const totalSec = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
	return `${currentMin}:${currentSec} / ${totalMin}:${totalSec}`;
}

flipChannelsBtn.addEventListener("click", () => {
	if (!audioContext) {
		audioContext = new (window.AudioContext || window.webkitAudioContext)();
		source = audioContext.createMediaElementSource(audio);
		splitter = audioContext.createChannelSplitter(2);
		merger = audioContext.createChannelMerger(2);
		gainNode = audioContext.createGain();
		source.connect(splitter);
	}
	
	splitter.disconnect();
	if (isFlipped) {
		splitter.connect(merger, 0, 0);
		splitter.connect(merger, 1, 1);
		flipChannelsBtn.textContent = "LR";
	} else {
		splitter.connect(merger, 0, 1);
		splitter.connect(merger, 1, 0);
		flipChannelsBtn.textContent = "RL";
	}
	
	merger.connect(gainNode);
	gainNode.connect(audioContext.destination);
	isFlipped = !isFlipped;
	audioContext.resume();
});
// 現在再生中の曲を視覚的にハイライトする
function updateActiveTrack(index) {
	const items = trackList.querySelectorAll('li');
	items.forEach(item => item.classList.remove('active'));
	if (items[index]) items[index].classList.add('active');
}

// playTrack関数内で呼び出す
function playTrack(index) {
	if (index < trackFiles.length) {
		currentIndex = index;
		audio.src = URL.createObjectURL(trackFiles[index]);
		currentTrackDisplay.textContent = trackFiles[index].name.replace(/\.[^/.]+$/, "");
		audio.volume = volumeBar.value;
		audio.play();
		playPauseBtn.textContent = "再生中";
		updateActiveTrack(index); // この行を追加
	}
}
