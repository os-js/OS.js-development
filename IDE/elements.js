import {setProperty} from './utils';
const DOM = OSjs.require('utils/dom');
const Utils = OSjs.require('utils/misc');
const GUI = OSjs.require('utils/gui');

function getMediaProperties(icon) {
  return {
    isContainer: false,
    allowInnerContainers: false,
    icon: icon,
    properties: {
      src: ''
    },
    propertyTypes: {
      src: {
        type: 'string'
      }
    }
  };
}

function getSelectProperties(icon) {
  return {
    isContainer: true,
    allowChildren: ['gui-select-option'],
    allowInnerContainers: false,
    icon: icon,
    propertyTypes: {
      disabled: {
        type: 'boolean'
      }
    },
    properties: {
      disabled: null
    }
  };
}

function getInputProperties(icon, hasLabel, defaultValue, mergeWith, hasIcon) {
  mergeWith = mergeWith || {};

  var defaults = {
    isContainer: false,
    allowInnerContainers: false,
    icon: icon,
    propertyTypes: {
      disabled: {
        type: 'boolean'
      },
      placeholder: {
        type: 'string'
      }
    },
    properties: {
      disabled: null,
      placeholder : ''
    }
  };

  var lbl = hasLabel ? 'label' : 'value';
  defaults.propertyTypes[lbl] = {
    type: 'string',
    defaultValue: defaultValue || ''
  };
  defaults.properties[lbl] = '';

  if ( hasIcon ) {
    defaults.properties.icon = '';
    defaults.propertyTypes.icon = {
      type: 'string'
    };
  }

  return Utils.argumentDefaults(defaults, mergeWith);
}

function getBoxContainerProperties(name, icon) {
  function getContainerParentName(tagName) {
    tagName = tagName || name;
    if ( tagName === 'gui-tabs' ) {
      return 'gui-tab-container';
    }
    return name + '-container';
  }

  function updateBoxChildren(el, tagName, size) {
    size = parseInt(size, 10);
    var current = el.children.length;
    var args = {};

    if ( tagName === 'gui-tabs' ) {
      args = {
        label: 'Tab'
      };
    } else {
      args = {
        shrink: 1,
        grow: 1
      };
    }

    if ( !isNaN(size) ) {
      if ( size < current ) {
        var removeNumber = current - size;
        if ( removeNumber > 0 ) {
          while ( el.children.length > (current-removeNumber) ) {
            DOM.$remove(el.children[el.children.length - 1]);
          }
        }
      } else {
        var addNumber = size - current;
        if ( addNumber > 0 ) {
          for ( var a = 0; a < addNumber; a++ ) {
            el.appendChild(GUI.createElement(getContainerParentName(tagName), args));
          }
        }
      }
    }
  }

  var ptypes = {
    _size: {
      type: 'number'
    }
  };

  var ps = {
    _size: function(el, tagName) {
      if ( !el || !el.parentNode ) {
        return -1;
      }

      function getSize(cn) {
        var size = 0;

        el.children.forEach(function(e) {
          if ( e.tagName.toLowerCase() === cn ) {
            size++;
          }
        });

        return size;
      }

      if ( tagName === 'gui-tabs' ) {
        return getSize('gui-tab-container');
      }

      return getSize(tagName + '-container');
    }
  };

  if ( name === 'gui-paned-view' ) {
    ptypes.orientation = {
      type: 'mixed',
      values: [{label: 'Horizontal', value: 'horizontal'}, {label: 'Vertical', value: 'vertical'}]
    };
    ps.orientation = function(el, tagName) {
      if ( el ) {
        return el.getAttribute('data-orientation');
      }
      return null;
    };
  }

  return {
    allowChildren: [getContainerParentName()],
    isContainer: getContainerParentName(),
    icon: icon,
    oncreate: function(el, par, tagName) {
      function createContainer(t, num, a) {
        for ( var i = 0; i < num; i++ ) {
          el.appendChild(GUI.createElement(t, a));
        }
      }

      if ( tagName === 'gui-vbox' || tagName === 'gui-hbox' ) {
        createContainer(getContainerParentName(tagName), 2, {
          shrink: 1,
          grow: 1
        });
      } else if ( tagName === 'gui-paned-view' ) {
        createContainer('gui-paned-view-container', 2, {
          shrink: 1,
          grow: 1
        });
      } else if ( tagName === 'gui-tabs' ) {
        createContainer('gui-tab-container', 1, {
          label: 'Tab'
        });
      }
    },
    onpropertyupdate: function(el, tagName, property, value) {
      if ( setProperty(el, tagName, property, value) ) {
        if ( (['gui-vbox', 'gui-hbox', 'gui-tabs', 'gui-paned-view']).indexOf(tagName) >= 0 ) {
          if ( property === '_size' ) {
            updateBoxChildren(el, tagName, value);
          }
        }

        return true;
      }
      return false;
    },
    propertyTypes: ptypes,
    properties: ps
  };
}

