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
import FragmentDialog from './dialog-fragment';
import Project from './project';
import PropertiesWindow from './window-properties';
import DesignerWindow from './window-designer';
import MainWindow from './window-main';
import {Elements} from './elements';
import * as Utils from './utils';

const Application = OSjs.require('core/application');
const Dialog = OSjs.require('core/dialog');
const DOM = OSjs.require('utils/dom');
const VFS = OSjs.require('vfs/fs');
const FileMetadata = OSjs.require('vfs/file');
const PackageManager = OSjs.require('core/package-manager');
const WindowManager = OSjs.require('core/window-manager');

/////////////////////////////////////////////////////////////////////////////
// APPLICATION CLASS
/////////////////////////////////////////////////////////////////////////////

class ApplicationIDE extends Application {

  constructor(args, metadata) {
    super('ApplicationIDE', args, metadata);

    this.currentProject = null;
    this.currentWindow = null;
    this.globalClickEvent = null;
    this.fragmentDialog = null;
  }

  destroy() {
    document.removeEventListener('click', this.globalClickEvent, false);

    this.curentProject = null;
    this.fragmentDialog = null;

    var designWin = this.getDesignerWindow();
    if ( designWin ) {
      designWin.destroy();
    }

    return super.destroy(...arguments);
  }

  init(settings, metadata) {
    super.init(...arguments);

    var self = this;
    self._addWindow(new PropertiesWindow(self, metadata));
    self._addWindow(new DesignerWindow(self, metadata));
    self._addWindow(new MainWindow(self, metadata), null, true);

    var file = self._getArgument('file');
    if ( file ) {
      self.loadProject(null, file.path);
    }

    this.globalClickEvent = function(ev) {
      self.onDOMElementClicked(ev, ev.target || ev.srcElement);
    };

    document.addEventListener('click', this.globalClickEvent, false);
  }

  //
  // HELPERS
  //

  windowAction(fn, args) {
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
  }

  loadProject(name, path) {
    var self = this;

    this.currentProject = null;
    this.windowAction('_toggleLoading', [true]);
    this.windowAction('clear', []);

    this.currentProject = new Project(name, path);
    this.currentProject.load(this, function(err) {
      self.windowAction('_toggleLoading', [false]);
      if ( !err ) {
        self.windowAction('load', [self.currentProject]);

        self._setArgument('file', new FileMetadata(self.currentProject.path));
      }
    });
  }

  toggleDesignerWindow() {
    var win = this.getDesignerWindow();
    if ( win ) {
      win._minimize();
    }
  }

  togglePropertiesWindow() {
    var win = this.getPropertiesWindow();
    if ( win ) {
      win._minimize();
    }
  }

  //
  // PROPERTY EVENTS
  //

  onAddMime(mime) {
    if ( !this.currentProject ) {
      return;
    }
    this.currentProject.addMime(mime);

    var propWin = this.getPropertiesWindow();
    if ( propWin ) {
      propWin.load(this.currentProject);
    }
  }

  onApplyMetadata(metadata) {
    if ( !this.currentProject ) {
      return;
    }
    this.currentProject.applyMetadata(metadata);

    this.onSave('metadata');

    var win = this.getDesignerWindow();
    if ( win ) {
      win.render();
    }
  }

  onAddFragment() {
    var self = this;
    var propWin = this.getPropertiesWindow();

    if ( !this.currentProject ) {
      return;
    }

    if ( this.fragmentDialog ) {
      this.fragmentDialog._focus();
      return;
    }

    function done(data) {
      if ( data.name ) {
        self.currentProject.createFragment(data.type, data.name);

        /*if ( win ) {
          win.render()
        }*/

        if ( propWin ) {
          propWin.load(self.currentProject);
        }
      }
    }

    Dialog.create(function(args, callback) {
      self.fragmentDialog = new FragmentDialog(args, callback);

      return self.fragmentDialog;
    }, {
      scheme: this.__scheme
    }, function(ev, btn, data) {
      self.fragmentDialog = null;

      if ( btn === 'ok' ) {
        done(data);
      }
    }, this);
  }

