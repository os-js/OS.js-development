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
      width: 200,
      height: 500
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

    var toolbar = scheme.find(this, 'Buttons');
    Object.keys(elements).forEach(function(name) {
      var el = elements[name];
      if ( el === null ) {
        toolbar.append(document.createElement('div'));
        return;
      }
      if ( el.skip === true ) {
        return;
      }

      var button = scheme.create(self, 'gui-button', {
        icon: el.icon.match(/\//) ? API.getIcon(el.icon) : API.getApplicationResource(app, 'icons/' + el.icon),
        tooltip: name,
        name: name
      }, toolbar);

      API.createDraggable(button.$element, {
        data: {
          tagName: name
        }
      });

      button = null;
    });

    return root;
  };

  ApplicationIDEWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
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
