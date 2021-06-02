import { FolderName } from ".";
import { Text } from "troika-three-text";
import { Color, MeshStandardMaterial } from "three";

export const title = FolderName + ".welcome";

export const effect = async (node) => {
  let scene = await node.ready.scene;
  let camera = await node.ready.camera;
  let AvatarHead = await node.ready.AvatarHead;
  let RainbowEnvMap = await node.ready.RainbowEnvMap;

  let welcome = new Text();

  welcome.text = "Welcome to Effect Node!";

  welcome.letterSpacing = 0.04;

  welcome.material.envMap = RainbowEnvMap;

  welcome.material.texture = welcome.textAlign = "center";
  welcome.anchorX = "center";
  welcome.anchorY = "middle";
  welcome.fontSize = 0.2;
  welcome.font =
    "https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff";

  node.onLoop(() => {
    AvatarHead.getWorldPosition(welcome.position);
    welcome.position.y = 2.2;
    welcome.lookAt(camera.position);
  });

  scene.add(welcome);
  node.onClean(() => {
    scene.remove(welcome);
    welcome.dispose();
  });
};
