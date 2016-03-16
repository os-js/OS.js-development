/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  function getPropertyTypes(el) {
    el = el || {};
    return Utils.argumentDefaults(el.propertyTypes || {}, {
      id: {
        type: 'string'
      }
    });
  }

  function setProperty(el, tagName, property, value) {
    var innerLabelElement = ['gui-button'];

    if ( property.substr(0, 1) === '_' ) {
      return true;
    }

    if ( elements[tagName] && (property === 'id' || elements[tagName].propertyTypes[property]) ) {
      var il = elements[tagName].hasInnerLabel;
      if ( property === 'label' && il ) {
        var lel = (il === true) ? el : el.querySelector(il);
        Utils.$empty(lel);
        lel.appendChild(document.createTextNode(value));
      } else {
        el.setAttribute('data-' + property, String(value));
      }
      return true;
    }

    return false;
  }

  function getProperties(xpath, tagName, el) {
    var target = this.getElement(xpath);
    var elementPropTypes = getPropertyTypes(el);
    var defaultProps = {};
    var elementProps = {};
    var refProps = (el || {}).properties || {};

    if ( xpath ) {
      elementProps = {
        id: target ? target.getAttribute('data-id') : null
      };
    } else {
      elementProps = {
        id: this.getFragmentName()
      };
    }

    Object.keys(refProps).forEach(function(k) {
      var value = refProps[k];
      if ( typeof value === 'function' ) {
        value = value(target, tagName);
      }
      defaultProps[k] = value;
    });

    if ( target ) {
      var attributes = target.attributes;
      var attrib;
      for ( var i = 0; i < attributes.length; i++ ) {
        attrib = attributes[i];
        if ( attrib.name.substr(0, 1) !== '_' ) {
          elementProps[attrib.name.replace(/^data\-/, '')] = attrib.value;
        }
      }

      if ( elements[tagName] && elements[tagName].hasInnerLabel ) {
        elementProps.label = target.innerHTML;
      }
    }

    return Utils.argumentDefaults(elementProps, defaultProps);
  }

  /////////////////////////////////////////////////////////////////////////////
  // INIT
  /////////////////////////////////////////////////////////////////////////////

  function getMediaProperties(icon) {
    return {
      isContainer: false,
      icon: icon,
      properties: {
        src: ''
      },
      propertyTypes: {
        src: {
          type: 'string'
        }
      }
    };
  }

  function getInputProperties(icon, hasLabel, defaultValue, mergeWith, hasIcon) {
    mergeWith = mergeWith || {};

    var defaults = {
      isContainer: false,
      icon: icon,
      propertyTypes: {
        disabled: {
          type: 'boolean'
        },
        placeholder: {
          type: 'string'
        }
      },
      properties: {
        disabled: null,
        placeholder : ''
      }
    };

    var lbl = hasLabel ? 'label' : 'value';
    defaults.propertyTypes[lbl] = {
      type: 'string',
      defaultValue: defaultValue || ''
    };
    defaults.properties[lbl] = '';

    if ( hasIcon ) {
      defaults.properties.icon = '';
      defaults.propertyTypes.icon = {
        type: 'string'
      };
    }

    return Utils.argumentDefaults(defaults, mergeWith);
  }

  function getBoxContainerProperties(name, icon) {
    function getContainerParentName(tagName) {
      tagName = tagName || name;
      if ( tagName === 'gui-tabs' ) {
        return 'gui-tab-container';
      }
      return name + '-container';
    }

    function updateBoxChildren(el, tagName, size) {
      size = parseInt(size, 10);
      var current = el.children.length;
      var args = {};

      if ( tagName === 'gui-tabs' ) {
        args = {
          label: 'Tab'
        };
      } else {
        args = {
          shrink: 1,
          grow: 1
        };
      }

      if ( !isNaN(size) ) {
        if ( size < current ) {
          var removeNumber = current - size;
          if ( removeNumber > 0 ) {
            while ( el.children.length > (current-removeNumber) ) {
              Utils.$remove(el.children[el.children.length - 1]);
            }
          }
        } else {
          var addNumber = size - current;
          if ( addNumber > 0 ) {
            for ( var a = 0; a < addNumber; a++ ) {
              el.appendChild(GUI.Helpers.createElement(getContainerParentName(tagName), args));
            }
          }
        }
      }
    }

    var ptypes = {
      _size: {
        type: 'number'
      }
    };

    var ps = {
      _size: function(el, tagName) {
        if ( !el || !el.parentNode ) {
          return -1;
        }

        if ( tagName === 'gui-tabs' ) {
          return el.getElementsByTagName('gui-tab-container').length || 0;
        }
        return el.getElementsByTagName(tagName + '-container').length || 0;
      }
    };

    if ( name === 'gui-paned-view' ) {
      ptypes.orientation = {
        type: 'mixed',
        values: [{label: 'Horizontal', value: 'horizontal'}, {label: 'Vertical', value: 'vertical'}]
      };
      ps.orientation = function(el, tagName) {
        if ( el ) {
          return el.getAttribute('data-orientation');
        }
        return null;
      };
    }

    return {
      isContainer: getContainerParentName(),
      icon: icon,
      oncreate: function(el, par, tagName) {
        function createContainer(t, num, a) {
          for ( var i = 0; i < num; i++ ) {
            el.appendChild(GUI.Helpers.createElement(t, a));
          }
        }

        if ( tagName === 'gui-vbox' || tagName === 'gui-hbox' ) {
          createContainer(getContainerParentName(tagName), 2, {
            shrink: 1,
            grow: 1
          });
        } else if ( tagName === 'gui-paned-view' ) {
          createContainer('gui-paned-view-container', 2, {
            shrink: 1,
            grow: 1
          });
        } else if ( tagName === 'gui-tabs' ) {
          createContainer('gui-tab-container', 1, {
            label: 'Tab'
          });
        }
      },
      onpropertyupdate: function(el, tagName, property, value) {
        if ( setProperty(el, tagName, property, value) ) {
          if ( (['gui-vbox', 'gui-hbox', 'gui-tabs', 'gui-paned-view']).indexOf(tagName) >= 0 ) {
            if ( property === '_size' ) {
              updateBoxChildren(el, tagName, value);
            }
          }

          return true;
        }
        return false;
      },
      propertyTypes: ptypes,
      properties: ps
    };
  }

  function boxProperties() {
    return {
      isContainer: true,
      icon: 'widget-gtk-container.png',
      propertyTypes: {
        grow: {
          type: 'number'
        },
        shrink: {
          type: 'number'
        },
        basis: {
          type: 'string'
        },
        expand: {
          type: 'boolean'
        },
        fill: {
          type: 'boolean'
        }
      },
      properties: {
        grow: null,
        shrink: null,
        basis: null,
        expand: null,
        fill: null
      }
    };
  }

  var elements = {
    'application-window': {
      isContainer: true,
      propertyTypes: {
        width: {
          type: 'number'
        },
        height: {
          type: 'number'
        },
        allow_maximize: {
          type: 'boolean'
        },
        allow_minimize: {
          type: 'boolean'
        },
        allow_close: {
          type: 'boolean'
        },
        allow_resize: {
          type: 'boolean'
        }
      },
      properties: {
        width: null,
        height: null,
        allow_maximize: true,
        allow_minimize: true,
        allow_close: true,
        allow_resize: true
      }
    },

    'application-fragment': {
      isExternal: true,
      isContainer: true,
      icon: 'widget-gtk-frame.png'
    },

    //
    // CONTAINERS
    //

    'gui-hbox': getBoxContainerProperties('gui-hbox', 'widget-gtk-hbox.png'),
      'gui-hbox-container': boxProperties(),

    'gui-vbox': getBoxContainerProperties('gui-vbox', 'widget-gtk-vbox.png'),
      'gui-vbox-container': boxProperties(),

    'gui-paned-view': getBoxContainerProperties('gui-paned-view', 'widget-gtk-hpaned.png'),
      'gui-paned-view-container': boxProperties(),

    'gui-tabs': getBoxContainerProperties('gui-tabs', 'widget-gtk-notebook.png'),
      'gui-tab-container': {
        icon: 'widget-gtk-container.png',
        propertyTypes: {
          label: {
            type: 'string'
          }
        },
        properties: {
          label: 'Tab'
        }
      },

    'gui-toolbar': {
      isContainer: true,
      icon: 'widget-gtk-toolbar.png'
    },
    'gui-button-bar': {
      isContainer: true,
      icon: 'widget-gtk-toolbar.png'
    },
    'gui-expander': {
      isContainer: true,
      icon: 'widget-gtk-expander.png',
      propertyTypes: {
        label: {
          type: 'string'
        }
      },
      properties: {
        label: function(el, tagName) {
          if ( el ) {
            return el.getAttribute('data-label');
          }
          return '';
        }
      },
      oncreate: function(el, par, tagName) {
        el.setAttribute('data-label', 'Expander');
      }
    },

    //
    // MEDIA
    //

    'gui-audio': getMediaProperties('status/dialog-question.png'),
    'gui-video': getMediaProperties('status/dialog-question.png'),
    'gui-image': getMediaProperties('widget-gtk-image.png'),
    'gui-iframe': getMediaProperties('widget-gtk-custom.png'),
    'gui-canvas': {
      isContainer: false,
      icon: 'widget-gtk-drawingarea.png'
    },

    //
    // INPUTS
    //

    'gui-label': getInputProperties('widget-gtk-label.png', true, 'Label'),
    'gui-radio': getInputProperties('widget-gtk-radiotoolbutton.png'),
    'gui-checkbox': getInputProperties('widget-gtk-radiotoolbutton.png'),
    'gui-file-upload': getInputProperties('widget-gtk-filechooserbutton.png'),
    'gui-input-modal': getInputProperties('widget-gtk-comboboxentry.png'),
    'gui-select': getInputProperties('widget-gtk-combobox.png'),
    'gui-select-list': getInputProperties('widget-gtk-list.png'),
    'gui-slider': getInputProperties('widget-gtk-hscale.png'),
    'gui-switch': getInputProperties('widget-gtk-togglebutton.png'),
    'gui-text': getInputProperties('widget-gtk-entry.png'),
    'gui-password': getInputProperties('widget-gtk-entry.png'),
    'gui-textarea': getInputProperties('widget-gtk-textview.png'),
    'gui-button': getInputProperties('widget-gtk-button.png', true, 'Button', {
      hasInnerLabel: true
    }, true),
    'gui-richtext': {
      isContainer: false,
      icon: 'widget-gtk-textview.png',
      properties: {
        value: ''
      }
    },

    //
    // VIEWS
    //

    'gui-tree-view': {
      isContainer: false,
      icon: 'widget-gtk-treeview.png'
    },
    'gui-icon-view': {
      isContainer: false,
      icon: 'widget-gtk-iconview.png'
    },
    'gui-list-view': {
      isContainer: false,
      icon: 'widget-gtk-list.png'
    },
    'gui-file-view': {
      isContainer: false,
      icon: 'widget-gtk-filefilter.png'
    },

    //
    // MISC
    //

    'gui-progress-bar': {
      isContainer: false,
      icon: 'widget-gtk-progressbar.png',
      propertyTypes: {
        progress: {
          type: 'number',
          min: 0,
          max: 100
        }
      },
      properties: {
        progress: 0
      }
    },
    'gui-color-box': {
      isContainer: false,
      icon: 'widget-gtk-colorbutton.png'
    },
    'gui-color-swatch': {
      isContainer: false,
      icon: 'widget-gtk-colorselection.png'
    },
    'gui-menu': {
      isContainer: false,
      icon: 'widget-gtk-menu.png',
      special: true
    },
      'gui-menu-entry': {
      },
    'gui-menu-bar': {
      isContainer: false,
      icon: 'widget-gtk-menubar.png'
    },
      'gui-menu-bar-entry': {
        icon: 'widget-gtk-label.png'
      },
    'gui-statusbar': {
      isContainer: false,
      icon: 'widget-gtk-statusbar.png',
      properties: {
        value: ''
      },
      propertyTypes: {
        value: {
          type: 'string'
        }
      }
    }

  };

  var categories = [
    {
      label: 'Containers',
      items: ['gui-hbox', 'gui-vbox', 'gui-paned-view', 'gui-tabs', 'gui-toolbar', 'gui-button-bar', 'gui-expander', 'application-fragment']
    },
    {
      label: 'Media',
      items: ['gui-audio', 'gui-video', 'gui-image', 'gui-canvas', 'gui-iframe']
    },
    {
      label: 'Input',
      items: ['gui-label', 'gui-button', 'gui-switch', 'gui-radio', 'gui-checkbox', 'gui-select', 'gui-select-list', 'gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-richtext']
    },
    {
      label: 'Views',
      items: ['gui-tree-view', 'gui-icon-view', 'gui-list-view', 'gui-file-view']
    },
    {
      label: 'Misc',
      items: ['gui-progress-bar', 'gui-color-swatch', 'gui-menu', 'gui-menu-bar', 'gui-statusbar', 'gui-file-upload', 'gui-input-modal', 'gui-color-box']
    }
  ];

  /////////////////////////////////////////////////////////////////////////////
  // INIT
  /////////////////////////////////////////////////////////////////////////////

  function Project(name, path) {
    this.scheme          = GUI.createScheme(null);
    this.fragments       = [];
    this.currentWindow   = 0;
    this.name            = name || 'Unknown';
    this.path            = path;
    this.dom             = null;
    this.data            = {};
  }

  Project.prototype._createProject = function(app, cb) {
    var self = this;
    var projectPath = 'home:///.packages/' + self.name;

    app._call('createProject', {
      name: self.name,
      template: 'osjs://' + API.getApplicationResource(app, 'template'),
      destination: projectPath
    }, function(response) {
      self.path = projectPath;
      cb(projectPath);
    });
  };

  Project.prototype.load = function(app, cb) {
    var self = this;

    function loadScheme(fname) {
      var file = new VFS.File(fname);
      console.warn('IDE', 'Loading scheme', file);

      VFS.read(file, function(error, content) {
        self.scheme.loadString(content, function(err, result) {
          if ( err ) {
            return cb(err);
          }

          self.dom = result;
          self.updateFragments();

          cb(false, true);
        });
      }, {type: 'text'});
    }

    function loadProject(path) {
      var proj = new VFS.File(path + '/metadata.json');

      console.warn('IDE', 'Loading project', proj);
      VFS.read(proj, function(error, content) {
        if ( error ) {
          return cb(error);
        }

        var pdata = JSON.parse(content);
        var spath = path + '/scheme.html';

        self.data = pdata;
        self.name = pdata.name;

        loadScheme(spath);
      }, {type: 'text'});
    }


    if ( this.path ) {
      loadProject(this.path);
    } else {
      this._createProject(app, function(path) {
        loadProject(path);
      });
    }
  };

  Project.prototype.save = function(type, cb) {
    if ( !type || type === 'scheme' ) {
      this.saveScheme(cb);
    } else if ( type === 'metadata' ) {
      this.saveMetadata(cb);
    }
  };

  Project.prototype.saveScheme = function(cb) {
    var path = this.path + '/scheme.html';
    var content = this.getHTML();

    VFS.write(path, content, function(err) {
      cb(err);
    });
  };

  Project.prototype.saveMetadata = function(cb) {
    var path = this.path + '/metadata.json';
    var content = JSON.stringify(this.data, null, 2);

    VFS.write(path, content, function(err) {
      cb(err);
    });
  };

  Project.prototype.getElement = function(xpath) {
    var idx = this.currentWindow + 1;
    var root = '/div[1]/application-window[' + String(idx) + ']';

    if ( xpath && typeof xpath !== 'number' ) {
      xpath = root + '/' + xpath.replace(/^\//, ''); // FIXME
    } else {
      xpath = root;
    }

    var ttarget = null;
    try {
      ttarget = OSjs.Applications.ApplicationIDE.getElementByXpath(xpath, this.dom.firstChild);
    } catch ( e ) {
      console.warn('Error getting target', e.stack, e);
    }

    return ttarget;
  };

  Project.prototype.getFragmentName = function() {
    return this.fragments[this.currentWindow];
  };

  Project.prototype.getFragment = function() {
    return this.dom.firstChild.children[this.currentWindow];
  };

  Project.prototype.getFragments = function() {
    return this.fragments;
  };

  Project.prototype.removeFragment = function(idx) {
    var f = this.getElement(idx);
    if ( f ) {
      f = Utils.$remove(f);

      if ( this.currentWindow === idx ) {
        this.currentWindow = 0;
      }

      this.fragments.splice(idx, 1);

      return true;
    }

    return false;
  };

  Project.prototype.updateFragments = function() {
    var fragments = [];
    this.dom.firstChild.children.forEach(function(s) {
      fragments.push(s.getAttribute('data-id'));
    });
    this.fragments = fragments;
  };

  Project.prototype.applyMetadata = function(metadata) {
    var self = this;
    Object.keys(metadata).forEach(function(k) {
      self.data[k] = metadata[k];
    });

    this.name = this.data.name;
  };

  Project.prototype.getElementProperty = function(xpath, tagName, el, property) {
    var props = getProperties.call(this, xpath, tagName, el);
    return typeof props[property] === 'undefined' ? null : props[property];
  };

  Project.prototype.getElementPropertyType = function(el, property) {
    return (getPropertyTypes(el)[property] || {}).type || 'unknown';
  };

  Project.prototype.getElementProperties = function(xpath, tagName, el, win) {
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
  };

  Project.prototype.getHTML = function() {
    return this.scheme.getHTML();
  };

  /////////////////////////////////////////////////////////////////////////////
  // UTILS
  /////////////////////////////////////////////////////////////////////////////

  function getElementByXpath(path, doc, root) {
    root = root || document;
    doc = doc || document.documentElement;
    return document.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }

  function getXpathByElement(elm, doc) {
    function getElementIdx(elt) {
      var count = 1;
      for (var sib = elt.previousSibling; sib ; sib = sib.previousSibling) {
        if (sib.nodeType == 1 && sib.tagName == elt.tagName) {
          count++
        }
      }
      return count;
    }

    var path = '';
    var idx, xname;
    for (; elm && elm.nodeType == 1; elm = elm.parentNode) {
      idx = getElementIdx(elm);
      xname = elm.tagName.toLowerCase() + '[' + idx + ']';
      path = '/' + xname + path;
    }

    return path;
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationIDE = OSjs.Applications.ApplicationIDE || {};
  OSjs.Applications.ApplicationIDE.Elements = elements;
  OSjs.Applications.ApplicationIDE.Categories = categories;
  OSjs.Applications.ApplicationIDE.Project = Project;
  OSjs.Applications.ApplicationIDE.getElementByXpath = getElementByXpath;
  OSjs.Applications.ApplicationIDE.getXpathByElement = getXpathByElement;
  OSjs.Applications.ApplicationIDE.setProperty = setProperty;



})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
