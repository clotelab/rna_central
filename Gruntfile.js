"use strict";

module.exports = function(grunt) {
  var jshint_watched_files = ["Gruntfile.js", "lib/**/*.js", "test/**/*.js", "webservers/**/*.js"];

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    jshint: {
      options: {
        jshintrc: true
      },
      all: jshint_watched_files
    },
    wiredep: {
      task: {
        src: [
          "lib/views/**/*.html",
          "lib/views/**/*.jade"
        ]
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: "list"
        },
        src: ["test/**/test*.js"]
      }
    },
    watch: {
      files: jshint_watched_files,
      tasks: ["mochaTest"]
    },
    shell: {
      bootstrap: {
        command: "npm-check-updates && rm -rf node_modules && rm -rf lib/public/vendor && npm-check-updates -u && npm cache clean && npm install && bower install"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-shell");

  grunt.registerTask("default", ["watch"]);
};
