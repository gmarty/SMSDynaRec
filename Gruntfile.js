module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-closure-compiler');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Project configuration.
  grunt.initConfig({
    // Options
    closurePath: function() {
      return process.env.CLOSURE_PATH;
    }(),
    js: [
      'src/setup.js',
      'node_modules/jsSMS/source/sms.js',
      'node_modules/jsSMS/source/utils.js',
      'src/dynaRec.js',
      'src/z80.js',
      'node_modules/jsSMS/source/keyboard.js',
      'node_modules/jsSMS/source/psg.js',
      'node_modules/jsSMS/source/vdp.js',
      'node_modules/jsSMS/source/ui.js',
      'node_modules/jsSMS/source/ports.js',
      'node_modules/jsSMS/source/build/exports.js'
    ],
    externs: [
      '<%= closurePath %>/contrib/externs/webkit_console.js',
      '<%= closurePath %>/contrib/externs/jquery-1.7.js',
      '<%= closurePath %>/contrib/html5.js'
    ],

    'closure-compiler': {
      // Generates a minified version of the script.
      min: {
        js: '<%= js %>',
        jsOutputFile: 'min/jssms.min.js',
        options: {
          externs: '<%= externs %>',
          compilation_level: 'SIMPLE_OPTIMIZATIONS', // @todo Fix Closure Compiler compliance.
          language_in: 'ECMASCRIPT5_STRICT',
          summary_detail_level: 3,
          warning_level: 'VERBOSE',
          //output_wrapper: '(function(){%output%})();', // @todo Fix Closure Compiler compliance.
          define: [
            '"DEBUG=false"'
          ],
          debug: false,
          formatting: 'PRETTY_PRINT' // @todo Fix Closure Compiler compliance.
        }
      },

      // Generates a minified version of the script for debugging.
      debug: {
        js: '<%= js %>',
        jsOutputFile: 'min/jssms.debug.js',
        options: {
          externs: '<%= externs %>',
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          language_in: 'ECMASCRIPT5_STRICT',
          summary_detail_level: 3,
          warning_level: 'VERBOSE',
          define: [
            '"DEBUG=true"'
          ],
          debug: true,
          formatting: 'pretty_print'
        }
      },

      // Generates a unminified concatenated version.
      // @todo Refactor to remove 'node_modules/jsSMS/source/build/exports.js' from object `js` prop.
      concat: {
        js: [
          'src/setup.js',
          'node_modules/jsSMS/source/sms.js',
          'node_modules/jsSMS/source/utils.js',
          'src/dynaRec.js',
          'src/z80.js',
          'node_modules/jsSMS/source/keyboard.js',
          'node_modules/jsSMS/source/psg.js',
          'node_modules/jsSMS/source/vdp.js',
          'node_modules/jsSMS/source/ui.js',
          'node_modules/jsSMS/source/ports.js'
        ],
        jsOutputFile: 'min/jssms.concat.js',
        options: {
          compilation_level: 'WHITESPACE_ONLY',
          language_in: 'ECMASCRIPT5_STRICT',
          summary_detail_level: 3,
          warning_level: 'VERBOSE',
          debug: true,
          formatting: 'PRETTY_PRINT'
        }
      }
    },

    concat: {
      options: {
        banner: grunt.file.read('src/license.js')
      },
      min: {
        src: ['min/jssms.min.js'],
        dest: 'min/jssms.min.js'
      },
      debug: {
        src: ['min/jssms.debug.js'],
        dest: 'min/jssms.debug.js'
      },
      concat: {
        src: ['min/jssms.concat.js'],
        dest: 'min/jssms.concat.js'
      }
    }

  });

  // Default task.
  grunt.registerTask('default', [
    'closure-compiler:min',
    'closure-compiler:debug',
    'closure-compiler:concat',
    'concat:min',
    'concat:debug',
    'concat:concat'
  ]);

};
