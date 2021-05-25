import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import Head from "next/head";
import { useEffect } from "react";
import { ENRuntime, BASEURL_REST } from "../pages-code/ENCloudSDK/ENRuntime";
import { EnvMap } from "../pages-code/EnvMap/EnvMap";

let getProjectJSON = () => {
  return {
    published: true,
    displayName: "encloud-template-nextjs",
    _id: "60a6ebc7d80d490008f8ab95",
    username: "wonglok831",
    userID: "609b49ad59f39c00098c34ea",
    slug: "encloud-template-nextjs",
    created_at: "2021-05-20T23:07:51.465Z",
    updated_at: "2021-05-23T02:50:31.784Z",
    __v: 0,
    largeString:
      '{"_id":"60a6ebc7d80d490008f8ab95","blockers":[{"_id":"_6do18mg4w52i9pvn0d","position":[-674.0453595439151,-0.000001220703197191142,35.60591617949544],"title":"plane"},{"_id":"_ooc9qukolxlhni9fiu","position":[-287.26805390047235,-0.000001220703140347723,54.343136226317576],"title":"sweet"}],"ports":[{"_id":"_ca5x3jili6j4kvxnwx","type":"input","blockerID":"_6do18mg4w52i9pvn0d"},{"_id":"_d1eh9yeyaldsydvy14","type":"input","blockerID":"_6do18mg4w52i9pvn0d"},{"_id":"_lq4y5qqtn5xu9mz0hv","type":"input","blockerID":"_6do18mg4w52i9pvn0d"},{"_id":"_ilv9xf2xq0xl63rer0","type":"input","blockerID":"_6do18mg4w52i9pvn0d"},{"_id":"_zd6ma8saw4xs0s9pjv","type":"input","blockerID":"_6do18mg4w52i9pvn0d"},{"_id":"_jm5frvh17h68yzq4d4","type":"output","blockerID":"_6do18mg4w52i9pvn0d"},{"_id":"_1kf0u93xzenosz2sll","type":"output","blockerID":"_6do18mg4w52i9pvn0d"},{"_id":"_1atnz563guey67puc0","type":"output","blockerID":"_6do18mg4w52i9pvn0d"},{"_id":"_d4tx77l0gh9qmwr7rs","type":"output","blockerID":"_6do18mg4w52i9pvn0d"},{"_id":"_n63ed9pr67jnlzsu0z","type":"output","blockerID":"_6do18mg4w52i9pvn0d"},{"_id":"_fsz0eaf5030gwcdq83","type":"input","blockerID":"_ooc9qukolxlhni9fiu"},{"_id":"_bdzlc7tchhrep7lvjr","type":"input","blockerID":"_ooc9qukolxlhni9fiu"},{"_id":"_ys17rno9pr0h9r4kmu","type":"input","blockerID":"_ooc9qukolxlhni9fiu"},{"_id":"_tko04z0wcuvcfg5guu","type":"input","blockerID":"_ooc9qukolxlhni9fiu"},{"_id":"_14fwfv8pqrkpbdw6eo","type":"input","blockerID":"_ooc9qukolxlhni9fiu"},{"_id":"_tgzl4n1gz4l6hwkfv2","type":"output","blockerID":"_ooc9qukolxlhni9fiu"},{"_id":"_x7yf0me28405j5lyp1","type":"output","blockerID":"_ooc9qukolxlhni9fiu"},{"_id":"_jlhjbk2hrzvewdsr8j","type":"output","blockerID":"_ooc9qukolxlhni9fiu"},{"_id":"_h0tb7g0ydd7pyk2vht","type":"output","blockerID":"_ooc9qukolxlhni9fiu"},{"_id":"_rliicyas7t8h0zz00o","type":"output","blockerID":"_ooc9qukolxlhni9fiu"}],"connections":[{"_id":"_16pwjf37xgyr572m1f","input":{"_id":"_fsz0eaf5030gwcdq83","type":"input","blockerID":"_ooc9qukolxlhni9fiu"},"output":{"_id":"_jm5frvh17h68yzq4d4","type":"output","blockerID":"_6do18mg4w52i9pvn0d"}}],"pickers":[{"_id":"_z2lvr4iffp5tvsgq8y","position":[205.77533920830103,-9.155273517080786e-7,-0.621626904721556],"title":"appSettings","pickers":[{"_id":"_qtwywc2dd16ljgxvjy","type":"text","title":"text1","value":""},{"_id":"_frcro94cj6tm5vozto","type":"text","title":"text2","value":""},{"_id":"_xqwje9vzr8ijn2bj5n","type":"hex","title":"color1","value":"#5c00f0"},{"_id":"_zycxu4qrx7mm87h2jv","type":"hex","title":"color2","value":"#ff0000"},{"_id":"_igvoksu032ftx2rsai","type":"float","title":"slider1","value":-53.86},{"_id":"_matdibcb2edre7i16u","type":"float","title":"slider2","value":27.13},{"_id":"_6po30th4nqgrnfqjro","type":"vec4","title":"vec4slider1","value":[1,1,1,1]},{"_id":"_a0378exualgxiw5xvu","type":"vec4","title":"vec4slider2","value":[1,1,1,-2.1]}]},{"_id":"_pdjo7ubkv5i3jbx0xg","position":[392.5983923407588,-9.155273517080786e-7,-0.07911030023779149],"title":"myMaterial","pickers":[{"_id":"_ygby3wbe75w70yv44a","type":"text","title":"text1","value":""},{"_id":"_7ohnxqyqj8w6r1vyqy","type":"text","title":"text2","value":""},{"_id":"_7t7iwe5318qbspcxm7","type":"hex","title":"color1","value":"#ffffff"},{"_id":"_r5jcun82uerf9il3ss","type":"hex","title":"color2","value":"#ffffff"},{"_id":"_y2xh3yf9k2nire9wdw","type":"hex","title":"color3","value":"#ff2525"},{"_id":"_n11oecxn93h8n76muq","type":"float","title":"slider1","value":9.74},{"_id":"_f8jckwucc72ekxcfrt","type":"float","title":"slider2","value":0},{"_id":"_v9ewcl54a4l7gg4fv7","type":"vec4","title":"vec4slider1","value":[1,1,1,1]},{"_id":"_kwnqo0316z89rq9nsw","type":"vec4","title":"vec4slider2","value":[1,1,1,1]}]}]}',
  };
};

let loadBattriesInFolder = () => {
  let enBatteries = [];
  let reqq = require.context("../pages-code/ENBatteries/", true, /\.js$/);
  let keys = reqq.keys();
  keys.forEach((key) => {
    enBatteries.push(reqq(key));
  });

  //
  return enBatteries;
};

function EffectNode({ projectJSON }) {
  let three = useThree();
  useEffect(() => {
    let enRunTime = new ENRuntime({
      projectJSON: projectJSON,
      enBatteries: loadBattriesInFolder(),
      userData: {},
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

export default function Home({ buildTimeCache }) {
  return (
    <div className={"h-full w-full"}>
      <Head>
        <title>Your Brand New Site</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Canvas>
        {/*  */}
        <EffectNode
          projectJSON={buildTimeCache || getProjectJSON()}
        ></EffectNode>

        {/*  */}
        <directionalLight
          position={[10, 10, 10]}
          intensity={0.1}
        ></directionalLight>

        {/*  */}
        <ambientLight intensity={0.1}></ambientLight>

        {/*  */}
        <EnvMap></EnvMap>

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

        <OrbitControls></OrbitControls>
      </Canvas>
    </div>
  );
}
