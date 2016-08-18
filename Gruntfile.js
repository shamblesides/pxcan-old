module.exports = function(grunt) {

  // Plugin configuration
  grunt.initConfig({
    concat: {
      options: {
        separator: grunt.util.linefeed + grunt.util.linefeed
      },
      buildSrc: {
        files: {
          'build/pxcan.js': [
            'src/screen.js', 'src/screen_panel.js', 'src/screen_drawing.js', 'src/screen_preloading.js',
            'src/sheets.js', 'src/sheets_global.js',
            'src/math_extensions.js', 'src/random.js', 'src/wrap_string.js'
          ]
        }
      },
      copyToDocs: {
        files: { 'docs/static/pxcan.js': [ 'build/pxcan.js' ] }
      }
    },
    uglify: {
      buildSrc: {
        files: {
          'build/pxcan.min.js': 'build/pxcan.babel.js'
        }
      }
    },
    babel: {
      options: {
        sourceMap: true,
        presets: ['babel-preset-es2015']
      },
      babel: {
        files: {
          'build/pxcan.babel.js': 'build/pxcan.js'
        }
      }
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-babel');

  // Tasks
  grunt.registerTask('default', ['concat:buildSrc', 'babel', 'uglify:buildSrc', 'concat:copyToDocs']);
  grunt.registerTask('test', ['concat:buildSrc']);

};
