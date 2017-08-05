const VFS = OSjs.require('vfs/fs');
const DOM = OSjs.require('utils/dom');
const GUIScheme = OSjs.require('gui/scheme');
const FileMetadata = OSjs.require('vfs/file');

import {getProperties, getPropertyTypes, getElementByXpath} from './utils';

export default class Project {
  constructor(name, path) {
    this.scheme          = new GUIScheme(null);
    this.fragments       = [];
    this.currentWindow   = 0;
    this.name            = name || 'Unknown';
    this.path            = path;
    this.dom             = null;
    this.data            = {};
  }

  _createProject(app, cb) {
    var self = this;
    var projectPath = 'home:///.packages/' + self.name;

    app._api('createProject', {
      name: self.name,
      template: app._getResource('template', true),
      destination: projectPath
    }).then(() => {
      self.path = projectPath;
      return cb(projectPath);
    });
  }

  load(app, cb) {
    var self = this;

    function loadScheme(fname) {
      var file = new FileMetadata(fname);
      console.warn('IDE', 'Loading scheme', file);

      VFS.read(file, {type: 'text'}).then(function(content) {
        self.scheme = GUIScheme.fromString(content);
        self.dom = self.scheme.scheme;
        self.updateFragments();

        cb(false, true);
      });
    }

    function loadProject(path) {
      var proj = new FileMetadata(path + '/metadata.json');

      console.warn('IDE', 'Loading project', proj);
      VFS.read(proj, {type: 'text'}).catch(cb).then(function(content) {
        var pdata = JSON.parse(content);
        var spath = path + '/scheme.html';

        self.data = pdata;
        self.name = pdata.name;

        return loadScheme(spath);
      });
    }

    if ( this.path ) {
      loadProject(this.path);
    } else {
      this._createProject(app, function(path) {
        loadProject(path);
      });
    }
  }

  save(type, cb) {
    if ( !type || type === 'scheme' ) {
      this.saveScheme(cb);
    } else if ( type === 'metadata' ) {
      this.saveMetadata(cb);
    }
  }

  saveScheme(cb) {
    var path = this.path + '/scheme.html';
    var content = this.getHTML();

    VFS.write(path, content).catch(cb).then(() => cb(false));
  }

  saveMetadata(cb) {
    var path = this.path + '/metadata.json';
    var content = JSON.stringify(this.data, null, 2);

    VFS.write(path, content).catch(cb).then(() => cb(false));
  }

  getElement(xpath) {
    var idx = this.currentWindow + 1;
    var root = '/div[1]/*[' + String(idx) + ']';

    if ( xpath && typeof xpath !== 'number' ) {
      xpath = root + '/' + xpath.replace(/^\//, ''); // FIXME
    } else {
      xpath = root;
    }

    var ttarget = null;
    try {
      ttarget = getElementByXpath(xpath, this.dom.firstChild);
    } catch ( e ) {
      console.warn('Error getting target', e.stack, e);
    }

    return ttarget;
  }

  getFragmentName() {
    return this.fragments[this.currentWindow];
  }

  getFragment() {
    return this.dom.firstChild.children[this.currentWindow];
  }

  getFragments() {
    return this.fragments;
  }

  removeFragment(idx) {
    var f = this.getElement(idx);
    if ( f ) {
      f = DOM.$remove(f);

      if ( this.currentWindow === idx ) {
        this.currentWindow = 0;
      }

      this.fragments.splice(idx, 1);

      return true;
    }

    return false;
  }

  updateFragments() {
    var fragments = [];
    this.dom.firstChild.children.forEach(function(s) {
      fragments.push(s.getAttribute('data-id'));
    });
    this.fragments = fragments;
  }

  createFragment(type, name) {
    if ( this.fragments.indexOf(name) >= 0 ) {
      throw new Error('A fragment by this name already exists');
    }

    var el = document.createElement(type);
    el.setAttribute('data-id', name);

    this.dom.firstChild.appendChild(el);

    this.updateFragments();
  }

  addMime(str) {
    if ( !this.data.mime ) {
      this.data.mime = [];
    }
    this.data.mime.push(str);
  }

  removeMime(idx) {
    if ( !this.data.mime || !this.data.mime.length ) {
      return;
    }

    this.data.mime.splice(idx, 1);
  }

  applyMetadata(metadata) {
    var self = this;
    Object.keys(metadata).forEach(function(k) {
      self.data[k] = metadata[k];
    });

    this.name = this.data.name;
  }

  getElementProperty(xpath, tagName, el, property) {
    var props = getProperties.call(this, xpath, tagName, el);
    return typeof props[property] === 'undefined' ? null : props[property];
  }

  getElementPropertyType(el, property) {
    return (getPropertyTypes(el)[property] || {}).type || 'unknown';
  }

  getElementProperties(xpath, tagName, el, win) {
    var props = getProperties.call(this, xpath, tagName, el);
    var elementPropTypes = getPropertyTypes(el);
    Object.keys(props).forEach(function(p) {
      var type = (elementPropTypes[p] || {}).type;
      var value = props[p];
      props[p] = {
        value: value,
        type: type || typeof value
      };
    });
    return props;
  }

  getHTML() {
    return this.scheme.getHTML();
  }

}
