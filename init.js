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

  /////////////////////////////////////////////////////////////////////////////
  // INIT
  /////////////////////////////////////////////////////////////////////////////

  function inputProperties(icon) {
    return {
      isContainer: false,
      icon: icon,
      propertyTypes: {
        value: {
          type: 'string'
        },
        placeholder: {
          type: 'string'
        }
      },
      properties: {
        value: '',
        placeholder : ''
      }
    };
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
      skip: true,
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
      skip: true,
      isContainer: true/*,
      properties: {
        x: null,
        y: null,
        width: null,
        height: null
      }*/
    },

    //
    // CONTAINERS
    //

    'gui-hbox': getBoxContainerProperties('gui-hbox', 'widget-gtk-hbox.png'),
      'gui-hbox-container': boxProperties(),

    'gui-vbox': getBoxContainerProperties('gui-vbox', 'widget-gtk-vbox.png'),
      'gui-vbox-container': boxProperties(),

    'gui-paned-view': {
      isContainer: 'gui-paned-view-container',
      icon: 'widget-gtk-hpaned.png'
    },
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

    'separator1' : null,

    //
    // MEDIA
    //

    'gui-audio': {
      isContainer: false,
      icon: 'status/dialog-question.png'
    },
    'gui-video': {
      isContainer: false,
      icon: 'status/dialog-question.png'
    },
    'gui-canvas': {
      isContainer: false,
      icon: 'widget-gtk-drawingarea.png'
    },
    'gui-image': {
      isContainer: false,
      icon: 'widget-gtk-image.png'
    },

    'separator2' : null,

    //
    // INPUTS
    //

    'gui-button': {
      isContainer: false,
      hasInnerLabel: true,
      icon: 'widget-gtk-button.png',
      properties: {
        label: 'Button'
      }
    },
    'gui-radio': {
      isContainer: false,
      icon: 'widget-gtk-radiotoolbutton.png'
    },
    'gui-checkbox': {
      isContainer: false,
      icon: 'widget-gtk-radiotoolbutton.png'
    },
    'gui-file-upload': {
      isContainer: false,
      icon: 'widget-gtk-filechooserbutton.png'
    },
    'gui-input-modal': {
      isContainer: false,
      icon: 'widget-gtk-comboboxentry.png'
    },
    'gui-label': {
      isContainer: false,
      icon: 'widget-gtk-label.png',
      properties: {
        label: 'Label'
      }
    },
    'gui-richtext': {
      isContainer: false,
      icon: 'widget-gtk-textview.png',
      properties: {
        value: ''
      }
    },
    'gui-select': {
      isContainer: false,
      icon: 'widget-gtk-combobox.png'
    },
    'gui-select-list': {
      isContainer: false,
      icon: 'widget-gtk-list.png'
    },
    'gui-slider': {
      isContainer: false,
      icon: 'widget-gtk-hscale.png'
    },
    'gui-switch': {
      isContainer: false,
      icon: 'widget-gtk-togglebutton.png'
    },
    'gui-text': inputProperties('widget-gtk-entry.png'),
    'gui-password': inputProperties('widget-gtk-entry.png'),
    'gui-textarea': inputProperties('widget-gtk-textview.png'),

    'separator3' : null,

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

    'separator4' : null,

    //
    // MISC
    //

    'gui-progress-bar': {
      isContainer: false,
      icon: 'widget-gtk-progressbar.png',
      properties: {
        progress: ''
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
    'gui-iframe': {
      isContainer: false,
      icon: 'widget-gtk-custom.png'
    },
    'gui-menu': {
      isContainer: false,
      icon: 'widget-gtk-menu.png'
    },
      'gui-menu-entry': {
        skip: true
      },
    'gui-menu-bar': {
      isContainer: false,
      icon: 'widget-gtk-menubar.png'
    },
      'gui-menu-bar-entry': {
        skip: true
      },
    'gui-statusbar': {
      isContainer: false,
      icon: 'widget-gtk-statusbar.png'
    }

  };

  /////////////////////////////////////////////////////////////////////////////
  // INIT
  /////////////////////////////////////////////////////////////////////////////

  function Project(name) {
    this.scheme  = GUI.createScheme(null);
    this.windows = [];
    this.name    = name;
    this.dom     = null;
  }

  Project.prototype.load = function(cb) {
    var self = this;
    var file = new VFS.File('osjs://packages/' + this.name + '/scheme.html');

    VFS.read(file, function(error, content) {
      self.scheme.loadString(content, function(err, result) {
        if ( err ) {
          return cb(err);
        }

        var windows = [];
        result.firstChild.getElementsByTagName('application-window').forEach(function(s) {
          windows.push(s.getAttribute('data-id'));
        });
        self.windows = windows;
        self.dom = result;

        cb(false, true);
      });
    }, {type: 'text'});
  };

  Project.prototype.save = function(cb) {
    cb();
  };

  Project.prototype.getWindow = function(name) {
    var result = null;
    this.dom.firstChild.getElementsByTagName('application-window').forEach(function(s) {
      if ( s.getAttribute('data-id') === name ) {
        result = s;
      }
      return !!result;
    });
    return result;
  };

  Project.prototype.getElement = function(xpath) {
    xpath = '/div[1]/application-window[1]/' + xpath.replace(/^\//, ''); // FIXME

    var ttarget = null;
    try {
      ttarget = OSjs.Applications.ApplicationIDE.getElementByXpath(xpath, this.dom.firstChild);
    } catch ( e ) {
      console.warn('Error getting target', e.stack, e);
    }
    return ttarget;
  };

  Project.prototype.getWindow = function() {
    return this.dom.firstChild.getElementsByTagName('application-window')[0];
  };

  Project.prototype.getElementProperties = function(xpath, tagName, el) {
    var target = xpath ? this.getElement(xpath) : null;
    var defaultProps = {};

    var elementProps = {
      id: target ? (target.getAttribute('data-id') || null) : null
    };
    var elementPropTypes = Utils.argumentDefaults(el.propertyTypes || {}, {
      id: {
        type: 'string'
      }
    });

    var refProps = el.properties || {};
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
      for ( var i = 1; i < attributes.length; i++ ) {
        attrib = attributes[i];
        elementProps[attrib.name.replace(/^data\-/, '')] = attrib.value;
      }
    }

    var props = Utils.argumentDefaults(elementProps, defaultProps);

    Object.keys(props).forEach(function(p) {
      var type = (elementPropTypes[p] || {}).type || 'unknown';
      props[p] = type + ':' + props[p];
    });
    return props;
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
  OSjs.Applications.ApplicationIDE.Project = Project;
  OSjs.Applications.ApplicationIDE.getElementByXpath = getElementByXpath;
  OSjs.Applications.ApplicationIDE.getXpathByElement = getXpathByElement;



})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
