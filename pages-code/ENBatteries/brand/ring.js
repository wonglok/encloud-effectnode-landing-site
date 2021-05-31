import { AdditiveBlending, SubtractiveBlending } from "three";
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

export const title = FolderName + ".ring";

// preload
let effectNodeStrip = new TextureLoader().load("/texture/eNeNeN-white.png");

export const effect = async (node) => {
  let AvatarHips = await node.ready.AvatarHips;

  let scale = 0.2;
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
    color: new Color("#ffffff"),

    transparent: true,
    map: effectNodeStrip,
  });

  let mesh = new Mesh(ring, mat);
  enableBloom(mesh);

  node.onLoop((et, dt) => {
    mesh.rotation.y += dt;
  });

  AvatarHips.add(mesh);
  node.onClean(() => {
    AvatarHips.remove(mesh);
  });
};
