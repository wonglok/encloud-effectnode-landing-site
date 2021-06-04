import {
  Color,
  CylinderBufferGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  TextureLoader,
} from "three";
import { FolderName } from ".";
import { enableBloom } from "../../Bloomer/Bloomer";
import { download } from "../../Utils";
import { InteractionManager } from "three.interactive";

export const title = FolderName + ".ring";

export const effect = async (node) => {
  let AvatarHips = await node.ready.AvatarHips;
  let camera = await node.ready.camera;
  let renderer = await node.ready.gl;

  const interactionManager = new InteractionManager(
    renderer,
    camera,
    renderer.domElement
  );
  node.onLoop(() => {
    interactionManager.update();
  });

  let scale = 0.25;
  let ring = new CylinderBufferGeometry(
    5 * scale,
    5 * scale,
    1.3 * scale,
    32,
    1,
    true
  );

  let mat = new MeshStandardMaterial({
    //
    side: DoubleSide,
    //
    color: new Color("#555555"),

    transparent: true,

    metalness: 1,
    roughness: 0,

    map: await download(
      TextureLoader,
      node.userData.ringURL || "/texture/eNeNeN-white.png"
    ),
  });

  node.ready.RainbowEnvMap.then((tt) => {
    mat.envMap = tt;
  });

  let mesh = new Mesh(ring, mat);
  enableBloom(mesh);

  interactionManager.add(mesh);
  node.onClean(() => {
    interactionManager.remove(mesh);
  });

  mesh.addEventListener("mouseover", (event) => {
    document.body.style.cursor = "pointer";
    node.events.emit("click-logo", { type: "ring" });
    node.events.emit("cta-text", { type: "ring" });
  });
  mesh.addEventListener("mouseout", (event) => {
    document.body.style.cursor = "";
  });

  node.onLoop((et, dt) => {
    mesh.rotation.y += dt;
  });

  AvatarHips.add(mesh);
  node.onClean(() => {
    AvatarHips.remove(mesh);
  });
};
