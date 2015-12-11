module.exports = function(grunt) {

	// Plugin configuration
	grunt.initConfig({
		concat: {
      options: {
        separator: grunt.util.linefeed + grunt.util.linefeed
      },
			src: {
				files: {
					'build/nigelgame.js': [
            'src/screen.js', 'src/screen_panel.js', 'src/screen_drawing.js', 'src/screen_preloading.js',
            'src/sheets.js', 'src/sheets_global.js',
            'src/math_extensions.js', 'src/random.js', 'src/wrap_string.js'
          ]
				}
			}
		},
		uglify: {
			build: {
				files: {
					'build/nigelgame.min.js': 'build/nigelgame.js'
				}
			}
		}
	});

	// Load the plugins
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Tasks
	grunt.registerTask('default', ['concat:src', 'uglify:build']);
	grunt.registerTask('test', ['concat:src']);

};