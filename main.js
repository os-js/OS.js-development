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
  // APPLICATION CLASS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationIDE(args, metadata) {
    Application.apply(this, ['ApplicationIDE', args, metadata]);

    this.currentProject = null;
    this.currentWindow = null;
    this.globalClickEvent = null;
  }

  ApplicationIDE.prototype = Object.create(Application.prototype);
  ApplicationIDE.constructor = Application;

  ApplicationIDE.prototype.destroy = function() {
    document.removeEventListener('click', this.globalClickEvent, false);
    this.curentProject = null;

    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationIDE.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;

    function loadDefaultProject() {
      self.openProject('default/FileManager');
    }

    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new OSjs.Applications.ApplicationIDE.PropertiesWindow(self, metadata, scheme));
      self._addWindow(new OSjs.Applications.ApplicationIDE.DesignerWindow(self, metadata));
      self._addWindow(new OSjs.Applications.ApplicationIDE.MainWindow(self, metadata, scheme), null, true);

      loadDefaultProject();
    });

    this.globalClickEvent = function(ev) {
      self.onDOMElementClicked(ev, ev.target || ev.srcElement);
    };

    document.addEventListener('click', this.globalClickEvent, false);

    this._setScheme(scheme);
  };

  //
  // HELPERS
  //

  ApplicationIDE.prototype.windowAction = function(fn, args) {
    var mainWin = this.getMainWindow();
    if ( mainWin ) {
      mainWin[fn].apply(mainWin, args);
    }

    var propWin = this.getPropertiesWindow();
    if ( propWin ) {
      propWin[fn].apply(propWin, args);
    }

    var designWin = this.getDesignerWindow();
    if ( designWin ) {
      designWin[fn].apply(designWin, args);
    }
  };

  ApplicationIDE.prototype.openProject = function(name) {
    var self = this;

    this.currentProject = null;
    this.windowAction('_toggleLoading', [true]);
    this.windowAction('clear', []);

    this.currentProject = new OSjs.Applications.ApplicationIDE.Project(name);
    this.currentProject.load(function(err) {
      self.windowAction('_toggleLoading', [false]);
      if ( !err ) {
        self.windowAction('load', []);
      }
    });
  };

  ApplicationIDE.prototype.saveProject = function(cb) {
    if ( this.currentProject ) {
      this.windowAction('_toggleLoading', [true]);
      this.currentProject.save(function(err) {
        self.windowAction('_toggleLoading', [false]);

        cb(err);
      });
    }
  };

  ApplicationIDE.prototype.toggleDesignerWindow = function() {
    var win = this.getDesignerWindow();
    if ( win ) {
      win._minimize();
    }
  };

  ApplicationIDE.prototype.togglePropertiesWindow = function() {
    var win = this.getPropertiesWindow();
    if ( win ) {
      win._minimize();
    }
  };

  ApplicationIDE.prototype.toggleFileBrowserWindow = function() {
  };

  //
  // PROPERTY EVENTS
  //

  ApplicationIDE.prototype.onPropertyApply = function(xpath, tagName, property, originalValue, value) {
    var elements = OSjs.Applications.ApplicationIDE.Elements;
    var target = null;
    var ttarget = null;
    var elementTagName = null;

    console.group('ApplicationIDE::onPropertyApply()');
    console.log('Xpath', xpath);
    console.log('Value', originalValue, value);
    console.log('Element', tagName, elements[tagName]);
    console.log('Target', target);
    console.log('Template Target', ttarget);
    console.log('Teplate Element', elementTagName, elements[elementTagName]);
    console.groupEnd();

    this.onElementSelected(xpath, tagName);

    var propWin = this.getPropertiesWindow();
    if ( propWin ) {
      propWin.selectElement(xpath, tagName, true);
    }
  };

  ApplicationIDE.prototype.onPropertySelected = function(property, item) {
    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();
    if ( !win || !propWin ) {
      return;
    }

    var value;
    var tagName;

    if ( property && item ) {
      var elements = OSjs.Applications.ApplicationIDE.Elements;
      tagName = item.tagName;

      if ( item.path ) {
        value = this.currentProject.getElementProperty(item.path, tagName, elements[tagName], property);
      } else {
        value = property === 'id' ? this.currentProject.getFragmentName() : null;
      }
    }

    propWin.selectProperty(property, value, tagName);
  };

  ApplicationIDE.prototype.onDeleteElementClick = function(xpath, tagName) {
    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();
    if ( !win ) {
      return;
    }

    console.group('ApplicationIDE::onDeleteElementClick()');

    var elements = OSjs.Applications.ApplicationIDE.Elements;
    var target = win.getElement(xpath);
    var ttarget = this.currentProject.getElement(xpath);

    console.log('Xpath', xpath);
    console.log('Element', tagName, elements[tagName]);
    console.log('Target', target);
    console.log('Template Target', ttarget);
    console.groupEnd();

    if ( target && ttarget ) {
      Utils.$remove(ttarget);

      if ( win ) {
        win.render();
      }
      if ( propWin ) {
        propWin.load();
      }
    }
  };

  ApplicationIDE.prototype.onElementSelected = function(xpath, tagName) {
    var elements = OSjs.Applications.ApplicationIDE.Elements;
    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();

    if ( !win || !propWin ) {
      return;
    }

    var target = null;
    var ttarget = null;
    var props = null;

    if ( xpath ) {
      target = win.getElement(xpath);
      ttarget = this.currentProject.getElement(xpath);
    } else {
      target = win._$root;
      ttarget = this.currentProject.getFragment();
      tagName = 'application-window';
    }

    console.group('ApplicationIDE::onElementSelected()');
    console.log('Xpath', xpath);
    console.log('Element', tagName, elements[tagName]);
    console.log('Target', target);
    console.log('Template Target', ttarget);
    console.groupEnd();

    var props = {};
    if ( target ) {
      win.selectElement(target);
      props = this.currentProject.getElementProperties(xpath, tagName, elements[tagName]);
    }

    propWin.renderProperties(xpath, tagName, props);
  };

  //
  // GLOBAL EVENTS
  //

  ApplicationIDE.prototype.onDOMElementClicked = function(ev, target) {
    function isValid(el) {
      if ( el ) {
        if ( el.getAttribute('data-ide-element') === 'true' || el.getAttribute('data-ide-container') === 'true' ) {
          return true;
        }
      }
      return false;
    }

    if ( isValid(target) ) {
      if ( Utils.$hasClass(target, 'ide-selected') ) {
        if ( isValid(target.parentNode) ) {
          target = target.parentNode;
        }
      }
      this.onElementClicked(target);
    }
  };

  //
  // DESIGNER EVENTS
  //

  ApplicationIDE.prototype.onElementClicked = function(target) {
    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();

    if ( !win ) {
      return;
    }

    var rootPath = OSjs.Applications.ApplicationIDE.getXpathByElement(win._$root);
    var xpath = OSjs.Applications.ApplicationIDE.getXpathByElement(target).replace(rootPath + '/', '');
    var tagName = target.tagName.toLowerCase();

    win.selectElement(target, true);

    console.log('ApplicationIDE::onElementClicked()', xpath, target);

    this.onElementSelected(xpath, tagName);

    if ( propWin ) {
      propWin.selectElement(xpath, tagName, true);
    }
  };

  ApplicationIDE.prototype.onElementDropped = function(xpath, tagName, elementTagName) {
    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();

    var rootPath = OSjs.Applications.ApplicationIDE.getXpathByElement(win._$root);
    xpath = xpath.replace(rootPath, '');

    var elements = OSjs.Applications.ApplicationIDE.Elements;
    var target = win.getElement(xpath.replace(/^\//, ''));
    var ttarget = this.currentProject.getElement(xpath);

    console.group('ApplicationIDE::onElementDropped()');
    console.log('Xpath', xpath);
    console.log('Element', tagName, elements[tagName]);
    console.log('Target', target);
    console.log('Template Target', ttarget);
    console.log('Teplate Element', elementTagName, elements[elementTagName]);

    if ( target && ttarget ) {
      var el = document.createElement(elementTagName);
      var setProps = elements[elementTagName].properties || {};

      Object.keys(setProps).forEach(function(k) {
        var val = setProps[k];
        var ref = elements[elementTagName];

        if ( typeof setProps[k] === 'function' ) {
          setProps[k](null, elementTagName);
        }

        if ( (ref.propertyTypes || {})[k] && typeof ref.propertyTypes[k].defaultValue !== 'undefined' ) {
          val = ref.propertyTypes[k].defaultValue;
        }

        if ( val !== null ) {
          if ( k === 'label' && ref.hasInnerLabel === true ) {
            el.appendChild(document.createTextNode(String(val)));
          } else {
            el.setAttribute('data-' + k, String(val));
          }
        }
      });

      ttarget.appendChild(el);

      if ( win ) {
        win.render()
      }

      if ( propWin ) {
        propWin.load();
      }
    }

    console.groupEnd();
  };

  //
  // MAIN EVENTS
  //

  ApplicationIDE.prototype.onNew = function() {
  };

  ApplicationIDE.prototype.onOpen = function() {
  };

  ApplicationIDE.prototype.onSave = function() {
    console.warn(this.currentProject.getHTML());
  };

  ApplicationIDE.prototype.onSaveAs = function() {
    console.warn(this.currentProject.getHTML());
  };

  //
  // GETTERS
  //

  ApplicationIDE.prototype.getMainWindow = function() {
    return this._getWindow(null);
  };

  ApplicationIDE.prototype.getDesignerWindow = function() {
    return this._getWindowsByTag('designer')[0];
  };

  ApplicationIDE.prototype.getPropertiesWindow = function() {
    return this._getWindowsByTag('properties')[0];
  };

  ApplicationIDE.prototype.getFileBrowserWindow = function() {
    return this._getWindowsByTag('filebrowser')[0];
  };


  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationIDE = OSjs.Applications.ApplicationIDE || {};
  OSjs.Applications.ApplicationIDE.Class = ApplicationIDE;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
