var load = require( '../dist/load.min.js' );
var test = require( 'tape' );

test( "should load sequentially using then", function(t)
{
   t.plan( 3 );

   load.when( "seq1.js", function()
   {
      t.assert( this["seq1"] && this["seq2"] === undefined && this["seq3"] === undefined, "seq1 loaded only" );
   } );
   load.when( "seq2.js", function()
   {
      t.assert( this["seq1"] && this["seq2"] && this["seq3"] === undefined, "seq1 and seq2 loaded" );
   } );
   load.when( "seq3.js", function()
   {
      t.assert( this["seq1"] && this["seq2"] && this["seq3"], "seq1, seq2, and seq3 loaded" );
   } );

   load.setBaseUrl( "./js/" );
   load( "seq1.js" ).then( "seq2.js" ).then( "seq3.js" ).then( function()
   {
      load.setBaseUrl( undefined );
   } );
} );

test( "should load from a labelled then argument", function(t)
{
   t.plan( 1 );

   load( "./js/seq1.js" ).then( { labelled: "./js/labelled-then.js" } );
   load.when( "labelled", function()
   {
      t.assert( this["labelledThen"], "labelled-then.js loaded" );
   } );
} );