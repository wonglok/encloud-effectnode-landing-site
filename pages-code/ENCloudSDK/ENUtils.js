import { BASEURL_WS } from "./ENCloud.js";

export const getID = function () {
  return (
    "_" +
    Math.random().toString(36).substr(2, 9) +
    Math.random().toString(36).substr(2, 9)
  );
};

export const onEvent = function (ev, fnc) {
  useEffect(() => {
    window.addEventListener(ev, fnc);
    return () => {
      window.removeEventListener(ev, fnc);
    };
  }, []);
};

export const makeShallowStore = (myObject = {}) => {
  let ___NameSpaceID = getID();
  let Utils = {
    exportJSON: () => {
      return JSON.parse(JSON.stringify(myObject));
    },
    getNameSpcaeID: () => {
      return ___NameSpaceID;
    },
    onEventChangeKey: (key, func) => {
      let evName = `${___NameSpaceID}`;
      let hh = () => {
        func(myObject[key]);
      };

      window.addEventListener(`${evName}-${key}`, hh);
      return () => {
        window.removeEventListener(`${evName}-${key}`, hh);
      };
    },
    onChangeKey: (key, func) => {
      useEffect(() => {
        let evName = `${___NameSpaceID}`;
        let hh = () => {
          func(myObject[key]);
        };

        window.addEventListener(`${evName}-${key}`, hh);
        return () => {
          window.removeEventListener(`${evName}-${key}`, hh);
        };
      }, []);
    },

    makeKeyReactive: (key) => {
      let [, setSt] = useState(0);
      useEffect(() => {
        let evName = `${___NameSpaceID}`;

        let hh = () => {
          setSt((s) => {
            return s + 1;
          });
        };

        window.addEventListener(`${evName}-${key}`, hh);
        return () => {
          window.removeEventListener(`${evName}-${key}`, hh);
        };
      }, []);
    },
    notifyKeyChange: (key) => {
      window.dispatchEvent(
        new CustomEvent(`${___NameSpaceID}-${key}`, { detail: {} })
      );
    },
  };

  let setupArray = (array, key, Utils) => {
    array.getItemByID =
      array.getItemByID ||
      ((_id) => {
        let result = array.find((a) => a._id === _id);
        return result;
      });

    array.getItemIndexByID =
      array.getItemIndexByID ||
      ((_id) => {
        let result = array.findIndex((a) => a._id === _id);
        return result;
      });

    array.addItem =
      array.addItem ||
      ((item) => {
        let api = makeSimpleShallowStore(item);
        array.push(api);

        let ns = Utils.getNameSpcaeID();
        window.dispatchEvent(new CustomEvent(`${ns}-${key}`, { detail: {} }));

        return api;
      });

    array.removeItem =
      array.removeItem ||
      ((item) => {
        //
        let idx = array.findIndex((a) => a._id === item._id);

        if (idx !== -1) {
          array.splice(idx, 1);
          let ns = Utils.getNameSpcaeID();
          window.dispatchEvent(new CustomEvent(`${ns}-${key}`, { detail: {} }));
        } else {
          console.log(`item not found: ${item._id}`);
        }
      });
  };

  Object.keys(myObject).forEach((kn) => {
    let val = myObject[kn];
    if (val instanceof Array) {
      setupArray(val, kn, Utils);
    }
  });

  let proxy = new Proxy(myObject, {
    get: (o, k) => {
      //
      if (Utils[k]) {
        return Utils[k];
      }

      return o[k];
    },
    set: (o, key, val) => {
      if (val instanceof Array) {
        setupArray(val, key, Utils);
      }

      o[key] = val;

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(`${___NameSpaceID}-${key}`, { detail: {} })
        );
      }

      return true;
    },
  });

  return proxy;
};

let isFunction = function (obj) {
  return typeof obj === "function" || false;
};

class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }
  addEventListener(label, callback) {
    this.listeners.has(label) || this.listeners.set(label, []);
    this.listeners.get(label).push(callback);
  }

  removeEventListener(label, callback) {
    let listeners = this.listeners.get(label);
    let index = 0;

    if (listeners && listeners.length) {
      index = listeners.reduce((i, listener, index) => {
        let a = () => {
          i = index;
          return i;
        };
        return isFunction(listener) && listener === callback ? a() : i;
      }, -1);

      if (index > -1) {
        listeners.splice(index, 1);
        this.listeners.set(label, listeners);
        return true;
      }
    }
    return false;
  }
  trigger(label, ...args) {
    let listeners = this.listeners.get(label);

    if (listeners && listeners.length) {
      listeners.forEach((listener) => {
        listener(...args);
      });
      return true;
    }
    return false;
  }
}

