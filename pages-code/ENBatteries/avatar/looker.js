import { OrbitControls } from "three-stdlib";
import { FolderName } from ".";

export const title = FolderName + ".looker";

export const effect = async (node) => {
  let renderer = await node.ready.gl;
  let camera = await node.ready.camera;
  let AvatarHead = await node.ready.AvatarHead;

  let controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  AvatarHead.getWorldPosition(controls.target);
  controls.object.position.y = controls.target.y + 0.12;
  controls.object.position.z = controls.target.z + 3;

  node.onLoop(() => {
    controls.update();
  });
  node.onClean(() => {
    controls.dispose();
  });

  camera.near = 0.01;
  camera.far = 100000;
  camera.updateProjectionMatrix();
};