function boxProperties(allowParent) {
  return {
    isContainer: true,
    icon: 'widget-gtk-container.png',
    allowParents: allowParent ? [allowParent] : null,
    propertyTypes: {
      grow: {
        type: 'number'
      },
      shrink: {
        type: 'number'
      },
      basis: {
        type: 'unit'
      },
      expand: {
        type: 'boolean'
      },
      fill: {
        type: 'boolean'
      }
    },
    properties: {
      grow: null,
      shrink: null,
      basis: null,
      expand: null,
      fill: null
    }
  };
}

export const Elements = {
  'application-window': {
    isContainer: true,
    propertyTypes: {
      width: {
        type: 'number'
      },
      height: {
        type: 'number'
      },
      allow_maximize: {
        type: 'boolean'
      },
      allow_minimize: {
        type: 'boolean'
      },
      allow_close: {
        type: 'boolean'
      },
      allow_resize: {
        type: 'boolean'
      }
    },
    properties: {
      width: null,
      height: null,
      allow_maximize: true,
      allow_minimize: true,
      allow_close: true,
      allow_resize: true
    }
  },

  'gui-fragment': {
    isExternal: true,
    isContainer: true,
    allowInnerContainers: false,
    icon: 'widget-gtk-frame.png',
    properties: {
      'fragment-id': null
    },
    propertyTypes: {
      'fragment-id': 'string'
    }
  },

  //
  // CONTAINERS
  //

  'gui-hbox': getBoxContainerProperties('gui-hbox', 'widget-gtk-hbox.png'),
    'gui-hbox-container': boxProperties('gui-hbox'),

  'gui-vbox': getBoxContainerProperties('gui-vbox', 'widget-gtk-vbox.png'),
    'gui-vbox-container': boxProperties('gui-vbox'),

  'gui-paned-view': getBoxContainerProperties('gui-paned-view', 'widget-gtk-hpaned.png'),
    'gui-paned-view-container': boxProperties(),

  'gui-tabs': getBoxContainerProperties('gui-tabs', 'widget-gtk-notebook.png'),
    'gui-tab-container': {
      icon: 'widget-gtk-container.png',
      allowParents: ['gui-tabs'],
      invalidChildren: ['gui-tab-container'],
      propertyTypes: {
        label: {
          type: 'string'
        }
      },
      properties: {
        label: 'Tab'
      }
    },

  'gui-toolbar': {
    isContainer: true,
    allowInnerContainers: false,
    icon: 'widget-gtk-toolbar.png'
  },
  'gui-button-bar': {
    isContainer: true,
    allowInnerContainers: false,
    icon: 'widget-gtk-toolbar.png'
  },
  'gui-expander': {
    isContainer: true,
    icon: 'widget-gtk-expander.png',
    propertyTypes: {
      label: {
        type: 'string'
      }
    },
    properties: {
      label: function(el, tagName) {
        if ( el ) {
          return el.getAttribute('data-label');
        }
        return '';
      }
    },
    oncreate: function(el, par, tagName) {
      el.setAttribute('data-label', 'Expander');
    }
  },

  //
  // MEDIA
  //

  'gui-audio': getMediaProperties('status/dialog-question.png'),
  'gui-video': getMediaProperties('status/dialog-question.png'),
  'gui-image': getMediaProperties('widget-gtk-image.png'),
  'gui-iframe': getMediaProperties('widget-gtk-custom.png'),
  'gui-canvas': {
    isContainer: false,
    icon: 'widget-gtk-drawingarea.png'
  },

  //
  // INPUTS
  //

  'gui-label': getInputProperties('widget-gtk-label.png', true, 'Label'),
  'gui-radio': getInputProperties('widget-gtk-radiotoolbutton.png', true),
  'gui-checkbox': getInputProperties('widget-gtk-checkbox.png', true),
  'gui-file-upload': getInputProperties('widget-gtk-filechooserbutton.png'),
  'gui-input-modal': getInputProperties('widget-gtk-comboboxentry.png'),
  'gui-select': getSelectProperties('widget-gtk-combobox.png'),
  'gui-select-list': getSelectProperties('widget-gtk-list.png'),
  'gui-select-option': {
    hasInnerLabel: true,
    isContainer: false,
    icon: 'widget-gtk-label.png',
    selectQuery: function(idx, q) {
      return q.replace(/gui\-select\-option\[\d+\]$/, '') + 'select/option[' + String(idx+1) + ']';
    },
    propertyTypes: {
      value: {
        type: 'string'
      },
      label: {
        type: 'string'
      }
    },
    properties: {
      value: null,
      label: null
    }
  },
  'gui-slider': getInputProperties('widget-gtk-hscale.png'),
  'gui-switch': getInputProperties('widget-gtk-togglebutton.png'),
  'gui-text': getInputProperties('widget-gtk-entry.png'),
  'gui-password': getInputProperties('widget-gtk-password.png'),
  'gui-textarea': getInputProperties('widget-gtk-textview.png'),
  'gui-button': getInputProperties('widget-gtk-button.png', true, 'Button', {
    hasInnerLabel: true
  }, true),
  'gui-richtext': {
    isContainer: false,
    allowInnerContainers: false,
    icon: 'widget-gtk-textview.png',
    properties: {
      value: ''
    }
  },

  //
  // VIEWS
  //

  'gui-tree-view': {
    isContainer: false,
    allowInnerContainers: false,
    icon: 'widget-gtk-treeview.png'
  },
  'gui-icon-view': {
    isContainer: false,
    allowInnerContainers: false,
    icon: 'widget-gtk-iconview.png'
  },
  'gui-list-view': {
    isContainer: false,
    allowInnerContainers: false,
    icon: 'widget-gtk-list.png'
  },
  'gui-file-view': {
    isContainer: false,
    allowInnerContainers: false,
    icon: 'widget-gtk-filefilter.png'
  },

  //
  // MISC
  //

  'gui-progress-bar': {
    isContainer: false,
    allowInnerContainers: false,
    icon: 'widget-gtk-progressbar.png',
    propertyTypes: {
      progress: {
        type: 'number',
        min: 0,
        max: 100
      }
    },
    properties: {
      progress: 0
    }
  },
  'gui-color-box': {
    isContainer: false,
    allowInnerContainers: false,
    icon: 'widget-gtk-colorbutton.png'
  },
  'gui-color-swatch': {
    isContainer: false,
    allowInnerContainers: false,
    icon: 'widget-gtk-colorselection.png'
  },
  'gui-menu': {
    isContainer: false,
    icon: 'widget-gtk-menu.png',
    special: true,
    allowParents: ['gui-menu-entry']
  },
    'gui-menu-entry': {
    },
  'gui-menu-bar': {
    isContainer: true,
    allowInnerContainers: false,
    allowChildren: ['gui-menu-bar-entry'],
    icon: 'widget-gtk-menubar.png'
  },
    'gui-menu-bar-entry': {
      isContainer: false,
      icon: 'widget-gtk-label.png',
      propertyTypes: {
        disabled: {
          type: 'boolean'
        },
        label: {
          type: 'string'
        }
      },
      properties: {
        disabled: null,
        label: 'Menu Item'
      }
    },
  'gui-statusbar': {
    isContainer: false,
    allowInnerContainers: false,
    icon: 'widget-gtk-statusbar.png',
    properties: {
      value: ''
    },
    propertyTypes: {
      value: {
        type: 'string'
      }
    }
  }

};

export const Categories = [
  {
    label: 'Containers',
    items: ['gui-hbox', 'gui-vbox', 'gui-paned-view', 'gui-tabs', 'gui-toolbar', 'gui-button-bar', 'gui-expander', 'gui-fragment']
  },
  {
    label: 'Media',
    items: ['gui-audio', 'gui-video', 'gui-image', 'gui-canvas', 'gui-iframe']
  },
  {
    label: 'Input',
    items: ['gui-label', 'gui-button', 'gui-switch', 'gui-radio', 'gui-checkbox', 'gui-select', 'gui-select-list', 'gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-richtext']
  },
  {
    label: 'Views',
    items: ['gui-tree-view', 'gui-icon-view', 'gui-list-view', 'gui-file-view']
  },
  {
    label: 'Misc',
    items: ['gui-progress-bar', 'gui-color-swatch', 'gui-menu-bar', 'gui-statusbar', 'gui-file-upload', 'gui-input-modal', 'gui-color-box']
  },
  {
    label: 'Entries',
    items: ['gui-menu-bar-entry', 'gui-select-option']
  }
];
