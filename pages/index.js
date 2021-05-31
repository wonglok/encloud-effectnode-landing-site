import { Canvas, useThree } from "@react-three/fiber";
import Head from "next/head";
import { useEffect } from "react";
import { ENRuntime, BASEURL_REST } from "../pages-code/ENCloudSDK/ENRuntime";
import { EnvMap } from "../pages-code/EnvMap/EnvMap";
import { Bloomer } from "../pages-code/Bloomer/Bloomer";
// import { VDBLoader } from "../pages-code/VDBLoader/VDBLoader";

let getProjectJSON = () => {
  return {
    published: true,
    displayName: "effectnode-landing-site",
    _id: "60ac9e372594510009f812f2",
    username: "wonglok831",
    userID: "609b49ad59f39c00098c34ea",
    slug: "effectnode-landing-site",
    created_at: "2021-05-25T06:50:31.177Z",
    updated_at: "2021-05-25T06:50:35.583Z",
    __v: 0,
    largeString:
      '{"_id":"60ac9e372594510009f812f2","blockers":[],"ports":[],"connections":[],"pickers":[]}',
  };
};

let loadBattriesInFolder = () => {
  let enBatteries = [];
  let reqq = require.context("../pages-code/ENBatteries/", true, /\.js$/);
  let keys = reqq.keys();
  keys.forEach((key) => {
    enBatteries.push(reqq(key));
  });

  return enBatteries;
};

function EffectNode({ projectJSON }) {
  let three = useThree();
  useEffect(() => {
    let enRunTime = new ENRuntime({
      projectJSON: projectJSON,
      enBatteries: loadBattriesInFolder(),
      userData: {
        ...three,
      },
    });

    Object.entries(three).forEach(([key, value]) => {
      enRunTime.mini.set(key, value);
    });

    return () => {
      enRunTime.mini.clean();
    };
  }, []);

  return <group></group>;
}

export async function getStaticProps(context) {
  let project = getProjectJSON();
  let projectID = project._id;
  let buildTimeCache = await fetch(
    `${BASEURL_REST}/project?action=get-one-of-published`,
    {
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({ _id: projectID }),
      method: "POST",
      mode: "cors",
    }
  )
    //
    .then((res) => {
      return res.json();
    });

  return {
    props: {
      buildTimeCache,
    }, // will be passed to the page component as props
  };
}

// function Loopsy({ ...props }) {
//   let texture = useTexture("/texture/eNeNeN.png");

//   return (
//     <Cylinder scale={0.3} {...props} args={[5, 5, 1.5, 32, 2, true]}>
//       <meshBasicMaterial
//         side={DoubleSide}
//         transparent={true}
//         blending={AdditiveBlending}
//         map={texture}
//       ></meshBasicMaterial>
//     </Cylinder>
//   );
// }

// function Looper({ children, ...props }) {
//   let ref = useRef();

//   useFrame((st, dt) => {
//     //
//     ref.current.rotation.y += dt;
//   });

//   return (
//     <group ref={ref} {...props}>
//       {children}
//     </group>
//   );
// }

export default function Home({ buildTimeCache }) {
  return (
    <div className={"h-full w-full"}>
      <Head>
        <title>Your Brand New Site</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Canvas
        dpr={(typeof window !== "undefined" && window.devicePixelRatio) || 1.0}
      >
        <Bloomer></Bloomer>
        {/*  */}
        {/* <OrbitControls></OrbitControls> */}

        {/*  */}
        <EffectNode
          projectJSON={buildTimeCache || getProjectJSON()}
        ></EffectNode>

        {/*  */}
        <directionalLight
          position={[0, 10, -10]}
          intensity={0.2}
        ></directionalLight>

        {/*  */}
        <ambientLight intensity={0.2}></ambientLight>

        {/*  */}
        <EnvMap></EnvMap>

        {/* <Suspense fallback={null}>
          <group rotation-x={Math.PI * 0.085} rotation-z={Math.PI * 0.1}>
            <Looper>
              <Loopsy></Loopsy>
            </Looper>
          </group>
        </Suspense> */}

        {/* <Sphere position-x={-1} args={[1, 25, 25]}>
          <meshStandardMaterial
            metalness={0.9}
            roughness={0.1}
          ></meshStandardMaterial>
        </Sphere>

        <Box position-x={1} args={[2, 2, 2, 25, 25, 25]}>
          <meshStandardMaterial
            metalness={0.9}
            roughness={0.1}
          ></meshStandardMaterial>
        </Box> */}
      </Canvas>
    </div>
  );
}
