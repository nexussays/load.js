module.exports = function(grunt)
{
   grunt.loadNpmTasks( "grunt-ts" );
   grunt.loadNpmTasks( "grunt-browserify" );
   grunt.loadNpmTasks( 'grunt-contrib-uglify' );
   grunt.loadNpmTasks( 'grunt-contrib-clean' );

   //
   // tasks
   //
   grunt.registerTask( "default", ["build"] );
   grunt.registerTask( "build", ["ts:build", "wrap", "browserify"] );
   grunt.registerTask( "package", ["build", "uglify"] );
   grunt.registerTask( "complete", ["clean", "package"] );
   grunt.registerMultiTask( "wrap", function()
   {
      var fs = require( "fs" );
      var mkdirp = require( "mkdirp" );
      var path = require( "path" );

      mkdirp.sync( path.dirname( this.data.dest ) );
      var file = fs.readFileSync( this.data.src ).toString();
      fs.writeFileSync( this.data.dest,
         this.data.header + file.replace( this.data.remove, "" ) + this.data.footer,
         'utf-8' );
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
            header: "(function (name, factory) {\n" +
               "   if (typeof define === 'function' && define.amd) { define([], factory); }\n" +
               "   else if (typeof exports === 'object') { module.exports = factory(); }\n" +
               "   else { this[name] = factory(); }\n" +
               "})" +
               "('load', function () {\n",
            footer: "\nreturn load;\n});"
         }
      },

      browserify: {
         all: {
            src: "<%= paths.compiled %>**/*.js",
            dest: "<%= paths.dist %>load.browserify.js",
            options: {
               browserifyOptions: {
                  standalone: "load"
               }
            }
         }
      },

      uglify: {
         options: {
            banner: "/**!\n" +
               " * https://github.com/nexussays/load.js\n" +
               " * Copyright Malachi Griffie\n" +
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

      clean: {
         src: [
            ".tscache",
            "**/.baseDir.ts",
            "<%= paths.compiled %>**/*.js.map",
            "<%= paths.compiled %>**/*.js",
            "<%= paths.compiled %>**/*.d.ts",
            "<%= paths.src %>**/*.js.map",
            "<%= paths.src %>**/*.js",
            "<%= paths.src %>**/*.d.ts",
            "<%= paths.dist %>"
         ]
      }
   } );
}