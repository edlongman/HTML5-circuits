// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.

/**
 * innerHTML property for SVGElement
 * Copyright(c) 2010, Jeff Schiller
 *
 * Licensed under the Apache License, Version 2
 *
 * Works in a SVG document in Chrome 6+, Safari 5+, Firefox 4+ and IE9+.
 * Works in a HTML5 document in Chrome 7+, Firefox 4+ and IE9+.
 * Does not work in Opera since it doesn't support the SVGElement interface yet.
 *
 * I haven't decided on the best name for this property - thus the duplication.
 */

(function() {
var serializeXML = function(node, output) {
  var nodeType = node.nodeType;
  if (nodeType == 3) { // TEXT nodes.
    // Replace special XML characters with their entities.
    output.push(node.textContent.replace(/&/, '&amp;').replace(/</, '&lt;').replace('>', '&gt;'));
  } else if (nodeType == 1) { // ELEMENT nodes.
    // Serialize Element nodes.
    output.push('<', node.tagName);
    if (node.hasAttributes()) {
      var attrMap = node.attributes;
      for (var i = 0, len = attrMap.length; i < len; ++i) {
        var attrNode = attrMap.item(i);
        output.push(' ', attrNode.name, '=\'', attrNode.value, '\'');
      }
    }
    if (node.hasChildNodes()) {
      output.push('>');
      var childNodes = node.childNodes;
      for (var i = 0, len = childNodes.length; i < len; ++i) {
        serializeXML(childNodes.item(i), output);
      }
      output.push('</', node.tagName, '>');
    } else {
      output.push('/>');
    }
  } else if (nodeType == 8) {
    // TODO(codedread): Replace special characters with XML entities?
    output.push('<!--', node.nodeValue, '-->');
  } else {
    // TODO: Handle CDATA nodes.
    // TODO: Handle ENTITY nodes.
    // TODO: Handle DOCUMENT nodes.
    throw 'Error serializing XML. Unhandled node of type: ' + nodeType;
  }
}
// The innerHTML DOM property for SVGElement.
Object.defineProperty(SVGElement.prototype, 'innerHTML', {
  get: function() {
    var output = [];
    var childNode = this.firstChild;
    while (childNode) {
      serializeXML(childNode, output);
      childNode = childNode.nextSibling;
    }
    return output.join('');
  },
  set: function(markupText) {
    // Wipe out the current contents of the element.
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    try {
      // Parse the markup into valid nodes.
      var dXML = new DOMParser();
      dXML.async = false;
      // Wrap the markup into a SVG node to ensure parsing works.
      sXML = '<svg xmlns=\'http://www.w3.org/2000/svg\'>' + markupText + '</svg>';
      var svgDocElement = dXML.parseFromString(sXML, 'text/xml').documentElement;

      // Now take each node, import it and append to this element.
      var childNode = svgDocElement.firstChild;
      while(childNode) {
        this.appendChild(this.ownerDocument.importNode(childNode, true));
        childNode = childNode.nextSibling;
      }
    } catch(e) {
      throw new Error('Error parsing XML string');
    };
  }
});

// The innerSVG DOM property for SVGElement.
Object.defineProperty(SVGElement.prototype, 'innerSVG', {
  get: function() {
    return this.innerHTML;
  },
  set: function(markupText) {
    this.innerHTML = markupText;
  }
});

})();
//End of innerHTML for SVG


// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};