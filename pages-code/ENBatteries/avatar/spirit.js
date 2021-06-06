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
  AdditiveBlending,
  Object3D,
  Color,
} from "three";
import { Geometry } from "three/examples/jsm/deprecated/Geometry.js";
import { enableBloom } from "../../Bloomer/Bloomer";

export const title = FolderName + ".spirit";

// class UI {
//   static async hoverPlane(node) {
//     let raycaster = await node.ready.raycaster;
//     let mouse = await node.ready.mouse;
//     let camera = await node.ready.camera;
//     let scene = await node.ready.scene;
//     let viewport = await node.ready.viewport;

//     let geoPlane = new PlaneBufferGeometry(
//       3.0 * viewport.width,
//       3.0 * viewport.height,
//       2,
//       2
//     );

//     let matPlane = new MeshBasicMaterial({
//       transparent: true,
//       opacity: 0.25,
//       color: 0xff0000,
//     });

//     let planeMesh = new Mesh(geoPlane, matPlane);
//     planeMesh.position.z = -camera.position.z / 2;

//     scene.add(planeMesh);
//     node.onClean(() => {
//       scene.remove(planeMesh);
//     });

//     let temppos = new Vector3();
//     node.onLoop(() => {
//       planeMesh.lookAt(camera.position);
//       raycaster.setFromCamera(mouse, camera);
//       let res = raycaster.intersectObject(planeMesh);
//       if (res && res[0]) {
//         temppos.copy(res[0].point);
//       }
//     });

//     return temppos;
//   }
// }

let makeNodeOrbitor = (node, mounter, radius = 1) => {
  let orbit = new Object3D();
  if (mounter) {
    mounter.add(orbit);
    node.onClean(() => {
      mounter.remove(orbit);
    });
  }

  node.onLoop((dt) => {
    orbit.rotation.y += 0.05;
  });

  let orbiting1 = new Object3D();
  orbiting1.position.y = 0.15;
  orbiting1.position.x = radius;
  orbit.add(orbiting1);

  let left = new Vector3();
  let right = new Vector3();
  let dist = 2.5700293285455326;
  let v3 = new Vector3();
  Promise.all([
    //
    node.ready.AvaLeftHand,
    node.ready.AvaRightHand,
  ]).then(
    ([
      //
      AvaLeftHand,
      AvaRightHand,
    ]) => {
      node.onLoop(() => {
        AvaLeftHand.getWorldPosition(left);
        AvaRightHand.getWorldPosition(right);

        let dist2 = left.distanceTo(right);

        let s = dist2 / dist;
        v3.set(s * s * 10 + 0.5, 1, 1);
        orbit.scale.lerp(v3, 1);
      });
    }
  );

  return orbiting1;
};

