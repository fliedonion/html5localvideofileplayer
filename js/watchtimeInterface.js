'use strict'
import db from './watchtimedb.js'


// const x = async () => {
//     const l = await db.loadWatchtimeItemAsync("dummy1");
//     console.log(l)
//
//     console.debug("store dummy")
//     await db.saveWatchtimeItemAsync("dummy", 0, Date())
// }

const saveWatchtime = async (title, currentTime, date = Date()) => {
    await db.saveWatchtimeItemAsync(title, currentTime, date)
}

const loadWatchtime = async (title) => {
    return await db.loadWatchtimeItemAsync(title);
}

export default {
    loadWatchtime,
    saveWatchtime,
}