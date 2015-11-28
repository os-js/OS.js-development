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

  var elements = {
    'gui-hbox': {
      isContainer: 'gui-hbox-container',
      icon: 'widget-gtk-hbox.png'
    },
    'gui-vbox': {
      isContainer: 'gui-vbox-container',
      icon: 'widget-gtk-vbox.png'
    },
    'gui-paned-view': {
      isContainer: 'gui-paned-view-container',
      icon: 'widget-gtk-hpaned.png'
    },
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

    'gui-button': {
      isContainer: false,
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
    'gui-password': {
      isContainer: false,
      icon: 'widget-gtk-entry.png',
      properties: {
        value: ''
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
    'gui-text': {
      isContainer: false,
      icon: 'widget-gtk-entry.png',
      properties: {
        value: ''
      }
    },
    'gui-textarea': {
      isContainer: false,
      icon: 'widget-gtk-textview.png',
      properties: {
        value: ''
      }
    },

    'separator3' : null,

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
    'gui-menu-bar': {
      isContainer: false,
      icon: 'widget-gtk-menubar.png'
    },
    'gui-statusbar': {
      isContainer: false,
      icon: 'widget-gtk-statusbar.png'
    },


    'gui-menu-bar-entry': {
      skip: true
    },
    'gui-vbox-container': {
      skip: true,
      properties: {
        fill: 0,
        shrink: 0,
        expand: false,
        fill: false
      }
    },
    'gui-hbox-container': {
      skip: true,
      properties: {
        fill: 0,
        shrink: 0,
        expand: false,
        fill: false
      }
    },
    'gui-menu-entry': {
      skip: true
    },
    'gui-paned-view-container': {
      skip: true
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

  Project.prototype.getElementProperties = function(xpath, tagName, el) {
    var element = this.getElement(xpath);
    var defaultProps = el.properties || {};
    var elementProps = {};

    if ( element ) {
      var attributes = element.attributes;
      var attrib;
      for ( var i = 1; i < attributes.length; i++ ) {
        attrib = attributes[i];
        elementProps[attrib.name.replace(/^data\-/, '')] = attrib.value;
      }
    }

    return Utils.argumentDefaults(elementProps, defaultProps);
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
