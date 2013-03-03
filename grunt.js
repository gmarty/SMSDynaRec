module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-closure-compiler');

  // Project configuration.
  grunt.initConfig({
    'closure-compiler': {
      js:      [
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
        '<%= process.env.CLOSURE_PATH %>/contrib/externs/webkit_console.js',
        '<%= process.env.CLOSURE_PATH %>/contrib/externs/jquery-1.7.js',
        '<%= process.env.CLOSURE_PATH %>/contrib/html5.js'
      ],

      // Generates a minified version of the script.
      min:     {
        js:           '<config:closure-compiler.js>',
        jsOutputFile: 'min/jssms.min.js',
        options:      {
          externs:              '<config:closure-compiler.externs>',
          compilation_level:    'ADVANCED_OPTIMIZATIONS',
          language_in:          'ECMASCRIPT5_STRICT',
          summary_detail_level: 3,
          warning_level:        'VERBOSE',
          define:               [
            '"DEBUG=false"'
          ],
          debug:                false
        }
      },

      // Generates a debug minified version of the script.
      debug:   {
        js:           '<config:closure-compiler.js>',
        jsOutputFile: 'min/jssms.debug.js',
        options:      {
          externs:              '<config:closure-compiler.externs>',
          compilation_level:    'ADVANCED_OPTIMIZATIONS',
          language_in:          'ECMASCRIPT5_STRICT',
          summary_detail_level: 3,
          warning_level:        'VERBOSE',
          define:               [
            '"DEBUG=true"'
          ],
          debug:                true,
          formatting:           'pretty_print'
        }
      },

      // Generates a unminified concatenated version.
      // @todo Refactor to remove 'node_modules/jsSMS/source/build/exports.js' from object `js` prop.
      concat:  {
        js:           [
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
        options:      {
          compilation_level:    'WHITESPACE_ONLY',
          language_in:          'ECMASCRIPT5_STRICT',
          summary_detail_level: 3,
          warning_level:        'VERBOSE',
          debug:                true,
          formatting:           'PRETTY_PRINT'
        }
      }
    }

  });

  // Default task.
  grunt.registerTask('default', 'closure-compiler:min closure-compiler:debug closure-compiler:concat');

};
