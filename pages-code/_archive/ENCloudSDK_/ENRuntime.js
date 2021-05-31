import { ENCloud } from "./ENCloud";
import { ENMini } from "./ENMini";
import { getID } from "./ENUtils";

export { BASEURL_REST, BASEURL_WS } from "./ENCloud";

export class ENRuntime {
  constructor({
    projectJSON,
    userData = {},
    enBatteries = [],
    autoStartLoop = true,
  }) {
    if (!projectJSON) {
      throw new Error("NEEDS Project JSON");
    }
    this.fallBackJSON = projectJSON;
    this.mini = new ENMini({ name: "ENProjectRuntime" });
    this.encloud = new ENCloud({
      fallbackJSON: this.fallBackJSON,
      mini: this.mini,
    });
    this.projectJSON = false;
    this.autoStartLoop = autoStartLoop;
    this.enBatteries = enBatteries;
    this.userData = userData;
    this.promise = this.setup();
  }
  async setup() {
    //
    this.projectJSON = await this.encloud.waitForTruth();

    //
    let activeListener = new Map();

    //
    let runtimes = [];
    let Signatures = {
      now: "now",
      last: "last",
    };

    //
    let getSignature = () => {
      return JSON.stringify({
        blockers: this.projectJSON.blockers.map((e) => {
          return [e._id, e.title];
        }),
        ports: this.projectJSON.ports.map((e) => {
          return [e._id];
        }),
        connections: this.projectJSON.connections.map((e) => {
          return [e._id, e.input._id, e.output._id];
        }),
      });
    };

    let handleArrival = ({ detail }) => {
      this.projectJSON = detail;

      //
      let pickers = this.projectJSON.pickers;

      //
      pickers.forEach((moduleObj) => {
        moduleObj.pickers.forEach((pickerItem) => {
          if (activeListener.has(`${moduleObj.title}/${pickerItem.title}`)) {
            window.dispatchEvent(
              new CustomEvent(`${moduleObj.title}/${pickerItem.title}`, {
                detail: pickerItem,
              })
            );
          }
        });
      });

      //
      tirggerRegraph();
    };

    let tirggerRegraph = () => {
      Signatures.now = getSignature();
      if (Signatures.last !== Signatures.now) {
        Signatures.last = Signatures.now;
        window.dispatchEvent(new CustomEvent("remake-graph"));
      }
    };

    let handleOnSave = () => {
      tirggerRegraph();
    };

    window.addEventListener("on-save", handleOnSave, false);
    this.mini.onClean(() => {
      window.removeEventListener("on-save", handleOnSave);
    });

    window.addEventListener("project-arrive", handleArrival, false);
    this.mini.onClean(() => {
      window.removeEventListener("project-arrive", handleArrival);
    });

    this.mini.onClean(() => {
      runtimes.forEach(({ mini }) => {
        mini.clean();
      });
    });

    let remakeGraph = () => {
      runtimes.forEach(({ mini }) => {
        mini.clean();
      });

      runtimes.forEach((r) => {
        runtimes.splice(
          runtimes.findIndex((rr) => rr._id === r),
          1
        );
      });

      runtimes.push(
        new CodeRuntime({
          parent: this,
        })
      );
      // setTimeout(() => {
      //   runtimes.push(
      //     new CodeRuntime({
      //       parent: this,
      //     })
      //   );
      // }, 1000);
    };

    window.addEventListener("remake-graph", remakeGraph, false);
    this.mini.onClean(() => {
      window.removeEventListener("remake-graph", remakeGraph);
    });

    let makePicker = (moduleTitle) => {
      let stream = (pickerTitle, fnc = () => {}) => {
        if (!activeListener.has(`${moduleTitle}/${pickerTitle}`)) {
          activeListener.set(`${moduleTitle}/${pickerTitle}`, true);
        }

        let hPicker = ({ detail }) => {
          //
          fnc(detail.value, detail);
        };
        window.addEventListener(`${moduleTitle}/${pickerTitle}`, hPicker);
        this.mini.onClean(() => {
          window.removeEventListener(`${moduleTitle}/${pickerTitle}`, hPicker);
        });

        let ans = this.projectJSON?.pickers
          ?.find((e) => e.title === moduleTitle)
          ?.pickers?.find((e) => e.title === pickerTitle);
        fnc(ans.value, ans);
      };

      let pickerAPI = {
        get: (tgOBJ, key) => {
          let pickerSet = this.projectJSON.pickers.find(
            (e) => e.title === moduleTitle
          );
          if (!pickerSet) {
            throw new Error("cant find picker module", moduleTitle);
          }

          let obj = pickerSet.pickers.find((e) => e.title === key);

          obj.stream = (fnc) => {
            return stream(key, fnc);
          };

          return obj;
        },
      };

      return new Proxy({}, pickerAPI);
    };

    let PickerCache = new Map();

    let pickerModAPI = {
      get: (obj, key) => {
        let pickers = this.projectJSON.pickers;
        if (pickers.map((e) => e.title).includes(key)) {
          if (PickerCache.has(key)) {
            return PickerCache.get(key);
          }
          let api = makePicker(key);
          PickerCache.set(key, api);
          return api;
        } else {
          throw new Error("No picker found");
        }
      },
    };

    this.pickers = new Proxy({}, pickerModAPI);
    this.coreAPI = {
      pickers: this.pickers,
    };

    let rAFID = 0;
    let rAF = () => {
      rAFID = requestAnimationFrame(rAF);
      this.mini.work();
    };
    this.mini.onClean(() => {
      cancelAnimationFrame(rAFID);
    });
    if (this.autoStartLoop) {
      rAFID = requestAnimationFrame(rAF);
    }

    tirggerRegraph();

    return this;
  }
}