export class LokLokGravitySimulation {
  constructor({ node, width, height }) {
    this.WIDTH = width;
    this.HEIGHT = height;
    this.count = width * height;
    this.node = node;
    this.wait = this.setup();
  }
  async setup() {
    let node = this.node;
    let renderer = await node.ready.gl;

    // let mouse = await UI.hoverPlane(node);
    //
    let mouse = new Vector3();
    let TrackerTarget = await node.ready.AvaHead;
    let orbitTracker = makeNodeOrbitor(node, TrackerTarget, 1.0);

    orbitTracker.getWorldPosition(mouse);
    mouse.y += 0.4;
    node.onLoop(() => {
      orbitTracker.getWorldPosition(mouse);
      mouse.y += 0.4;
    });

    //

    this.gpu = new GPUComputationRenderer(this.WIDTH, this.HEIGHT, renderer);
    let gpu = this.gpu;

    gpu.setDataType(HalfFloatType);

    const dtPosition = this.gpu.createTexture();
    const dtVelocity = this.gpu.createTexture();
    const lookUpTexture = this.gpu.createTexture();

    dtPosition.wrapS = RepeatWrapping;
    dtPosition.wrapT = RepeatWrapping;

    dtVelocity.wrapS = RepeatWrapping;
    dtVelocity.wrapT = RepeatWrapping;

    this.fillPositionTexture(dtPosition, mouse);
    this.fillVelocityTexture(dtVelocity);
    this.fillLookupTexture(lookUpTexture);

    this.positionVariable = this.gpu.addVariable(
      "texPosition",
      this.posShader(),
      dtPosition
    );
    this.velocityVariable = this.gpu.addVariable(
      "texVelocity",
      this.velShader(),
      dtVelocity
    );

    this.gpu.setVariableDependencies(this.positionVariable, [
      this.velocityVariable,
      this.positionVariable,
    ]);

    this.gpu.setVariableDependencies(this.velocityVariable, [
      this.positionVariable,
      this.velocityVariable,
    ]);

    this.velocityUniforms = this.velocityVariable.material.uniforms;

    this.velocityUniforms.mouse = { value: mouse };

    this.positionUniforms = this.positionVariable.material.uniforms;
    this.positionUniforms["lookup"] = { value: lookUpTexture };
    this.positionUniforms["time"] = { value: 0 };
    dtPosition.wrapS = RepeatWrapping;
    dtPosition.wrapT = RepeatWrapping;

    this.positionUniforms["dt"] = { value: 1 };
    this.velocityUniforms.dt = { value: 1 };

    //
    const error = this.gpu.init();
    if (error !== null) {
      console.error(error);
    }

    node.onLoop((dt) => {
      gpu.compute();

      this.positionUniforms["dt"] = { value: dt / 1000 };
      this.velocityUniforms.dt = { value: dt / 1000 };
    });

    // let scene = await node.ready.scene;
    // let planeGeo = new PlaneBufferGeometry(1, 1);
    // let planeMat = new MeshBasicMaterial({
    //   map: null,
    // });
    // let item = new Mesh(planeGeo, planeMat);
    // item.position.y = 2;
    // scene.add(item);
    // node.onClean(() => {
    //   scene.remove(item);
    // });
    // node.onLoop(() => {
    //   planeMat.map = this.gpu.getCurrentRenderTarget(
    //     this.positionVariable
    //   ).texture;
    //   planeMat.needsUpdate = true;
    // })

    return this;
  }
  getPositionTexture() {
    return this.gpu.getCurrentRenderTarget(this.positionVariable).texture;
  }
  getVelocityTexture() {
    return this.gpu.getCurrentRenderTarget(this.positionVariable).texture;
  }
  render() {}

  velShader() {
    return /* glsl */ `
      float constrain(float val, float min, float max) {
        if (val < min) {
            return min;
        } else if (val > max) {
            return max;
        } else {
            return val;
        }
      }

      vec3 getDiff (in vec3 lastPos, in vec3 mousePos) {
        vec3 diff = lastPos - mousePos;

        float distance = constrain(length(diff), 15.0, 300.0);
        float strength = 1.0 / pow(distance, 1.5);

        diff = normalize(diff);

        // delta
        diff = diff * strength * -1.0;

        // diff = diff * strength * (-20.83) * (1.0 / delta) * 0.0183;
        // diff = normalize(diff);

        return diff;
      }

      uniform vec3 mouse;
      uniform float dt;

      void main(void)	{
        vec2 cellSize = 1.0 / resolution.xy;
        vec2 uv = gl_FragCoord.xy * cellSize;

        vec4 lastVel = texture2D(texVelocity, uv);
        vec4 lastPos = texture2D(texPosition, uv);

        vec3 diff = getDiff( lastPos.xyz, vec3(mouse) );
        lastVel.xyz += diff * 3.0;

        gl_FragColor = lastVel;
      }

    `;
  }
  posShader() {
    return /* glsl */ `
    uniform float dt;

      void main(void)	{
        vec2 cellSize = 1.0 / resolution.xy;
        vec2 uv = gl_FragCoord.xy * cellSize;

        vec4 lastVel = texture2D( texVelocity, uv );
        vec4 lastPos = texture2D( texPosition, uv );

        lastPos.xyz += lastVel.xyz * 0.01 * dt * 100.0;
        gl_FragColor = lastPos;
      }
    `;
  }

