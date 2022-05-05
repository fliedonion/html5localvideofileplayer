'use strict'

const isIndexedDBSupport = () => {
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return false;
  }
  return true;
}

let db;

const dbName = "video-watchtimedb";
const storeName = "watchtime"
const storeKeyPathTitle = "title"
const uniqueIndexName = "title"

const openDbAsync = async (dbName, version) => {
  return new Promise((res, rej) => {
    const DBOpenRequest = window.indexedDB.open(dbName, version);

    DBOpenRequest.onerror = function(event) {
      db = null;
      rej(event)
    };

    DBOpenRequest.onsuccess = function() {
      console.log(`Database ${dbName} initialized.`);
      db = DBOpenRequest.result;

      getAllKeysAsync().then(keys => {
        console.debug("watchtime-keys", keys)
      })

      res(db)
    };

    DBOpenRequest.onupgradeneeded = dbUpgradeNeeded;
  })
}

const dbUpgradeNeeded = (event) => {
  // not only upgrade but also initialize.
  const upgDb = event.target.result; 

  upgDb.onerror = function(event) {
    console.error(`<li>Error loading ${dbName} database.</li>`);
  };

  let objectStore = undefined;
  if (!upgDb.objectStoreNames.contains(storeName)) {
    // Create an objectStore for this database
    //   like ...  create table "storeName" ( "keyPath" primary key )
    objectStore = upgDb.createObjectStore(storeName, { keyPath: storeKeyPathTitle });
    // define what data items the objectStore will contain
    objectStore.createIndex("title", storeKeyPathTitle, { unique: true });
  
  } else {
    // https://stackoverflow.com/a/36025624/2513010
    const tx = event.target.transaction;
    // console.log(tx.objectStore(storeName))
    objectStore = tx.objectStore(storeName)
  }

  if (event.oldVersion < 2) {
    // https://stackoverflow.com/a/44007456/2513010
    // Do Update
  }
}

const getAllKeysAsync = () => {
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName)
    const store = tx.objectStore(storeName)
    const index = store.index(uniqueIndexName)

    const req = index.getAllKeys()
    req.onsuccess = () => {
      res(req.result)
      return;
    }

    req.onerror = () => rej(req.error)
  })
}

if (isIndexedDBSupport()){
  await openDbAsync(dbName, 1)
}


const _findOneToCheckExists = (idbIndex, searchValue) => {
  // like...     where idbIndex = searchValue
  // idbIndex is unique key.

  return new Promise((res, rej) => {
    const openCursor = idbIndex.openCursor(searchValue)

    openCursor.onerror = event => {
      rej(event)
    }
    openCursor.onsuccess = event => {
      // note: This event called not only first time but also every cursor.continue;
  
      const cursor = event.target.result;
      if (!cursor) {
        // console.debug('may by not found')
        // Add item only if missing.
        res({found: false, key: null, value: null })
        return
      }
  
      // console.debug("may be found exit with nothing.", cursor.key);
      // cursor.continue(); // not continue this time.
      res({found: true, key: cursor.key, value: {...cursor.value} })
      return
    }
  })
}


const loadWatchtimeItemAsync = (title) => {
  const item = { title };
  return loadItemPromise(db, item, uniqueIndexName)
}

const loadItemPromise = (db, item, indexName) => {
  return new Promise((res, rej)=> {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)

    // Read first to avoid Already Exists error.
    const indexKeyPath = index.keyPath;

    // `indexKeyPath` looks like... column names (of unique index) in rdb.
    // `extractKeyPathValueArray` looks like... get column values of unique index columns.
    const keyPathValueArray = extractKeyPathValueArray(indexKeyPath, item)
    
    _findOneToCheckExists(index, keyPathValueArray)
      .then(v => {
        if (v.found) {
          res(v.value)
        }
        res(undefined)
      })
      .catch(e => {
        rej(e)
      })
  })
}



const saveWatchtimeItemAsync = (title, currentTime, updateDate) => {
  const item = { title, currentTime, updateDate };
  return saveItemPromise(db, item, uniqueIndexName)
}

// upsert
const saveItemPromise = (db, item, indexName) => {
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

    const putItem = (updateItem) => {
      // store item to objectStore.
      const objectStoreRequest = store.put(updateItem);
      objectStoreRequest.onsuccess = onsuccess
      objectStoreRequest.onerror = onerror
    }
    // Read first to avoid Already Exists error.
    const indexKeyPath = index.keyPath;
    const keyPathValueArray = extractKeyPathValueArray(indexKeyPath, item)
    
    _findOneToCheckExists(index, keyPathValueArray)
      .then(v => {
        if (v.found){
          // putはなければ追加されるので、常にputでも良いのかもしれない。
          putItem(item)
        } else {
          addItem();
        }
      })
      .catch(e => {
        rej(e)
      })
  })
}


// util
const extractKeyPathValueArray = (keyPath, item) => {
  // ex: item = {"key1": "value", "key2": "val2", "key3": "val3"}
  //     keyPath = ["key1", "key2"]
  //   then 
  //     return [ item["key1"], item["key2"] ]

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

  if (!Array.isArray(keyPath)) {
    return result[0];
  }
  return result;
};



export default {
  isIndexedDBSupport, 
  loadWatchtimeItemAsync,
  saveWatchtimeItemAsync,
}