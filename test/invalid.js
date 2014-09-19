var load = require( '../dist/load.min.js' );
var test = require( 'tape' );

test( "should fire callback for invalid file", function(t)
{
   t.plan( 1 );
   load( "error.js" ).then( function()
   {
      t.pass("callback fired for invalid file");
   } );
} );

test( "should fire callback for empty string", function( t )
{
   t.plan( 1 );
   load( "" ).then( function()
   {
      t.pass( "callback fired for empty string" );
   } );
} );

test( "should fire callback for empty label", function( t )
{
   t.plan( 1 );
   load( { "": "./js/null-label.js" } ).then( function()
   {
      t.pass( "callback fired for empty label" );
   } );
} );

test( "should fire callback for null", function( t )
{
   t.plan( 1 );
   load( null ).then( function()
   {
      t.pass( "callback fired for null" );
   } );
} );

test( "should fire callback for null with label", function( t )
{
   t.plan( 1 );
   load( { "foo": null } ).then( function()
   {
      t.pass( "callback fired for null with label" );
   } );
} );