  fillPositionTexture(texture, initPosVec3 = false) {
    let i = 0;
    const theArray = texture.image.data;
    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        if (initPosVec3) {
          theArray[i++] = initPosVec3.x;
          theArray[i++] = initPosVec3.y;
          theArray[i++] = initPosVec3.z;
          theArray[i++] = 1.0;
        } else {
          theArray[i++] = Math.random() * 2.0 - 1.0;
          theArray[i++] = Math.random() * 2.0 - 1.0;
          theArray[i++] = Math.random() * 2.0 - 1.0;
          theArray[i++] = 1.0;
        }
      }
    }
    texture.needsUpdate = true;
  }

  fillVelocityTexture(texture) {
    let i = 0;
    const theArray = texture.image.data;
    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        theArray[i++] = 1.0 * (Math.random() - 0.5);
        theArray[i++] = 1.0 * (Math.random() - 0.5);
        theArray[i++] = 1.0 * (Math.random() - 0.5);
        theArray[i++] = 1.0;
      }
    }
    texture.needsUpdate = true;
  }

  fillLookupTexture(texture) {
    let i = 0;
    const theArray = texture.image.data;

    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        theArray[i++] = x / this.WIDTH;
        theArray[i++] = y / this.HEIGHT;
        theArray[i++] = this.WIDTH;
        theArray[i++] = this.HEIGHT;
      }
    }
    texture.needsUpdate = true;
  }
}

class LokLokHairBallSimulation {
  constructor({ node, virtual, numberOfScans = 10, trailSize = 32 }) {
    this.node = node;
    this.virtual = virtual;
    this.WIDTH = trailSize;

    this.HEIGHT = numberOfScans;
    this.NUMBER_OF_SCANS = numberOfScans;

    this.wait = this.setup({ node });
    this.v3v000 = new Vector3(0, 0, 0);
  }
  async setup({ node }) {
    await this.virtual.wait;
    let renderer = await node.ready.gl;

    let gpu = (this.gpu = new GPUComputationRenderer(
      this.WIDTH,
      this.HEIGHT,
      renderer
    ));

    gpu.setDataType(HalfFloatType);

    const dtPosition = this.gpu.createTexture();
    const lookUpTexture = this.gpu.createTexture();
    const virtualLookUpTexture = this.gpu.createTexture();

    this.fillVirtualLookUpTexture(virtualLookUpTexture);
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
    this.positionUniforms["virtualLookup"] = { value: virtualLookUpTexture };
    this.positionUniforms["lookup"] = { value: lookUpTexture };
    this.positionUniforms["time"] = { value: 0 };

    this.positionUniforms["virtualPosition"] = {
      value: this.virtual.getPositionTexture(),
    };
    node.onLoop(() => {
      this.positionUniforms["virtualPosition"] = {
        value: this.virtual.getPositionTexture(),
      };
    });

    // let h = this.HEIGHT;
    // for (let ii = 0; ii < h; ii++) {
    //   this.positionUniforms["mouse" + ii] = { value: new Vector3(0, 0, 0) };
    // }

    this.positionUniforms["time"] = { value: 0 };
    dtPosition.wrapS = RepeatWrapping;
    dtPosition.wrapT = RepeatWrapping;

    //
    const error = this.gpu.init();
    if (error !== null) {
      console.error(error);
    }

    node.onLoop(() => {
      this.positionUniforms["time"].value = window.performance.now() / 1000;
      this.gpu.compute();
    });
  }

  fillVirtualLookUpTexture(texture) {
    let k = 0;
    const theArray = texture.image.data;

    const tempArray = [];

    for (let x = 0; x < this.virtual.WIDTH; x++) {
      for (let y = 0; y < this.virtual.HEIGHT; y++) {
        tempArray.push([x / this.virtual.WIDTH, y / this.virtual.HEIGHT]);
      }
    }

    for (let iii = 0; iii < this.NUMBER_OF_SCANS; iii++) {
      for (let x = 0; x < this.WIDTH; x++) {
        let v = tempArray[iii];

        theArray[k++] = v[0];
        theArray[k++] = v[1];
        theArray[k++] = 0.0;
        theArray[k++] = 0.0;
      }
    }

    texture.needsUpdate = true;
  }

