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
const DOM = OSjs.require('utils/dom');
const GUI = OSjs.require('utils/gui');
const Window = OSjs.require('core/window');
const WindowManager = OSjs.require('core/window-manager');

import {getElementByXpath, getXpathByElement, isValidTarget} from './utils';
import {Elements} from './elements';

var timeout;
function createDroppable(win, root, done) {
  function onDrop(data) {
    var destTagName = root.tagName.toLowerCase();
    var valid = isValidTarget(data.tagName, destTagName);
    if ( valid !== true ) {
      var wm = WindowManager.instance;
      if ( wm ) {
        wm.notification({
          icon: 'status/important.png',
          title: 'IDE',
          message: valid
        });
      }
      return;
    }
    (done = done || function() {}).apply(this, arguments);
  }

  GUI.createDroppable(root, {
    onEnter: function(ev) {
      ev.stopPropagation();
      DOM.$addClass(root, 'ide-hover');
    },
    onOver: function(ev) {
      ev.stopPropagation();
      DOM.$addClass(root, 'ide-hover');
    },
    onLeave: function() {
      DOM.$removeClass(root, 'ide-hover');
    },
    onDrop: function(ev) {
      DOM.$removeClass(root, 'ide-hover');
    },
    onItemDropped: function(ev, el, item, args) {
      ev.stopPropagation();
      ev.preventDefault();

      timeout = clearTimeout(timeout);
      timeout = setTimeout(function() {
        DOM.$removeClass(root, 'ide-hover');
        onDrop(item.data);
      }, 10);
    }
  });
}

/////////////////////////////////////////////////////////////////////////////
// WINDOWS
/////////////////////////////////////////////////////////////////////////////

export default class ApplicationIDEDesignerWindow extends Window {

  constructor(app, metadata) {
    super('ApplicationIDEDesignerWindow', {
      tag: 'designer',
      gravity: 'center',
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 400
    }, app);

    this._restored = false;

    this.selectedElement = null;
  }

  init(wmRef, app) {
    var root = super.init(...arguments);
    var self = this;

    this._toggleDisabled(true);

    // Load and set up scheme (GUI) here
    var propWin = app.getPropertiesWindow();
    createDroppable(propWin, root, function(data) {
      app.onElementDropped(null, 'application-window', data.tagName);
    });

    this._on('resized', function() {
      app.onWindowResize({
        w: self._dimension.w,
        h: self._dimension.h
      });
    });

    return root;
  }

  destroy() {
    this.selectedElement = null;

    super.destroy(...arguments);
  }

  clear() {
  }

  getElement(xpath) {
    var target = null;
    try {
      target = getElementByXpath(xpath, this._$root);
    } catch ( e ) {}
    return target;
  }

  selectElement(el, clicked) {
    if ( this.selectedElement ) {
      DOM.$removeClass(this.selectedElement, 'ide-selected');
    }
    this.selectedElement = el;
    DOM.$addClass(this.selectedElement, 'ide-selected');
  }

  load() {
    //var app = this._app;
    //var project = app.currentProject;
    //var windowName = project.getFragmentName();

    this._toggleDisabled(false);

    this.render();
  }

  render() {
    var self = this;

    var app = this._app;
    var project = app.currentProject;
    var windowName = project.getFragmentName();
    var propWin = app.getPropertiesWindow();

    this._setTitle(windowName + '@' + project.name, true);

    var root = this._$root;
    DOM.$empty(root);
    project.scheme.render(this, windowName, root, null, function() {}, {
      resolve: false
    });

    //var thispath = OSjs.Applications.ApplicationIDE.getXpathByElement(this._$root);

    function traverse(el) {
      if ( el.children ) {
        el.children.forEach(function(sel) {
          sel.setAttribute('data-ide-window', windowName);

          var tagName = sel.tagName.toLowerCase();
          if ( Elements[tagName] ) {
            var cn = Elements[tagName].isContainer;
            if ( cn ) {

              if ( cn === true ) {
                sel.setAttribute('data-ide-container', 'true');
                createDroppable(propWin, sel, function(data) {
                  var xpath = getXpathByElement(sel, self._$root);
                  app.onElementDropped(xpath, tagName, data.tagName, data);
                });
              } else {
                sel.getElementsByTagName(cn).forEach(function(cel) {
                  createDroppable(propWin, cel, function(data) {
                    var xpath = getXpathByElement(cel, self._$root);
                    app.onElementDropped(xpath, tagName, data.tagName, data);
                  });
                });
              }

            } else {
              sel.setAttribute('data-ide-element', 'true');
            }
          }

          traverse(sel);
        });
      }
    }

    traverse(root);
  }
}
