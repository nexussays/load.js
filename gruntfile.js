module.exports = function(grunt)
{
   grunt.loadNpmTasks( "grunt-ts" );
   grunt.loadNpmTasks( "grunt-browserify" );
   grunt.loadNpmTasks( 'grunt-contrib-uglify' );
   grunt.loadNpmTasks( 'grunt-contrib-clean' );
   grunt.loadNpmTasks( 'grunt-git' );
   grunt.loadNpmTasks( 'grunt-sync' );

   //
   // tasks
   //
   grunt.registerTask( "default", ["build"] );
   grunt.registerTask( "build", ["ts:build", "wrap"] );
   grunt.registerTask( "package", ["build", "uglify", "sync:declaration"] );
   grunt.registerTask( "test", ["browserify:tests"] );
   grunt.registerTask( "complete", ["clean", "package", "test"] );
   grunt.registerTask( "tag", ["gittag"] );
   grunt.registerMultiTask( "wrap", function()
   {
      var file = grunt.file.read( this.data.src ).toString();
      grunt.file.write( this.data.dest,
         this.data.header + file.replace( this.data.remove, "" ) + this.data.footer,
         'utf-8' );
   } );
   grunt.registerTask( "version", "Increment package version.", function(type)
   {
      var semver = require( 'semver' );
      var typeValid = /major|minor|patch/.test( type );
      if(!type || !typeValid)
      {
         var pkg = grunt.file.readJSON( "package.json" );
         grunt.log.writeln( "Current version is " + pkg.version + "\n" +
            "To increment the version, provide the respective part as an argument.\n" +
            "grunt " + this.name + ":major => " + semver.inc( pkg.version, "major" ) + "\n" +
            "grunt " + this.name + ":minor => " + semver.inc( pkg.version, "minor" ) + "\n" +
            "grunt " + this.name + ":patch => " + semver.inc( pkg.version, "patch" ) );
         if(type && !typeValid)
         {
            grunt.fail.warn( "Invalid version increment \"" + type + "\" provided" );
         }
         return;
      }

      var padding = arguments.length > 1 && !isNaN( parseInt( arguments[1] ) ) ? parseInt( arguments[1] ) : 4;
      grunt.file.expand(["**/package.json", "**/bower.json", "!node_modules/**", "!/bower_components/"]).forEach( function( file )
      {
         if(grunt.file.isFile( file ))
         {
            var json = grunt.file.readJSON( file );
            json.version = semver.inc( json.version, type );
            grunt.file.write( file, JSON.stringify( json, null, padding ) );
            grunt.log.writeln( "Updated " + file + " to " + json.version );
         }
      } );
   } );
   //
   // config
   //
   grunt.initConfig( {
      paths: {
         src: "./src/",
         compiled: "./bin/",
         dist: "./dist/"
      },

      ts: {
         options: {
            target: "es5",
            module: "commonjs",
            sourceMap: false,
            declaration: true,
            removeComments: true,
         },
         build: {
            src: "<%= paths.src %>**/*.ts",
            outDir: "<%= paths.compiled %>",
         }
      },

      wrap: {
         target: {
            src: "<%= paths.compiled %>load.js",
            dest: "<%= paths.dist %>load.js",
            remove: "module.exports = load;",
            header: "<%= uglify.options.banner %>" +
               "(function (name, factory) {\n" +
               "   if (typeof define === 'function' && define.amd) { define([], factory); }\n" +
               "   else if (typeof exports === 'object') { module.exports = factory(); }\n" +
               "   else { this[name] = factory(); }\n" +
               "})" +
               "('load', function () {\n",
            footer: "\nreturn load;\n});"
         }
      },

      sync: {
         declaration: {
            cwd: "<%= paths.compiled %>",
            src: "**/*.d.ts",
            dest: "<%= paths.dist %>",
            verbose: true,
            updateAndDelete: false,
            expand: true
         }
      },

      browserify: {
         tests: {
            src: ["./test/*.js", "!./test/test-bundled.js"],
            dest: "./test/test-bundled.js",
         }
      },

      uglify: {
         options: {
            banner: "/**!\n" +
               " * https://github.com/nexussays/load.js | Copyright Malachi Griffie\n" +
               " * @version <%= grunt.file.readJSON( 'package.json' ).version %>\n" +
               " * @license http://mozilla.org/MPL/2.0/\n" +
               " */\n",
            mangle: true,
            compress: false,
            beautify: false,
            preserveComments: false,
         },
         all: {
            files: [
               {
                  expand: true,
                  cwd: "<%= paths.dist %>",
                  src: ["*.js", "!*.min.js"],
                  dest: "<%= paths.dist %>",
                  rename: function(path, name)
                  {
                     return require( 'path' ).join( path, name.replace( '.js', '.min.js' ) );
                  }
               }
            ]
         }
      },

      gittag: {
         options: {
            tag: "<%= grunt.file.readJSON( 'package.json' ).version %>"
         },
         main: {
            
         },
         dist: {
            options: {
               cwd: "<%= paths.dist %>",
            }
         }
      },

      clean: {
         src: [
            ".tscache",
            "./**/.baseDir.ts",
            "<%= paths.compiled %>**/*.js.map",
            "<%= paths.compiled %>**/*.js",
            "<%= paths.compiled %>**/*.d.ts",
            "<%= paths.src %>**/*.js.map",
            "<%= paths.src %>**/*.js",
            "<%= paths.src %>**/*.d.ts",
            "<%= browserify.tests.dest %>",
         ]
      }
   } );
}