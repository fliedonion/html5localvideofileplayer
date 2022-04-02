'use strict'
// document は渡さなくても取れるがあえて引数にしている。

const createCanvasElement = (document) => {
  const canvas = document.createElement('canvas')
  canvas.classList.add('cap-canvas')
  canvas.textContent = 'Your browser does not support HTML5 Canvas.'

  return {canvas};
}

const createCaptureCanvases = (document, smallPreviewContainer, count) => {
  return [...Array(count).keys()].map((index) => {
    const {canvas} = createCanvasElement(document)
    smallPreviewContainer.appendChild(canvas)

    const bigCapture = document.createElement('canvas')
    
    const playback = {
      small: canvas,
      isFirst: false,
      big: bigCapture,
      isActive: false,
      videoname: ''
    }

    return playback;    
  })
}

export { createCanvasElement, createCaptureCanvases }