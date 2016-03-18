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
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationIDEWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationIDEWindow', {
      gravity: 'north-west',
      icon: metadata.icon,
      title: metadata.name + ' - Main Window',
      allow_maximize: false,
      width: 175,
      height: 420
    }, app, scheme]);
  }

  ApplicationIDEWindow.prototype = Object.create(Window.prototype);
  ApplicationIDEWindow.constructor = Window.prototype;

  ApplicationIDEWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'IDEWindow', root);

    var elements = OSjs.Applications.ApplicationIDE.Elements;
    var categories = OSjs.Applications.ApplicationIDE.Categories;

    var toolbar = scheme.find(this, 'Buttons');

    categories.forEach(function(c) {
      var expander = scheme.create(this, 'gui-expander', {
        label: c.label
      }, toolbar);

      c.items.forEach(function(name) {
        var el = elements[name];

        var button = scheme.create(self, 'gui-button', {
          icon: el.icon.match(/\//) ? API.getIcon(el.icon) : API.getApplicationResource(app, 'icons/' + el.icon),
          tooltip: name,
          name: name
        }, expander);

        API.createDraggable(button.$element, {
          data: {
            tagName: name
          }
        });

        button = null;
      });
    });

    var menuMap = {
      MenuNew:            function() { app.onNew(); },
      MenuOpen:           function() { app.onOpen(); },
      MenuSave:           function() { app.onSave(); },
      MenuClose:          function() { self._close(); },
      MenuDesignerWindow: function() { app.toggleDesignerWindow(); },
      MenuPropertyWindow: function() { app.togglePropertiesWindow(); }
    };

    function menuEvent(ev) {
      if ( menuMap[ev.detail.id] ) {
        menuMap[ev.detail.id]();
      }
      self.update();
    }
    this._scheme.find(this, 'SubmenuFile').on('select', menuEvent);
    this._scheme.find(this, 'SubmenuView').on('select', menuEvent);

    this.update();

    return root;
  };

  ApplicationIDEWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationIDEWindow.prototype.update = function() {
    var viewMenu = this._scheme.find(this, 'SubmenuView');
    var app = this._app;

    viewMenu.set('checked', 'MenuDesignerWindow', !!app.getDesignerWindow());
    viewMenu.set('checked', 'MenuPropertyWindow', !!app.getPropertiesWindow());
  };

  ApplicationIDEWindow.prototype.clear = function() {
  };

  ApplicationIDEWindow.prototype.load = function() {
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationIDE = OSjs.Applications.ApplicationIDE || {};
  OSjs.Applications.ApplicationIDE.MainWindow = ApplicationIDEWindow;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
