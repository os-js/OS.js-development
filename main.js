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
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationIDE(args, metadata) {
    Application.apply(this, ['ApplicationIDE', args, metadata]);

    this.currentProject = null;
    this.currentWindow = null;
  }

  ApplicationIDE.prototype = Object.create(Application.prototype);
  ApplicationIDE.constructor = Application;

  ApplicationIDE.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationIDE.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;

    function loadDefaultProject() {
      self.openProject('default/FileManager');
    }

    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new OSjs.Applications.ApplicationIDE.MainWindow(self, metadata, scheme), null, true);
      self._addWindow(new OSjs.Applications.ApplicationIDE.PropertiesWindow(self, metadata, scheme));
      self._addWindow(new OSjs.Applications.ApplicationIDE.DesignerWindow(self, metadata));

      loadDefaultProject();

      onInited();
    });

    this._setScheme(scheme);
  };

  ApplicationIDE.prototype.windowAction = function(fn, args) {
    var mainWin = this.getMainWindow();
    var propWin = this.getPropertiesWindow();
    var designWin = this.getDesignerWindow();

    mainWin[fn].apply(mainWin, args);
    propWin[fn].apply(propWin, args);
    designWin[fn].apply(designWin, args);
  };

  ApplicationIDE.prototype.openProject = function(name) {
    var self = this;

    this.currentProject = null;
    this.windowAction('_toggleLoading', [true]);
    this.windowAction('clear', []);

    this.currentProject = new OSjs.Applications.ApplicationIDE.Project(name);
    this.currentProject.load(function(err) {
      console.warn("PROJECT", self.currentProject);
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

  ApplicationIDE.prototype.onElementSelected = function(win, el, target) {
    console.group('ApplicationIDE::onElementSelected()');
    console.log('Window', win);
    console.log('Element', el);
    console.log('Target', target);
    console.groupEnd();

    if ( target ) {
      win.selectElement(target);
    }
  };

  ApplicationIDE.prototype.onDeleteElementClick = function(win, el, target) {
    console.group('ApplicationIDE::onDeleteElementClick()');
    console.log('Window', win);
    console.log('Element', el);
    console.log('Target', target);
    console.groupEnd();

    if ( target ) {
    }
  };

  ApplicationIDE.prototype.onElementDropped = function(win, el, target) {
    console.warn('ApplicationIDE::onElementDropped()', win, el, target);
  };

  ApplicationIDE.prototype.getMainWindow = function() {
    return this._getWindow(null);
  };

  ApplicationIDE.prototype.getDesignerWindow = function() {
    return this._getWindowsByTag('designer')[0];
  };

  ApplicationIDE.prototype.getPropertiesWindow = function() {
    return this._getWindowsByTag('properties')[0];
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationIDE = OSjs.Applications.ApplicationIDE || {};
  OSjs.Applications.ApplicationIDE.Class = ApplicationIDE;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
