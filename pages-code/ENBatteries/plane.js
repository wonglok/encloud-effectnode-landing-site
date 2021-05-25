import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneBufferGeometry,
} from "three";

export const title = "plane";

export const effect = async (node) => {
  let scene = await node.ready.scene;
  let camera = await node.ready.camera;
  let renderer = await node.ready.gl;
  let raycaster = await node.ready.raycaster;
  let mouse = await node.ready.mouse;

  let mat = new MeshStandardMaterial({
    color: new Color("#ffffff"),
    metalness: 1.0,
    roughness: 0.4,
    transparent: true,
    opacity: 0.5,
    side: DoubleSide,
  });

  node.pickers.appSettings.color1.stream((value) => {
    mat.color.setStyle(value); //.offsetHSL(0.1, 0, 0);
  });

  let geo = new PlaneBufferGeometry(3, 3);
  geo.rotateX(-Math.PI * 0.35);

  let mesh = new Mesh(geo, mat);

  scene.add(mesh);
  node.onClean(() => {
    scene.remove(mesh);
  });

  node.onLoop(() => {
    raycaster.setFromCamera(mouse, camera);
    let items = raycaster.intersectObject(mesh);

    if (items.length > 0) {
      //
      node.out0.pulse({
        point: items[0].point,
      });
    }
  });
};

//
//
//
