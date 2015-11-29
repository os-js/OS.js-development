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

  function ApplicationIDEPropertiesWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationIDEPropertiesWindow', {
      tag: 'properties',
      gravity: 'nort-east',
      icon: metadata.icon,
      title: metadata.name + ' - Properties',
      width: 350,
      height: 740
    }, app, scheme]);
  }

  ApplicationIDEPropertiesWindow.prototype = Object.create(Window.prototype);
  ApplicationIDEPropertiesWindow.constructor = Window.prototype;

  ApplicationIDEPropertiesWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'IDEPropertiesWindow', root);

    var treeView = this._scheme.find(this, 'Tree');
    var iconView = this._scheme.find(this, 'Properties');

    treeView.on('contextmenu', function(ev) {
      var entry = ev.detail.entries[0].data;
      if ( entry ) {
        API.createMenu([
          {
            title: 'Delete',
            onClick: function() {
              app.onDeleteElementClick(entry.path, entry.tagName);
            }
          }
        ], ev);
      }
    });

    treeView.on('select', function(ev) {
      var entry = ev.detail.entries[0].data;
      app.onElementSelected(entry.path, entry.tagName);
    });

    iconView.on('select', function(ev) {
      var sel = treeView.get('selected') || [];
      sel = (sel[0] || {}).data || null;

      app.onPropertySelected(ev.detail.entries[0].data, sel);
    });

    return root;
  };

  ApplicationIDEPropertiesWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationIDEPropertiesWindow.prototype.clear = function() {
    this._scheme.find(this, 'Tree').clear();
    this._scheme.find(this, 'Properties').clear();
    this._scheme.find(this, 'Statusbar').set('value', '');
    this._scheme.find(this, 'PropertyValue').set('value', '');
  };

  ApplicationIDEPropertiesWindow.prototype.load = function() {
    this.renderTree();
    this.renderProperties();
  };

  ApplicationIDEPropertiesWindow.prototype.selectElement = function(xpath, tagName, clicked) {
    var treeView = this._scheme.find(this, 'Tree');
    treeView.set('selected', xpath, 'path', {scroll:true});
  };

  ApplicationIDEPropertiesWindow.prototype.selectProperty = function(property, value) {
    this._scheme.find(this, 'PropertyValue').set('value', String(value));
  };

  ApplicationIDEPropertiesWindow.prototype.renderProperties = function(xpath, tagName, properties) {
    var app = this._app;
    var project = app.currentProject;
    var elements = OSjs.Applications.ApplicationIDE.Elements;

    this._scheme.find(this, 'PropertyValue').set('value', '');

    var statusBar = this._scheme.find(this, 'Statusbar');
    statusBar.set('value', '/' + (typeof xpath === 'string' ? (xpath || '') : (xpath || 'null')));

    var listView = this._scheme.find(this, 'Properties');
    listView.clear();

    if ( properties ) {
      var rows = [];
      listView.set('columns', [
        {label: 'Name', basis: '100px', grow: 1, shrink: 1},
        {label: 'Value', grow: 0, shrink: 0}
      ]);

      Object.keys(properties).forEach(function(k) {
        var val = String(properties[k]);
        var key = k;

        rows.push({
          value: k,
          columns: [
            {label: key},
            {label: val}
          ]
        });
      });

      listView.add(rows);
    }
  };

  ApplicationIDEPropertiesWindow.prototype.renderTree = function() {
    var app = this._app;
    var project = app.currentProject;
    var windowName = project.windows[0];
    var rootWindow = project.getWindow(windowName);

    var treeView = this._scheme.find(this, 'Tree');
    treeView.clear();

    var elements = OSjs.Applications.ApplicationIDE.Elements;
    var rootIter = {
      label: windowName,
      icon: API.getApplicationResource(app, 'icons/widget-gtk-window.png'),
      value: {
        tagName: 'application-window',
        path: ''
      },
      entries: []
    };

    var tree = [rootIter];

    function traverse(root, riter) {
      if ( root.children ) {
        root.children.forEach(function(c) {

          var el = Utils.argumentDefaults(elements[c.tagName.toLowerCase()] || {}, {
            isContainer: false,
            icon: 'status/dialog-question.png'
          });

          var name = c.tagName.toLowerCase();
          var id = c.getAttribute('data-id') || null;
          if ( id ) {
            name = name + ' (' + id + ')';
          }

          var niter = {
            label: name,
            icon: el.icon.match(/\//) ? API.getIcon(el.icon) : API.getApplicationResource(app, 'icons/' + el.icon),
            value: {
              tagName: c.tagName.toLowerCase(),
              path: OSjs.Applications.ApplicationIDE.getXpathByElement(c, rootWindow).replace('/div[1]/application-window[1]/', '')
            },
            entries: []
          };

          riter.entries.push(niter);
          traverse(c, niter);
        });
      }
    }

    traverse(rootWindow, rootIter);
    treeView.add(tree);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationIDE = OSjs.Applications.ApplicationIDE || {};
  OSjs.Applications.ApplicationIDE.PropertiesWindow = ApplicationIDEPropertiesWindow;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