export class CodeRuntime {
  constructor({ parent }) {
    this._id = getID();
    this.parent = parent;
    let runtime = this;

    this.mini = new ENMini({
      name: "ENGraphRuntime",
      parentMini: this.parent.mini,
    });
    this.mini.set("parent", parent);
    parent.mini.onLoop(() => {
      this.mini.work();
    });

    parent.mini.onClean(() => {
      this.mini.clean();
    });

    let blockers = this.parent.projectJSON.blockers;
    let connections = this.parent.projectJSON.connections;
    let ports = this.parent.projectJSON.ports;

    connections.forEach((conn) => {
      //
      let handlConn = ({ detail }) => {
        window.dispatchEvent(new CustomEvent(conn.input._id, { detail }));
      };
      window.addEventListener(conn.output._id, handlConn);
      this.mini.onClean(() => {
        window.removeEventListener(conn.output._id, handlConn);
      });
    });

    let queue = [];
    blockers.forEach((b) => {
      //
      let uFunc = parent.enBatteries.find((f) => f.title === b.title);
      let portsAPIMap = new Map();

      let mode = "queue";

      this.mini.ready["ready-all"].then(() => {
        mode = "can-send";
        queue.forEach((ev) => {
          window.dispatchEvent(
            new CustomEvent(ev.eventName, { detail: ev.detail })
          );
        });
      });

      //
      ports
        .filter((e) => e.blockerID === b._id)
        .filter((e) => e.type === "input")
        .map((e, idx) => {
          let api = {
            stream: (onReceive) => {
              let hh = ({ detail }) => {
                onReceive(detail);
              };
              window.addEventListener(e._id, hh);
              this.mini.onClean(() => {
                window.removeEventListener(e._id, hh);
              });
            },
            get ready() {
              return new Promise((resolve) => {
                let hh = ({ detail }) => {
                  resolve(detail);
                  window.removeEventListener(e._id, hh);
                };
                window.addEventListener(e._id, hh);
              });
            },
          };

          portsAPIMap.set(`in${e.idx || idx}`, api);

          return e;
        });

      ports
        .filter((e) => e.blockerID === b._id)
        .filter((e) => e.type === "output")
        .map((e, idx) => {
          let api = {
            pulse: (data) => {
              if (mode === "queue") {
                queue.push({
                  eventName: e._id,
                  detail: data,
                });
                console.log("queue how long", queue.length);
              } else {
                window.dispatchEvent(new CustomEvent(e._id, { detail: data }));
              }
            },
          };
          portsAPIMap.set(`out${e.idx || idx}`, api);

          return e;
        });

      let prom = [];
      if (uFunc && uFunc.effect && typeof uFunc.effect === "function") {
        let node = {
          onClean: (v) => {
            runtime.mini.onClean(v);
          },
          onLoop: (v) => {
            runtime.mini.onLoop(v);
          },

          // getter
          ready: runtime.mini.ready,
          now: runtime.mini.now,

          //
          env: {
            get: runtime.mini.get,
            set: runtime.mini.set,
          },
          runtime: runtime,
          graphEngine: runtime.mini,
          pickers: this.parent.pickers,
          userData: this.parent.userData,
        };
        prom.push(
          uFunc.effect(
            new Proxy(node, {
              get: (obj, key) => {
                //
                if (key.indexOf("in") === 0 && !isNaN(key[2])) {
                  return portsAPIMap.get(key);
                }

                if (key.indexOf("out") === 0 && !isNaN(key[3])) {
                  return portsAPIMap.get(key);
                }

                return obj[key];
              },
            })
          )
        );
      }

      Promise.all(prom).then(() => {
        this.mini.set("ready-all", true);
      });
    });
  }
}
//

//

//
