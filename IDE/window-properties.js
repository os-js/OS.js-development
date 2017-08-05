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
const Window = OSjs.require('core/window');
const Process = OSjs.require('core/process');
const FileMetadata = OSjs.require('vfs/file');
const Menu = OSjs.require('gui/menu');
const Theme = OSjs.require('core/theme');
const GUIElement = OSjs.require('gui/element');
const Utils = OSjs.require('utils/misc');

import {getXpathByElement} from './utils';
import {Elements} from './elements';

export default class ApplicationIDEPropertiesWindow extends Window {

  constructor(app, metadata) {
    super('ApplicationIDEPropertiesWindow', {
      tag: 'properties',
      gravity: 'nort-east',
      icon: metadata.icon,
      title: metadata.name + ' - Project',
      allow_maximize: false,
      width: 350,
      height: 740
    }, app);

    this.currentPath = null;
    this.currentProperty = {
      name: null,
      tagName: null,
      value: null
    };
  }

  init(wmRef, app) {
    var root = super.init(...arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    this._render('IDEPropertiesWindow', require('osjs-scheme-loader!./scheme.html'));

    var fileView = this._find('Files');
    var treeView = this._find('Tree');
    var iconView = this._find('Properties');
    var input = this._find('PropertyValueInput');
    var inputTyped = this._find('PropertyValueTypedInput');
    var selectTyped = this._find('PropertyValueTypedSelect');
    var select = this._find('PropertyValueSelect');
    var selectFragment = this._find('SelectFragment');

    function applyValue(value) {
      app.onPropertyApply(self.currentPath, self.currentProperty.tagName, self.currentProperty.name, self.currentProperty.value, value);
    }

    function applyMetadata() {
      app.onApplyMetadata({
        className: self._find('MetadataClassName').get('value'),
        name: self._find('MetadataName').get('value'),
        icon: self._find('MetadataIcon').get('value'),
        singular: self._find('MetadataSingular').get('value'),
        category: self._find('MetadataCategory').get('value')
      });
    }

    function applyValues() {
      var val;
      if ( self._find('VBoxInput').$element.style.display !== 'none' ) {
        applyValue(input.get('value'));
      } else if ( self._find('VBoxSelect').$element.style.display !== 'none' ) {
        val = select.get('value');
        if ( val !== '(null)' ) {
          applyValue(val);
        }
      } else {
        if ( inputTyped.get('value') === 'auto' || selectTyped.get('value') === 'auto' ) {
          applyValue('auto');
        } else {
          val = String(inputTyped.get('value')) + String(selectTyped.get('value'));
          applyValue(val);
        }
      }
    }

    function resetValue() {
      input.set('value', '(null)');
      inputTyped.set('value', '(null)');
      select.set('value', 'null');
      selectTyped.set('value', 'null');
    }

    treeView.on('contextmenu', function(ev) {
      var entry = ev.detail.entries[0].data;
      if ( entry ) {
        Menu.create([
          {
            title: 'Delete',
            onClick: function() {
              app.onDeleteElementClick(entry.path, entry.tagName);
            }
          }
        ], ev);
      }
    });

    treeView.on('drop', function(ev) {
      app.onTreeElementDropped(ev.detail);
    });

    treeView.on('select', function(ev) {
      var entry = ev.detail.entries[0].data;
      app.onElementSelected(entry.path, entry.tagName);
      self.currentPath = entry.path;
    });

    iconView.on('select', function(ev) {
      var sel = treeView.get('selected') || [];
      sel = (sel[0] || {}).data || null;

      app.onPropertySelected(ev.detail.entries[0].data, sel);
    });

    selectFragment.on('change', function(ev) {
      var idx = parseInt(ev.detail, 10) || 0;
      app.onSelectFragment(idx);
    });

    this._find('VBoxSelect').hide();
    this._find('VBoxTyped').hide();
    this._find('VBoxEmpty').show();

    this._find('PropertyButtonApply').on('click', function() {
      applyValues();
    });

    input.on('enter', function() {
      applyValues();
    });
    inputTyped.on('enter', function() {
      applyValues();
    });

    this._find('PropertyButtonNull').on('click', function() {
      resetValue();
    });

    this._find('AddFragment').on('click', function() {
      app.onAddFragment();
    });
    this._find('RemoveFragment').on('click', function() {
      app.onRemoveFragment();
    });

    this._find('MetadataApply').on('click', function() {
      applyMetadata();
    });

    this._find('MetadataAddMime').on('click', function() {
      var value = self._find('MetadataAddMimeValue').get('value');
      if ( value ) {
        app.onAddMime(value);
      }
      self._find('MetadataAddMimeValue').set('value', '');
    });

    fileView.on('activate', function(ev) {
      if ( ev.detail && ev.detail.entries ) {
        ev.detail.entries.forEach(function(e) {
          if ( e && e.data ) {
            Process.createFromFile.open(new FileMetadata(e.data.filename, e.data.mime), {
              forceList: true
            });
          }
        });
      }
    });

    return root;
  }

  /////////////////////////////////////////////////////////////////////////////
  // IDE METHODS
  /////////////////////////////////////////////////////////////////////////////

  clear() {
    this.currentPath = null;
    this.currentProperty = {
      name: null,
      tagName: null,
      value: null
    };

    this._find('Tree').clear();
    this._find('Properties').clear();
    this._find('SelectFragment').clear();
    this._find('Statusbar').set('value', '');
    this._find('PropertyValueInput').set('value', '');
    this._find('PropertyValueSelect').clear().set('value', '');

    this._find('PropertyButtonNull').set('disabled', true);
    this._find('PropertyButtonApply').set('disabled', true);

    this._find('VBoxSelect').hide();
    this._find('VBoxTyped').hide();
    this._find('VBoxEmpty').show();
  }

  load(project) {
    this.renderTree();
    this.renderProperties();
    this.renderWindowList(project);
    this.renderFileList(project);
    this.renderMetadata(project);
  }

  /////////////////////////////////////////////////////////////////////////////
  // UI ACTIONS
  /////////////////////////////////////////////////////////////////////////////

  selectElement(xpath, tagName, clicked) {
    var treeView = this._find('Tree');
    treeView.set('selected', xpath, 'path', {scroll:true});

    this.currentPath = xpath;
    this._find('PropertyButtonNull').set('disabled', true);
    this._find('PropertyButtonApply').set('disabled', true);
  }

  selectProperty(property, value, tagName) {
    var type = this._app.currentProject.getElementPropertyType(Elements[tagName], property);

    var val = value;
    if ( val === null || typeof val === 'undefined') {
      val = '(null)';
    }

    this.currentProperty.name = property;
    this.currentProperty.tagName = tagName;
    this.currentProperty.value = value;

    var input = this._find('PropertyValueInput').set('value', '');
    var select = this._find('PropertyValueSelect').clear();
    var inputTyped = this._find('PropertyValueTypedInput').set('value', '');
    var selectTyped = this._find('PropertyValueTypedSelect').set('value', 'px');

    //var noopContainer = this._find('VBoxEmpty').hide();
    var normalContainer = this._find('VBoxInput').hide();
    var selectContainer = this._find('VBoxSelect').hide();
    var typedContainer  = this._find('VBoxTyped').hide();

    if ( type === 'boolean' || type === 'mixed' ) {
      selectContainer.show();

      var items = [];
      try {
        items = Array.prototype.slice.call(type === 'mixed' ? Elements[tagName].propertyTypes[property].values : [
          {label: 'true', value: 'true'},
          {label: 'false', value: 'false'}
        ]);
      } catch ( e ) {
        console.warn(e);
      }

      if ( (['true', 'false']).indexOf(String(value)) < 0 ) {
        items.unshift({label: 'NULL', value: 'null'});
      }

      select.add(items).set('value', String(value));
    } else if ( type === 'unit' ) {
      typedContainer.show();

      var vspl = String(val).match(/([0-9\.]+)(px|em|rem|pt|\%)?$/) || [];
      var valt = vspl.length > 1 ? vspl[2] || 'px' : 'auto';
      var valn = vspl.length > 0 ? vspl[1] || 0 : 'auto';

      inputTyped.set('value', valn);
      selectTyped.set('value', valt);
    } else {
      normalContainer.show();

      input.set('value', val);
      select.clear();
    }

    this._find('PropertyButtonNull').set('disabled', false);
    this._find('PropertyButtonApply').set('disabled', false);
  }

  /////////////////////////////////////////////////////////////////////////////
  // PROPERTIES
  /////////////////////////////////////////////////////////////////////////////

  renderProperties(xpath, tagName, properties) {
    //var app = this._app;
    //var project = app.currentProject;

    this._find('PropertyValueInput').set('value', '');
    this._find('PropertyValueSelect').clear().set('value', '');

    var statusBar = this._find('Statusbar');
    statusBar.set('value', '/' + (typeof xpath === 'string' ? (xpath || '') : (xpath || 'null')));

    var listView = this._find('Properties');
    listView.clear();

    if ( properties ) {
      var rows = [];
      listView.set('columns', [
        {label: 'Name'},
        {label: 'Type', size: '70px'},
        {label: 'Value', size: '80px'}
      ]);

      Object.keys(properties).forEach(function(k) {
        rows.push({
          value: k,
          columns: [
            {label: k},
            {label: properties[k].type},
            {label: String(properties[k].value)}
          ]
        });
      });

      listView.add(rows);
    }

    this._find('VBoxEmpty').show();
    this._find('VBoxInput').hide();
    this._find('VBoxSelect').hide();
    this._find('VBoxTyped').hide();

    this._find('PropertyButtonNull').set('disabled', true);
    this._find('PropertyButtonApply').set('disabled', true);
  }

  renderTree() {
    var app = this._app;
    var project = app.currentProject;
    var windowName = project.getFragmentName();
    var rootWindow = project.getFragment();
    //var wid = String(project.currentWindow + 1);

    var treeView = this._find('Tree');
    treeView.clear();

    var rootIter = {
      label: windowName,
      icon: app._getResource('icons/widget-gtk-window.png'),
      dropable: true,
      value: {
        tagName: 'application-window',
        path: ''
      },
      entries: []
    };

    var tree = [rootIter];

    function traverse(root, riter) {
      if ( root && root.children ) {
        root.children.forEach(function(c) {
          var el = Utils.argumentDefaults(Elements[c.tagName.toLowerCase()] || {}, {
            source: 'tree',
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
            icon: el.icon.match(/\//) ? Theme.getIcon(el.icon) : app._getResource('icons/' + el.icon),
            draggable: true,
            droppable: true,
            value: {
              source: 'tree',
              isContainer: el.isContainer,
              tagName: c.tagName.toLowerCase(),
              path: getXpathByElement(c, rootWindow)
                .replace(/\/div\[1\]\/application\-window\[\d+\]\//, '')
                .replace(/\/div\[1\]\/application\-fragment\[\d+\]\//, '')
            },
            entries: []
          };

          riter.entries.push(niter);

          if ( !el.special ) {
            traverse(c, niter);
          }
        });
      }
    }

    traverse(rootWindow, rootIter);
    treeView.add(tree);
  }

  /////////////////////////////////////////////////////////////////////////////
  // FILES
  /////////////////////////////////////////////////////////////////////////////

  renderFileList(project) {
    var self = this;

    var treeView = this._find('Files');
    treeView.clear();

    var entries = (function() {
      var result = [];
      project.data.preload.forEach(function(iter) {
        var mime = 'text/plain';
        var types = {
          stylesheet: 'text/css',
          javascript: 'application/javascript'
        };

        if ( types[iter.type] ) {
          mime = types[iter.type];
        }

        result.push({
          label: iter.src,
          icon: Theme.getIcon('mimetypes/binary.png'),
          value: {
            filename: project.path + '/' + iter.src,
            mime: mime
          }
        });
      });
      return result;
    })();

    var tree = [{
      label: project.data.name,
      icon: Theme.getIcon('categories/applications-development.png'),
      value: {
        tagName: 'application-window',
        path: ''
      },
      entries: [{
        label: 'Project',
        entries: [{
          icon: Theme.getIcon('mimetypes/binary.png'),
          label: 'metadata.json'
        }, {
          icon: self._app._getResource('icons/widget-gtk-window.png'),
          label: 'scheme.html'
        }]
      }, {
        label: 'Preload',
        entries: entries
      }, {
        label: 'Server',
        entries: [{
          icon: Theme.getIcon('mimetypes/binary.png'),
          label: 'api.js',
          value: {
            filename: project.path + '/api.js',
            mime: 'application/javascript'
          }
        }]
      }]
    }];

    treeView.add(tree);
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOW LIST
  /////////////////////////////////////////////////////////////////////////////

  renderWindowList(project) {
    var select = this._find('SelectFragment');
    select.clear();

    project = this._app.currentProject; // FIXME: Why did I do this again ? :P
    var fragments = project.getFragments();
    var list = [];

    fragments.forEach(function(name, idx) {
      list.push({
        label: name,
        value: idx
      });
    });

    select.add(list).set('value', String(project.currentWindow));

    this._find('RemoveFragment').set('disabled', project.currentWindow === 0 || list.length <= 1);
  }

  /////////////////////////////////////////////////////////////////////////////
  // METADATA
  /////////////////////////////////////////////////////////////////////////////

  renderMetadata(project) {
    var self = this;

    this._find('MetadataClassName').set('value', project.data.className);
    this._find('MetadataName').set('value', project.data.name);
    this._find('MetadataIcon').set('value', project.data.icon);
    this._find('MetadataCategory').set('value', project.data.category);
    this._find('MetadataSingular').set('value', project.data.singular === true);

    var parentEl = this._find('MetadataMimeContainer');
    var templateEl = this._scheme.getFragment('MIMERowTemplate');

    while ( parentEl.$element.children.length > 1 ) {
      parentEl.$element.removeChild(parentEl.$element.children[parentEl.$element.children.length - 1]);
    }

    (project.data.mime || []).forEach(function(m, idx) {
      var tpl = templateEl.firstChild.cloneNode(true);
      var row = GUIElement.create(tpl);
      var txt = row.querySelector('gui-text', true);
      var btn = row.querySelector('gui-button', true);
      parentEl.append(row);

      setTimeout(function() {
        txt.set('value', m);
        btn.on('click', function() {
          project.removeMime(idx);
          self.renderMetadata(project);
        });
      }, 0);
    });
  }

}
