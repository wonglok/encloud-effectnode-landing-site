import {
  Color,
  CylinderBufferGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  TextureLoader,
  Vector2,
  Vector3,
} from "three";
import { FolderName } from ".";
import { enableBloom } from "../../Bloomer/Bloomer";
import { download } from "../../Utils";
import { InteractionManager } from "three.interactive";
import anime from "animejs";
export const title = FolderName + ".ring";

export const effect = async (node) => {
  let AvatarHips = await node.ready.AvatarHips;
  let AvaRightHand = await node.ready.AvaRightHand;
  let AvaLeftHand = await node.ready.AvaLeftHand;
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
    anime({
      targets: [mesh.rotation],
      y: mesh.rotation.y - Math.PI * 0.5,
      duration: 5000,
    });
  });

  node.events.on("ring-expand", ({ duration }) => {
    // anime({
    //   targets: [mesh.scale],
    //   x: 0.3,
    //   y: 0.3,
    //   z: 0.3,
    //   duration: 2000,
    // }).finished.then(() => {
    //   return anime({
    //     targets: [mesh.scale],
    //     x: 1,
    //     y: 1,
    //     z: 1,
    //     duration: 2000,
    //   }).finished;
    // });

    //

    let active = true;

    let left = new Vector3();
    let right = new Vector3();
    let v1 = new Vector3(1, 1, 1);
    let dist = 2.5700293285455326;
    node.onLoop(() => {
      if (active === true) {
        AvaLeftHand.getWorldPosition(left);
        AvaRightHand.getWorldPosition(right);

        let dist2 = left.distanceTo(right);

        let s = dist2 / dist;
        mesh.scale.set(s * 3.0, s * 3.0, s * 3.0);
      } else if (active === "fade out") {
        mesh.scale.lerp(v1, 0.1);
      } else if (active === false) {
      }
    });
    setTimeout(() => {
      active = "fade out";

      setTimeout(() => {
        active = false;
      }, 1000);
    }, duration * 1000);
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

//

//
