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
    global.angleSliceInteractor = mod.exports;
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

  exports.default = angleSliceInteractor;


  function angleSliceInteractor(state, x, y) {
    // dispatch is the d3 event dispatcher: should have event "update" register
    // state: {cx: ..., cy: ..., angle_offset: ..., angle_range: ...}
    // angle is in pixel coords
    var name = state.name;
    var point_radius = state.point_radius == null ? 5 : state.point_radius;
    var dispatch = d3.dispatch("update");
    var x = x || d3.scale.linear();
    var y = y || d3.scale.linear();
    if (x.name != 'u' || y.name != 'u') {
      throw "angles only defined for linear scales";
      return;
    }

    var show_points = state.show_points == null ? true : state.show_points;
    var show_lines = state.show_lines == null ? true : state.show_lines;
    var show_center = state.show_center == null ? true : state.show_center;
    var cursor = fixed ? "auto" : "move";

    var angle_to_path = function angle_to_path(cx, cy, angle) {
      var yd = y.range(),
          xd = x.range(),
          rm = Math.sqrt(Math.pow(xd[1] - xd[0], 2) + Math.pow(yd[1] - yd[0], 2));

      var s = Math.sin(angle),
          c = Math.cos(angle),
          cxp = x(cx),
          cyp = y(cy);

      var y1 = cyp - rm * s,
          y2 = cyp + rm * s,
          x1 = cxp + rm * c,
          x2 = cxp - rm * c;

      var pathstring = "";
      // start in the center and draw to the edge
      pathstring += "M" + cxp.toFixed();
      pathstring += "," + cyp.toFixed();
      pathstring += "L" + x1.toFixed();
      pathstring += "," + y1.toFixed();
      if (state.mirror) {
        // and back to the center to draw the other sector
        pathstring += "M" + cxp.toFixed();
        pathstring += "," + cyp.toFixed();
        pathstring += "L" + x2.toFixed();
        pathstring += "," + y2.toFixed();
      }
      return pathstring;
    };

    var state_to_paths = function state_to_paths(state) {
      // convert from cx, cy, angle_offset and angle_range to paths for
      // boundaries and center lines

      // calculate angles of graph corners
      if (show_lines) {
        var centerline = angle_to_path(state.cx, state.cy, state.angle_offset),
            upperline = angle_to_path(state.cx, state.cy, state.angle_offset + state.angle_range),
            lowerline = angle_to_path(state.cx, state.cy, state.angle_offset - state.angle_range);

        return [{
          "path": centerline,
          "classname": "centerline"
        }, {
          "path": upperline,
          "classname": "upperline"
        }, {
          "path": lowerline,
          "classname": "lowerline"
        }];
      } else {
        return [];
      }
    };

    var state_to_center = function state_to_center(state) {
      if (show_center) {
        return [[state.cx, state.cy]];
      } else {
        return [];
      }
    };

    var drag_center = d3.behavior.drag().on("drag", dragmove_center).on("dragstart", function () {
      _d.event.sourceEvent.stopPropagation();
    });

    var drag_lines = d3.behavior.drag().on("drag", dragmove_lines).on("dragstart", function () {
      _d.event.sourceEvent.stopPropagation();
    });

    function interactor(selection) {
      var group = selection.append("g").classed("interactors interactor-" + name, true).style("cursor", cursor);
      var lines_group = group.append("g").attr("class", "lines_group").style("fill", "none").style("stroke", state.color1).style("stroke-width", "4px");

      var lines = lines_group.selectAll(".lines").data(state_to_paths(state)).enter().append("path").attr("class", function (d) {
        return d['classname'];
      }).classed("lines", true).attr("d", function (d) {
        return d['path'];
      });
      if (state.lines_fixed) lines.call(drag_lines);

      var center_group = group.append("g").classed("center_group", true).attr("fill", state.color1).selectAll("center").data(state_to_center(state)).enter().append("circle").classed("center", true).attr("r", point_radius).attr("cx", function (d) {
        return x(d[0]);
      }).attr("cy", function (d) {
        return y(d[1]);
      });
      if (state.center_fixed) center_group.call(drag_center);

      interactor.update = function (preventPropagation) {
        group.select('.center').attr("cx", x(state.cx)).attr("cy", y(state.cy));

        group.selectAll('.lines').data(state_to_paths(state)).attr("d", function (d) {
          return d['path'];
        });

        group.selectAll('.edge').data(state_to_paths(state)).attr("cx", function (d) {
          return x(d['cx']);
        }).attr("cy", function (d) {
          return y(d['cy']);
        }).attr("rx", function (d) {
          return Math.abs(x(d['rx'] + d['cx']) - x(d['cx']));
        }).attr("ry", function (d) {
          return Math.abs(y(d['ry'] + d['cy']) - y(d['cy']));
        });

        // fire!
        if (!preventPropagation) {
          dispatch.update();
        }
      };
    }

    function dragmove_corner(d) {
      var new_x = x.invert(_d.event.x),
          new_y = y.invert(_d.event.y);
      var vertex = parseInt(d3.select(this).attr("vertex"));
      // enforce relationship between corners:
      switch (vertex) {
        case 0:
          state.rx = new_x - state.cx;
          break;
        case 1:
          state.ry = new_y - state.cy;
          break;
        default:
      }
      interactor.update();
    }

    function dragmove_center() {
      state.cx = x.invert(x(state.cx) + _d.event.dx);
      state.cy = y.invert(y(state.cy) + _d.event.dy);
      interactor.update();
    }

    function dragmove_lines() {
      var new_angle = Math.atan2(y(state.cy) - _d.event.y, _d.event.x - x(state.cx));
      if (d3.select(this).classed("centerline")) {
        state.angle_offset = new_angle;
      } else if (d3.select(this).classed("upperline")) {
        state.angle_range = new_angle - state.angle_offset;
      } else if (d3.select(this).classed("lowerline")) {
        state.angle_range = -(new_angle - state.angle_offset);
      }
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