// let effectNodeStrip = new TextureLoader().load("/texture/eNeNeN-white.png");
export const download = async (classRef, url) => {
  let fnc = download;
  fnc.Cache = fnc.Cache || new Map();
  let myCache = fnc.Cache;
  return new Promise((resolve) => {
    if (myCache.has(url)) {
      resolve(myCache.get(url));
    } else {
      new classRef().load(url, (result) => {
        myCache.set(url, result);
        resolve(result);
      });
    }
  });
};
