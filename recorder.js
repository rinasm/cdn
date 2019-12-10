"use strict";

function _instanceof(left, right) { if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) { return !!right[Symbol.hasInstance](left); } else { return left instanceof right; } }

function _classCallCheck(instance, Constructor) { if (!_instanceof(instance, Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var config = {
  attributes: true,
  childList: true,
  characterData: true,
  subtree: true
};
var observer;
var currentNodeId = 1;
var data = [];
var eventListener = null;
var cssRules = '';
var inputNodeNames = ['TEXTAREA', 'INPUT']; // let domRef = null;

var eventTypes = {
  snapshot: 'snapshot',
  characterData: 'characterData',
  childList: 'childList',
  attributes: 'attributes',
  scroll: 'scroll',
  inputValue: 'inputValue',
  mouseClick: 'mouseClick',
  mouseMove: 'mouseMove',
  assetLoaded: 'assetLoaded',
  styleSheetsLoadReq: 'styleSheetsLoadReq'
};

var Recorder =
/*#__PURE__*/
function () {
  function Recorder() {
    var _this = this;

    _classCallCheck(this, Recorder);

    _defineProperty(this, "start", function (node) {
      // domRef = node;
      _this.recordStyle();

      _this.bindScroll(window);

      _this.bindMouseEvent(document);

      _this.takeSnapshot(node, true);

      observer = new MutationObserver(function (mutations) {
        _this.handleMutations(mutations);
      });
      observer.observe(node, config);
    });

    _defineProperty(this, "getRCIDFromEl", function (el) {
      return el.rcid;
    });

    _defineProperty(this, "recordStyle", function () {
      cssRules = '';

      for (var idx = 0; idx < document.styleSheets.length; idx++) {
        try {
          for (var jdx = 0; jdx < document.styleSheets[idx].rules.length; jdx++) {
            cssRules += document.styleSheets[idx].rules[jdx].cssText;
          }
        } catch (e) {
          _this.generateEvent({
            type: eventTypes.styleSheetsLoadReq,
            href: document.styleSheets[idx].href
          });
        }
      }
    });

    _defineProperty(this, "bindScroll", function (node) {
      if (node.addEventListener) {
        node.isScroll = true;
        node.addEventListener('scroll', _this.handleOnScroll);
      }
    });

    _defineProperty(this, "bindOnKeyup", function (node) {
      if (node.addEventListener) {
        node.isOnKeyup = true;
        node.addEventListener('keyup', _this.handleOnKeyup);
      }
    });

    _defineProperty(this, "bindMouseEvent", function (node) {
      node.addEventListener('mousemove', _this.handleMouseMove);
      node.addEventListener('click', _this.handleMouseClick);
    });

    _defineProperty(this, "unbindFromAllEvent", function (node) {
      if (node.isScroll && node.removeEventListener) {
        node.isScroll = false;
        node.removeEventListener('scroll', _this.handleOnScroll);
      }

      if (node.isOnKeyup && node.removeEventListener) {
        node.isOnKeyup = false;
        node.removeEventListener('keyup', _this.handleOnKeyup);
      }
    });

    _defineProperty(this, "readSrc", function (node, url) {
      node.addEventListener('load', function () {
        _this.generateEvent({
          rcid: node.rcid,
          url: url,
          src: _this.getBase64Image(node),
          type: eventTypes.assetLoaded
        });
      });
      return _this.getBase64Image(node);
    });

    _defineProperty(this, "handleMutations", function (mutations) {
      mutations.forEach(function (mutation) {
        if (!mutation.target) return;

        switch (mutation.type) {
          case eventTypes.characterData:
            _this.handleCharacterDataMutation(mutation);

            break;

          case eventTypes.childList:
            _this.handleChildList(mutation);

            break;

          case eventTypes.attributes:
            _this.handleAttributes(mutation);

            break;

          default:
            break;
        }
      });
    });

    _defineProperty(this, "handleCharacterDataMutation", function (mutation) {
      _this.generateEvent({
        rcid: mutation.target.rcid,
        type: eventTypes.characterData,
        text: mutation.target.data
      });
    });

    _defineProperty(this, "handleChildList", function (mutation) {
      var removedNodes = [];
      var addedNodes = [];

      for (var idx = 0; idx < mutation.removedNodes.length; idx++) {
        removedNodes.push(mutation.removedNodes[idx].rcid);

        _this.unbindFromAllEvent(mutation.removedNodes[idx]);
      }

      for (var _idx = 0; _idx < mutation.addedNodes.length; _idx++) {
        _this.populateId(mutation.addedNodes[_idx]);

        addedNodes.push(_this.getHTML(mutation.addedNodes[_idx]));
      }

      _this.generateEvent({
        parent: mutation.target.rcid,
        type: eventTypes.childList,
        addedNodes: addedNodes,
        removedNodes: removedNodes,
        nextSibling: mutation.nextSibling ? mutation.nextSibling.rcid : null,
        previousSibling: mutation.previousSibling ? mutation.previousSibling.rcid : null
      });
    });

    _defineProperty(this, "handleAttributes", function (mutation) {
      _this.generateEvent({
        rcid: mutation.target.rcid,
        type: eventTypes.attributes,
        attributeName: mutation.attributeName,
        attributeValue: mutation.target.getAttribute(mutation.attributeName)
      });
    });

    _defineProperty(this, "handleOnScroll", function (event) {
      var node = event.target || event;
      if (!node) return;
      var scroll = {};

      if (node.rcid == null) {
        scroll = {
          scrollTop: node.documentElement.scrollTop,
          scrollLeft: node.documentElement.scrollLeft,
          rcid: -1
        };
      } else {
        scroll = {
          scrollTop: node.scrollTop,
          scrollLeft: node.scrollLeft,
          rcid: node.rcid
        };
      }

      scroll.type = eventTypes.scroll;

      _this.generateEvent(scroll);
    });

    _defineProperty(this, "handleOnKeyup", function (event) {
      _this.generateEvent({
        rcid: event.target.rcid,
        value: event.target.value,
        type: eventTypes.inputValue
      });
    });

    _defineProperty(this, "handleMouseMove", function (event) {
      _this.generateEvent({
        mouseX: event.pageX - document.documentElement.scrollLeft,
        mouseY: event.pageY - document.documentElement.scrollTop,
        type: eventTypes.mouseMove
      });
    });

    _defineProperty(this, "handleMouseClick", function (event) {
      _this.generateEvent({
        mouseX: event.pageX,
        mouseY: event.pageY,
        type: eventTypes.mouseClick
      });
    });

    _defineProperty(this, "populateId", function (node) {
      node.rcid = currentNodeId;
      currentNodeId++;

      if (node.childNodes && node.childNodes) {
        node.childNodes.forEach(function (child) {
          _this.populateId(child);
        });
      }
    });

    _defineProperty(this, "getHTML", function (node) {
      var el = {};

      if (node.nodeName === '#text') {
        el.nodeName = node.nodeName;
        el.value = node.nodeValue;
        el.type = 'text';
      } else {
        el.tagName = node.tagName === 'BODY' ? 'DIV' : node.tagName;
        el.attributes = {};
        el.type = 'element';

        if (node.attributes) {
          for (var attrIndex = 0; attrIndex < node.attributes.length; attrIndex++) {
            if (node.attributes[attrIndex].localName === 'src') {
              el.src = _this.readSrc(node, node.attributes[attrIndex].value);
              el.srcURL = node.attributes[attrIndex].value;
            } else {
              el.attributes[node.attributes[attrIndex].localName] = node.attributes[attrIndex].value;
            }
          }
        }
        /**
         *  Event Binding
         */


        var style = window.getComputedStyle(node);

        if (['', 'X', 'Y'].map(function (d) {
          return ['scroll', 'auto'].indexOf(style['overflow' + d]) !== -1;
        }).filter(function (d) {
          return d;
        }).length) {
          _this.bindScroll(node);
        }

        if (inputNodeNames.indexOf(node.nodeName) !== -1) {
          _this.bindOnKeyup(node);
        }
      }

      el.rcid = node.rcid;
      el.childNodes = [];

      if (node.childNodes) {
        node.childNodes.forEach(function (child) {
          if (child.nodeName !== 'SCRIPT' && child.nodeName !== 'NOSCRIPT' && child.nodeName !== '#comment') {
            el.childNodes.push(_this.getHTML(child));
          }
        });
      }

      return el;
    });

    _defineProperty(this, "takeSnapshot", function (node, initial) {
      _this.populateId(node);

      var clone = _this.getHTML(node);

      _this.generateEvent({
        type: eventTypes.snapshot,
        dom: clone,
        cssRules: cssRules,
        initial: initial,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        scrollTop: document.documentElement.scrollTop,
        scrollLeft: document.documentElement.scrollLeft
      });
    });

    _defineProperty(this, "generateEvent", function (action) {
      var event = {
        time: parseInt(performance.now(), 10)
      };
      event = { ...event,
        ...action
      };
      data.push(event);

      _this.publishLiveUpdate(event);
    });

    _defineProperty(this, "publishLiveUpdate", function (event) {
      if (typeof eventListener === 'function') {
        eventListener(event, data);
      }
    });

    _defineProperty(this, "getLiveUpdate", function (listener) {
      if (typeof listener === 'function') {
        eventListener = listener;
        if (data.length) eventListener(data[data.length - 1], data);
      }
    });
  }

  _createClass(Recorder, [{
    key: "getBase64Image",
    value: function getBase64Image(img) {
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      var dataURL = '';

      try {
        dataURL = canvas.toDataURL("image/png");
      } catch (e) {}

      return dataURL;
    }
  }]);

  return Recorder;
}();
/**=============================================================================================================================
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 *                                                           Recorder handler
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * ==============================================================================================================================
 */


function loadJS(file, callback) {
  var jsElm = document.createElement("script");
  jsElm.type = "application/javascript";
  jsElm.src = file;
  jsElm.onload = callback;
  document.body.appendChild(jsElm);
}

var host = 'http://www.rinas.in:10200';

(function (funcName, baseObj) {
  funcName = funcName || "docReady";
  baseObj = baseObj || window;
  var readyList = [];
  var readyFired = false;
  var readyEventHandlersInstalled = false;

  function ready() {
    if (!readyFired) {
      readyFired = true;

      for (var i = 0; i < readyList.length; i++) {
        readyList[i].fn.call(window, readyList[i].ctx);
      }

      readyList = [];
    }
  }

  function readyStateChange() {
    if (document.readyState === "complete") {
      ready();
    }
  }

  baseObj[funcName] = function (callback, context) {
    if (typeof callback !== "function") {
      throw new TypeError("callback for docReady(fn) must be a function");
    }

    if (readyFired) {
      setTimeout(function () {
        callback(context);
      }, 1);
      return;
    } else {
      readyList.push({
        fn: callback,
        ctx: context
      });
    }

    if (document.readyState === "complete" || !document.attachEvent && document.readyState === "interactive") {
      setTimeout(ready, 1);
    } else if (!readyEventHandlersInstalled) {
      if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", ready, false);
        window.addEventListener("load", ready, false);
      } else {
        document.attachEvent("onreadystatechange", readyStateChange);
        window.attachEvent("onload", ready);
      }

      readyEventHandlersInstalled = true;
    }
  };
})("docReady", window);

var RecorderHandler = function RecorderHandler() {
  var _this2 = this;

  _classCallCheck(this, RecorderHandler);

  _defineProperty(this, "onDisconnect", function () {
    _this2.initiated = false;
  });

  _defineProperty(this, "onConnect", function () {
    console.log('Connected to Socket!');

    _this2.socket.emit('init', {
      type: 'recorder'
    });

    _this2.initiated = true;

    for (var idx in _this2.recorderData) {
      _this2.sendToServer(_this2.recorderData[idx]);
    }
  });

  _defineProperty(this, "sendToServer", function (event) {
    if (!_this2.initiated) return;

    _this2.socket.emit('msg', event);
  });

  _defineProperty(this, "onRecorderUpdater", function (event, data) {
    _this2.recorderData.push(event);

    _this2.sendToServer(event);
  });

  window.docReady(function () {
    loadJS('https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.slim.js', function () {
      console.log('Socket loaded');
      var io = window.io;
      _this2.socket = io.connect(host, {
        transports: ['websocket', 'polling']
      });

      _this2.socket.once('connect', _this2.onConnect);

      _this2.socket.once('reconnect', _this2.onConnect);

      _this2.socket.once('disconnect', _this2.onDisconnect);

      _this2.recorderData = [];
      _this2.recorder = new Recorder();
      setTimeout(function () {
        console.log('DOC ready');

        _this2.recorder.start(document.body);

        _this2.recorder.getLiveUpdate(_this2.onRecorderUpdater);
      }, 500);
    });
  });
};

new RecorderHandler();