  positionShader() {
    return /* glsl */ `
      uniform sampler2D lookup;
      uniform float time;
      uniform sampler2D virtualLookup;
      uniform sampler2D virtualPosition;

			void main()	{
        // const float width = resolution.x;
        // const float height = resolution.y;
        // float xID = floor(gl_FragCoord.x);
        // float yID = floor(gl_FragCoord.y);

        vec2 uvCursor = vec2(gl_FragCoord.x, gl_FragCoord.y) / resolution.xy;
        // vec4 positionHead = texture2D( texturePosition, uvCursor );

        vec4 lookupData = texture2D(lookup, uvCursor);
        vec2 nextUV = lookupData.xy;
        float currentIDX = floor(gl_FragCoord.x);
        float currentLine = floor(gl_FragCoord.y);

        if (floor(currentIDX) == 0.0) {
          vec4 uv4 = texture2D(virtualLookup, uvCursor);
          vec4 vp4 = texture2D(virtualPosition, uv4.xy);
          gl_FragColor = vec4(vp4.xyz, 1.0);
        } else {
          vec3 positionChain = texture2D( texturePosition,nextUV ).xyz;
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
        theArray[i++] = this.WIDTH;
        theArray[i++] = this.HEIGHT;
        items.push([x / this.WIDTH, y / this.HEIGHT]);
      }
    }
    texture.needsUpdate = true;
  }

  render({ trackers = [] }) {
    if (!this.positionUniforms) {
      return;
    }
  }

  getTextureAfterCompute() {
    return {
      posTexture: this.gpu.getCurrentRenderTarget(this.positionVariable)
        .texture,
    };
  }
}

class LokLokWiggleDisplay {
  constructor({ node, sim }) {
    this.node = node;
    this.sim = sim;
    this.wait = this.setup({ node });
  }
  async setup({ node }) {
    let scene = await node.ready.scene;

    // let camera = await node.ready.camera;
    // let renderer = await node.ready.gl;

    let { geometry, subdivisions, count } = new NoodleGeo({
      count: this.sim.NUMBER_OF_SCANS,
      numSides: 3,
      subdivisions: this.sim.WIDTH,
      openEnded: false,
    });

    geometry.instanceCount = count;

    this.invertedScale = 1;

    let matLine0 = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        matcap: {
          // value: new TextureLoader().load("/matcap/golden2.png"),
          value: await node.ready.RainbowTexture,
        },
        posTexture: { value: null },
        // handTexture: { value: null },
      },
      vertexShader: /* glsl */ `
        // #include <common>
        #define lengthSegments ${subdivisions.toFixed(1)}

        attribute float angle;
        attribute float newPosition;
        attribute float tubeInfo;

        // varying vec2 vUv;
        varying vec3 vNormal;
        attribute vec4 offset;

        uniform sampler2D posTexture;
        // uniform sampler2D handTexture;

        uniform float time;

        mat4 rotationX( in float angle ) {
          return mat4(	1.0,		0,			0,			0,
                  0, 	cos(angle),	-sin(angle),		0,
                  0, 	sin(angle),	 cos(angle),		0,
                  0, 			0,			  0, 		1);
        }

        mat4 rotationY( in float angle ) {
          return mat4(	cos(angle),		0,		sin(angle),	0,
                      0,		1.0,			 0,	0,
                  -sin(angle),	0,		cos(angle),	0,
                      0, 		0,				0,	1);
        }

        mat4 rotationZ( in float angle ) {
          return mat4(	cos(angle),		-sin(angle),	0,	0,
                  sin(angle),		cos(angle),		0,	0,
                      0,				0,		1,	0,
                      0,				0,		0,	1);
        }

        mat4 rotationMatrix (vec3 axis, float angle) {
            axis = normalize(axis);
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0 - c;

            return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                        0.0,                                0.0,                                0.0,                                1.0);
        }


