"use strict";

var _constants = require("./constants");

require("spinal-env-viewer-plugin-forge/dist/Constants");

var _SpinalCalNode = require("./SpinalCalNode");

var _SpinalCalNode2 = _interopRequireDefault(_SpinalCalNode);

var _SpinalCalculate = require("./SpinalCalculate");

var _SpinalCalculate2 = _interopRequireDefault(_SpinalCalculate);

var _config = require("../config.json");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

Object.defineProperty(Array.prototype, 'flat', {
  value: function (depth = 1) {
    return this.reduce(function (flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) && depth > 1 ? toFlatten.flat(depth - 1) : toFlatten);
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

    return _graph.getContext("BimFileContext").then((() => {
      var _ref = _asyncToGenerator(function* (BimFileContext) {
        if (!BimFileContext) return;

        const bimFiles = yield BimFileContext.getChildren("hasBimFile");
        const promises = bimFiles.map((() => {
          var _ref2 = _asyncToGenerator(function* (el) {
            let bimContexts = yield el.getChildren("hasBimContext");

            const promises2 = bimContexts.map(function (context) {
              return context.getChildren("hasBimObject");
            });
            return Promise.all(promises2);
          });

          return function (_x2) {
            return _ref2.apply(this, arguments);
          };
        })());

        return Promise.all(promises).then(function (values) {
          // console.log(values)
          const nodes = values.flat(10);
          return nodes.map(function (el) {
            return new _SpinalCalNode2.default(el);
          });
        });

        // let bimObjects = [];
        // return bimContext.getChildren(["hasBIMObject"]).then((bims) => {
        //   bims.forEach((element) => {
        //     bimObjects.push(new SpinalCalNode(element));
        //   });
        //   return bimObjects;
        // });
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    })());
  }

  start() {
    _constants.spinalCore.load(_constants.spinalCore.connect(this.url), this.path, graph => {
      // this.getGraph(_file).then((graph) => {
      this.getBimObject(graph).then(bimObjects => {
        new _SpinalCalculate2.default(bimObjects);
      });
    });
    // });
  }
}

let main = new Main(_config2.default.user, _config2.default.password, _config2.default.host, _config2.default.port, _config2.default.path);

main.start();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsIkFycmF5IiwicHJvdG90eXBlIiwidmFsdWUiLCJkZXB0aCIsInJlZHVjZSIsImZsYXQiLCJ0b0ZsYXR0ZW4iLCJjb25jYXQiLCJpc0FycmF5IiwiTWFpbiIsImNvbnN0cnVjdG9yIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsImhvc3QiLCJwb3J0IiwiZmlsZVBhdGgiLCJ1cmwiLCJwYXRoIiwiZ2V0QmltT2JqZWN0IiwiX2dyYXBoIiwiZ2V0Q29udGV4dCIsInRoZW4iLCJCaW1GaWxlQ29udGV4dCIsImJpbUZpbGVzIiwiZ2V0Q2hpbGRyZW4iLCJwcm9taXNlcyIsIm1hcCIsImVsIiwiYmltQ29udGV4dHMiLCJwcm9taXNlczIiLCJjb250ZXh0IiwiUHJvbWlzZSIsImFsbCIsInZhbHVlcyIsIm5vZGVzIiwiU3BpbmFsQ2FsTm9kZSIsInN0YXJ0Iiwic3BpbmFsQ29yZSIsImxvYWQiLCJjb25uZWN0IiwiZ3JhcGgiLCJiaW1PYmplY3RzIiwiU3BpbmFsQ2FsY3VsYXRlIiwibWFpbiIsImNvbmZpZyIsInVzZXIiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBSUE7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7OztBQUVBQSxPQUFPQyxjQUFQLENBQXNCQyxNQUFNQyxTQUE1QixFQUF1QyxNQUF2QyxFQUErQztBQUM3Q0MsU0FBTyxVQUFTQyxRQUFRLENBQWpCLEVBQW9CO0FBQ3pCLFdBQU8sS0FBS0MsTUFBTCxDQUFZLFVBQVNDLElBQVQsRUFBZUMsU0FBZixFQUEwQjtBQUMzQyxhQUFPRCxLQUFLRSxNQUFMLENBQWFQLE1BQU1RLE9BQU4sQ0FBY0YsU0FBZCxLQUE2QkgsUUFBUSxDQUF0QyxHQUNqQkcsVUFBVUQsSUFBVixDQUFlRixRQUFRLENBQXZCLENBRGlCLEdBQ1dHLFNBRHZCLENBQVA7QUFFRCxLQUhNLEVBR0osRUFISSxDQUFQO0FBSUQ7QUFONEMsQ0FBL0M7O0FBVUEsTUFBTUcsSUFBTixDQUFXO0FBQ1RDLGNBQVlDLFFBQVosRUFBc0JDLFFBQXRCLEVBQWdDQyxJQUFoQyxFQUFzQ0MsSUFBdEMsRUFBNENDLFFBQTVDLEVBQXNEO0FBQ3BELFNBQUtDLEdBQUwsR0FBWSxVQUFTTCxRQUFTLElBQUdDLFFBQVMsSUFBR0MsSUFBSyxJQUFHQyxJQUFLLEdBQTFEO0FBQ0EsU0FBS0csSUFBTCxHQUFZRixRQUFaO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUFHLGVBQWFDLE1BQWIsRUFBcUI7O0FBRW5CLFdBQU9BLE9BQU9DLFVBQVAsQ0FBa0IsZ0JBQWxCLEVBQW9DQyxJQUFwQztBQUFBLG1DQUF5QyxXQUM5Q0MsY0FEOEMsRUFDM0I7QUFDbkIsWUFBSSxDQUFDQSxjQUFMLEVBQXFCOztBQUdyQixjQUFNQyxXQUFXLE1BQU1ELGVBQWVFLFdBQWYsQ0FBMkIsWUFBM0IsQ0FBdkI7QUFDQSxjQUFNQyxXQUFXRixTQUFTRyxHQUFUO0FBQUEsd0NBQWEsV0FBTUMsRUFBTixFQUFZO0FBQ3hDLGdCQUFJQyxjQUFjLE1BQU1ELEdBQUdILFdBQUgsQ0FBZSxlQUFmLENBQXhCOztBQUVBLGtCQUFNSyxZQUFZRCxZQUFZRixHQUFaLENBQWdCLG1CQUFXO0FBQzNDLHFCQUFPSSxRQUFRTixXQUFSLENBQW9CLGNBQXBCLENBQVA7QUFDRCxhQUZpQixDQUFsQjtBQUdBLG1CQUFPTyxRQUFRQyxHQUFSLENBQVlILFNBQVosQ0FBUDtBQUNELFdBUGdCOztBQUFBO0FBQUE7QUFBQTtBQUFBLGFBQWpCOztBQVNBLGVBQU9FLFFBQVFDLEdBQVIsQ0FBWVAsUUFBWixFQUFzQkosSUFBdEIsQ0FBMkIsVUFBQ1ksTUFBRCxFQUFZO0FBQzVDO0FBQ0EsZ0JBQU1DLFFBQVFELE9BQU81QixJQUFQLENBQVksRUFBWixDQUFkO0FBQ0EsaUJBQU82QixNQUFNUixHQUFOLENBQVU7QUFBQSxtQkFBTSxJQUFJUyx1QkFBSixDQUFrQlIsRUFBbEIsQ0FBTjtBQUFBLFdBQVYsQ0FBUDtBQUNELFNBSk0sQ0FBUDs7QUFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNELE9BNUJNOztBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQVA7QUE2QkQ7O0FBRURTLFVBQVE7QUFDTkMsMEJBQVdDLElBQVgsQ0FBZ0JELHNCQUFXRSxPQUFYLENBQW1CLEtBQUt2QixHQUF4QixDQUFoQixFQUE4QyxLQUFLQyxJQUFuRCxFQUEwRHVCLEtBQUQsSUFBVztBQUNsRTtBQUNBLFdBQUt0QixZQUFMLENBQWtCc0IsS0FBbEIsRUFBeUJuQixJQUF6QixDQUErQm9CLFVBQUQsSUFBZ0I7QUFDNUMsWUFBSUMseUJBQUosQ0FBb0JELFVBQXBCO0FBQ0QsT0FGRDtBQUdELEtBTEQ7QUFNQTtBQUNEO0FBdkRROztBQTBEWCxJQUFJRSxPQUFPLElBQUlsQyxJQUFKLENBQ1RtQyxpQkFBT0MsSUFERSxFQUVURCxpQkFBT2hDLFFBRkUsRUFHVGdDLGlCQUFPL0IsSUFIRSxFQUlUK0IsaUJBQU85QixJQUpFLEVBS1Q4QixpQkFBTzNCLElBTEUsQ0FBWDs7QUFRQTBCLEtBQUtQLEtBQUwiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBQdHIsXG4gIHNwaW5hbENvcmVcbn0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5pbXBvcnQge30gZnJvbSBcInNwaW5hbC1lbnYtdmlld2VyLXBsdWdpbi1mb3JnZS9kaXN0L0NvbnN0YW50c1wiO1xuaW1wb3J0IFNwaW5hbENhbE5vZGUgZnJvbSBcIi4vU3BpbmFsQ2FsTm9kZVwiO1xuaW1wb3J0IFNwaW5hbENhbGN1bGF0ZSBmcm9tIFwiLi9TcGluYWxDYWxjdWxhdGVcIjtcbmltcG9ydCBjb25maWcgZnJvbSBcIi4uL2NvbmZpZy5qc29uXCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheS5wcm90b3R5cGUsICdmbGF0Jywge1xuICB2YWx1ZTogZnVuY3Rpb24oZGVwdGggPSAxKSB7XG4gICAgcmV0dXJuIHRoaXMucmVkdWNlKGZ1bmN0aW9uKGZsYXQsIHRvRmxhdHRlbikge1xuICAgICAgcmV0dXJuIGZsYXQuY29uY2F0KChBcnJheS5pc0FycmF5KHRvRmxhdHRlbikgJiYgKGRlcHRoID4gMSkpID9cbiAgICAgICAgdG9GbGF0dGVuLmZsYXQoZGVwdGggLSAxKSA6IHRvRmxhdHRlbik7XG4gICAgfSwgW10pO1xuICB9XG59KTtcblxuXG5jbGFzcyBNYWluIHtcbiAgY29uc3RydWN0b3IodXNlcm5hbWUsIHBhc3N3b3JkLCBob3N0LCBwb3J0LCBmaWxlUGF0aCkge1xuICAgIHRoaXMudXJsID0gYGh0dHA6Ly8ke3VzZXJuYW1lfToke3Bhc3N3b3JkfUAke2hvc3R9OiR7cG9ydH0vYDtcbiAgICB0aGlzLnBhdGggPSBmaWxlUGF0aDtcbiAgfVxuXG4gIC8vIGdldEdyYXBoKF9maWxlKSB7XG4gIC8vICAgY29uc29sZS5sb2coXCJfZmlsZVwiLCBfZmlsZSlcbiAgLy8gICBpZiAoX2ZpbGUuZ3JhcGggaW5zdGFuY2VvZiBQdHIpIHtcbiAgLy8gICAgIHJldHVybiBfZmlsZS5ncmFwaC5sb2FkKCk7XG4gIC8vICAgfVxuICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoX2ZpbGUuZ3JhcGgpO1xuICAvLyB9XG5cbiAgZ2V0QmltT2JqZWN0KF9ncmFwaCkge1xuXG4gICAgcmV0dXJuIF9ncmFwaC5nZXRDb250ZXh0KFwiQmltRmlsZUNvbnRleHRcIikudGhlbihhc3luYyAoXG4gICAgICBCaW1GaWxlQ29udGV4dCkgPT4ge1xuICAgICAgaWYgKCFCaW1GaWxlQ29udGV4dCkgcmV0dXJuO1xuXG5cbiAgICAgIGNvbnN0IGJpbUZpbGVzID0gYXdhaXQgQmltRmlsZUNvbnRleHQuZ2V0Q2hpbGRyZW4oXCJoYXNCaW1GaWxlXCIpO1xuICAgICAgY29uc3QgcHJvbWlzZXMgPSBiaW1GaWxlcy5tYXAoYXN5bmMgZWwgPT4ge1xuICAgICAgICBsZXQgYmltQ29udGV4dHMgPSBhd2FpdCBlbC5nZXRDaGlsZHJlbihcImhhc0JpbUNvbnRleHRcIik7XG5cbiAgICAgICAgY29uc3QgcHJvbWlzZXMyID0gYmltQ29udGV4dHMubWFwKGNvbnRleHQgPT4ge1xuICAgICAgICAgIHJldHVybiBjb250ZXh0LmdldENoaWxkcmVuKFwiaGFzQmltT2JqZWN0XCIpO1xuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMyKTtcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigodmFsdWVzKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHZhbHVlcylcbiAgICAgICAgY29uc3Qgbm9kZXMgPSB2YWx1ZXMuZmxhdCgxMClcbiAgICAgICAgcmV0dXJuIG5vZGVzLm1hcChlbCA9PiBuZXcgU3BpbmFsQ2FsTm9kZShlbCkpXG4gICAgICB9KVxuXG4gICAgICAvLyBsZXQgYmltT2JqZWN0cyA9IFtdO1xuICAgICAgLy8gcmV0dXJuIGJpbUNvbnRleHQuZ2V0Q2hpbGRyZW4oW1wiaGFzQklNT2JqZWN0XCJdKS50aGVuKChiaW1zKSA9PiB7XG4gICAgICAvLyAgIGJpbXMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgLy8gICAgIGJpbU9iamVjdHMucHVzaChuZXcgU3BpbmFsQ2FsTm9kZShlbGVtZW50KSk7XG4gICAgICAvLyAgIH0pO1xuICAgICAgLy8gICByZXR1cm4gYmltT2JqZWN0cztcbiAgICAgIC8vIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhcnQoKSB7XG4gICAgc3BpbmFsQ29yZS5sb2FkKHNwaW5hbENvcmUuY29ubmVjdCh0aGlzLnVybCksIHRoaXMucGF0aCwgKGdyYXBoKSA9PiB7XG4gICAgICAvLyB0aGlzLmdldEdyYXBoKF9maWxlKS50aGVuKChncmFwaCkgPT4ge1xuICAgICAgdGhpcy5nZXRCaW1PYmplY3QoZ3JhcGgpLnRoZW4oKGJpbU9iamVjdHMpID0+IHtcbiAgICAgICAgbmV3IFNwaW5hbENhbGN1bGF0ZShiaW1PYmplY3RzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8vIH0pO1xuICB9XG59XG5cbmxldCBtYWluID0gbmV3IE1haW4oXG4gIGNvbmZpZy51c2VyLFxuICBjb25maWcucGFzc3dvcmQsXG4gIGNvbmZpZy5ob3N0LFxuICBjb25maWcucG9ydCxcbiAgY29uZmlnLnBhdGhcbik7XG5cbm1haW4uc3RhcnQoKTsiXX0=