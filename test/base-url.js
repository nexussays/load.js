var load = require( '../dist/load.min.js' );
var test = require( 'tape' );

test( "should load from path when baseUrl set", function(t)
{
   t.plan( 1 );
   load.setBaseUrl( "./js/" );
   load( "base-url.js" ).then( function()
   {
      t.assert( baseUrl, "base-url loaded" );
   } );
   load.setBaseUrl( undefined );
} );

test( "should load from full URL even with baseUrl set", function( t )
{
   t.plan( 2 );
   t.assert( this["$"] === undefined, "jquery does not exist" );
   load.setBaseUrl( "./js/" );
   load( "https://raw.githubusercontent.com/jquery/jquery/2.1.1/dist/jquery.min.js" ).then( function()
   {
      t.assert( this["$"] !== undefined, "jquery loaded" );
   } );
   load.setBaseUrl( undefined );
} );