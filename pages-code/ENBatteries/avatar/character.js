import { AnimationMixer, FileLoader, MathUtils } from "three";
import { FBXLoader } from "three-stdlib";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FolderName } from ".";
import { enableBloom } from "../../Bloomer/Bloomer";

export const title = FolderName + ".character";

let download = async (classRef, url) => {
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

/*

  const obj = {};
  playFaceData({
    onFaceData: (object) => {

      for (let kn in object) {
        obj[kn] = object[kn];
      }

      processFace({ mesh: item, object: obj, lerp: 0.2 });
    },
    loop: true,
  });

*/

let playFaceData = ({ onFaceData = () => {}, loop = false }) => {
  new FileLoader().load("/facedata/eye.json-line", (file) => {
    let data = [];
    file.split("\n").forEach((e) => {
      try {
        let json = JSON.parse(e);
        if (json) {
          data.push(json);
        }
      } catch (e) {}
    });

    let restore = data.slice();
    let send = () => {
      let has = data.pop();
      if (!has) {
        if (loop) {
          data = restore.slice();
          setTimeout(send, 1000 / 120);
        }
      } else {
        onFaceData(has);
        setTimeout(send, 1000 / 120);
      }
    };
    send();
  });
};

let processFace = ({ mesh, object, lerp = 0.2 }) => {
  let namefixed = JSON.parse(JSON.stringify(object));
  Object.keys(namefixed).forEach((kn) => {
    if (kn.indexOf("_L") !== -1) {
      namefixed[kn.replace("_L", "Left")] = namefixed[kn];
      delete namefixed[kn];
    }
    if (kn.indexOf("_R") !== -1) {
      namefixed[kn.replace("_R", "Right")] = namefixed[kn];
      delete namefixed[kn];
    }
  });

  for (let kn in mesh.morphTargetDictionary) {
    let idx = mesh.morphTargetDictionary[kn];
    mesh.morphTargetInfluences[idx] = MathUtils.lerp(
      mesh.morphTargetInfluences[idx],
      namefixed[kn],
      lerp
    );
  }
};

export const effect = async (node) => {
  let scene = await node.ready.scene;

  let mixer = new AnimationMixer();
  node.onLoop((t, dt) => {
    mixer.update(dt);
  });

  let fbx = {};
  let gltf = await download(GLTFLoader, "/ppl/lok-3.glb");
  fbx.waveHand = await download(FBXLoader, "/actions/greetings/waving-2.fbx");

  let model = gltf.scene;
  model.traverse((item) => {
    //
    if (item && item.geometry) {
      item.frustumCulled = false;
    }

    //
    if (item && item.material) {
      //
      // console.log(item.name);
      //
      if (
        [
          "EyeLeft",
          "EyeRight",
          "Wolf3D_Head",
          "Wolf3D_Hair",
          "Wolf3D_Body",
        ].includes(item.name)
      ) {
      } else {
        enableBloom(item);
      }
    }
    if (item && item.morphTargetDictionary) {
      const obj = {};
      playFaceData({
        onFaceData: (object) => {
          for (let kn in object) {
            obj[kn] = object[kn];
          }
          processFace({ mesh: item, object: obj, lerp: 0.2 });
        },
        loop: true,
      });
    }
  });

  let waveHand = mixer.clipAction(fbx.waveHand.animations[0], model);
  waveHand.play();

  // Share avatar
  let Head = model.getObjectByName("Head");
  node.env.set("AvatarHead", Head);
  let Hips = model.getObjectByName("Hips");
  node.env.set("AvatarHips", Hips);

  scene.add(model);
  node.onClean(() => {
    scene.remove(model);
  });
};
