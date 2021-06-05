import { FolderName } from ".";
import { GPUComputationRenderer } from "three-stdlib";
import {
  HalfFloatType,
  Vector3,
  BufferAttribute,
  CylinderBufferGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Vector2,
  RepeatWrapping,
  ShaderMaterial,
  Mesh,
  DataTexture,
  DataUtils,
  RGBFormat,
  PlaneBufferGeometry,
  MeshBasicMaterial,
} from "three";
import { Geometry } from "three/examples/jsm/deprecated/Geometry.js";

export const title = FolderName + ".wiggle";

class LokLokWiggleSimulation {
  constructor({ node }) {
    this.node = node;
    this.WIDTH = 64;
    this.HEIGHT = 1;
    this.COUNT = this.WIDTH * this.HEIGHT;
    this.wait = this.setup({ node });
  }
  async setup({ node }) {
    let renderer = await node.ready.gl;

    let gpu = (this.gpu = new GPUComputationRenderer(
      this.WIDTH,
      this.HEIGHT,
      renderer
    ));

    gpu.setDataType(HalfFloatType);

    const dtPosition = this.gpu.createTexture();
    const lookUpTexture = this.gpu.createTexture();
    this.fillPositionTexture(dtPosition);
    this.fillLookupTexture(lookUpTexture);

    this.positionVariable = this.gpu.addVariable(
      "texturePosition",
      this.positionShader(),
      dtPosition
    );
    this.gpu.setVariableDependencies(this.positionVariable, [
      this.positionVariable,
    ]);

    this.positionUniforms = this.positionVariable.material.uniforms;
    this.positionUniforms["lookup"] = { value: lookUpTexture };
    this.positionUniforms["mouse"] = { value: new Vector3(0, 0, 0) };
    this.positionUniforms["time"] = { value: 0 };
    dtPosition.wrapS = RepeatWrapping;
    dtPosition.wrapT = RepeatWrapping;

    //
    const error = this.gpu.init();
    if (error !== null) {
      console.error(error);
    }
  }

  positionShader() {
    return /* glsl */ `
      // uniform sampler2D texturePosition;
      uniform vec3 mouse;
      uniform sampler2D lookup;
      uniform float time;

			void main()	{
        // const float width = resolution.x;
        // const float height = resolution.y;
        // float xID = floor(gl_FragCoord.x);
        // float yID = floor(gl_FragCoord.y);

        vec2 uvCursor = vec2(gl_FragCoord.x, gl_FragCoord.y) / resolution.xy;
        vec4 positionHead = texture2D( texturePosition, uvCursor );

        vec4 idxInfo = texture2D(lookup, uvCursor);
        vec2 nextUV = idxInfo.xy;
        float currentIDX = floor(gl_FragCoord.x);

        if (floor(currentIDX) == 0.0) {
          gl_FragColor = vec4(mouse, 1.0);
        } else {
          vec3 positionChain = texture2D( texturePosition, nextUV ).xyz;
          gl_FragColor = vec4(positionChain, 1.0);
        }
			}
    `;
  }

  fillPositionTexture(texture) {
    let i = 0;
    const theArray = texture.image.data;

    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        theArray[i++] = 0.0;
        theArray[i++] = 0.0;
        theArray[i++] = 0.0;
        theArray[i++] = 0.0;
      }
    }
    texture.needsUpdate = true;
  }

  fillLookupTexture(texture) {
    let i = 0;
    const theArray = texture.image.data;
    let items = [];

    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        let lastOneInArray = items[items.length - 1] || [0, 0];
        theArray[i++] = lastOneInArray[0];
        theArray[i++] = lastOneInArray[1];
        theArray[i++] = 0.0;
        theArray[i++] = 0.0;
        items.push([x / this.WIDTH, y / this.HEIGHT]);
      }
    }
    texture.needsUpdate = true;
  }

  render({ mouse }) {
    this.positionUniforms["time"].value = window.performance.now() / 1000;

    this.positionUniforms["mouse"].value.copy(mouse);

    this.gpu.compute();
  }

  getTextureAfterCompute() {
    return {
      posTexture: this.gpu.getCurrentRenderTarget(this.positionVariable)
        .texture,
    };
  }
}

