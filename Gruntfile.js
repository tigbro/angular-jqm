module.exports = function(grunt) {
  var srcFiles = grunt.file.readJSON('./build/files.js'),
      pkg = grunt.file.readJSON('./package.json');
  // needed for karma to locate phantomjs correctly.
  process.env.PHANTOMJS_BIN = './node_modules/.bin/phantomjs';
  grunt.initConfig({
    pkg: pkg,
    concat: {
      all: {
        options: {
          banner: grunt.file.read('build/header.js'),
          footer: grunt.file.read('build/footer.js')
        },
        src: srcFiles.concat('.tmp/angular-jqm-templates.js'),
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    html2js: {
      all: {
        options: {
          base: 'src',
          module: 'jqm-templates'
        },
        src: ['src/templates/**/*.html'],
        dest: '.tmp/angular-jqm-templates.js'
      }
    },
    uglify: {
      options: {
        preserveComments: 'some'
      },
      all: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
        }
      }
    },
    watch: {
      files: ['src/**/*','test/**/*'],
      tasks: ['concat','karma:dev:run']
    },
    jshint: {
      options: {
        strict: true,
        globalstrict: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        trailing: true
      },
      dist: {
        files: {
          src: ['dist/<%= pkg.name %>.js']
        },
        options: {
          globals: {
            angular: true,
            window: true
          }
        }
      },
      test: {
        files: {
          src: ['test/unit/**/*.js']
        },
        options: {
          globals: {
            /* By purpose: No iit, xit, ddescribe, xdescribe should
               be present in code that is committed */
            describe: true,
            beforeEach: true,
            afterEach: true,
            it: true,
            runs: true,
            waitsFor: true,
            waits: true,
            spyOn: true,
            expect: true,
            jasmine: true,
            window: true,
            document: true,
            location: true,
            angular: true,
            inject: true,
            module: true,
            dump: true,
            testutils: true
          }
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 9000,
          base: './',
          hostname: ''
        }
      }
    },
    karma: {
      options: {
        configFile: 'test/config/karma.conf.js',
        files: ['node_modules/grunt-karma/node_modules/karma/adapter/lib/jasmine.js',
                'node_modules/grunt-karma/node_modules/karma/adapter/jasmine.js',
                'components/angular/angular.js',
                'components/angular/angular-mocks.js',
                'test/lib/testutils.js'].
                concat(srcFiles).
                concat(['test/**/*Spec.js']).
                concat([{pattern: 'test/**/*', watched: true, included: false, served: true},
                        {pattern: 'components/**/*', watched: true, included: false, served: true}])
      },
      dev: {
        options: {
          singleRun: false,
          browsers: ['PhantomJS']
        },
        background: true
      },
      travis: {
        options: {
          singleRun: true,
          browsers: ['PhantomJS']
        }
      },
      localBuild: {
        options: {
          singleRun: true,
          browsers: ['PhantomJS']
        }
      }
    },
    changelog: {
      dest: 'CHANGELOG.md'
    }
  });

  grunt.registerTask('install', 'Prepare development environment', function() {
      if (!grunt.file.exists('.git/hooks/commit-msg')) {
          grunt.file.copy('build/validate-commit-msg.js', '.git/hooks/commit-msg');
          require('fs').chmodSync('.git/hooks/commit-msg', '0755');

          var gitconfig = grunt.file.read('.git/config');
          gitconfig += '\n' + grunt.file.read('build/git-config');
          grunt.file.write('.git/config', gitconfig);

          grunt.log.writeln('Installing commit enforce hook, dist merge hook.');
      }
  });

  grunt.registerTask('dev', ['connect','karma:dev','watch']);
  grunt.registerTask('default', ['install', 'concat','jshint','karma:localBuild']);
  grunt.registerTask('travis', ['concat','jshint','karma:travis']);

  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
};
