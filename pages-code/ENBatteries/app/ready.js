import { Color, Object3D, TextureLoader } from "three";
import SpriteText from "three-spritetext";
import { FBXLoader } from "three-stdlib";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FolderName } from ".";
import { download } from "../../Utils";
import { ShaderCubeChrome } from "../../Shaders/ShaderCubeChrome";

export const title = `${FolderName}.ready`;

let preload = (afterwards) => {
  download(FBXLoader, "/map/spaceship-walk.fbx").then(afterwards);
  download(TextureLoader, "/matcap/silver.png").then(afterwards);
  download(GLTFLoader, "/ppl/lok-5.glb").then(afterwards);
  download(FBXLoader, "/actions/greetings/waving-2.fbx").then(afterwards);
  download(TextureLoader, "/texture/eNeNeN-white.png").then(afterwards);
};

preload(() => {});

export const effect = async (node) => {
  let scene = await node.ready.scene;
  let renderer = await node.ready.gl;
  let o3d = new Object3D();
  o3d.visible = false;
  scene.add(o3d);

  node.env.set("ReadyGroup", o3d);

  // let loader = new Mesh(new MeshBasicMaterial({  color: 'red' }))
  let loader = new Object3D();
  loader.visible = true;

  var sprite = new SpriteText("Loading...");
  loader.scale.set(0.03, 0.03, 0.03);
  loader.add(sprite);

  let total = 6;
  let now = 0;
  let progress = () => {
    now++;
    sprite.text = `Loading... ${now}/${total}`;

    if (now === total) {
      node.env.set("PreloadDone", true);
    }
  };

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
  progress();

  //
  // preload
  preload(progress);

  scene.add(loader);
  node.onClean(() => {
    scene.remove(loader);
  });

  node.env
    .get("PreloadDone")
    .then(() => {
      loader.visible = false;
      return node.env.get("CameraAdjusted");
    })
    .then(() => {
      o3d.visible = true;
    });
};

//
//