class LokLokWiggleDisplay {
  constructor({ node, sim, tracker }) {
    this.node = node;
    this.sim = sim;
    this.tracker = tracker;
    this.wait = this.setup({ node });
  }
  async setup({ node }) {
    let raycaster = await node.ready.raycaster;
    let mouse = await node.ready.mouse;
    let scene = await node.ready.scene;
    let camera = await node.ready.camera;
    let viewport = await node.ready.viewport;

    // let camera = await node.ready.camera;
    // let renderer = await node.ready.gl;

    let { geometry, subdivisions, count } = new NoodleGeo({
      count: 1,
      numSides: 8,
      subdivisions: this.sim.WIDTH,
      openEnded: false,
    });

    geometry.instanceCount = count;

    // let attr = LokLokWiggleSimulation.getLookUpAttr();
    // attr.installTo(geometry);

    let getPointAtByT = ({
      controlPointsResolution = 20,
      textureName = "CONTROL_POINTS",
    }) => {
      controlPointsResolution = Math.floor(controlPointsResolution);

      // let intval = `${Number(pts.length).toFixed(0)}`
      let floatval = `${Number(controlPointsResolution).toFixed(1)}`;

      /*
let ifthenelse = ``;
      for (let idx = 0; idx < controlPointsResolution; idx++) {
        ifthenelse += `
        else if (index == ${idx.toFixed(1)}) {
          vec4 color = texture2D(${textureName},
            vec2(
              ${idx.toFixed(1)} / ${controlPointsResolution.toFixed(1)},
              0.0
            )
          );

          result = color.rgb;
        }
        `;
      }
      if (false) {
        } ${ifthenelse}
        else {
          vec4 color = texture2D(${textureName},
            vec2(
              1.0,
              0.0
            )
          );
          result = color.rgb;
        }

      */
      let res = `
      vec3 pointIDX_${textureName} (float index) {
        vec3 result = vec3(0.0);

        vec4 color = texture2D(${textureName},
          vec2(
            index / ${controlPointsResolution.toFixed(1)},
            0.0
          )
        );

        result = color.rgb;

        return result;
      }

      vec3 catmullRom (vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
          vec3 v0 = (p2 - p0) * 0.5;
          vec3 v1 = (p3 - p1) * 0.5;
          float t2 = t * t;
          float t3 = t * t * t;

          return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
      }

      vec3 getPointAt (float t) {
        bool closed = false;
        float ll = ${floatval};
        float minusOne = 1.0;
        if (closed) {
          minusOne = 0.0;
        }

        float p = (ll - minusOne) * t;
        float intPoint = floor(p);
        float weight = p - intPoint;

        float idx0 = intPoint + -1.0;
        float idx1 = intPoint +  0.0;
        float idx2 = intPoint +  1.0;
        float idx3 = intPoint +  2.0;

        vec3 pt0 = pointIDX_${textureName}(idx0);
        vec3 pt1 = pointIDX_${textureName}(idx1);
        vec3 pt2 = pointIDX_${textureName}(idx2);
        vec3 pt3 = pointIDX_${textureName}(idx3);

        vec3 pointoutput = catmullRom(pt0, pt1, pt2, pt3, weight);

        return pointoutput;
      }
      `;
      // console.log(res);
      return res;
    };

    let materialLine0 = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        posTexture: { value: null },
        // handTexture: { value: null },
      },
      vertexShader: /* glsl */ `
        #include <common>
        #define lengthSegments ${subdivisions.toFixed(1)}

        attribute float angle;
        attribute float newPosition;
        attribute float tubeInfo;

        varying vec2 vUv;
        varying vec3 vNormal;
        attribute vec3 offset;

        uniform sampler2D posTexture;
        // uniform sampler2D handTexture;

        uniform float time;

        ${getPointAtByT({
          controlPointsResolution: subdivisions,
          textureName: "posTexture",
        })}

        vec3 sampleFnc (float t) {
          vec3 pt = offset * 0.02;


          pt += getPointAt(t);

          return pt;
        }

        void createTube (float t, vec2 volume, out vec3 pos, out vec3 normal) {
          // find next sample along curve
          float nextT = t + (1.0 / lengthSegments);

          // sample the curve in two places
          vec3 cur = sampleFnc(t);
          vec3 next = sampleFnc(nextT);

          // compute the Frenet-Serret frame
          vec3 T = normalize(next - cur);
          vec3 B = normalize(cross(T, next + cur));
          vec3 N = -normalize(cross(B, T));

          // extrude outward to create a tube
          float tubeAngle = angle;
          float circX = cos(tubeAngle);
          float circY = sin(tubeAngle);

          // compute position and normal
          normal.xyz = normalize(B * circX + N * circY);
          pos.xyz = cur + B * volume.x * circX + N * volume.y * circY;
        }

        void main (void) {
          //
          vec3 transformed;
          vec3 objectNormal;

          float t = tubeInfo + 0.5;

          vec2 volume = vec2(0.005);
          createTube(t, volume, transformed, objectNormal);

          vec3 transformedNormal = normalMatrix * objectNormal;
          vNormal = normalize(transformedNormal);
          vUv = uv.yx;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        void main (void) {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `,
      transparent: true,
    });

    let line0 = new Mesh(geometry, materialLine0);
    scene.add(line0);
    node.onClean(() => {
      scene.remove(line0);
    });

    let temppos = new Vector3();
    node.onLoop(() => {
      this.tracker.getWorldPosition(temppos);

      this.sim.render({ mouse: temppos });

      let result = this.sim.getTextureAfterCompute();
      materialLine0.uniforms.posTexture.value = result.posTexture;
      materialLine0.uniforms.time.value = window.performance.now() / 1000;
    });
  }

  enableMousePlane() {
    let geoPlane = new PlaneBufferGeometry(
      2.0 * viewport.width,
      2.0 * viewport.height,
      2,
      2
    );

    let matPlane = new MeshBasicMaterial({
      transparent: true,
      opacity: 0.25,
      color: 0xff0000,
    });

    let planeMesh = new Mesh(geoPlane, matPlane);
    planeMesh.position.z = -camera.position.z / 2;

    scene.add(planeMesh);
    node.onClean(() => {
      scene.remove(planeMesh);
    });

    let temppos = new Vector3();
    node.onLoop(() => {
      planeMesh.lookAt(camera.position);
      raycaster.setFromCamera(mouse, camera);
      let res = raycaster.intersectObject(planeMesh);
      if (res && res[0]) {
        temppos.copy(res[0].point);
      }
    });
  }

  enableHandTexture() {
    const width = this.sim.WIDTH;
    const height = this.sim.HEIGHT;
    const size = width * height;

    let handMovement = [];
    let temppos = new Vector3();
    for (let i = 0; i < size; i++) {
      AvatarHead.getWorldPosition(temppos);

      let x = temppos.x || 0;
      let y = temppos.y || 0;
      let z = temppos.z || 0;
      //
      handMovement.unshift(x, y, z);
    }

    const textureArray = new Uint16Array(3 * size);
    const handTexture = new DataTexture(
      textureArray,
      width,
      height,
      RGBFormat,
      HalfFloatType
    );
    handTexture.needsUpdate = true;

    node.onLoop(() => {
      handMovement.push(DataUtils.toHalfFloat(temppos.x) || 0);
      handMovement.push(DataUtils.toHalfFloat(temppos.y) || 0);
      handMovement.push(DataUtils.toHalfFloat(temppos.z) || 0);

      handMovement.shift();
      handMovement.shift();
      handMovement.shift();

      textureArray.set(handMovement, 0);
      handTexture.needsUpdate = true;
      mat.uniforms.handTexture.value = handTexture;
    });
  }
}

