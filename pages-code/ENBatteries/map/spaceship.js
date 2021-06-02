import {
  Box3,
  Color,
  DoubleSide,
  MeshMatcapMaterial,
  MeshStandardMaterial,
  TextureLoader,
  Vector3,
} from "three";
import { FBXLoader } from "three-stdlib";
import { FolderName } from ".";
import { download } from "../../Utils";

export const title = FolderName + ".spaceship";

export const effect = async (node) => {
  let ReadyGroup = await node.ready.ReadyGroup;

  let fbx = await download(FBXLoader, "/map/spaceship-walk.fbx");
  let silverMatCapTexture = await download(TextureLoader, "/matcap/silver.png");

  let envMap = await node.ready.RainbowEnvMap;

  // node.ready.RainbowEnvMap.then((envMap) => {
  //   item.material.envMap = envMap;
  // });

  let model = fbx;
  let silver = new MeshMatcapMaterial({
    matcap: silverMatCapTexture,
    color: new Color("ffffff"),
  });

  let spaceScale = 3.0;

  model.scale.set(0.01 * spaceScale, 0.01 * spaceScale, 0.01 * spaceScale);
  model.traverse((item) => {
    if (item.isMesh) {
      item.geometry.computeBoundingBox();

      // console.log(item)
      // item.material.envMap = ;
      // 20 , 15, 10
      // foot walker
      if (item.name === "Mesh020") {
        item.material = new MeshStandardMaterial({
          envMap: envMap,
          metalness: 1,
          roughness: 0,
        });
      }
      if (item.name === "Mesh015") {
        item.material = new MeshStandardMaterial({
          envMap: envMap,
          metalness: 1,
          roughness: 0,
        });
      }
      if (item.name === "Mesh010") {
        item.material = new MeshStandardMaterial({
          envMap: envMap,
          metalness: 1,
          roughness: 0,
        });
      }

      // pipes
      if (item.name === "Mesh019") {
        item.material = new MeshStandardMaterial({
          envMap: envMap,
          metalness: 1,
          roughness: 0,
        });
      }
      if (item.name === "Mesh016") {
        item.material = new MeshStandardMaterial({
          envMap: envMap,
          metalness: 1,
          roughness: 0,
        });
      }
      if (item.name === "Mesh003") {
        item.material = new MeshStandardMaterial({
          envMap: envMap,
          metalness: 1,
          roughness: 0,
        });
      }

      // walls
      if (item.name === "Mesh018") {
        item.material = silver;
      }
      if (item.name === "Mesh017") {
        item.material = silver;
      }
      if (item.name === "Mesh013") {
        item.material = silver;
      }
      item.material.side = DoubleSide;
    }
  });

  const box = new Box3();
  box.setFromObject(model);

  const size = new Vector3().copy(box.max).sub(box.min);
  model.position.y = size.y / 2 - 1.475 * spaceScale;

  console.log(box);

  ReadyGroup.add(model);
  node.onClean(() => {
    ReadyGroup.remove(model);
  });
};
