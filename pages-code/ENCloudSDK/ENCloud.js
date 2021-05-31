import { makeShallowStore, LambdaClient } from "./ENUtils.js";
import SimplePeer from "simple-peer";

export let BASEURL_REST = "https://prod-rest.realtime.effectnode.com";
export let BASEURL_WS = `wss://prod-ws.realtime.effectnode.com`;

// if (process.env.NODE_ENV === "development" && false) {
//   BASEURL_REST = `http://${
//     typeof window === "undefined" ? "localhost" : window.location.hostname
//   }:3333`;
//   BASEURL_WS = `ws://${
//     typeof window === "undefined" ? "localhost" : window.location.hostname
//   }:3333`;
// }

export class ENCloud {
  constructor({ fallbackJSON, parent, mini }) {
    this.parent = parent;
    this.mini = mini;
    this.fallbackJSON = fallbackJSON;
    this.projectID = fallbackJSON._id;
    this.username = fallbackJSON.username;
    this.userID = fallbackJSON.userID;

    this.BASEURL_REST = BASEURL_REST;
    this.BASEURL_WS = BASEURL_WS;

    this.projectStatus = makeShallowStore({
      raw: false,
      json: false,
      socket: false,
    });

    try {
      let raw = fallbackJSON;
      let json = JSON.parse(fallbackJSON.largeString);

      this.projectStatus.raw = raw;
      this.projectStatus.json = json;
    } catch (e) {
      console.log(e);
    }

    this.waitForTruth = (fnc) => {
      if (fnc) {
        let tt = setInterval(() => {
          let ans = this.projectStatus.json;
          if (typeof ans === "object" && !!ans && ans !== null) {
            clearInterval(tt);
            fnc(ans);
          }
        }, 0);
      } else {
        return new Promise((resolve) => {
          let tt = setInterval(() => {
            let ans = this.projectStatus.json;
            if (typeof ans === "object" && !!ans && ans !== null) {
              clearInterval(tt);
              resolve(ans);
            }
          }, 0);
        });
      }
    };
    this.promise = this.setup();

    // const waitGet = (getFn, resFn) => {
    //   let tt = setInterval(() => {
    //     let res = getFn();
    //     if (res) {
    //       clearInterval(tt);
    //       resFn(res);
    //     }
    //   });
    // };

    //
  }
  async setup() {
    this.downloadJSON = () => {
      return (
        fetch(`${this.BASEURL_REST}/project?action=get-one-of-published`, {
          headers: {
            "content-type": "application/json;charset=UTF-8",
          },
          body: JSON.stringify({ _id: this.projectID }),
          method: "POST",
          mode: "cors",
        })
          //
          .then((res) => {
            return res.json();
          })
          .then((data) => {
            //
            let json = JSON.parse(data.largeString);
            return {
              raw: data,
              json: json,
            };
          })
      );
    };

    const onSave = () => {
      //
      window.dispatchEvent(new CustomEvent("on-save", {}));
    };
    const announceTruth = () => {
      window.dispatchEvent(
        new CustomEvent("project-arrive", {
          detail: JSON.parse(JSON.stringify(this.projectStatus.json)),
        })
      );
    };

    return this.downloadJSON()
      .then(({ raw, json }) => {
        this.projectStatus.raw = raw;
        this.projectStatus.json = json;
        console.log("downloaded JSON");
      })
      .then(() => {
        let socket = (this.projectStatus.socket = new LambdaClient({
          url: this.BASEURL_WS,
        }));

        let userID = "TruthReceiver" + (Math.random() * 100000000).toFixed(0);

        let setupTruthReceiver = async () => {
          let peer = new SimplePeer({
            initiator: true,
            trickle: false,
          });

          peer.once("signal", (sig) => {
            socket.send({
              action: "signal",
              roomID: this.projectID,
              userID,
              connectionID: socket.connID,
              signal: sig,
            });
            console.log(sig);
          });

          socket.once("signal", ({ connectionID, signal, userID }) => {
            if (
              connectionID === socket.connID &&
              userID === "TruthProvider" &&
              !peer.destroyed
            ) {
              peer.signal(signal);
            }
          });

          // socket.once("connect", () => {
          //   console.log("connected");
          // });

          peer.once("close", () => {
            peer.destroyed = true;
          });

          peer.once("error", () => {
            peer.destroyed = true;
          });

          peer.once("connect", () => {
            console.log("[P2P]: TruthRreceiver OK");
            let sendBatteries = () => {
              if (peer && !peer.destroyed && peer.send) {
                peer.send(
                  JSON.stringify({
                    type: "enBatteries",
                    enBatteries: this.parent.enBatteries,
                  })
                );
              }
            };
            sendBatteries();
            setInterval(() => {
              sendBatteries();
            }, 1000 * 2);
          });

          peer.on("data", (buffer) => {
            if (peer.destroyed) {
              return;
            }
            let str = buffer.toString();
            let obj = JSON.parse(str);

            let json = JSON.parse(obj.largeString);
            this.projectStatus.raw = obj;
            this.projectStatus.json = json;

            announceTruth();
            // console.log("arrived");
          });
          this.mini.onClean(() => {
            peer.destroy();
          });
        };

        socket.on("join-room", (e) => {
          socket.connID = e.connectionID;
          setupTruthReceiver();
          // console.log("join-room", socket.connID, userID);
        });

        socket.on("bridge-project-room", (ev) => {
          console.log("websocket-onsave", ev);

          let json = JSON.parse(ev.project.largeString);
          this.projectStatus.raw = ev.project;
          this.projectStatus.json = json;

          announceTruth();
          onSave();
        });

        socket.on("encloud-ready", () => {
          socket.send({
            action: "join-room",
            roomID: this.projectID,
            userID,
          });
        });

        socket.send({
          action: "join-room",
          roomID: this.projectID,
          userID,
        });

        socket.on("reconnected", () => {
          socket.send({
            action: "join-room",
            roomID: this.projectID,
            userID,
          });
        });

        this.mini.onClean(() => {
          socket.dispose();
        });
      })
      .catch((e) => {
        if (this.fallBackJSON) {
          this.projectStatus.raw = this.fallBackJSON;
          if (this.fallBackJSON.largeString) {
            try {
              this.projectStatus.json = JSON.parse(
                this.fallBackJSON.largeString
              );
            } catch (e) {
              console.log(e);
              this.projectStatus.json = false;
            }
          } else {
            this.projectStatus.json = false;
          }
          announceTruth();
        }
      });
  }
}
