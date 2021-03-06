if (!d3.hasOwnProperty("id")) {
  d3.id = (function(){var a = 0; return function(){return a++}})();
}

function heatChart() {
  var debug=false;
  var margin = {top: 10, right: 10, bottom: 50, left: 50};
  var cb_margin = {top: 10, right: 50, bottom: 50, left: 10};
  var show_grid = true;
  var show_colorbar = true;
  var colorbar_width = 120;
  var numberOfTicks = 4;
  var aspect_ratio = null;
  var autoscale = false;
  var ztransform = 'linear',
    z = d3.scale[ztransform]();
    
  var dims = {
    xmin: 0,
    xmax: 1,
    ymin: 0, 
    ymax: 1,
    xdim: 512,
    ydim: 512,
    zmin: 1.0,
    zmax: 100.0
  }
  // create working copy of zmax and zmin, for zooming colorbar
  var zdims = {}
  var id = d3.id();
  
  var x = d3.scale.linear();
  var y = d3.scale.linear();
  var xAxis = d3.svg.axis();
  var yAxis = d3.svg.axis();
  var zAxis = d3.svg.axis();
  var xAxisGrid = d3.svg.axis();
  var yAxisGrid = d3.svg.axis();
  var colormap = jet_colormap;  
  
  var zoomed = function() {
    var svg = d3.select(this);
    var container = d3.select(svg.node().parentNode);
    var data = container.data();
    //console.log(container);
    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);
    svg.select(".grid.x").call(xAxisGrid);
    svg.select(".grid.y").call(yAxisGrid);
    container.select('canvas.mainplot').call(drawImage, data);
  }
  var zoom = d3.behavior.zoom().on("zoom.heatmap_"+ id.toFixed(), zoomed);
  var resetzoom = function() {
    zoom.translate([0,0]).scale(1);
    zoomed.call(this);
  }
  
  var cb_zoomed = function() {
    var svg = d3.select(this);
    svg.select(".z.axis").call(zAxis);
	  zdims.zmax = Math.max.apply(Math, z.domain());
	  zdims.zmin = Math.min.apply(Math, z.domain());
	  chart.redrawImage();
  }
  var cb_zoom = d3.behavior.zoom().on("zoom.colorbar_"+ id.toFixed(), cb_zoomed);
  var cb_resetzoom = function() {
    cb_zoom.translate([0,0]).scale(1);
    cb_zoomed.call(this);
  }
  
  var dispatch = d3.dispatch("update", "redrawImage");
  dispatch.on("redrawImage", function() {
        _redraw_backing = true;
        chart.redrawImage();
  });
  
  // some private working variables
  var backing_canvas = document.createElement('canvas');
  var colorbar_backing_canvas = document.createElement('canvas');
  var _redraw_backing = true;
  var _redraw_colorbar = true;
  var _colormap_array = [];

  function chart(selection) {
    selection.each(function(data) {
      var offset_right = (show_colorbar) ? colorbar_width + 5 : 0;
      var outercontainer = d3.select(this),
        innerwidth = outercontainer.node().clientWidth - offset_right,
        innerheight = outercontainer.node().clientHeight,
        width = innerwidth - margin.right - margin.left,
        height = innerheight - margin.top - margin.bottom;
      chart.outercontainer = outercontainer;
      chart.source_data = data;
      chart.update = function() { outercontainer.transition().call(chart); chart.colorbar.update(); };   
      
      if (autoscale) {
        var new_min_max = get_min_max(data, z);
        zdims.zmin = new_min_max.min;
        zdims.zmax = new_min_max.max;
      } else {
        zdims.zmin = dims.zmin;
        zdims.zmax = dims.zmax;
      }
      var plotdata = make_plotdata(data, dims, zdims, z);

      var limits = fixAspect(aspect_ratio, dims.xmin, dims.xmax, dims.ymin, dims.ymax, width, height);
      // Update the x-scale.
      x
        .domain([limits.xmin, limits.xmax])
        .range([0, width]);
        
      // Update the y-scale.
      y
        .domain([limits.ymin, limits.ymax])
        .range([height, 0]);
      
      xAxisGrid
        .scale(x)
        .orient("bottom")
        .ticks(numberOfTicks)
        .tickPadding(10)
        .tickSize(-height, 0, 0)
        .tickFormat("");
        
      yAxisGrid
        .scale(y)
        .ticks(numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)	
        .orient("left")
        .tickSize(-width, 0, 0)
        .tickFormat("")
      
      xAxis
        .scale(x)
        .ticks(numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)	
        .orient("bottom");
      
      yAxis
        .scale(y)
        .ticks(numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)	
        .orient("left");
        
        
      // we will bind data to the container div, a slightly non-standard
      // arrangement.
      var container = d3.select(this).selectAll("div.heatmap-container").data([data]);
      
      zoom.x(x).y(y);
      chart.resetzoom = resetzoom;
      chart.zoom = zoom;
      
      // if inner container doesn't exist, build it.
      container.enter().append("div")
        .attr("class", "heatmap-container")
        .attr("width", innerwidth)
        .attr("height", innerheight)
        .style("display", "inline-block")
        .style("width", innerwidth + "px")
        .style("height", innerheight + "px");
        
      var mainCanvas = container.selectAll("canvas.mainplot").data([plotdata]);
      mainCanvas.enter().append("canvas");
      mainCanvas
          .attr("width", width)
          .attr("height", height)
          .attr("class", "mainplot")
          .style("width", width + "px")
          .style("height", height + "px")
          .style("padding-left", margin.left + "px")
          .style("padding-right", margin.right + "px")
          .call(drawImage, plotdata);
                
      chart.mainCanvas = mainCanvas;
      
      var svg = container.selectAll("svg.mainplot").data([plotdata]);
      var esvg = svg.enter()
        .append("svg")
          .attr("class", "mainplot");
      esvg.append("g")
          .attr("class", "x axis");
      esvg.append("g")
          .attr("class", "y axis");
      esvg.append("g")
          .attr("class", "x grid");           
      esvg.append("g")
          .attr("class", "y grid");
      
      svg.select(".x.axis").call(xAxis);
      svg.select(".y.axis").call(yAxis);
      svg.select(".x.grid").call(xAxisGrid);
      svg.select(".y.grid").call(yAxisGrid);
      svg.call(zoom)
        .on("dblclick.zoom", null)
        .on("dblclick.resetzoom", resetzoom);
      
      svg.attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom);
                
      svg.selectAll("g.x")
        .attr("transform", "translate(" + margin.left + "," + height + ")");
      svg.selectAll("g.y")
        .attr("transform", "translate(" + margin.left + ",0)");    
    });
    selection.call(chart.colorbar);
  }
  
  chart.colorbar = function(selection) {
    selection.each(function(data) {      
      var outercontainer = d3.select(this),
        offset_left = 0,
        innerwidth = colorbar_width,
        innerheight = outercontainer.node().clientHeight,
        width = innerwidth - cb_margin.right,
        height = innerheight - cb_margin.top - cb_margin.bottom;
      //colorbar.name = "colorbar";
      chart.colorbar.outercontainer = outercontainer;
      
      
      // update the z axis
      z
        .domain([zdims.zmin, zdims.zmax])
        .range([height, 0]);
        
      zAxis
        .scale(z)
        .ticks(numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)	
        .orient("right");
        
      var cx = d3.scale.linear()
        .domain([0, 10])
        .range([0, width]);
        
      // we will bind data to the container div, a slightly non-standard
      // arrangement.
      var container = d3.select(this).selectAll("div.colorbar-container").data([0]);
     
      cb_zoom.y(z);
      chart.colorbar.resetzoom = cb_resetzoom;
      chart.colorbar.zoom = cb_zoom;
      
      // if inner container doesn't exist, build it.
      container.enter().append("div")
        .attr("class", "colorbar-container")
        .attr("width", innerwidth)
        .attr("height", innerheight)
        .style("display", "inline-block")
        .style("width", innerwidth + "px")
        .style("height", innerheight + "px");
        
      var colorbarCanvas = container.selectAll("canvas.colorbar").data([0]);
      colorbarCanvas.enter().append("canvas");
      colorbarCanvas
          .attr("width", width)
          .attr("height", height)
          .attr("class", "colorbar")
          .style("width", width + "px")
          .style("height", height + "px")
          .style("padding-left", offset_left + "px")
          .style("padding-right", cb_margin.right + "px")
          .call(drawScale);
                
      chart.colorbar.colorbarCanvas = colorbarCanvas;
      
      var svg = container.selectAll("svg.colorbar").data([0]);
      var esvg = svg.enter()
        .append("svg")
          .attr("class", "colorbar");
      esvg.append("g")
          .attr("class", "z axis");
    
      svg.select(".z.axis").call(zAxis);
      svg.call(cb_zoom)
        .on("dblclick.zoom", null)
        .on("dblclick.resetzoom", cb_resetzoom);
      
      svg.attr("width", width + cb_margin.left + cb_margin.right)
          .attr("height", height + cb_margin.top + cb_margin.bottom);
      
      svg.selectAll("g.z")
        .attr("transform", "translate(" + width + ",0)");
        
    });
  }
  chart.colorbar.update = function() { this.outercontainer.call(chart.colorbar); };   
  
  chart.colormap=function(_) {
    if (!arguments.length) return colormap;
    colormap = _;
    _colormap_array = [];
    for (var i=0; i<256; i++) {
        _colormap_array[i] = d3.rgb(colormap(i));
        _colormap_array[i].a = 255;
    }
    _colormap_array[256] = d3.rgb(0,0,0);
    _colormap_array[256].a = 0;
    _redraw_colorbar = true;
    return chart;
  };
  
  // cache the colormap:
  chart.colormap(colormap);

  chart.dispatch = dispatch;
  chart.redrawImage = function() {
    _redraw_backing = true;
    var plotdata = make_plotdata(this.source_data, dims, zdims, z);
    drawImage(this.mainCanvas, plotdata);
    return chart;
  };
  
  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.show_grid = function(_) {
    if (!arguments.length) return show_grid;
    show_grid = _;
    chart.outercontainer.selectAll(".grid").style(
      "display", (show_grid == true || show_grid == "true") ? "inline" : "none"
    );
    return chart;
  };
  
  chart.ztransform = function(_) {
    if (!arguments.length) return ztransform;
    ztransform = _;
    z = d3.scale[ztransform]();
    _redraw_backing = true;
    return chart;
  };
  
  chart.aspect_ratio = function(_) {
    if (!arguments.length) return aspect_ratio;
    aspect_ratio = _;
    return chart;
  };
  
  chart.dims = function(_) {
    if (!arguments.length) return dims;
    dims = _;
    return chart;
  };
  
  chart.zdims = function(_) {
    if (!arguments.length) return zdims;
    zdims = _;
    return chart;
  };
  
  chart.autoscale = function(_) {
    if (!arguments.length) return autoscale;
    autoscale = _;
    return chart;
  };
  
  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.x = function(_) {
    if (!arguments.length) return x;
    x = _;
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return y;
    y = _;
    return chart;
  };
  
  chart.z = function(_) {
    if (!arguments.length) return z;
    z = _;
    return chart;
  };

  var get_sxdx = function(){
    var delta_x = (dims.xmax - dims.xmin)/(dims.xdim),
        delta_y = (dims.ymax - dims.ymin)/(dims.ydim);
    
    graph_xmax = Math.max.apply(Math, x.domain());
    graph_xmin = Math.min.apply(Math, x.domain());
    graph_ymax = Math.max.apply(Math, y.domain());
    graph_ymin = Math.min.apply(Math, y.domain());
    
    var xmin = Math.max(graph_xmin, dims.xmin), xmax = Math.min(graph_xmax, dims.xmax);
    var ymin = Math.max(graph_ymin, dims.ymin), ymax = Math.min(graph_ymax, dims.ymax);
    if (debug) {
      console.log('x', xmin,xmax, 'y', ymin,ymax, 'w', (xmax-xmin), 'h', (ymax-ymin));
      console.log('dims', dims);
    }
    
    var sx  = (xmin - dims.xmin)/delta_x, sy  = (dims.ymax - ymax)/delta_y,
      sx2 = (xmax - dims.xmin)/delta_x, sy2 = (dims.ymax - ymin)/delta_y,
      sw = sx2 - sx, sh = sy2 - sy;
    if (debug)
      console.log('sx', sx, 'sy', sy, 'sw', sw, 'sh', sh, '   sx2 ', sx2, 'sy2 ', sy2);
    
    var dx = x(xmin),
      dy = y(ymax),
      dw = x(xmax) - dx, 
      dh = y(ymin) - dy;
    if (debug)
      console.log('dx', dx, 'dy', dy, 'dw', dw, 'dh', dh);
    return {sx:sx, sy:sy, sw:sw, sh:sh, dx:dx, dy:dy, dw:dw, dh:dh}
  };
  
  var fixAspect = function(aspect_ratio, xmin, xmax, ymin, ymax, width, height) {
    if (aspect_ratio == null) {
      return {'xmin': xmin, 'xmax': xmax, 'ymin': ymin, 'ymax': ymax}
    }
    var yrange = (ymax - ymin);
    var ycenter = (ymax + ymin) / 2.0;
    var xrange = (xmax - xmin);
    var xcenter = (xmax + xmin) / 2.0;
    var graph_ratio = width / height;
    var ratio = yrange/xrange * graph_ratio;
    //console.log('ratios:', ratio, aspect_ratio);
    if (isNaN(ratio) || ratio == aspect_ratio) { return };
    if (ratio < aspect_ratio) { // y-range is too small
        yrange = aspect_ratio * xrange / graph_ratio;
    }
    if (ratio > aspect_ratio) {
        xrange = yrange / aspect_ratio * graph_ratio;
    }
            
    //console.log('ranges:', yrange, xrange);
    output = {
        'xmin': xcenter - xrange/2.0, 
        'xmax': xcenter + xrange/2.0,
        'ymin': ycenter - yrange/2.0, 
        'ymax': ycenter + yrange/2.0
    }
    return output;
  };
  
  // Compute the pixel colors; scaled by CSS.
  function drawImage(canvas, plotdata) {
    var maxColorIndex = 255,
      overflowIndex = 256,
      context = canvas.node().getContext("2d"),
      ctx = backing_canvas.getContext("2d");
        
    if (_redraw_backing) {
      _redraw_backing = false;        
      backing_canvas.width = dims.xdim;
      backing_canvas.height = dims.ydim;
      var image = ctx.createImageData(dims.xdim, dims.ydim);
      var data = image.data;
      var yp, pdy;
      for (var yt = 0, p = -1; yt < dims.ydim; ++yt) {
        yp = dims.ydim - 1 - yt; // y-axis starts at the top!
        pdy = plotdata[yp];
        for (var xp = 0; xp < dims.xdim; ++xp) {
          var c = _colormap_array[pdy[xp]];
          /*
          data[++p] = c[0];
          data[++p] = c[1];
          data[++p] = c[2];
          data[++p] = c[3];
          */
          data[++p] = c.r;
          data[++p] = c.g;
          data[++p] = c.b;
          data[++p] = c.a;
        }
      }
      ctx.putImageData(image, 0, 0);
    }
    
	//context.mozImageSmoothingEnabled = false;
	//context.webkitImageSmoothingEnabled = false;
	//context.msImageSmoothingEnabled = false;
	//context.imageSmoothingEnabled = false;
	var x0=x(dims.xmin),
	    y0=y(dims.ymin),
	    x1=x(dims.xmax),
	    y1=y(dims.ymax);
	   
    context.clearRect(0,0, context.canvas.width, context.canvas.height);
    if (context.mozImageSmoothingEnabled) context.mozImageSmoothingEnabled = false;
    if (context.imageSmoothingEnabled) context.imageSmoothingEnabled = false;
    var sxdx = get_sxdx();
    context.drawImage(ctx.canvas, sxdx.sx, sxdx.sy, sxdx.sw, sxdx.sh, sxdx.dx, sxdx.dy, sxdx.dw, sxdx.dh);
  }
  
  // Compute the pixel colors; scaled by CSS.
  function drawScale(canvas) {
    var maxColorIndex = 255,
      overflowIndex = 256,
      context = canvas.node().getContext("2d"),
      ctx = colorbar_backing_canvas.getContext("2d");        
    if (_redraw_colorbar) {
      _redraw_colorbar = false;        
      colorbar_backing_canvas.width = 1;
      colorbar_backing_canvas.height = 256;
      var image = ctx.createImageData(1, 256);
      var data = image.data;
      for (var yp = 255, p = -1; yp >= 0; --yp) {
        var c = _colormap_array[yp];
        data[++p] = c.r;
        data[++p] = c.g;
        data[++p] = c.b;
        data[++p] = c.a;
      }
      ctx.putImageData(image, 0, 0);
    }
     
    context.clearRect(0,0, context.canvas.width, context.canvas.height);
    if (context.mozImageSmoothingEnabled) context.mozImageSmoothingEnabled = false;
    if (context.imageSmoothingEnabled) context.imageSmoothingEnabled = false;
    context.drawImage(ctx.canvas, 0, 0, 1, 256, 0, 0, context.canvas.width, context.canvas.height);
  }
  
  // call after setting transform
  var make_plotdata = function(source_data, dims, clim, t) {
    // source_data is 2d array
    // dims is object with dim, max and min for x,y,z
    // t is transform (is function(x) {return x} for linear)
    var maxColorIndex = 255;
    var overflowIndex = 256;
    var width = dims.xdim;
    var height = dims.ydim;
    var tzmax = t(clim.zmax);
    var tzmin = t(clim.zmin);
    var data = source_data; 
    var plotdata = [], rowdata;
    
    // plotdata is stored in row-major order ("C"), where row is "y"
    var z, r, c, plotz;
    for (r = 0; r < height; r++) {
      plotdata[r] = [];
      for (c = 0; c < width; c++) {
        z = data[r][c];
        plotz = Math.floor(((t(z) - tzmin) / (tzmax - tzmin)) * maxColorIndex);
        
        if (isNaN(plotz) || (z == null)) { plotz = overflowIndex }
        else if (plotz > maxColorIndex) { plotz = maxColorIndex }
        else if (plotz < 0) { plotz = 0 }
        plotdata[r][c]=plotz;
      }
      //plotdata[r] = rowdata.slice();
    }
    _redraw_backing = true;
    return plotdata
  };
  
  
  function get_min_max(array, transform, existing_min, existing_max) {
    var new_min_max = {min: existing_min, max: existing_max};
    for (var i=0; i<array.length; i++) {
      var subarr = array[i];
      if (subarr == null) { return {min: existing_min, max: existing_max} }
      if (!subarr.hasOwnProperty('length')) {
        var t_el = transform(subarr);
        if (isFinite(t_el)) {
          new_min_max = {min: subarr, max: subarr};
        }
      } else {
        new_min_max = get_min_max(subarr, transform, existing_min, existing_max);
      }
      if (existing_min == undefined || new_min_max.min < existing_min) {
        var existing_min = new_min_max.min;
      }
      if (existing_max == undefined || new_min_max.max > existing_max) {
        var existing_max = new_min_max.max;
      }
      //console.log(i, existing_min);
    }
    return {min: existing_min, max: existing_max}
  };
  
  return chart
  
}

var jet_colormap = d3.scale.linear()
    .domain([0, 31, 63, 95, 127, 159, 191, 223, 255])
    /* Jet:
      #00007F: dark blue
      #0000FF: blue
      #007FFF: azure
      #00FFFF: cyan
      #7FFF7F: light green
      #FFFF00: yellow
      #FF7F00: orange
      #FF0000: red
      #7F0000: dark red
      #00000000: transparent for overflow
    */
    .range(["#00007F", "#0000FF","#007FFF", "#00FFFF","#7FFF7F","#FFFF00","#FF7F00","#FF0000","#7F0000"]);
