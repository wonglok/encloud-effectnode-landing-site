import { Vector3 } from "three";
import { OrbitControls } from "three-stdlib";
import { FolderName } from ".";

export const title = FolderName + ".looker";

export const effect = async (node) => {
  let renderer = await node.ready.gl;
  let scene = await node.ready.scene;
  let camera = await node.ready.camera;
  let AvatarHead = await node.ready.AvatarHead;
  await node.ready.PreloadDone;

  let controls = new OrbitControls(camera, renderer.domElement);
  //
  // renderer.domElement.addEventListener(
  //   "touchstart",
  //   (e) => {
  //     e.preventDefault();
  //   },
  //   { passive: false }
  // );
  // //
  // renderer.domElement.addEventListener(
  //   "touchmove",
  //   (e) => {
  //     e.preventDefault();
  //   },
  //   {
  //     passive: false,
  //   }
  // );

  //
  controls.enableDamping = true;
  controls.rotateSpeed = 1;

  AvatarHead.getWorldPosition(controls.target);
  camera.position.y = controls.target.y + 0.12;
  camera.position.z = controls.target.z + 3;

  controls.enabled = false;

  let controlTarget = new Vector3();
  node.onLoop(() => {
    if (controls.disposed____) {
      return;
    }

    AvatarHead.getWorldPosition(controlTarget);
    controls.target.lerp(controlTarget, 0.05);
    controls.update();
  });

  node.onClean(() => {
    controls.disposed____ = true;
    controls.dispose();
    controls.enabled = false;
  });

  camera.near = 0.01;
  camera.far = 100000;
  camera.updateProjectionMatrix();
  scene.add(camera);

  node.env.set("CameraAdjusted", true);
};
