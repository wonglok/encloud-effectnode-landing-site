import { FolderName } from ".";
import { DoubleSide, Sprite, SpriteMaterial, TextureLoader } from "three";
import { download } from "../../Utils";
import { enableBloom } from "../../Bloomer/Bloomer";
import { InteractionManager } from "three.interactive";

export const title = FolderName + ".logo";

class LokLokSprite {
  constructor({ node }) {
    this.node = node;
    this.wait = this.setup({ node });
  }
  async setup({ node }) {
    let camera = await node.ready.camera;
    let renderer = await node.ready.gl;
    let viewport = await node.ready.viewport;

    const interactionManager = new InteractionManager(
      renderer,
      camera,
      renderer.domElement
    );
    node.onLoop(() => {
      interactionManager.update();
    });

    let texture = await download(TextureLoader, "/texture/en2-white.png");
    const material = new SpriteMaterial({
      map: texture,
      side: DoubleSide,
      depthTest: false,
      transparent: true,
      opacity: 0.7,
    });

    let sprite = new Sprite(material);
    enableBloom(sprite);

    interactionManager.add(sprite);

    sprite.center.set(0, 1);

    node.onLoop((dt, st) => {
      let vp = viewport.getCurrentViewport();
      let vmax = Math.max(vp.width, vp.height);
      if (vmax >= 5) {
        vmax = 5;
      }
      sprite.dt = sprite.dt || 0;
      sprite.dt += dt;
      sprite.position.x = -vp.width + vmax * 0.03;
      sprite.position.y = vp.height - vmax * 0.03;
      sprite.position.z = -vp.distance * 2;

      sprite.rotation.z += 2;

      let aspect = texture.image.width / texture.image.height;

      sprite.scale.set(vmax * 0.12 * aspect, vmax * 0.12, 1);
    });

    // sprite.scale.set(material.map.image.width, material.map.image.height, 1);
    sprite.frustumCulled = false;

    sprite.addEventListener("click", () => {
      node.events.emit("click-logo", { type: "logo" });
    });

    sprite.addEventListener("mouseover", () => {
      document.body.style.cursor = "pointer";
    });
    sprite.addEventListener("mouseout", () => {
      document.body.style.cursor = "";
    });

    camera.add(sprite);
    node.onClean(() => {
      camera.remove(sprite);
    });
  }
}

export const effect = async (node) => {
  new LokLokSprite({ node });
};
