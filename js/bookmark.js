'use strict'

const isIndexedDBSupport = () => {
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return false;
  }
  return true;
}

let db = undefined;
if (isIndexedDBSupport()){
  // Let us open our database
  const DBOpenRequest = window.indexedDB.open("toDoList", 7);

  // these event handlers act on the database being opened.
  DBOpenRequest.onerror = function(event) {
    console.error('<li>Error loading database.</li>');
  };

  DBOpenRequest.onsuccess = function(event) {
    console.log('<li>Database initialized.</li>');
    db = DBOpenRequest.result;
  };

  // This event handles the event whereby a new version of
  // the database needs to be created Either one has not
  // been created before, or a new version number has been
  // submitted via the window.indexedDB.open line above
  // it is only implemented in recent browsers
  DBOpenRequest.onupgradeneeded = function(event) {
    const upgDb = this.result; 

    upgDb.onerror = function(event) {
      console.error('<li>Error loading database.</li>');
    };

    let objectStore = undefined;
    if (!upgDb.objectStoreNames.contains('toDoList')) {
      // Create an objectStore for this database
      objectStore = upgDb.createObjectStore("toDoList", { keyPath: "taskTitle" });
      // define what data items the objectStore will contain
      objectStore.createIndex("hours", "hours", { unique: false });
      objectStore.createIndex("minutes", "minutes", { unique: false });
      objectStore.createIndex("day", "day", { unique: false });
      objectStore.createIndex("month", "month", { unique: false });
      objectStore.createIndex("year", "year", { unique: false });
      objectStore.createIndex("notified", "notified", { unique: false });
    } else {
      // https://stackoverflow.com/a/36025624/2513010
      const tx = event.target.transaction;
      console.log(tx.objectStore('toDoList'))
      objectStore = tx.objectStore('toDoList')
    }
    if (event.oldVersion < 2) {
      // https://stackoverflow.com/a/44007456/2513010
      // Do Update
    }
  };
}

const testDbIsModuleScope = () => {
  console.log(db);
}


export {isIndexedDBSupport, testDbIsModuleScope}