import { AnimationMixer, FileLoader, MathUtils } from "three";
import { FBXLoader } from "three-stdlib";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FolderName } from ".";
import { enableDarken, enableBloom } from "../../Bloomer/Bloomer";
import { download } from "../../Utils";

export const title = FolderName + ".character";

let playFaceData = ({ onFrame = () => {}, loop = false }) => {
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
        onFrame(has);
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
  let ReadyGroup = await node.ready.ReadyGroup;

  let mixer = new AnimationMixer();

  node.onLoop((t, dt) => {
    mixer.update(dt);
  });

  let fbx = {};

  let avatarURL = "/ppl/lok-white-armor.glb";
  if (node.userData.customAvatarURL) {
    avatarURL = await node.userData.customAvatarURL;
  }

  let gltf = await download(GLTFLoader, avatarURL);

  let grettingsURL = "/actions/greetings/hiphop2.fbx";

  if (node.userData.greetingsActionURL) {
    grettingsURL = node.userData.greetingsActionURL;
  }
  fbx.waveHand = await download(FBXLoader, grettingsURL);

  let model = gltf.scene;
  model.scale.set(1, 1, 1);
  model.traverse((item) => {
    //
    if (item && item.geometry) {
      item.frustumCulled = false;
    }

    //
    if (item && item.material) {
      if (
        [
          "Wolf3D_Outfit_Footwear",
          "Wolf3D_Outfit_Top",
          "Wolf3D_Outfit_Bottom",
        ].includes(item.name)
      ) {
        // enableBloom(item);
        enableDarken(item);
      } else {
        enableDarken(item);
      }

      if (
        [
          "Wolf3D_Glasses",
          "Wolf3D_Hair",
          "Wolf3D_Outfit_Top",
          "Wolf3D_Outfit_Footwear",
          "Wolf3D_Outfit_Bottom",
        ].includes(item.name)
      ) {
        node.ready.RainbowEnvMap.then((envMap) => {
          item.material.roughness = 0.0;
          item.material.metalness = 1.0;
          item.material.envMapIntensity = 3.5;
          item.material.envMap = envMap;
        });
      }
    }

    if (item && item.morphTargetDictionary) {
      const obj = {};
      playFaceData({
        onFrame: (object) => {
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
  let last = waveHand;
  let idx = 0;
  let acts = [
    { msg: `Let me do a backflip!`, fbx: "/actions/greetings/backflip.fbx" },
    // { msg: `Welcome dear!`, fbx: "/actions/greetings/bow-informal.fbx" },
    {
      msg: `EffectNode can make avatar dance too.`,
      fbx: "/actions/greetings/hiphop.fbx",
    },
    // {
    //   msg: `EffectNode can make more dance moves.`,
    //   fbx: "/actions/greetings/hiphop2.fbx",
    // },
    // {
    //   msg: `EffectNode respects your vision.`,
    //   fbx: "/actions/greetings/salute.fbx",
    // },
    {
      msg: `EffectNode is battle tested, ready for production.`,
      fbx: "/actions/greetings/warmup.fbx",
    },
    {
      msg: `EffectNode is working on face capture for avatars.`,
      fbx: "/actions/greetings/singing.fbx",
    },
    // { msg: `Hi!`, fbx: "/actions/greetings/waving-1.fbx" },
    // { msg: `Hello`, fbx: "/actions/greetings/waving-2.fbx" },
    // { msg: `Welcome!`, fbx: "/actions/greetings/waving-3.fbx" },
    { msg: `Thank you for coming.`, fbx: "/actions/greetings/waving-4.fbx" },
  ];

  node.events.on("click-logo", (ev) => {
    let act = acts[idx % acts.length];

    let actURL = act.fbx;
    if (ev && ev.type === "ring") {
      actURL = "/actions/greetings/salute.fbx";
    } else {
      node.events.emit("cta-text", { text: act.msg });
      idx++;
    }

    download(FBXLoader, actURL).then((fbx) => {
      let action = mixer.clipAction(fbx.animations[0], model);
      requestAnimationFrame(() => {
        if (last) {
          last.fadeOut(0.5);
        }
        action.reset();
        action.play();
        last = action;
      });
    });
  });

  // Share avatar
  let Head = model.getObjectByName("Head");
  node.env.set("AvatarHead", Head);

  //
  let Hips = model.getObjectByName("Hips");
  node.env.set("AvatarHips", Hips);

  //
  let RightHand = model.getObjectByName("RightHand");
  node.env.set("AvatarRightHand", RightHand);

  //
  let LefttHand = model.getObjectByName("LefttHand");
  node.env.set("AvatarLefttHand", LefttHand);

  //
  ReadyGroup.add(model);
  node.onClean(() => {
    ReadyGroup.remove(model);
  });
};
