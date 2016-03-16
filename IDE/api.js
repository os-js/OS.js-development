/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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

  module.exports = {
    createProject: function(args, callback, request, response, config, handler) {
      var _vfs = handler.instance._vfs;
      var template = args.template + '/metadata.json';
      var destination = args.destination + '/metadata.json';

      function replaceTemplateVariables(content) {
        return content.toString().replace(/EXAMPLE/g, args.name);
      }

      function enqueueFiles(list, done) {
        var result = [];

        function _next(i) {
          if ( i >= (list.length-1) ) {
            return done(result);
          }

          var iter = list[i].src;
          if ( iter.match(/^(https?|ftp)\:/) ) {
            return _next(i+1);
          }

          _vfs.read({path: args.template + '/' + iter, options: {raw: true}}, request, function(err, content) {
            content = replaceTemplateVariables(content || '');
            _vfs.write({path: args.destination + '/' + iter, data: content, options: {raw: true, rawtype: 'utf8'}}, request, function(err) {
              _next(i+1);
            }, config);
          }, config);
        }

        _next(0);
      }

      function copyResources(done) {
        var src = args.template + '/api.js';
        var dest = args.destination + '/api.js';

        _vfs.copy({src: src, dest: dest}, request, function() {
          done();
        }, config);
      }

      _vfs.delete({path: args.destination}, request, function() {
        _vfs.mkdir({path: args.destination}, request, function() {
          _vfs.read({path: template, options: {raw: true}}, request, function(err, content) {
            var d = replaceTemplateVariables(content || '{}');
            _vfs.write({path: destination, data: d, options: {raw: true, rawtype: 'utf8'}}, request, function() {
              var files = JSON.parse(d).preload || [];
              files.push({type: 'scheme', src: 'scheme.html'});
              files.push({type: 'metadata', src: 'metadata.json'});

              enqueueFiles(files, function() {
                copyResources(function() {
                  callback(false, true);
                });
              });
            }, config);
          }, config);
        }, config);
      }, config);
    }
  };

})();

