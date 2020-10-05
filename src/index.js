import {
  Ptr,
  spinalCore
} from "./constants";
import {} from "spinal-env-viewer-plugin-forge/dist/Constants";
import SpinalCalNode from "./SpinalCalNode";
import SpinalCalculate from "./SpinalCalculate";
import config from "../config.json";

Object.defineProperty(Array.prototype, 'flat', {
  value: function(depth = 1) {
    return this.reduce(function(flat, toFlatten) {
      return flat.concat((Array.isArray(toFlatten) && (depth > 1)) ?
        toFlatten.flat(depth - 1) : toFlatten);
    }, []);
  }
});


class Main {
  constructor(username, password, host, port, filePath) {
    this.url = `http://${username}:${password}@${host}:${port}/`;
    this.path = filePath;
  }

  // getGraph(_file) {
  //   console.log("_file", _file)
  //   if (_file.graph instanceof Ptr) {
  //     return _file.graph.load();
  //   }
  //   return Promise.resolve(_file.graph);
  // }

  getBimObject(_graph) {

    return _graph.getContext("BimFileContext").then(async (
      BimFileContext) => {
      if (!BimFileContext) return;


      const bimFiles = await BimFileContext.getChildren("hasBimFile");
      const promises = bimFiles.map(async el => {
        let bimContexts = await el.getChildren("hasBimContext");

        const promises2 = bimContexts.map(context => {
          return context.getChildren("hasBimObject");
        })
        return Promise.all(promises2);
      })

      return Promise.all(promises).then((values) => {
        // console.log(values)
        const nodes = values.flat(10)
        return nodes.map(el => new SpinalCalNode(el))
      })

      // let bimObjects = [];
      // return bimContext.getChildren(["hasBIMObject"]).then((bims) => {
      //   bims.forEach((element) => {
      //     bimObjects.push(new SpinalCalNode(element));
      //   });
      //   return bimObjects;
      // });
    });
  }

  start() {
    spinalCore.load(spinalCore.connect(this.url), this.path, (graph) => {
      // this.getGraph(_file).then((graph) => {
      this.getBimObject(graph).then((bimObjects) => {
        new SpinalCalculate(bimObjects);
      });
    });
    // });
  }
}

let main = new Main(
  config.user,
  config.password,
  config.host,
  config.port,
  config.path
);

main.start();