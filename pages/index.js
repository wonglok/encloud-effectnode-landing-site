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
    let vips = {
      "?vip=susaye": {
        customAvatarURL: "/ppl/susaye-v4.glb",
        ringURL: "/texture/susaye-white-text.png",
        greetingsActionURL: "/actions/greetings/singing.fbx",
      },
      "?vip=susaye2": {
        customAvatarURL: "/ppl/susaye-v4.glb",
        ringURL: "/texture/susaye-white-text.png",
        greetingsActionURL: "/actions/greetings/backflip.fbx",
      },
      "?vip=susaye3": {
        customAvatarURL: "/ppl/susaye2.glb",
        ringURL: "/texture/susaye-white-text.png",
        greetingsActionURL: "/actions/greetings/hiphop.fbx",
      },
      "?vip=susaye4": {
        customAvatarURL: "/ppl/susaye2.glb",
        ringURL: "/texture/susaye-white-text.png",
        greetingsActionURL: "/actions/greetings/salute.fbx",
      },
      "?vip=susaye5": {
        customAvatarURL: "/ppl/susaye2.glb",
        ringURL: "/texture/susaye-white-text.png",
        greetingsActionURL: "/actions/greetings/hiphop2.fbx",
      },

      "?vip=charlie": {
        customAvatarURL: "/ppl/charlie.glb",
        greetingsActionURL: "/actions/greetings/backflip.fbx",
      },

      // /actions/greetings/hiphop2.fbx
      "?vip=patrick": {
        customAvatarURL: "/ppl/patrick2.glb",
        greetingsActionURL: "/actions/greetings/backflip.fbx",
      },
      "?vip=patrick2": {
        customAvatarURL: "/ppl/patrick2.glb",
        greetingsActionURL: "/actions/greetings/hiphop2.fbx",
      },
      "?vip=lok": {
        customAvatarURL: "/ppl/lok-7.glb",
        greetingsActionURL: "/actions/greetings/salute.fbx",
      },
      "?vip=lok2": {
        customAvatarURL: "/ppl/lok-7.glb",
        greetingsActionURL: "/actions/greetings/warmup.fbx",
      },
      "?vip=lok3": {
        customAvatarURL: "/ppl/lok-7.glb",
        greetingsActionURL: "/actions/greetings/hiphop.fbx",
      },

      "?vip=lok4": {
        customAvatarURL: "/ppl/lok-7.glb",
        greetingsActionURL: "/actions/greetings/singing.fbx",
      },
      "?vip=lok5": {
        customAvatarURL: "/ppl/lok-7.glb",
        greetingsActionURL: "/actions/greetings/hiphop2.fbx",
      },

      "?vip=henry": {
        customAvatarURL: "/ppl/henry.glb",
        greetingsActionURL: "/actions/greetings/singing.fbx",
      },
      "?vip=henry2": {
        customAvatarURL: "/ppl/henry.glb",
        greetingsActionURL: "/actions/greetings/backflip.fbx",
      },
      "?vip=henry3": {
        customAvatarURL: "/ppl/henry.glb",
        greetingsActionURL: "/actions/greetings/warmup.fbx",
      },
    };

    let enRunTime = new ENRuntime({
      projectJSON: projectJSON,
      enBatteries: loadBattriesInFolder(),
      userData: {
        ...three,
        ...vips[window.location.search],
      },
    });

    Object.entries(three).forEach(([key, value]) => {
      enRunTime.mini.set(key, value);
      console.log(key);
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

        <EffectNode
          projectJSON={buildTimeCache || getProjectJSON()}
        ></EffectNode>

        <directionalLight
          position={[0, 10, -10]}
          intensity={0.4}
        ></directionalLight>

        <ambientLight intensity={0.2}></ambientLight>

        <EnvMap></EnvMap>
      </Canvas>
    </div>
  );
}