class NoodleGeo {
  constructor(props) {
    let {
      count = 24 * 24,
      numSides = 4,
      subdivisions = 50,
      openEnded = true,
    } = props;
    const radius = 1;
    const length = 1;

    const cylinderBufferGeo = new CylinderBufferGeometry(
      radius,
      radius,
      length,
      numSides,
      subdivisions,
      openEnded
    );

    let baseGeometry = new Geometry();
    baseGeometry = baseGeometry.fromBufferGeometry(cylinderBufferGeo);

    baseGeometry.rotateZ(Math.PI / 2);

    // compute the radial angle for each position for later extrusion
    const tmpVec = new Vector2();
    const xPositions = [];
    const angles = [];
    const uvs = [];
    const vertices = baseGeometry.vertices;
    const faceVertexUvs = baseGeometry.faceVertexUvs[0];
    const oPositions = [];

    // Now go through each face and un-index the geometry.
    baseGeometry.faces.forEach((face, i) => {
      const { a, b, c } = face;
      const v0 = vertices[a];
      const v1 = vertices[b];
      const v2 = vertices[c];
      const verts = [v0, v1, v2];
      const faceUvs = faceVertexUvs[i];

      // For each vertex in this face...
      verts.forEach((v, j) => {
        tmpVec.set(v.y, v.z).normalize();

        // the radial angle around the tube
        const angle = Math.atan2(tmpVec.y, tmpVec.x);
        angles.push(angle);

        // "arc length" in range [-0.5 .. 0.5]
        xPositions.push(v.x);
        oPositions.push(v.x, v.y, v.z);

        // copy over the UV for this vertex
        uvs.push(faceUvs[j].toArray());
      });
    });

    // build typed arrays for our attributes
    const posArray = new Float32Array(xPositions);
    const angleArray = new Float32Array(angles);
    const uvArray = new Float32Array(uvs.length * 2);

    const origPosArray = new Float32Array(oPositions);

    // unroll UVs
    for (let i = 0; i < posArray.length; i++) {
      const [u, v] = uvs[i];
      uvArray[i * 2 + 0] = u;
      uvArray[i * 2 + 1] = v;
    }

    const lineGeo = new InstancedBufferGeometry();
    lineGeo.instanceCount = count;

    lineGeo.setAttribute("position", new BufferAttribute(origPosArray, 3));
    lineGeo.setAttribute("tubeInfo", new BufferAttribute(posArray, 1));
    lineGeo.setAttribute("angle", new BufferAttribute(angleArray, 1));
    lineGeo.setAttribute("uv", new BufferAttribute(uvArray, 2));

    let offset = [];
    let ddxyz = Math.floor(Math.pow(count, 1 / 3));
    for (let z = 0; z < ddxyz; z++) {
      for (let y = 0; y < ddxyz; y++) {
        for (let x = 0; x < ddxyz; x++) {
          offset.push(
            (x / ddxyz) * 2.0 - 1.0,
            (y / ddxyz) * 2.0 - 1.0,
            (z / ddxyz) * 2.0 - 1.0
          );
        }
      }
    }

    // let ddxyz = Math.floor(Math.pow(count, 1 / 2));
    // for (let y = 0; y < ddxyz; y++) {
    //   for (let x = 0; x < ddxyz; x++) {
    //     offset.push(0.0, (x / ddxyz) * 2.0 - 1.0, (y / ddxyz) * 2.0 - 1.0);
    //   }
    // }

    lineGeo.setAttribute(
      "offset",
      new InstancedBufferAttribute(new Float32Array(offset), 3)
    );

    return {
      ...props,
      dataLength: posArray.length,
      geometry: lineGeo,
    };
  }
}