export class LambdaClient extends EventEmitter {
  constructor({ url }) {
    super();
    this.url = url;
    this.autoReconnectInterval = 15 * 1000;
    this.open({ isReconnect: false });
  }

  get ready() {
    return this.ws.readyState === WebSocket.OPEN;
  }

  close() {
    try {
      this.ws.__disposed = true;
      this.ws.close();
      console.log("WebSocket: closed");
    } catch (e) {
      console.log(e);
    }
  }

  dispose() {
    this.close();
  }

  open({ isReconnect }) {
    this.ws = new WebSocket(this.url);
    this.ws.__disposed = false;

    this.ws.addEventListener("open", (e) => {
      if (this.ws.__disposed) {
        return;
      }
      console.log(
        isReconnect
          ? "WebSopcket reopened, please rejoin room to refresh connection ID"
          : "WebSocket: opened"
      );
      if (isReconnect) {
        this.trigger("reconnected");
      }
    });

    this.ws.addEventListener("message", (evt) => {
      if (this.ws.__disposed) {
        return;
      }

      try {
        let response = JSON.parse(evt.data);
        if (response && response.inventory && response.inventory.inv) {
          delete response.inventory;
        }
        this.trigger(response.action, response);
      } catch (e) {
        console.log(e);
      }
    });

    this.ws.addEventListener("close", (e) => {
      if (this.ws.__disposed) {
        return;
      }

      switch (e.code) {
        case 1000: // CLOSE_NORMAL
          console.log("WebSocket: closed");
          break;
        default:
          // Abnormal closure
          this.reconnect(e);
          break;
      }
      this.onClose(e);
    });

    this.ws.addEventListener("error", (e) => {
      if (this.ws.__disposed) {
        return;
      }

      switch (e.code) {
        case "ECONNREFUSED":
          this.reconnect(e);
          break;
        default:
          this.onError(e);
          break;
      }
    });
  }

  onClose(e) {
    console.log(e);
  }
  onError(e) {
    console.log(e);
  }

  reconnect(e) {
    if (this.ws) {
      this.ws.__disposed = true;
    }
    console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e);

    setTimeout(() => {
      console.log("WebSocketClient: reconnecting...");
      this.open({ isReconnect: true });
    }, this.autoReconnectInterval);
  }

  ensureWS(fnc) {
    let tt = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        clearInterval(tt);
        fnc();
      }
    }, 0);
  }

  // api
  send(data) {
    this.ensureWS(() => {
      this.ws.send(JSON.stringify(data));
    });
  }

  on(event, handler) {
    this.addEventListener(event, handler);
  }

  once(event, handler) {
    let hh = (v) => {
      this.removeEventListener(event, v);
      handler(v);
    };
    this.addEventListener(event, hh);
  }

  off(event) {
    let arr = this.listeners.get(event) || [];
    arr.forEach((l) => {
      this.removeEventListener(event, l);
    });
  }

  offOne(event, handler) {
    this.removeEventListener(event, handler);
  }
}

// export const makeReceiverPeer = ({ url }) => {
//   let socket = new LambdaClient({
//     url: BASEURL_WS,
//   });

//   socket.send({
//     action: "join-room",
//     roomID: projectID,
//     userID: "ARClient",
//   });

//   let setupPeer = async () => {
//     let peer = new SimplePeer({
//       initiator: true,
//       trickle: false,
//     });

//     peer.once("signal", (sig) => {
//       socket.send({
//         action: "signal",
//         roomID: projectID,
//         userID: "ARClient",
//         connectionID: socket.connID,
//         signal: sig,
//       });
//       console.log(sig);
//     });

//     socket.once("signal", ({ connectionID, signal, userID }) => {
//       if (
//         connectionID === socket.connID &&
//         userID === "ENCloud" &&
//         !peer.destroyed
//       ) {
//         peer.signal(signal);
//       }
//     });

//     // socket.once("connect", () => {
//     //   console.log("connected");
//     // });

//     peer.once("close", () => {
//       peer.destroyed = true;
//     });
//     peer.once("error", () => {
//       peer.destroyed = true;
//     });

//     peer.once("connect", () => {
//       console.log("happyhappy connetec  at the AR Clinet");
//     });

//     peer.on("data", (v) => {
//       if (peer.destroyed) {
//         return;
//       }
//       let str = v.toString();
//       let obj = JSON.parse(str);

//       processJSON({
//         original: obj,
//         json: JSON.parse(obj.largeString),
//       });
//       // console.log("arrived");
//     });
//   };

//   socket.on("join-room", (resp) => {
//     socket.connID = resp.connectionID;
//     setupPeer();
//   });

//   socket.on("encloud-ready", () => {
//     socket.send({
//       action: "join-room",
//       roomID: projectID,
//       userID: "ARClient",
//     });
//   });
// };
