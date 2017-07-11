// This software is in the public domain.

export {add_tree};

// need to sort out JSON types: object, number, null, array, string
function type(i) {
  if (i === null || i === undefined) {
    return 'null'
  }
  else if (Boolean(i) === i) {
    return 'bool'
  }
  else if (Number(i) === i || Number.isNaN(i) || i === Infinity || i === -Infinity) {
    return 'number'
  }
  else if (String(i) === i) {
    return 'string'
  }
  else if (i instanceof Array) {
    return 'array'
  }
  else if (i instanceof Object) {
    return 'object'
  }
  else { throw ('unknown type for ' + String(i)) }
}

var item_handlers = {
  "null": add_null,
  "bool": add_bool,
  "string": add_string,
  "number": add_number,
  "array": add_array,
  "object": add_object
} 

function add_null(obj, name) {
  if (name != null) {this.append("label").text(name + ": ").classed('key', true)}
  this.append("span").classed("type-null", true).text(String(obj));
}

function add_string(obj, name) {
  if (name != null) {this.append("label").text(name + ": ").classed('key', true)}
  this.append("span").classed("quotes", true).text('"');
  this.append("span").classed("type-string", true).text(obj);
  this.append("span").classed("quotes", true).text('"');
}

function add_bool(obj, name) {
  if (name != null) {this.append("label").text(name + ": ").classed('key', true)}
  this.append("span").classed("type-bool", true).text(obj.toString());
}

function add_number(obj, name) {
  if (name != null) {this.append("label").text(name + ": ").classed('key', true)}
  this.append("span").classed("type-number", true).text(obj.toString());
}

function add_array(obj, name) {
  this.classed('hidden', true);
  this.append("span").html("&#9658;").classed("closed-indicator", true);
  this.append("span").html("&#9660;").classed("open-indicator", true);
  if (name != null) {this.append("label").text(name + ": ").classed('key', true)}
  this.append("span").text("Array(" + obj.length.toFixed() + ")")
  this.on("click", function() { d3.event.stopPropagation(); var li = d3.select(this); li.classed('hidden', !li.classed('hidden')); });
  var ol = this.append("ol").classed("type-array", true);
  obj.forEach(function(o,i) {
    var row = ol.append("li");
    item_handlers[type(o)].call(row, o, i.toFixed());
  });
}

function add_object(obj, name) {
  this.classed('hidden', true);
  this.append("span").html("&#9658;").classed("closed-indicator", true);
  this.append("span").html("&#9660;").classed("open-indicator", true);
  if (name != null) {this.append("label").text(name + ": ").classed('key', true)}
  this.append("span").text("Object ");
  this.on("click", function() { d3.event.stopPropagation(); var li = d3.select(this); li.classed('hidden', !li.classed('hidden')); });
  var keys = Object.keys(obj);
  var ul = this.append("ul").classed("type-object", true);
  keys.forEach(function(k) {
    var v = obj[k];
    var row = ul.append("li");
    //var label = row.append("label").text(k + ": ").classed('key', true);
    item_handlers[type(v)].call(row, v, k);
  });
}

function add_tree(target, obj) {
  target.classed('json-viewer', true);
  var li = target.append("li").classed("root-node", true);
  item_handlers[type(obj)].call(li, obj);
}