export class WiggleTracker {
  constructor({ node, tracker }) {
    let sim = new LokLokWiggleSimulation({ node });
    let display = new LokLokWiggleDisplay({ node, sim, tracker });
  }
}

export const effect = async (node) => {
  let tracker = new WiggleTracker({
    node,
    tracker: await node.ready.AvaRightHandIndex4,
  });
  let tracker2 = new WiggleTracker({
    node,
    tracker: await node.ready.AvaLeftHandIndex4,
  });
};

/*


        // vec3 catmullRom (vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
        //     vec3 v0 = (p2 - p0) * 0.5;
        //     vec3 v1 = (p3 - p1) * 0.5;
        //     float t2 = t * t;
        //     float t3 = t * t * t;
        //     return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
        // }

        // vec3 ctrlPt0 = texture2D(posTexture, vec2(0.0 / 3.0, 0.0)).xyz;
        // vec3 ctrlPt1 = texture2D(posTexture, vec2(1.0 / 3.0, 0.0)).xyz;
        // vec3 ctrlPt2 = texture2D(posTexture, vec2(2.0 / 3.0, 0.0)).xyz;
        // vec3 ctrlPt3 = texture2D(posTexture, vec2(3.0 / 3.0, 0.0)).xyz;

        // pt += catmullRom(
        //   ctrlPt0,
        //   ctrlPt1,
        //   ctrlPt2,
        //   ctrlPt3,
        //   t
        // );
*/
