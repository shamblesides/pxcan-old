module.exports = function(grunt) {

	// Plugin configuration
	grunt.initConfig({
		concat: {
      options: {
        separator: grunt.util.linefeed + grunt.util.linefeed
      },
			src: {
				files: {
					'build/nigelgame.js': 'src/*.js'
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