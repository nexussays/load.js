var load = require( '../dist/load.min.js' );
var test = require( 'tape' );

test( "should allow when with label", function(t)
{
   t.plan( 1 );
   load( { "label": "./js/when-label.js" } );
   load.when( "label", function()
   {
      t.pass( "when called for label" );
   } );
} );

test( "should allow when with filename", function(t)
{
   t.plan( 1 );
   load( "./js/when-file.js" );
   load.when( "when-file.js", function()
   {
      t.pass( "when called for when-file.js" );
   } );
} );

test( "should allow when with filename ignoring label", function(t)
{
   t.plan( 1 );
   load( { "label": "./js/when-file2.js" } );
   load.when( "when-file2", function()
   {
      t.pass( "when called for when-file2" );
   } );
} );

test( "should allow when by files or label with multiple files", function(t)
{
   t.plan( 2 );
   load( { multi: ["./js/when-multi1.js", "./js/when-multi2.js"] } );
   load.when( "multi", function()
   {
      t.pass( "when called for multi" );
   } );
   load.when( ["when-multi1.js", "when-multi2.js"], function()
   {
      t.pass( "when called for when-multi1.js and when-multi2.js" );
   } );
} );

test( "should allow when before load", function(t)
{
   t.plan( 1 );
   load.when( "when-first.js", function()
   {
      t.pass( "when called" );
   } );
   setTimeout( function()
   {
      load( "./js/when-first.js" );
   }, 500 );
} );