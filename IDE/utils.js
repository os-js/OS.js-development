import {Elements} from './elements';

const Utils = OSjs.require('utils/misc');

export function getElementByXpath(path, doc, root) {
  root = root || document;
  doc = doc || document.documentElement;
  return document.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

export function getXpathByElement(elm, doc) {
  function getElementIdx(elt) {
    var count = 1;
    for (var sib = elt.previousSibling; sib ; sib = sib.previousSibling) {
      if (sib.nodeType === 1 && sib.tagName === elt.tagName) {
        count++;
      }
    }
    return count;
  }

  var path = '';
  var idx, xname;
  for (; elm && elm.nodeType === 1; elm = elm.parentNode) {
    idx = getElementIdx(elm);
    xname = elm.tagName.toLowerCase() + '[' + idx + ']';
    path = '/' + xname + path;
  }

  return path;
}

export function isValidTarget(srcTagName, destTagName) {
  var se = Elements[srcTagName];
  var de = Elements[destTagName];

  if ( !se || !de ) {
    return true;
  }

  var msg =  true;

  // allowChildren
  if ( de.allowChildren && de.allowChildren.indexOf(srcTagName) === -1 ) {
    msg = Utils.format('{0} {1} {2}', destTagName, 'does not allow (allowChildren)', srcTagName);
  }
  // allowParents
  if ( se.allowParents && se.allowParents.indexOf(destTagName) === -1 ) {
    msg = Utils.format('{0} {1} {2}', srcTagName, 'does not allow (allowParents)', destTagName);
  }

  // invalidChildren
  if ( de.invalidChildren && de.invalidChildren.indexOf(srcTagName) >= 0 ) {
    msg = Utils.format('{0} {1} {2}', destTagName, 'does not allow (invalidChildren)', srcTagName);
  }

  // allowInnerContainers
  if ( de.allowInnerContainers === false && se.isContainer ) {
    msg = Utils.format('{0} {1} {2}', destTagName, 'does not allow (allowInnerContainers)', srcTagName);
  }

  if ( msg !== true ) {
    console.warn(msg);
  }

  return msg;
}

export function setProperty(el, tagName, property, value) {
  if ( property.substr(0, 1) === '_' ) {
    return true;
  }

  if ( Elements[tagName] && (property === 'id' || Elements[tagName].propertyTypes[property]) ) {
    var il = Elements[tagName].hasInnerLabel;
    if ( property === 'label' && il ) {
      var lel = (il === true) ? el : el.querySelector(il);
      DOM.$empty(lel);
      lel.appendChild(document.createTextNode(value));
    } else {
      el.setAttribute('data-' + property, String(value));
    }
    return true;
  }

  return false;
}

export function getPropertyTypes(el) {
  el = el || {};
  return Utils.argumentDefaults(el.propertyTypes || {}, {
    id: {
      type: 'string'
    }
  });
}

export function getProperties(xpath, tagName, el) {
  var target = this.getElement(xpath);
  var elementPropTypes = getPropertyTypes(el);
  var defaultProps = {};
  var elementProps = {};
  var refProps = (el || {}).properties || {};

  if ( xpath ) {
    elementProps = {
      id: target ? target.getAttribute('data-id') : null
    };
  } else {
    elementProps = {
      id: this.getFragmentName()
    };
  }

  Object.keys(refProps).forEach(function(k) {
    var value = refProps[k];
    if ( typeof value === 'function' ) {
      value = value(target, tagName);
    }
    defaultProps[k] = value;
  });

  if ( target ) {
    var attributes = target.attributes;
    var attrib;
    for ( var i = 0; i < attributes.length; i++ ) {
      attrib = attributes[i];
      if ( attrib.name.substr(0, 1) !== '_' ) {
        elementProps[attrib.name.replace(/^data\-/, '')] = attrib.value;
      }
    }

    if ( Elements[tagName] && Elements[tagName].hasInnerLabel ) {
      elementProps.label = target.innerHTML;
    }
  }

  return Utils.argumentDefaults(elementProps, defaultProps);
}

