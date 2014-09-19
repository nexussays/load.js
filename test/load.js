var load = require( '../dist/load.min.js' );
var test = require( 'tape' );

test( "should load a single file", function( t )
{
   t.plan( 1 );
   load( "./js/load1.js" ).then( function()
   {
      t.assert( load1, "load1 loaded" );
   } );
} );

test( "should load a single file with a label", function( t )
{
   t.plan( 1 );
   load( { "label": "./js/load1label.js" } ).then( function()
   {
      t.assert( load1label, "load1label loaded" );
   } );
} );

test( "should load multiple files as an array", function(t)
{
   t.plan( 1 );
   load( ["./js/multi1.js", "./js/multi2.js", "./js/multi3.js"] ).then( function()
   {
      t.assert( multi1 && multi2 && multi3, "multi1, multi2, and multi3 loaded" );
   } );
} );

test( "should load multiple files as arguments", function( t )
{
   t.plan( 1 );
   load( "./js/multi4.js", "./js/multi5.js", "./js/multi6.js" ).then( function()
   {
      t.assert( multi4 && multi5 && multi6, "multi4, multi5, and multi6 loaded" );
   } );
} );

test( "should allow calling load with the same file without loading it more than once", function(t)
{
   t.plan( 3 );
   load( "./js/duplicate.js" ).then( function()
   {
      t.assert( duplicate, "duplicate == " + duplicate );
   } );

   setTimeout( function()
   {
      load( "./js/duplicate.js" ).then( function()
      {
         t.assert( duplicate, "duplicate == " + duplicate );
      } );
   }, 500 );

   load.when( "duplicate.js", function()
   {
      t.assert( duplicate, "duplicate == " + duplicate );
   } );

} );