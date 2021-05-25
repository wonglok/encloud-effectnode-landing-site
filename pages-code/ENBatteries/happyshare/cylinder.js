import { FolderName } from ".";
import {
  BufferAttribute,
  CylinderGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  RawShaderMaterial,
  TextureLoader,
  Vector2,
} from "three";
import { Geometry } from "three-stdlib/deprecated/Geometry";
import * as GLSLTools from "./utils/utils.js";

export const title = `${FolderName}.cylinder`;
export const effect = async (node) => {
  let scene = await node.ready.scene;
  let camera = await node.ready.camera;
  let renderer = await node.ready.gl;
  let raycaster = await node.ready.raycaster;
  let mouse = await node.ready.mouse;

  //
};

export const CylinderInfo = ({
  count = 100,
  numSides = 8,
  subdivisions = 50,
  openEnded = true,
}) => {
  let info = {};

  // create a base CylinderGeometry which handles UVs, end caps and faces
  const radius = 1;
  const length = 1;
  const newBaseGeometry = new CylinderGeometry(
    radius,
    radius,
    length,
    numSides,
    subdivisions,
    openEnded
  );

  const baseGeometry = new Geometry().fromBufferGeometry(newBaseGeometry);

  // fix the orientation so X can act as arc length
  baseGeometry.rotateZ(Math.PI / 2);

  // compute the radial angle for each position for later extrusion
  const tmpVec = new Vector2();
  const xPositions = [];
  const v3Positions = [];
  const angles = [];
  const uvs = [];
  const vertices = baseGeometry.vertices;
  const faceVertexUvs = baseGeometry.faceVertexUvs[0];

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
      // "arc length" in range [0.0 .. 1.0]
      xPositions.push(v.x + 0.5);

      v3Positions.push(v.x, v.y, v.z);

      // copy over the UV for this vertex
      uvs.push(faceUvs[j].toArray());
    });
  });

  // build typed arrays for our attributes
  const posArray = new Float32Array(xPositions);
  const angleArray = new Float32Array(angles);
  const uvArray = new Float32Array(uvs.length * 2);

  // unroll UVs
  for (let i = 0; i < posArray.length; i++) {
    const [u, v] = uvs[i];
    uvArray[i * 2 + 0] = u;
    uvArray[i * 2 + 1] = v;
  }

  const lineGeo = new InstancedBufferGeometry();
  lineGeo.instanceCount = count;
  lineGeo.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(v3Positions), 3)
  );
  lineGeo.setAttribute("line", new BufferAttribute(posArray, 1));
  lineGeo.setAttribute("angle", new BufferAttribute(angleArray, 1));
  lineGeo.setAttribute("uv", new BufferAttribute(uvArray, 2));

  let offsets = [];
  let ddxyz = count;
  for (let z = 0; z < ddxyz; z++) {
    offsets.push(z / ddxyz, z / ddxyz, z / ddxyz);
  }

  // for (let i = 0; i < this.parent.ctrlPts; i++) {
  //   lineGeo.setAttribute(
  //     "controlPoint" + i,
  //     new InstancedBufferAttribute(
  //       new Float32Array(this.parent[`controlPoint${i}`]),
  //       3
  //     )
  //   );
  // }

  lineGeo.setAttribute(
    "offset",
    new InstancedBufferAttribute(new Float32Array(offsets), 3)
  );

  baseGeometry.dispose();

  let provideGLSL = {
    attributes: /* glsl */ `
      #define MY_PI 3.1415926535897932384626433832795

      attribute float line;
      attribute float angle;
      attribute vec3 offset;
    `,

    uniforms: /* glsl */ `
      // uniforms
      uniform float time;

      uniform float subdivisions;
    `,

    sampler: /* glsl */ `


      // line
      // vec3 sample (float t) {
      //   float x = t * 2.0 - 1.0;
      //   float y = sin(t + time);
      //   return vec3(x, y, 0.0);
      // }

      // dough nut
      // vec3 sample (float t) {
      //   float angle = t * 2.0 * MY_PI;
      //   vec2 rot = vec2(cos(angle), sin(angle));
      //   return vec3(rot, 0.0);
      // }


      // vec3 sample (float t) {
      //   float beta = t * MY_PI;

      //   float r = sin(beta * 1.0 + sin(time)) * 5.25;
      //   float phi = sin(beta * 9.0 + time);
      //   float theta = 6.0 * beta;

      //   return spherical(r, phi, theta);
      // }

      // vec3 sample (float t) {
      //   float beta = t * MY_PI;

      //   float r = sin(beta * 1.0 + time * 0.1) * 6.25;
      //   float phi = sin(beta * 6.0 + time * 0.0);
      //   float theta = beta * 2.0;

      //   return spherical(r, phi, theta);
      // }

      // vec3 spherical (float r, float phi, float theta) {
      //   return vec3(
      //     r * cos(phi) * cos(theta),
      //     r * cos(phi) * sin(theta),
      //     r * sin(phi)
      //   );
      // }

      // vec3 sample (float t) {
      //   float beta = t * MY_PI;

      //   float r = sin(beta * 1.0) * 6.75;
      //   float phi = sin(beta * 6.0 + sin(time * 0.1));
      //   float theta = 4.0 * beta;

      //   return spherical(r, phi, theta);
      // }

      vec3 sample (float t) {
        vec3 pos = vec3((t) * 2500.0);
        float pX = pos.x;
        float pY = pos.y;
        float pZ = pos.y;
        float piz = 0.001 * 2.0 * 3.14159265;

        pos.xyz = rotateQ(normalize(vec3(1.0, pY * piz, 1.0)), time + pY * piz) * rotateY(time + pZ * piz) * pos.xyz;
        pos.xyz = rotateQ(normalize(vec3(1.0, pZ * piz, 1.0)), time + pY * piz) * rotateZ(time + pZ * piz) * pos.xyz;
        pos.xyz = rotateQ(normalize(vec3(1.0, pZ * piz, 1.0)), time + pX * piz) * rotateY(time + pY * piz) * pos.xyz;

        // pos.z += sin(time  + pX * piz * 0.333) * pos.y;

        pos.xyz *= 0.00055;

        float ttTime = time * 0.5;

        pos.xyz *= rotateX(length(pos.xyz) + ttTime);
        pos.xyz *= rotateY(length(pos.xyz) + ttTime);
        pos.xyz *= rotateZ(length(pos.xyz) + ttTime);

        pos.xyz += ballify(pos.xyz, length(pos.xyz) * 0.25 + 0.75 * length(pos.xyz) * sin(ttTime));

        return pos.xyz;
      }
    `,

    builtInVertexHeader: `

      // built in
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      uniform mat4 modelMatrix;
      uniform mat3 normalMatrix;
      uniform vec3 cameraPosition;

    `,

    varyings: `

    varying vec3 vNormal;
    varying vec3 vViewPosition;


    `,
    precisionHigh: `

    precision highp float;

    `.trim(),

    getMatCapUV: `

      vec2 getMatCapUV (vec3 vViewPosition, vec3 vNormal) {
        vec3 viewDir = normalize( vViewPosition );
        vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
        vec3 y = cross( viewDir, x );
        vec2 smoothUV = vec2( dot( x, vNormal ), dot( y, vNormal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks
        return smoothUV;
      }


    `,

    createTubeInfo: `
      struct TubeGeo {
        vec3 position;
        vec3 normal;
      };

      TubeGeo createTubeInfo (float t, vec2 volume) {
        // find next sample along curve
        float nextT = t + (1.0 / subdivisions);

        // sample the curve in two places
        vec3 cur = sample(t);
        vec3 next = sample(nextT);

        // compute the Frenet-Serret frame
        vec3 T = normalize(next - cur);
        vec3 B = normalize(cross(T, next + cur));
        vec3 N = -normalize(cross(B, T));

        // extrude outward to create a tube
        float tubeAngle = angle;
        float circX = cos(tubeAngle);
        float circY = sin(tubeAngle);

        // compute position and normal

        TubeGeo info;
        info.normal = normalize(B * circX + N * circY);
        info.position = cur + B * volume.x * circX + N * volume.y * circY;

        return info;
      }
    `,
  };

  let uniforms = {
    baseOpacity: { value: 1 },
    matcapTexture: {
      value: new TextureLoader().load("/matcap/golden2.png"),
    },
    subdivisions: { value: subdivisions },
    time: { value: 0 },
  };

  const lineMat = new RawShaderMaterial({
    transparent: true,
    uniforms,
    vertexShader: /* glsl */ `
      ${provideGLSL.precisionHigh}

      ${provideGLSL.builtInVertexHeader}

      ${provideGLSL.attributes}

      ${provideGLSL.uniforms}

      ${GLSLTools.toolset}

      ${provideGLSL.sampler}

      ${provideGLSL.varyings}

      ${provideGLSL.createTubeInfo}

      void main (void) {
        float t = (line);
        vec2 volume = vec2(0.05 * (1.0 - line));
        TubeGeo tube = createTubeInfo(t, volume);

        mat4 flowerSpread = rotationZ(0.25 * offset.x * MY_PI * 2.0);
        vec4 newObjPos = flowerSpread * vec4(tube.position, 1.0);
        vec4 mvPosition = modelViewMatrix * newObjPos;
        gl_Position = projectionMatrix * mvPosition;

        vec3 transformedNormal = normalMatrix * tube.normal;
        vNormal = normalize(transformedNormal);
        vViewPosition = -mvPosition.xyz;
      }
      //
    `.trim(),

    fragmentShader: /* glsl */ `
      ${provideGLSL.precisionHigh}

      ${provideGLSL.varyings}
      ${provideGLSL.getMatCapUV}

      uniform float baseOpacity;
      uniform sampler2D matcapTexture;

      void main (void) {
        vec2 uv = getMatCapUV(vViewPosition, vNormal);
        vec4 color = texture2D(matcapTexture, uv);

        gl_FragColor = vec4(vec3(color), baseOpacity);
      }

    `.trim(),
  });

  info.preview = new Mesh(lineGeo, lineMat);
  return info;
};

//
