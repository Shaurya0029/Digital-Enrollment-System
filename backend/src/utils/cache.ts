type CacheEntry = { value: any; expiresAt: number }

const store = new Map<string, CacheEntry>()

export function cacheGet(key: string){
  const e = store.get(key)
  if (!e) return null
  if (Date.now() > e.expiresAt) {
    store.delete(key)
    return null
  }
  return e.value
}

export function cacheSet(key: string, value: any, ttlSeconds = 60){
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

export function cacheDelete(key: string){
  store.delete(key)
}

export function cacheClear(){
  store.clear()
}
