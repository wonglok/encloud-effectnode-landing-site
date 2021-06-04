import { Color, Object3D, TextureLoader } from "three";
import SpriteText from "three-spritetext";
import { FBXLoader } from "three-stdlib";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FolderName } from ".";
import { download } from "../../Utils";
import { ShaderCubeChrome } from "../../Shaders/ShaderCubeChrome";

export const title = `${FolderName}.ready`;

export const effect = async (node) => {
  let camera = await node.ready.camera;
  let scene = await node.ready.scene;
  let renderer = await node.ready.gl;
  let o3d = new Object3D();
  o3d.visible = false;
  scene.add(o3d);

  node.env.set("ReadyGroup", o3d);

  let rainbow = new ShaderCubeChrome({
    renderer,
    res: 1024,
    color: new Color("#ffffff"),
  });
  node.env.set("RainbowEnvMap", rainbow.out.envMap);
  node.env.set("RainbowTexture", rainbow.out.texture);

  node.onLoop((st, dt) => {
    rainbow.compute({ time: st / 2 });
  });

  // isGUI
  node.env
    .get("PreloadDone")
    .then(() => {
      return node.env.get("CameraAdjusted");
    })
    .then(() => {
      o3d.visible = true;
    });
};

//