  onRemoveFragment() {
    if ( !this.currentProject ) {
      return;
    }

    var idx = this.currentProject.currentWindow;
    if ( this.currentProject.removeFragment(idx) ) {
      var win = this.getDesignerWindow();
      if ( win ) {
        win.render();
      }

      var propWin = this.getPropertiesWindow();
      if ( propWin ) {
        propWin.load(this.currentProject);
      }
    }
  }

  onSelectFragment(index) {
    if ( !this.currentProject ) {
      return;
    }

    this.currentProject.currentWindow = index;

    var win = this.getDesignerWindow();
    if ( win ) {
      win.render();
    }

    var propWin = this.getPropertiesWindow();
    if ( propWin ) {
      propWin.load(this.currentProject);
    }
  }

  onPropertyApply(xpath, tagName, property, originalValue, value) {
    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();
    var self = this;

    if ( !win ) {
      return;
    }

    var target = win.getElement(xpath);
    var ttarget = this.currentProject.getElement(xpath);

    console.group('ApplicationIDE::onPropertyApply()');
    console.log('Xpath', xpath);
    console.log('Property', property);
    console.log('Value', originalValue, value);
    console.log('Element', tagName, Elements[tagName]);
    console.log('Target', target);
    console.log('Template Target', ttarget);
    console.groupEnd();

    if ( ttarget && Elements[tagName] ) {
      var result;
      if ( typeof Elements[tagName].onpropertyupdate === 'function' ) {
        result = Elements[tagName].onpropertyupdate(ttarget, tagName, property, value);
      } else {
        result = Utils.setProperty(ttarget, tagName, property, value);
      }

      if ( tagName === 'application-window' ) {
        this.currentProject.updateFragments();
      }

      if ( result ) {
        win.render();

        if ( propWin ) {
          propWin.load(this.currentProject);
        }
      }

      setTimeout(function() {
        self.onElementSelected(xpath, tagName);

        if ( propWin ) {
          propWin.selectElement(xpath, tagName, true);
        }
      }, 100);

      return result;
    }

    return true;
  }

  onPropertySelected(property, item) {
    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();
    if ( !win || !propWin ) {
      return;
    }

    var value;
    var tagName;

    if ( property && item ) {
      tagName = item.tagName;

      if ( item.path ) {
        value = this.currentProject.getElementProperty(item.path, tagName, Elements[tagName], property);
      } else {
        value = property === 'id' ? this.currentProject.getFragmentName() : null;
      }
    }

    propWin.selectProperty(property, value, tagName);
  }

  onDeleteElementClick(xpath, tagName) {
    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();
    if ( !win ) {
      return;
    }

    console.group('ApplicationIDE::onDeleteElementClick()');

    var target = win.getElement(xpath);
    var ttarget = this.currentProject.getElement(xpath);

    console.log('Xpath', xpath);
    console.log('Element', tagName, Elements[tagName]);
    console.log('Target', target);
    console.log('Template Target', ttarget);
    console.groupEnd();

    if ( target && ttarget ) {
      DOM.$remove(ttarget);

      if ( win ) {
        win.render();
      }

      if ( propWin ) {
        propWin.load(this.currentProject);
      }
    }
  }

  onElementSelected(xpath, tagName) {
    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();

    if ( !win || !propWin ) {
      return;
    }

    var target = null;
    var ttarget = null;
    var dxpath = xpath;

    if ( xpath ) {
      target = win.getElement(xpath);
      ttarget = this.currentProject.getElement(xpath);

      if ( Elements[tagName].selectQuery ) {
        var idx = DOM.$index(ttarget);
        dxpath = Elements[tagName].selectQuery(idx, xpath);

        target = win.getElement(dxpath);
      }
    } else {
      target = win._$root;
      ttarget = this.currentProject.getFragment();
      tagName = 'application-window';
    }

    console.group('ApplicationIDE::onElementSelected()');
    console.log('Xpath', xpath);
    console.log('Element', tagName, Elements[tagName]);
    console.log('Target', target);
    console.log('Template Target', ttarget);
    console.groupEnd();

    var props = {};
    if ( target ) {
      win.selectElement(target);
      props = this.currentProject.getElementProperties(xpath, tagName, Elements[tagName]);
    }

    propWin.renderProperties(xpath, tagName, props);
  }

