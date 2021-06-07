import { FolderName } from ".";

export const title = `${FolderName}.cta`;

import { Text } from "troika-three-text";
// import {
//   Color,
//   DoubleSide,
//   Mesh,
//   MeshBasicMaterial,
//   MeshStandardMaterial,
//   SphereBufferGeometry,
//   Sprite,
//   SpriteMaterial,
//   TextureLoader,
// } from "three";

export const effect = async (node) => {
  let scene = await node.ready.scene;
  let camera = await node.ready.camera;
  let renderer = await node.ready.gl;
  let raycaster = await node.ready.raycaster;
  let mouse = await node.ready.mouse;
  let AvatarHead = await node.ready.AvatarHead;
  let RainbowEnvMap = await node.ready.RainbowEnvMap;
  let RainbowTexture = await node.ready.RainbowTexture;
  let welcome = new Text();
  welcome.text = "Hi! Welcome to EffectNode.";

  node.events.on("cta-text", (v) => {
    if (v?.text) {
      welcome.text = v?.text;
    }
  });

  welcome.letterSpacing = 0.05;
  welcome.material.map = RainbowTexture;
  RainbowTexture.repeat.set(0.25, 0.25);
  welcome.material.envMap = RainbowEnvMap;
  welcome.textAlign = "center";
  welcome.anchorX = "center";
  welcome.anchorY = "bottom";
  welcome.maxWidth = 3.5;
  welcome.fontSize = 0.2;
  // welcome.font =
  //   "https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff";

  welcome.font = `/font/Cronos-Pro-Light_12448.ttf`;
  welcome.frustumCulled = false;
  welcome.material.depthTest = false;
  welcome.scale.set(0.75, 0.75, 0.75);

  welcome.outlineWidth = 0.01;
  welcome.outlineColor = "white";

  node.onLoop(() => {
    // AvatarHead.getWorldPosition(welcome.position);
    // welcome.position.y = -0.9;

    welcome.position.y = 0.35;
    // welcome.position.z = -1.5;
    welcome.lookAt(camera.position);
  });

  AvatarHead.add(welcome);
  node.onClean(() => {
    AvatarHead.remove(welcome);
    welcome.dispose();
  });
  let onClick = () => {
    //
    //
    console.log(123);
  };
  let scan = (fnc = () => {}) => {
    raycaster.setFromCamera(mouse, camera);
    let result = raycaster.intersectObjects([welcome]);
    if (result && result[0]) {
      fnc(result[0]);
    }
  };
  let onClickRaw = () => {
    scan(onClick);
  };
  renderer.domElement.addEventListener("click", onClickRaw);
  node.onClean(() => {
    renderer.domElement.removeEventListener("click", onClickRaw);
  });
};

//
//
