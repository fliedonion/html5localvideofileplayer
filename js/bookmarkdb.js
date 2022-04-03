'use strict'

const isIndexedDBSupport = () => {
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return false;
  }
  return true;
}

let db;

// undefined : not initialized
// resolve even if db can't open.
let dbOpenPromise;

const dbName = "video-bookmarks";
const storeName = "notes"
const storeKeyPathTitleWithTime = ["title", "time"]
const storeKeyPathTitle = "title"

const uniqueIndexName = "titleAndTime"

// note: 複合キーの範囲はSQL的でないので注意
//       key range: [3, 3], [5, 5]  は [4,0]や[4,6]を含む。 
//         so does NOT mean (3 < col1 < 5) and (4 < col2 < 5)
//         you need imagine comparison will work somthing like following:
//               33 < (col1 * 10 + col2) < 55
//            or "3:3" < (col1 + ":" + col2) < "5:5"
//         See spec to understand correctlly. https://w3c.github.io/IndexedDB/#key-construct


const timeoutAsync = (timeout, key) => {
  return new Promise((res, rej) => {
    setTimeout(()=>{
      if (key !== undefined){
        res(key)
      } else {
        res();
      }
    }, timeout)
  })
}



if (isIndexedDBSupport()){

  // Let us open our database
  const DBOpenRequest = window.indexedDB.open(dbName, 1);

  // these event handlers act on the database being opened.
  DBOpenRequest.onerror = function(event) {
    console.error('<li>Error loading database.</li>');
    console.error(event);
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
    if (!upgDb.objectStoreNames.contains(storeName)) {
      // Create an objectStore for this database
      objectStore = upgDb.createObjectStore(storeName, { keyPath: storeKeyPathTitleWithTime });
      // define what data items the objectStore will contain
      objectStore.createIndex("title", storeKeyPathTitle, { unique: false });
      objectStore.createIndex(uniqueIndexName, storeKeyPathTitleWithTime, { unique: true });
    } else {
      // https://stackoverflow.com/a/36025624/2513010
      const tx = event.target.transaction;
      console.log(tx.objectStore(storeName))
      objectStore = tx.objectStore(storeName)
    }
    if (event.oldVersion < 2) {
      // https://stackoverflow.com/a/44007456/2513010
      // Do Update
    }
  };
}


const onSuccess = event => {
  console.log('success ', event)
}
const onError = event => {
  console.error('error ', event)
}


const extractKeyPathValueArray = (keyPath, item) => {
  if (keyPath == "") return null;

  const workKeyPath = []
  if (Array.isArray(keyPath)) {
    workKeyPath.push(...keyPath)
  } else {
    workKeyPath.push(keyPath)
  }

  const result = [];
  workKeyPath.forEach((nortation) => {
    // nortation can be "key1.childkey1"
    // console.log(`%c nortation: ${nortation}`,  'color: blue')
    result.push(nortation.split('.').reduce((o,ind) => o[ind], item))
  })
  return result;
};

const _findOneToCheckExists = (idbINdex, keyPathValueArray) => {
  return new Promise((res, rej) => {
    const openCursor = idbINdex.openCursor(keyPathValueArray)

    openCursor.onerror = event => {
      rej(event)
    }
    openCursor.onsuccess = event => {
      // note: This event called not only first time but also every cursor.continue;
  
      const cursor = event.target.result;
      if (!cursor) {
        // console.debug('may by not found')
        // Add item only if missing.
        res({found: false, value: null })
        return
      }
  
      // console.debug("may be found exit with nothing.", cursor.key);
      // cursor.continue(); // not continue this time.
      res({found: true, value: {...cursor.key.value} })
      return
    }
  })
}

const addItemPromise = (db, item, indexName) => {
  return new Promise((res, rej)=> {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)

    const onsuccess = event => {
      res(event)
    }
    const onerror = event => {
      rej(event)
    }

    const addItem = () => {
      // store item to objectStore.
      const objectStoreRequest = store.add(item);
      objectStoreRequest.onsuccess = onsuccess
      objectStoreRequest.onerror = onerror
    }

    // Read first to avoid Already Exists error.
    const indexKeyPath = index.keyPath;
    const keyPathValueArray = extractKeyPathValueArray(indexKeyPath, item)
    
    const openCursor = index.openCursor(keyPathValueArray)
    _findOneToCheckExists(index, keyPathValueArray)
      .then(v => {
        if (v.found){
          console.log(v.value)
        } else {
          addItem();
        }
      })
      .catch(e => {
        rej(e)
      })
  })
}



// example to use Promise Version
const testDbAddItem2 = async () => {
  const TESTKEY = ["test-promise", 101];
  const newItem = {title: TESTKEY[0], time: TESTKEY[1], note: "This is a promise test"};

  try{
    await addItemPromise(db, newItem, uniqueIndexName)
  } catch(err) {
    console.log(err);
  }
}

// example or referrence
const TESTKEY = ["test", 101]
const testDbAddItem = () => {
  const newItem = {title: TESTKEY[0], time: TESTKEY[1], note: "This is a test"};


  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)
  const index = store.index("titleAndTime")
  const indexKeyPath = index.keyPath;

  // report on the success of opening the transaction
  tx.oncomplete = onSuccess
  tx.onerror = onError


  const addItem = () => {
    // add our newItem object to the object store
    const objectStoreRequest = store.add();
    objectStoreRequest.onsuccess = onSuccess    
  }


  // Read first to avoid Already Exists error.
  const keyPathValueArray = extractKeyPathValueArray(indexKeyPath, newItem)
  console.log(TESTKEY, keyPathValueArray)


  const openCursor = index.openCursor(IDBKeyRange.only(keyPathValueArray))
  openCursor.onsuccess = event => {
    // note: This event called not only first time but also every cursor.continue;

    const cursor = event.target.result;
    if (!cursor) {
      console.log('may by not found')
      // Add item only if missing.
      addItem();
      return;
    }

    console.log("may be found exit with nothing.", cursor.key);
    // cursor.continue(); // not continue this time.
    return;
  }

  // // add our newItem object to the object store
  // const objectStoreRequest = store.add({title: "test", time: 100, note: "This is a test"});
  // objectStoreRequest.onsuccess = onSuccess
}

// example or referrence
const testDbReadItems = () => {
  const tx = db.transaction(storeName)
  const store = tx.objectStore(storeName)
  const index = store.index(uniqueIndexName)
  
  const openCursor = index.openCursor(IDBKeyRange.bound(["test", 0], ["test", Number.MAX_VALUE]))
  openCursor.onsuccess = event => {
    const cursor = event.target.result;
    if (!cursor) {
      return;
    }
    console.log(cursor.key, cursor.value)
    cursor.continue();
  }

  const openCursor2 = index.openCursor(IDBKeyRange.bound(["test-promise", 0], ["test-promise", Number.MAX_VALUE]))
  openCursor2.onsuccess = event => {
    const cursor = event.target.result;
    if (!cursor) {
      return;
    }

    console.log(cursor.key, cursor.value)
    cursor.continue();
  }  
}

export {isIndexedDBSupport, testDbAddItem, testDbReadItems, testDbAddItem2, timeoutAsync}