  onTreeElementDropped(data) {
    var self = this;
    var win = this.getDesignerWindow();
    var propWin;

    if ( !win || !data.src || !data.dest || (data.src.path === data.dest.path) ) {
      return;
    }

    if ( data.src.source === 'palette' ) {
      if ( data.dest.path ) {
        this.onElementDropped(data.dest.path, data.dest.tagName, data.src.tagName);
      }
      return;
    }

    if ( typeof data.src.path === 'undefined' || typeof data.dest.path === 'undefined' ) {
      return;
    }

    var sourceTarget = this.currentProject.getElement(data.src.path.replace(/^\//, ''));
    var destTarget = this.currentProject.getElement(data.dest.path.replace(/^\//, ''));

    function done() {
      win.render();

      if ( propWin ) {
        propWin.load(self.currentProject);
      }
    }

    if ( sourceTarget && destTarget ) {

      propWin = this.getPropertiesWindow();

      if ( data.dest.isContainer ) {
        var valid = Utils.isValidTarget(
          sourceTarget.tagName.toLowerCase(),
          destTarget.tagName.toLowerCase() );

        if ( valid !== true ) {
          var wm = WindowManager.instance;
          if ( wm ) {
            wm.notification({
              icon: 'status/important.png',
              title: 'IDE',
              message: valid
            });
          }

          destTarget.parentNode.insertBefore(sourceTarget, destTarget);

          return done();
        }

        destTarget.appendChild(sourceTarget);
      } else {
        destTarget.parentNode.insertBefore(sourceTarget, destTarget);
      }

      done();
    }
  }

  //
  // GLOBAL EVENTS
  //

  onDOMElementClicked(ev, target) {
    function isValid(el) {
      if ( el ) {
        if ( el.getAttribute('data-ide-element') === 'true' || el.getAttribute('data-ide-container') === 'true' ) {
          return true;
        }
      }
      return false;
    }

    if ( isValid(target) ) {
      if ( DOM.$hasClass(target, 'ide-selected') ) {
        if ( isValid(target.parentNode) ) {
          target = target.parentNode;
        }
      }
      this.onElementClicked(target);
    }
  }

  //
  // DESIGNER EVENTS
  //

  onWindowResize(dim) {
    if ( !this.currentProject ) {
      return;
    }

    var frag = this.currentProject.getFragment();
    this.onPropertyApply('', frag.tagName.toLowerCase(), 'width', dim.w, dim.w);
    this.onPropertyApply('', frag.tagName.toLowerCase(), 'height', dim.h, dim.h);
  }

  onElementClicked(target) {
    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();

    if ( !win ) {
      return;
    }

    var rootPath = Utils.getXpathByElement(win._$root);
    var xpath = Utils.getXpathByElement(target).replace(rootPath + '/', '');
    var tagName = target.tagName.toLowerCase();

    win.selectElement(target, true);

    console.log('ApplicationIDE::onElementClicked()', xpath, target);

    this.onElementSelected(xpath, tagName);

    if ( propWin ) {
      propWin.selectElement(xpath, tagName, true);
    }
  }

  onElementDropped(xpath, tagName, elementTagName, dragData) {
    if ( !xpath ) {
      console.error('onElementDropped()', 'NO XPATH', xpath);
      //return;
    }

    if ( Elements[tagName] && (Elements[tagName].isExternal || !Elements[tagName].isContainer) ) {
      console.warn('Invalid target');
      return;
    }

    var win = this.getDesignerWindow();
    var propWin = this.getPropertiesWindow();

    // Ignore dragged elements from treeview
    if ( dragData && dragData.source === 'tree' ) {
      // FIXME: Move element instead of ignore
      return;
    }

    var rootPath = Utils.getXpathByElement(win._$root);
    xpath = (xpath || '').replace(rootPath, '');

    var target = win.getElement(xpath.replace(/^\//, '')) || win._$root;
    var ttarget = this.currentProject.getElement(xpath);

    console.group('ApplicationIDE::onElementDropped()');
    console.log('Xpath', xpath);
    console.log('Element', tagName, Elements[tagName]);
    console.log('Target', target);
    console.log('Template Target', ttarget);
    console.log('Teplate Element', elementTagName, Elements[elementTagName]);

    if ( target && ttarget ) {
      var el = document.createElement(elementTagName);
      var setProps = Elements[elementTagName].properties || {};

      Object.keys(setProps).forEach(function(k) {
        var val = setProps[k];
        var ref = Elements[elementTagName];

        if ( typeof setProps[k] === 'function' ) {
          //val = setProps[k](null, elementTagName);
          return;
        }

        if ( (ref.propertyTypes || {})[k] && typeof ref.propertyTypes[k].defaultValue !== 'undefined' ) {
          val = ref.propertyTypes[k].defaultValue;
        }

        if ( val !== null ) {
          if ( k === 'label' && ref.hasInnerLabel === true ) {
            el.appendChild(document.createTextNode(String(val)));
          } else {
            if ( k.substr(0, 1) !== '_' ) {
              el.setAttribute('data-' + k, String(val));
            }
          }
        }
      });

      if ( typeof Elements[elementTagName].oncreate === 'function' ) {
        Elements[elementTagName].oncreate(el, ttarget, elementTagName);
      }

      ttarget.appendChild(el);

      if ( win ) {
        win.render();
      }

      if ( propWin ) {
        propWin.load(this.currentProject);
      }
    }

    console.groupEnd();
  }

  //
  // MAIN EVENTS
  //

  onNew() {
    var self = this;

    this._setArgument('file', null);

    Dialog.create('Input', {
      message: 'Please enter the name of your project',
      value: 'MyProject'
    }, function(ev, btn, name) {
      if ( btn === 'ok' && name ) {
        var projectPath = 'home:///.packages/' + name;

        VFS.exists(projectPath).then((res) => {
          if ( res ) {
            return Dialog.create('Confirm', {
              message: 'Overwrite project with the name ' + name + '?',
              buttons: ['yes', 'no']
            }, function(ev, button, result) {
              if ( button === 'ok' || button === 'yes' ) {
                VFS.mkdir('home:///.packages').finally(() => {
                  self.loadProject(name);
                });
              }
            });
          }

          return self.loadProject(name);
        });
      }
    });
  }

  onOpen() {
    var self = this;

    Dialog.create('File', {
      path: 'home:///.packages',
      select: 'dir'
    }, function(ev, button, result) {
      if ( button === 'ok' && result ) {
        self.loadProject(null, result.path);
      }
    });
  }

  onSave(type) {
    var self = this;

    if ( !this.currentProject ) {
      return;
    }

    this._setArgument('file', new FileMetadata(this.currentProject.path));

    this.windowAction('_toggleLoading', [true]);
    this.currentProject.save(type, function() {
      var pm = PackageManager.instance;

      function done() {
        self.windowAction('_toggleLoading', [false]);
      }

      if ( pm ) {
        pm.generateUserMetadata(done);
      } else {
        done();
      }
    });
  }

  //
  // GETTERS
  //

  getMainWindow() {
    return this._getWindow(null);
  }

  getDesignerWindow() {
    return this._getWindowsByTag('designer')[0];
  }

  getPropertiesWindow() {
    return this._getWindowsByTag('properties')[0];
  }

}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

OSjs.Applications.ApplicationIDE = ApplicationIDE;

