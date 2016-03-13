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
    return Utils.argumentDefaults(el.propertyTypes || {}, {
      id: {
        type: 'string'
      }
    });
  }

  function getProperties(xpath, tagName, el) {
    var target = xpath ? this.getElement(xpath) : null;
    var elementPropTypes = getPropertyTypes(el);
    var defaultProps = {};
    var elementProps = {};
    var refProps = el.properties || {};

    if ( xpath ) {
      elementProps = {
        id: target.getAttribute('data-id')
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
        elementProps[attrib.name.replace(/^data\-/, '')] = attrib.value;
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
    return {
      isContainer: name + '-container',
      icon: icon,
      propertyTypes: {
        _size: {
          type: 'number'
        }
      },
      properties: {
        _size: function(el, tagName) {
          return el.parentNode.getElementsByTagName(tagName + '-container').length || 0;
        }
      }
    };
  }

  function boxProperties() {
    return {
      isContainer: true,
      propertyTypes: {
        grow: {
          type: 'number'
        },
        shrink: {
          type: 'number'
        },
        basis: {
          type: 'mixed',
          values: [null, 'auto']
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
        }
      },
      properties: {
        width: null,
        height: null
      }
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

    'gui-tabs': {
      isContainer: 'gui-tab-container',
      icon: 'widget-gtk-notebook.png'
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
      icon: 'widget-gtk-expander.png'
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
      items: ['gui-hbox', 'gui-vbox', 'gui-paned-view', 'gui-tabs', 'gui-toolbar', 'gui-button-bar', 'gui-expander']
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

  Project.prototype.load = function(app, cb) {
    var self = this;

    function replaceTemplateVariables(content) {
      return (content || '').replace(/EXAMPLE/g, self.name);
    }

    function loadScheme(fname) {
      var file = new VFS.File(fname);
      console.warn('IDE', 'Loading scheme', file);

      VFS.read(file, function(error, content) {
        self.scheme.loadString(content, function(err, result) {
          if ( err ) {
            return cb(err);
          }

          var fragments = [];
          result.firstChild.children.forEach(function(s) {
            fragments.push(s.getAttribute('data-id'));
          });
          self.fragments = fragments;
          self.dom = result;

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

    function createFromTemplate(cb) {
      var templatePath = 'osjs://' + API.getApplicationResource(app, 'template');
      var templateFile = templatePath + '/metadata.json';
      var storagePath  = 'home:///IDEProjects';
      var projectPath  = storagePath + '/' + self.name;

      function enqueueFiles(list, done) {
        var result = [];

        function _next(i) {
          if ( i >= (list.length-1) ) {
            return done(result);
          }

          var iter = list[i].src;
          console.warn('---->', iter, list[i]);

          if ( iter.match(/^(https?|ftp)\:/) ) {
            return _next(i+1);
          }

          VFS.read(templatePath + '/' + iter, function(err, content) {
            content = replaceTemplateVariables(content);
            VFS.write(projectPath + '/' + iter, content, function() {
              _next(i+1);
            });
          }, {type: 'text'});
        }

        _next(0);
      }

      console.warn(templatePath, templateFile, storagePath, projectPath);
      VFS.delete(projectPath, function() {
        VFS.mkdir(storagePath, function() {
          VFS.mkdir(projectPath, function() {
            VFS.read(templateFile, function(err, content) {
              var d = JSON.parse(replaceTemplateVariables(content || '{}'));
              VFS.write(projectPath + '/metadata.json', JSON.stringify(d), function() {
                var files = d.preload;
                files.push({type: 'scheme', src: 'scheme.html'});
                files.push({type: 'metadata', src: 'metadata.json'});

                enqueueFiles(files || [], function() {
                  cb(projectPath);
                });
              });
            }, {type: 'text'});
          });
        });
      });
    }

    if ( !this.path ) {
      createFromTemplate(function(path) {
        loadProject(path);
      });
    }
  };

  Project.prototype.save = function(cb) {
    cb();
  };

  Project.prototype.getElement = function(xpath) {
    var idx = this.currentWindow + 1;
    xpath = '/div[1]/application-window[' + String(idx) + ']/' + xpath.replace(/^\//, ''); // FIXME

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



})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
