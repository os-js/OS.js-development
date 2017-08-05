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
import {Elements, Categories} from './elements';

const Window = OSjs.require('core/window');
const Theme = OSjs.require('core/theme');
const GUI = OSjs.require('utils/gui');

export default class ApplicationIDEWindow extends Window {

  constructor(app, metadata) {
    super('ApplicationIDEWindow', {
      gravity: 'north-west',
      icon: metadata.icon,
      title: metadata.name + ' - Main Window',
      allow_maximize: false,
      width: 250,
      height: 500
    }, app);
  }

  init(wmRef, app) {
    var root = super.init(...arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    this._render('IDEWindow', require('osjs-scheme-loader!./scheme.html'));

    var toolbar = this._find('Buttons');

    Categories.forEach(function(c) {
      var expander = self._create('gui-expander', {
        label: c.label
      }, toolbar);

      c.items.forEach(function(name) {
        var el = Elements[name];

        var button = self._create('gui-button', {
          icon: el.icon.match(/\//) ? Theme.getIcon(el.icon) : app._getResource('icons/' + el.icon),
          tooltip: name,
          name: name
        }, expander);

        GUI.createDraggable(button.$element, {
          data: {
            source: 'palette',
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
    this._find('SubmenuFile').on('select', menuEvent);
    this._find('SubmenuView').on('select', menuEvent);
    this._find('MenuSave').set('disabled', true);

    this.update();

    return root;
  }

  update() {
    var viewMenu = this._find('SubmenuView');
    var app = this._app;

    viewMenu.set('checked', 'MenuDesignerWindow', !!app.getDesignerWindow());
    viewMenu.set('checked', 'MenuPropertyWindow', !!app.getPropertiesWindow());

    this._find('MenuSave').set('disabled', app.currentProject ? false : true);
  }

  clear() {
  }

  load() {
    var app = this._app;
    this._find('MenuSave').set('disabled', app.currentProject ? false : true);
  }

}
