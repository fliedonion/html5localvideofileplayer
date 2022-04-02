'use strict'

// global variable
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
    let message = 'Can play type "' + type + '": ' + canPlay
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

const setVideoSeek = (video, itemsecs) => {
  // const itemsecs = [-15,-5,5,15]
  const videoseek = (secs) => {
    if (video.fastSeek) {
      video.fastSeek(video.currentTime + secs)
    } else {
      video.currentTime = video.currentTime + secs
    }            
  }
  
  itemsecs.forEach((sec) => {
    if (sec == 0) return;
    if (sec.isNaN) return;

    let idprefix = sec < 0 ? "back" : "forw"
    let elementId = `${idprefix}${sec < 0 ? -sec : sec}s`
    const ele = document.querySelector(`#${elementId}`)
    if (ele) {
      ele.addEventListener('click', () => videoseek(sec));
    } else {
      console.log(`element ${elementId} is not found`)
    }
  })
}



const video = document.getElementById('videoele');


// set events for seek offset button
setVideoSeek(video, [-15,-5,5,15]);



const captureButton = document.querySelector('#capture');
const canvas1 = document.getElementById('draw1');
const canvas2 = document.getElementById('draw2');
const canvas3 = document.getElementById('draw3');
const canvasPlayback1 = document.createElement('canvas');
const canvasPlayback2 = document.createElement('canvas');
const canvasPlayback3 = document.createElement('canvas');

const timetext = document.getElementById('timetext');

const playbacks = [];
playbacks.push({
  small: canvas1,
  isFirst: true,
  big: canvasPlayback1,
  isActive: false,
  videoname: ''
});
playbacks.push({
  small: canvas2,
  isFirst: false,
  big: canvasPlayback2,
  isActive: false,
  videoname: ''
});
playbacks.push({
  small: canvas3,
  isFirst: false,
  big: canvasPlayback3,
  isActive: false,
  videoname: ''
});




const copyCanvasDraw = (canSrc, canDest) => {
  canDest.height = canSrc.height;
  canDest.width = canSrc.width;
  canDest.getContext('2d').drawImage(canSrc, 0, 0);
}

const copyImageFromVideo = (video, destPlayback) => {
  let smallCanvasW = 300; //canvasの幅
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
    

  for(let i = 1; i < playbacks.length; i++){
    if (playbacks[i-1].isActive) {
      const {small:s1, big:s2} = playbacks[i-1];
      const {small:d1, big:d2} = playbacks[i];
      copyCanvasDraw(s1, d1);
      copyCanvasDraw(s2, d2);
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

  [canvas1, canvas2, canvas3].forEach(x => {
    x.addEventListener('click', () => {
      video.pause();
      // video.focus();
      displayPlayback(playbacks, x, video);
    });
  })

  playbackcapture.addEventListener('click', function() {
    playbackcapture.style.visibility = 'hidden';
    video.focus();
    //　video.play();
  })
}