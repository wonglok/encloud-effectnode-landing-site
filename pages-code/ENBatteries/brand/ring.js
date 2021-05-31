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
import { download } from "../../Utils";

export const title = FolderName + ".ring";

export const effect = async (node) => {
  let AvatarHips = await node.ready.AvatarHips;

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

  node.onLoop((et, dt) => {
    mesh.rotation.y += dt;
  });

  AvatarHips.add(mesh);
  node.onClean(() => {
    AvatarHips.remove(mesh);
  });
};
