'use strict'
import db from './bookmarkdb.js'

const refreshButton = document.querySelector('#commentRefresh')
const saveButton = document.querySelector('#updateComment')
const video = document.querySelector('#videoele');
const lastLoadedVideoTitle = document.querySelector('#videotitle')
const commentTextArea = document.querySelector('#commentText')

if (db.isIndexedDBSupport()) {
    refreshButton.addEventListener('click', async event => {
        db.removeFloatTimeItemsAsync(lastLoadedVideoTitle.textContent)

        const items = await db.getAllAsync(lastLoadedVideoTitle.textContent)
        for(const item of items) {
            console.log(item)
        }
        updateListBox(items)
    })
    saveButton.addEventListener('click', async (event) => {
        // console.debug({
        //     videoTitle: lastLoadedVideoTitle.textContent,
        //     readyState: video.readyState,
        //     src: video.src,
        //     currentSrc: video.currentSrc,
        //     currentTime: video.currentTime,
        // })

        const comment = commentTextArea.value;
        if (!comment || comment === "") {
            return;
        }

        await db.saveBookmarkItemAsync(
            lastLoadedVideoTitle.textContent,
            Math.floor(video.currentTime), 
            comment,
            Date.now(),
        )
    })
}

let currentListItems = [];
const listbox = document.querySelector('#commentList')


const secToHms = (sec) => {
    const date = new Date(null);
    date.setSeconds(sec);
    return date.toISOString().substring(11, 19);
}

const updateListBox = (items) => {
    currentListItems = [...items]
    const newOptions = currentListItems.map(x => {
        const text = x.note.split('\n', 1)[0]
        const time = secToHms(x.time)

        return new Option(`${time} ${text}`, x)
    })
    listbox.options.length = 0;
    newOptions.forEach(x => listbox.appendChild(x))
}