/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
(function() {

  module.exports.api = {
    createProject: function(env, http, resolve, reject, args) {
      var _vfs = require(env.NODEDIR + '/core/vfs.js');
      var template = args.template + '/metadata.json';
      var destination = args.destination + '/metadata.json';

      function replaceTemplateVariables(content) {
        return content.toString().replace(/EXAMPLE/g, args.name);
      }

      function enqueueFiles(list, done) {
        var result = [];

        function _next(i) {
          if ( i >= (list.length - 1) ) {
            return done(result);
          }

          var iter = list[i].src;
          if ( iter.match(/^(https?|ftp)\:/) ) {
            return _next(i + 1);
          }

          _vfs._request(http, 'read', {path: args.template + '/' + iter, options: {raw: true, stream: false}}).then(function(content) {
            content = replaceTemplateVariables(content || '');
            _vfs._request(http, 'write', {path: args.destination + '/' + iter, data: content, options: {raw: true, rawtype: 'utf8'}}).then(function() {
              _next(i + 1);
            }).catch(function() {
              _next(i + 1);
            });
          }).catch(function() {
            _next(i + 1);
          });
        }

        _next(0);
      }

      function _makeFiles(d) {
        var files = JSON.parse(d).preload || [];
        files.push({type: 'scheme', src: 'scheme.html'});
        files.push({type: 'metadata', src: 'metadata.json'});

        enqueueFiles(files, function() {
          var src = args.template + '/api.js';
          var dest = args.destination + '/api.js';

          _vfs._request(http, 'copy', {src: src, dest: dest}).then(function() {
            resolve(true);
          }).catch(reject);
        });
      }

      function _makeDirectory() {
        _vfs._request(http, 'mkdir', {path: args.destination}).then(function() {
          _vfs._request(http, 'read', {path: template, options: {raw: true, stream: false}}).then(function(content) {
            var d = replaceTemplateVariables(content || '{}');
            _vfs._request(http, 'write', {path: destination, data: d, options: {raw: true, rawtype: 'utf8'}}).then(function() {
              _makeFiles(content);
            }).catch(reject);
          }).catch(reject);
        }).catch(reject);
      }

      _vfs._request(http, 'delete', {path: args.destination})
        .then(_makeDirectory)
        .catch(_makeDirectory);
    }
  };

})();