        vec3 sampleFnc (float t) {
          vec3 pt = (offset.xyz + 0.5) * 0.0;

          // pt = vec4(vec4(pt, 1.0) * rotationY(t * 0.1 + time * 0.1)).xyz;
          // if (lineIDXER == 0.0) {
          //   pt += getPointAt_0(t);
          // }

          float lineIDXER = offset.w;
          // pt += getPointAt_0(t);



          vec4 color = texture2D(posTexture,
            vec2(
              t,
              lineIDXER / ${this.sim.NUMBER_OF_SCANS.toFixed(1)}
            )
          );

          pt += color.rgb;


          // pt = getPointAt_2(t);

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

        varying float vT;
        attribute vec3 rainbow;
        varying vec3 vRainbow;
        varying vec3 vViewPosition;

        void main (void) {
          vRainbow = rainbow;
          vec3 transformed;
          vec3 objectNormal;

          float t = tubeInfo + 0.5;

          vT = t;

          vec2 volume = vec2(
            0.003 *
            ${this.invertedScale.toFixed(1)}
            ,
            0.003 *
            ${this.invertedScale.toFixed(1)}
          );
          createTube(t, volume, transformed, objectNormal);

          vec3 transformedNormal = normalMatrix * objectNormal;
          vNormal = normalize(transformedNormal);

          // vUv = uv.yx;

          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          vViewPosition = -mvPosition.xyz;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vT;
        // varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform sampler2D matcap;
        varying vec3 vRainbow;
        void main (void) {

          // vec3 viewDir = normalize( vViewPosition );
          // vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
          // vec3 y = cross( viewDir, x );
          // vec2 uv = vec2( dot( x, vNormal ), dot( y, vNormal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks

          // vec4 matcapColor = texture2D( matcap, uv );

          gl_FragColor = vec4(vRainbow, (1.0 - vT) * (1.0 - vT));
        }
      `,
      transparent: true,
      blending: AdditiveBlending,
    });

    let line0 = new Mesh(geometry, matLine0);

    line0.scale.set(
      1 / this.invertedScale,
      1 / this.invertedScale,
      1 / this.invertedScale
    );

    enableBloom(line0);

    scene.add(line0);
    node.onClean(() => {
      scene.remove(line0);
    });

    await this.sim.wait;

    node.onLoop(() => {
      let result = this.sim.getTextureAfterCompute();
      matLine0.uniforms.posTexture.value = result.posTexture;
      matLine0.uniforms.time.value = window.performance.now() / 1000;
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
      count = 20,
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

    // let colors = [
    //   ["#69d2e7", "#a7dbd8", "#e0e4cc", "#f38630", "#fa6900"],
    //   ["#fe4365", "#fc9d9a", "#f9cdad", "#c8c8a9", "#83af9b"],
    //   ["#ecd078", "#d95b43", "#c02942", "#542437", "#53777a"],
    //   ["#556270", "#4ecdc4", "#c7f464", "#ff6b6b", "#c44d58"],
    //   ["#774f38", "#e08e79", "#f1d4af", "#ece5ce", "#c5e0dc"],
    //   ["#e8ddcb", "#cdb380", "#036564", "#033649", "#031634"],
    //   ["#490a3d", "#bd1550", "#e97f02", "#f8ca00", "#8a9b0f"],
    //   ["#594f4f", "#547980", "#45ada8", "#9de0ad", "#e5fcc2"],
    //   ["#00a0b0", "#6a4a3c", "#cc333f", "#eb6841", "#edc951"],
    //   ["#e94e77", "#d68189", "#c6a49a", "#c6e5d9", "#f4ead5"],
    //   ["#3fb8af", "#7fc7af", "#dad8a7", "#ff9e9d", "#ff3d7f"],
    //   ["#d9ceb2", "#948c75", "#d5ded9", "#7a6a53", "#99b2b7"],
    //   ["#ffffff", "#cbe86b", "#f2e9e1", "#1c140d", "#cbe86b"],
    //   ["#efffcd", "#dce9be", "#555152", "#2e2633", "#99173c"],
    //   ["#343838", "#005f6b", "#008c9e", "#00b4cc", "#00dffc"],
    //   ["#413e4a", "#73626e", "#b38184", "#f0b49e", "#f7e4be"],
    //   ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4"],
    //   ["#99b898", "#fecea8", "#ff847c", "#e84a5f", "#2a363b"],
    //   ["#655643", "#80bca3", "#f6f7bd", "#e6ac27", "#bf4d28"],
    //   ["#00a8c6", "#40c0cb", "#f9f2e7", "#aee239", "#8fbe00"],
    //   ["#351330", "#424254", "#64908a", "#e8caa4", "#cc2a41"],
    //   ["#554236", "#f77825", "#d3ce3d", "#f1efa5", "#60b99a"],
    //   ["#5d4157", "#838689", "#a8caba", "#cad7b2", "#ebe3aa"],
    //   ["#8c2318", "#5e8c6a", "#88a65e", "#bfb35a", "#f2c45a"],
    //   ["#fad089", "#ff9c5b", "#f5634a", "#ed303c", "#3b8183"],
    //   ["#ff4242", "#f4fad2", "#d4ee5e", "#e1edb9", "#f0f2eb"],
    //   ["#f8b195", "#f67280", "#c06c84", "#6c5b7b", "#355c7d"],
    //   ["#d1e751", "#ffffff", "#000000", "#4dbce9", "#26ade4"],
    //   ["#1b676b", "#519548", "#88c425", "#bef202", "#eafde6"],
    //   ["#5e412f", "#fcebb6", "#78c0a8", "#f07818", "#f0a830"],
    //   ["#bcbdac", "#cfbe27", "#f27435", "#f02475", "#3b2d38"],
    //   ["#452632", "#91204d", "#e4844a", "#e8bf56", "#e2f7ce"],
    //   ["#eee6ab", "#c5bc8e", "#696758", "#45484b", "#36393b"],
    //   ["#f0d8a8", "#3d1c00", "#86b8b1", "#f2d694", "#fa2a00"],
    //   ["#2a044a", "#0b2e59", "#0d6759", "#7ab317", "#a0c55f"],
    //   ["#f04155", "#ff823a", "#f2f26f", "#fff7bd", "#95cfb7"],
    //   ["#b9d7d9", "#668284", "#2a2829", "#493736", "#7b3b3b"],
    //   ["#bbbb88", "#ccc68d", "#eedd99", "#eec290", "#eeaa88"],
    //   ["#b3cc57", "#ecf081", "#ffbe40", "#ef746f", "#ab3e5b"],
    //   ["#a3a948", "#edb92e", "#f85931", "#ce1836", "#009989"],
    //   ["#300030", "#480048", "#601848", "#c04848", "#f07241"],
    //   ["#67917a", "#170409", "#b8af03", "#ccbf82", "#e33258"],
    //   ["#aab3ab", "#c4cbb7", "#ebefc9", "#eee0b7", "#e8caaf"],
    //   ["#e8d5b7", "#0e2430", "#fc3a51", "#f5b349", "#e8d5b9"],
    //   ["#ab526b", "#bca297", "#c5ceae", "#f0e2a4", "#f4ebc3"],
    //   ["#607848", "#789048", "#c0d860", "#f0f0d8", "#604848"],
    //   ["#b6d8c0", "#c8d9bf", "#dadabd", "#ecdbbc", "#fedcba"],
    //   ["#a8e6ce", "#dcedc2", "#ffd3b5", "#ffaaa6", "#ff8c94"],
    //   ["#3e4147", "#fffedf", "#dfba69", "#5a2e2e", "#2a2c31"],
    //   ["#fc354c", "#29221f", "#13747d", "#0abfbc", "#fcf7c5"],
    //   ["#cc0c39", "#e6781e", "#c8cf02", "#f8fcc1", "#1693a7"],
    //   ["#1c2130", "#028f76", "#b3e099", "#ffeaad", "#d14334"],
    //   ["#a7c5bd", "#e5ddcb", "#eb7b59", "#cf4647", "#524656"],
    //   ["#dad6ca", "#1bb0ce", "#4f8699", "#6a5e72", "#563444"],
    //   ["#5c323e", "#a82743", "#e15e32", "#c0d23e", "#e5f04c"],
    //   ["#edebe6", "#d6e1c7", "#94c7b6", "#403b33", "#d3643b"],
    //   ["#fdf1cc", "#c6d6b8", "#987f69", "#e3ad40", "#fcd036"],
    //   ["#230f2b", "#f21d41", "#ebebbc", "#bce3c5", "#82b3ae"],
    //   ["#b9d3b0", "#81bda4", "#b28774", "#f88f79", "#f6aa93"],
    //   ["#3a111c", "#574951", "#83988e", "#bcdea5", "#e6f9bc"],
    //   ["#5e3929", "#cd8c52", "#b7d1a3", "#dee8be", "#fcf7d3"],
    //   ["#1c0113", "#6b0103", "#a30006", "#c21a01", "#f03c02"],
    //   ["#000000", "#9f111b", "#b11623", "#292c37", "#cccccc"],
    //   ["#382f32", "#ffeaf2", "#fcd9e5", "#fbc5d8", "#f1396d"],
    //   ["#e3dfba", "#c8d6bf", "#93ccc6", "#6cbdb5", "#1a1f1e"],
    //   ["#f6f6f6", "#e8e8e8", "#333333", "#990100", "#b90504"],
    //   ["#1b325f", "#9cc4e4", "#e9f2f9", "#3a89c9", "#f26c4f"],
    //   ["#a1dbb2", "#fee5ad", "#faca66", "#f7a541", "#f45d4c"],
    //   ["#c1b398", "#605951", "#fbeec2", "#61a6ab", "#accec0"],
    //   ["#5e9fa3", "#dcd1b4", "#fab87f", "#f87e7b", "#b05574"],
    //   ["#951f2b", "#f5f4d7", "#e0dfb1", "#a5a36c", "#535233"],
    //   ["#8dccad", "#988864", "#fea6a2", "#f9d6ac", "#ffe9af"],
    //   ["#2d2d29", "#215a6d", "#3ca2a2", "#92c7a3", "#dfece6"],
    //   ["#413d3d", "#040004", "#c8ff00", "#fa023c", "#4b000f"],
    //   ["#eff3cd", "#b2d5ba", "#61ada0", "#248f8d", "#605063"],
    //   ["#ffefd3", "#fffee4", "#d0ecea", "#9fd6d2", "#8b7a5e"],
    //   ["#cfffdd", "#b4dec1", "#5c5863", "#a85163", "#ff1f4c"],
    //   ["#9dc9ac", "#fffec7", "#f56218", "#ff9d2e", "#919167"],
    //   ["#4e395d", "#827085", "#8ebe94", "#ccfc8e", "#dc5b3e"],
    //   ["#a8a7a7", "#cc527a", "#e8175d", "#474747", "#363636"],
    //   ["#f8edd1", "#d88a8a", "#474843", "#9d9d93", "#c5cfc6"],
    //   ["#046d8b", "#309292", "#2fb8ac", "#93a42a", "#ecbe13"],
    //   ["#f38a8a", "#55443d", "#a0cab5", "#cde9ca", "#f1edd0"],
    //   ["#a70267", "#f10c49", "#fb6b41", "#f6d86b", "#339194"],
    //   ["#ff003c", "#ff8a00", "#fabe28", "#88c100", "#00c176"],
    //   ["#ffedbf", "#f7803c", "#f54828", "#2e0d23", "#f8e4c1"],
    //   ["#4e4d4a", "#353432", "#94ba65", "#2790b0", "#2b4e72"],
    //   ["#0ca5b0", "#4e3f30", "#fefeeb", "#f8f4e4", "#a5b3aa"],
    //   ["#4d3b3b", "#de6262", "#ffb88c", "#ffd0b3", "#f5e0d3"],
    //   ["#fffbb7", "#a6f6af", "#66b6ab", "#5b7c8d", "#4f2958"],
    //   ["#edf6ee", "#d1c089", "#b3204d", "#412e28", "#151101"],
    //   ["#9d7e79", "#ccac95", "#9a947c", "#748b83", "#5b756c"],
    //   ["#fcfef5", "#e9ffe1", "#cdcfb7", "#d6e6c3", "#fafbe3"],
    //   ["#9cddc8", "#bfd8ad", "#ddd9ab", "#f7af63", "#633d2e"],
    //   ["#30261c", "#403831", "#36544f", "#1f5f61", "#0b8185"],
    //   ["#aaff00", "#ffaa00", "#ff00aa", "#aa00ff", "#00aaff"],
    //   ["#d1313d", "#e5625c", "#f9bf76", "#8eb2c5", "#615375"],
    //   ["#ffe181", "#eee9e5", "#fad3b2", "#ffba7f", "#ff9c97"],
    //   ["#73c8a9", "#dee1b6", "#e1b866", "#bd5532", "#373b44"],
    //   ["#805841", "#dcf7f3", "#fffcdd", "#ffd8d8", "#f5a2a2"],
    // ];
    let colorsVertexArray = [];
    let colorSet = ["#00a8c6", "#40c0cb", "#f9f2e7", "#aee239", "#8fbe00"];
    let colorVar = new Color();
    for (let cc = 0; cc < count; cc++) {
      colorVar.setStyle(colorSet[cc % colorSet.length]);
      colorsVertexArray.push(colorVar.r, colorVar.g, colorVar.b);
    }

    lineGeo.setAttribute(
      "rainbow",
      new InstancedBufferAttribute(new Float32Array(colorsVertexArray), 3)
    );
    lineGeo.setAttribute("position", new BufferAttribute(origPosArray, 3));
    lineGeo.setAttribute("tubeInfo", new BufferAttribute(posArray, 1));
    lineGeo.setAttribute("angle", new BufferAttribute(angleArray, 1));
    lineGeo.setAttribute("uv", new BufferAttribute(uvArray, 2));

    let offset = [];
    let ddxyz = Math.floor(Math.pow(count, 1 / 3));
    let iii = 0;
    for (let z = 0; z < ddxyz; z++) {
      for (let y = 0; y < ddxyz; y++) {
        for (let x = 0; x < ddxyz; x++) {
          offset.push(
            0.0, //  * (x / ddxyz) * 2.0 - 1.0,
            0.0, //  * (y / ddxyz) * 2.0 - 1.0,
            0.0, //  * (z / ddxyz) * 2.0 - 1.0,
            iii
          );
          iii++;
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
      new InstancedBufferAttribute(new Float32Array(offset), 4)
    );

    let eachLineIdx = [];
    for (let c = 0; c < count; c++) {
      eachLineIdx.push(c);
    }

    // lineGeo.setAttribute(
    //   "lineIDXER",
    //   new InstancedBufferAttribute(new Float32Array(eachLineIdx), 1)
    // );

    return {
      ...props,
      dataLength: posArray.length,
      geometry: lineGeo,
    };
  }
}

export class WiggleTracker {
  //
  constructor({ node }) {
    this.node = node;
    this.setup({ node });
  }

  async setup({ node }) {
    let WIDTH = 1;
    let HEIGHT = 128;
    let SCAN_COUNT = WIDTH * HEIGHT;
    let TAIL_LENGTH = 32;

    let virtual = new LokLokGravitySimulation({
      node: node,
      width: WIDTH,
      height: HEIGHT,
    });

    let sim = new LokLokHairBallSimulation({
      node,
      virtual,
      numberOfScans: SCAN_COUNT,
      trailSize: TAIL_LENGTH,
    });

    let display = new LokLokWiggleDisplay({ node, sim });

    node.onLoop(() => {
      sim.render({});
    });
  }
}

export const effect = async (node) => {
  new WiggleTracker({
    node,
  });
};
