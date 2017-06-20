(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'd3'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('d3'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.d3);
    global.polygonInteractor = mod.exports;
  }
})(this, function (exports, _d) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var d3 = _interopRequireWildcard(_d);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  exports.default = polygonInteractor;


  function polygonInteractor(state, x, y) {
    // x, y are d3.scale objects (linear, log, etc) from parent
    // dispatch is the d3 event dispatcher: should have event "update" register
    //var state = options;
    var name = state.name;
    var radius = state.radius == null ? 5 : state.radius;
    var event_name = "polygon." + state.name;
    var dispatch = d3.dispatch("update");
    var x = x || d3.scale.linear();
    var y = y || d3.scale.linear();
    var interpolation = state.interpolation == null ? 'linear' : state.interpolation;
    var prevent_crossing = state.prevent_crossing == null ? false : state.prevent_crossing;
    var fixed = state.fixed == null ? false : state.fixed;
    var cursor = fixed ? "auto" : "move";

    var line = d3.svg.line().x(function (d) {
      return x(d[0]);
    }).y(function (d) {
      return y(d[1]);
    }).interpolate(interpolation);

    var drag_corner = d3.behavior.drag().on("drag", dragmove_corner).on("dragstart", function () {
      _d.event.sourceEvent.stopPropagation();
    });

    function interactor(selection) {
      var group = selection.append("g").classed("interactors interactor-" + name, true).style("cursor", cursor);
      var edge_group = group.append("g").attr("class", "edges").style("stroke", state.color1).style("stroke-linecap", "round").style("stroke-width", "4px").style("fill", "none");
      //if (!fixed) edges.call(drag_edge);

      var corner_group = group.append("g").classed("corners", true).attr("fill", state.color1);

      interactor.update = function () {

        var corners = corner_group.selectAll('.corner').data(state.points);
        var new_corners = corners.enter().append("circle").classed("corner", true).attr("vertex", function (d, i) {
          return i.toFixed();
        }).attr("r", radius);
        if (!fixed) new_corners.call(drag_corner);
        corners.attr("cx", function (d) {
          return x(d[0]);
        }).attr("cy", function (d) {
          return y(d[1]);
        }).attr("visibility", state.show_points ? "visible" : "hidden");
        corners.exit().remove();

        var edge_data = state.close_path && state.points.length > 1 ? state.points.concat([state.points[0]]) : state.points;
        var edges = edge_group.selectAll('.edge').data([edge_data]);
        edges.enter().append("path").classed("edge", true).attr("side", function (d, i) {
          return i.toFixed();
        });
        edges.attr("d", line).attr("visibility", state.show_lines ? "visible" : "hidden");
        edges.exit().remove();

        // fire!
        dispatch.update();
      };

      interactor.update();
    }

    function dragmove_corner(d, i) {
      var new_x = x.invert(_d.event.x),
          new_y = y.invert(_d.event.y);
      var sp = state.points;
      if (prevent_crossing && sp[i + 1] != null && sp[i + 1][0] <= new_x) {
        new_x = sp[i + 1][0];
      }
      if (prevent_crossing && sp[i - 1] != null && sp[i - 1][0] >= new_x) {
        new_x = sp[i - 1][0];
      }
      state.points[i] = [new_x, new_y];
      interactor.update();
    }

    interactor.x = function (_) {
      if (!arguments.length) return x;
      x = _;
      return interactor;
    };

    interactor.y = function (_) {
      if (!arguments.length) return y;
      y = _;
      return interactor;
    };

    interactor.state = state;
    interactor.dispatch = dispatch;

    return interactor;
  }
});
