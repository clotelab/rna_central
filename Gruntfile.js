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
      tasks: ["jshint", "mochaTest"]
    },
    shell: {
      bootstrap: {
        command: "rm -r node_modules && rm -r bower_components && npm-check-updates -u && npm install && bower install && grunt wiredep"
      }
    }
  });
  
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-wiredep");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-shell");

  grunt.registerTask("default", ["watch"]);
};
