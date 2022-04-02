'use strict'
// document は渡さなくても取れるがあえて引数にしている。

const createButtonElement = (document, sec) => {
  if (sec == 0) return;
  if (sec.isNaN) return;

  const span = document.createElement('span')
  span.classList.add('seek-button-border')

  const button = document.createElement('button')
  button.textContent = `${sec}s`

  let idprefix = sec < 0 ? "back" : "forw"
  let elementId = `${idprefix}${sec < 0 ? -sec : sec}s`
  button.id = elementId;

  span.appendChild(button)

  return {span, button};
}

const createSeekButtons = (document, containerElement, videoElement, itemsecs) => {
  // const itemsecs = [-15,-5]

  const videoseek = (secs) => {
    if (videoElement.fastSeek) {
      videoElement.fastSeek(videoElement.currentTime + secs)
    } else {
      videoElement.currentTime = videoElement.currentTime + secs
    }            
  }
    
  itemsecs.forEach((sec) => {
    if (sec == 0) return;
    if (sec.isNaN) return;

    const {span, button} = createButtonElement(document, sec);
    if (!button) return;

    button.addEventListener('click', () => videoseek(sec));
    containerElement.appendChild(span);
  })
}

export { createSeekButtons };