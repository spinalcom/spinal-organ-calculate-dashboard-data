import {
  Ptr,
  spinalCore
} from "./constants";


import SpinalCalNode from "./SpinalCalNode";
import SpinalCalculate from './SpinalCalculate'

import config from "../config.json";


class Main {

  constructor(username, password, host, port, filePath) {
    this.url = `http://${username}:${password}@${host}:${port}/`;
    this.path = filePath;
  }

  getGraph(_file) {

    if (_file.graph instanceof Ptr) {
      return _file.graph.load();
    }
    return Promise.resolve(_file.graph);

  }

  getBimObject(_graph) {
    return _graph.getContext("BIMObjectContext")
      .then(bimContext => {
        let bimObjects = [];
        return bimContext.getChildren(["hasBIMObject"]).then(bims => {
          bims.forEach(element => {
            bimObjects.push(new SpinalCalNode(element));
          });
          return bimObjects;
        })

      })
  }

  start() {
    spinalCore.load(spinalCore.connect(this.url), this.path, _file => {
      this.getGraph(_file).then(graph => {
        this.getBimObject(graph).then(bimObjects => {
          new SpinalCalculate(bimObjects);
        })
      })
    })
  }




}



let main = new Main(config.user, config.password, config.host, config.port,
  config.path);

main.start();