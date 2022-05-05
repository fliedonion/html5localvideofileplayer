'use strict'

import { createSeekButtons } from './seekButton.js'
import { createCaptureCanvases } from './pastFramePlaybacks.js'

// global variable
const playbackcaptureCount = 10;
let videoReady = false;
const getVideoReady = () => videoReady;
const setVideoReady = (value) => videoReady = value;


// 数秒前キャプチャ表示用のキャンバス
const playbackcapture = document.querySelector('#playbackcapture');


window.onload = () => localFileVideoPlayer();


const setVideoNameToTitle = (name) => {
  document.querySelector('#videotitle').textContent = name
}

const localFileVideoPlayer = () => {

  // console.log("test: all-items before add")
  // testDbReadItems();

  // testDbAddItem();
  // testDbAddItem2();

  // console.log("test: all-items after add")
  // testDbReadItems();


  const URL = window.URL || window.webkitURL
  const displayMessage = (message, isError) => {
    const element = document.querySelector('#message')
    element.innerHTML = message
    element.className = isError ? 'error' : 'info'
  }
  const playSelectedFile = (event) => {
    const that = event.target;

    const file = that.files[0]
    const type = file.type
    const videoNode = document.querySelector('#videoele')
    let canPlay = videoNode.canPlayType(type)
    if (canPlay === '') canPlay = 'no'
    let message = `'${type}' will probably ${canPlay==='no'?'NOT':''} play.`
    const isError = canPlay === 'no'
    displayMessage(message, isError)

    if (isError) {
      return
    }
    setVideoNameToTitle(file.name)

    const fileURL = URL.createObjectURL(file)
    videoNode.src = fileURL
    videoNode.focus();
  }
  const inputNode = document.querySelector('#fileinput')
  inputNode.addEventListener('change', playSelectedFile, false)
}

const fileBrowseButton = document.querySelector('#fileAltButton')
fileBrowseButton.addEventListener('click', () => {
  const fileNode = document.querySelector('#fileinput')
  fileNode.click();
})




const video = document.getElementById('videoele');


// create buttons for seek video and set events to the buttons.
const backwardContainer = document.querySelector('#backwardContainer')
const forwardContainer = document.querySelector('#forwardContainer')
createSeekButtons(document, backwardContainer, video, [-15,-5])
createSeekButtons(document, forwardContainer, video, [5,15])

// example capture button
const captureButton = document.querySelector('#capture');

// create elements for auto playback capture.
const playbacks = createCaptureCanvases(document, document.querySelector('#smallPreviewContainer'), playbackcaptureCount);
playbacks[0].isFirst = true;

const smallCaptureCanvases = playbacks.map(x=>x.small);

// time indicator
const timetext = document.getElementById('timetext');



const copyCanvasDraw = (canSrc, canDest) => {
  canDest.height = canSrc.height;
  canDest.width = canSrc.width;
  canDest.getContext('2d').drawImage(canSrc, 0, 0);
}

const smallCanvasWidthPx = 200;

const copyImageFromVideo = (video, destPlayback) => {
  let smallCanvasW = smallCanvasWidthPx; //canvasの幅
  let smallCanvasH = (smallCanvasW*video.videoHeight)/video.videoWidth; //canvasの高さ

  destPlayback.small.width = smallCanvasW;
  destPlayback.small.height = smallCanvasH;
  destPlayback.small.getContext('2d').drawImage(video, 0, 0, smallCanvasW, smallCanvasH);

  destPlayback.big.width = video.videoWidth;
  destPlayback.big.height = video.videoHeight;
  destPlayback.big.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

  destPlayback.isActive = true;
}


const intervalCallback = () => {
  if (!getVideoReady()) return;
  if (video.paused) return;

  const curtime = video.currentTime;

  if (!isNaN(curtime)){
    if (curtime >= 3600) {
      timetext.innerText = new Date(curtime * 1000).toISOString().substring(11, 11 + 8);
    }
    else {
      timetext.innerText = new Date(curtime * 1000).toISOString().substring(14, 14 + 5);
    }
  }

  for(let i = playbacks.length - 1; i > 0; i--) {
    if (playbacks[i-1].isActive) {
      const {small:srcSmall, big:srcBig} = playbacks[i-1];
      const {small:destSmall, big:destBig} = playbacks[i];
      copyCanvasDraw(srcSmall, destSmall);
      copyCanvasDraw(srcBig, destBig);
      playbacks[i].isActive = true;
    }
  }

  copyImageFromVideo(video, playbacks[0]);
}


setInterval(intervalCallback, 1000);

const showPlayback = (source, video) => {
  let cw = document.documentElement.clientWidth * 0.95;
  let ch = (cw*video.videoHeight)/video.videoWidth;

  let pad = Math.floor((document.documentElement.clientWidth - cw) / 2) ;

  playbackcapture.width = cw
  playbackcapture.height = ch;
  playbackcapture.style.left = pad + "px";
  // playbackcapture.style.top = pad + "px";
  playbackcapture.style.top = video.offsetTop + "px";
  playbackcapture.style.position = "absolute";          
  playbackcapture.style.visibility = "visible";
  playbackcapture.getContext('2d').drawImage(
    source, 0, 0, cw, ch
  );
}

const sidebarToggleButton = document.querySelector('#toggleSidebar')
sidebarToggleButton.addEventListener('click', () => {

  const sidebar = document.querySelector('#sidebar')
  const previews = document.querySelector('#smallPreviewContainer')
  const cover = document.querySelector('#smallPreviewHiddenCover')

  if (cover.dataset.covered === "false") {
    sidebarToggleButton.textContent = '>>'
    sidebar.style.width = '40px'
    previews.style.display='none'
    cover.dataset.covered = "true"
    cover.style.display = 'block'
  }
  else {
    sidebarToggleButton.textContent = '<<'
    sidebar.style.width = '200px'
    previews.style.display='flex'
    cover.dataset.covered = "false"
    cover.style.display = 'none'
  }


})



const setPlayPauseButtonEvent = (video) => {
  const play = document.querySelector('#play');
  const pause = document.querySelector('#pause');
  
  play.addEventListener('click', (e) => {
    if (!getVideoReady()) return; // global
    if (!video) return;
    if (!video.paused) return;

    video.play();
  })

  pause.addEventListener('click', (e) => {
    if (!getVideoReady()) return; // global
    if (!video) return;
    if (video.paused) return;

    video.pause();
  })
}

setPlayPauseButtonEvent(video);


video.onloadedmetadata = () => { //動画が読み込まれてから処理を開始
  video.volume = 0.3;
  captureButton.disabled = false;
  setVideoReady(true);

  // example
  captureButton.addEventListener('click',function(){
    // video.focus();
    video.pause();
    showPlayback(playbacks[0].big, video);
  });

  const displayPlayback = (playbacks, target, video) => {
    // video.focus();
    let q = playbacks.find(x => x.small == target);
    if(q && q.isActive) {
      showPlayback(q.big, video);
    }
  };

  smallCaptureCanvases.forEach(x => {
    x.addEventListener('click', () => {
      video.pause();
      // video.focus();
      displayPlayback(playbacks, x, video);
    });
  })

  playbackcapture.addEventListener('click', function() {
    playbackcapture.style.visibility = 'hidden';
    video.focus();
    // video.play();
  })
}