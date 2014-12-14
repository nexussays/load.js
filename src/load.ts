// Copyright Malachi Griffie <malachi@nexussays.com>
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

export = load;

var remaining: { [dependency: string]: number } = {};
var completionCallbacks: { [concatenatedDependencies: string]: Array<() => void> } = {};
var written: { [path: string]: boolean } = {};
var root: string;
var querystring: string;

// on startup, try to find our script tag and see if there is a data-base-url attribute set
var attr = "data-base-url";
var us = <HTMLScriptElement>document.querySelector("script[" + attr +"]" );
if(us)
{
   root = us.getAttribute(attr);
}

function load(file: string): load.Promise;
function load(fileWithLabel: any): load.Promise;
function load(...files: any[]): load.Promise;
function load(...files: any[]): load.Promise
{
   var items = tokenize( files );
   //console.log( items );
   for(var x = 0; x < items.files.length; ++x)
   {
      items.files[x].forEach( (file) =>
      {
         var label = items.labels[x];
         remaining[label] = remaining[label] || 0;
         // if file is empty string, don't prepend root to it
         var path = file && root && !/^(?:https?:)?\/\//.test( file ) ? root + file : file;
         if(!written[path])
         {
            remaining[label]++;
            //console.log( "loading " + path + " with label " + label );
            written[path] = true;
            //
            // Write to head
            //
            var script = document.createElement( 'script' );
            var isLoaded: boolean;
            script.onload = script.onreadystatechange = function()
            {
               if(isLoaded || (script.readyState && !/^complete|loaded/.test(script.readyState)))
               {
                  return;
               }
               script.onload = script.onerror = script.onreadystatechange = null;
               isLoaded = true;
               //var lbl = getLabelFromFile(script.src);
               if(--remaining[label] === 0)
               {
                  //console.log( "loadComplete " + label, remaining[label] );
                  scanCallbacks();
               }
            };
            script.onerror = function()
            {
               console.error(path);
               script.onload = script.onerror = script.onreadystatechange = null;
               if(--remaining[label] === 0)
               {
                  //console.log( "loadComplete " + label, remaining[label] );
                  scanCallbacks();
               }
            };
            script.async = true;
            script.src = querystring ? path + (path.indexOf('?') === -1 ? '?' : '&') + querystring : path;

            var head = document.getElementsByTagName('head')[0];
            defer( head.insertBefore( script, head.lastChild ) );
         }
      } );
   }
   scanCallbacks();
   return makePromise( items.labels );
}

function tokenize(files: any[]): { labels: Array<string>; files: Array<Array<string>> }
{
   var labelsToLoad: string[] = [];
   var filesToLoad: Array<Array<string>> = [];
   var label: string;
   for(var x = 0; x < files.length; ++x)
   {
      var obj = files[x];
      if(obj instanceof Array)
      {
         //console.log( x + " is array " + obj + ". labels start " + labelsToLoad + ". files start " + filesToLoad );
         var other = tokenize( obj );
         labelsToLoad.push.apply( labelsToLoad, other.labels );
         filesToLoad.push.apply( filesToLoad, other.files );
         //console.log( other );
         //console.log( "labels end " + labelsToLoad + ". files end " + filesToLoad );
      }
      // use the file as the label, try to get only the file name and not the path
      else if(typeof obj == "string" && obj != "")
      {
         label = getLabelFromFile( obj );
         labelsToLoad.push( label );
         filesToLoad.push( [obj] );
      }
      // an object was passed, use the keys as labels and the values as file paths
      else
      {
         for(label in obj)
         {
            if(obj.hasOwnProperty( label ))
            {
               var file = obj[label];
               if(file)
               {
                  label = label || file;
                  labelsToLoad.push( label );
                  filesToLoad.push( file instanceof Array ? file : [file] );
               }
            }
         }
      }
   }
   return { labels: labelsToLoad, files: filesToLoad };
}

function scanCallbacks()
{
   // now see if there are other pending callbacks that can be run
   for(var concatenatedDependency in completionCallbacks)
   {
      // if every dependency is loaded, then execute every callback
      if(concatenatedDependency.split( '|' ).every( dep => dep && remaining[dep] === 0 ))
      {
         //console.log("dependencies complete for " + concatenatedDependency, remaining, completionCallbacks);
         while(completionCallbacks[concatenatedDependency] && completionCallbacks[concatenatedDependency].length)
         {
            //console.log( "triggering completion callback for dependencies of " + concatenatedDependency );
            completionCallbacks[concatenatedDependency].pop()();
         }
         delete completionCallbacks[concatenatedDependency];
      }
   }
}

function getLabelFromFile(file: string): string
{
   var s = file.lastIndexOf( '/' );
   var e = file.lastIndexOf( '?' );
   return file.substring( s == -1 ? 0 : s + 1, e == -1 ? file.length : e );
}

// use internally to retain type info when we neet to concatenate dependencies
interface PrivatePromise extends load.Promise
{
   deps: string[];
}

function makePromise(dependencies: string[]): PrivatePromise
{
   //console.log( "makePromise", dependencies );
   return {
      // if this is ever changed to be part of the public promise interface, be sure to slice()
      deps: dependencies,
      then: function(...args): load.Promise
      {
         load.when( dependencies, args.length == 1 ? args[0] : args );
         // if the onComplete is more dependencies to load, return a new promise
         if(args.length && typeof args[0] != "function")
         {
            // concat dependencies and return new promise
            return makePromise( dependencies.concat( tokenize( args ).labels ) );
         }
         return this;
      }
   };
}

function defer(func)
{
   // FYI min allowed time for setTimeout according to W3C spec is 4ms,
   // so this will almost definitely get clamped upwards to 4, but don't
   // set it to 0 just in case some engines would optimize it out.
   setTimeout( func, 1 );
}

module load
{
   export interface Promise
   {
      then(callback: () => void): Promise;
      then(file: string): Promise;
      then(fileWithLabel: any): Promise;
      then(...files: any[]): Promise;
   }

   export function setBaseUrl(path: string): void
   {
      root = path;
   }

   export function getBaseUrl(): string
   {
      return root;
   }

   export function setQuerystring(args: string): void
   {
      querystring = args;
   }

   // when complete trigger a callback
   export function when(dependency: string, callback: () => void, waiting?: (missing: string[]) => void): void;
   export function when(dependencies: string[], callback: () => void, waiting?: (missing: string[]) => void): void;
   // when complete, load the provided file
   export function when(dependency: string, file: string, waiting?: (missing: string[]) => void): void;
   export function when(dependencies: string[], file: string, waiting?: (missing: string[]) => void): void;
   // when complete, load all of the provided files
   export function when(dependency: string, files: string[], waiting?: (missing: string[]) => void): void;
   export function when(dependencies: string[], files: string[], waiting?: (missing: string[]) => void): void;
   // when complete, load the provided file(s) with a label
   export function when(dependency: string, fileWithLabel: any, waiting?: (missing: string[]) => void): void;
   export function when(dependencies: string[], fileWithLabel: any, waiting?: (missing: string[]) => void): void;
   export function when(dependencies: any, whenComplete: any, waiting?: (missing: string[]) => void): void
   {
      var deps: string[] = dependencies instanceof Array ? dependencies : [dependencies];
      var callback = typeof whenComplete == "function" ? whenComplete : () => load( whenComplete );
      var missing = [];
      // see if all dependencies are loaded and collect the ones that are not
      deps.forEach( dep => dep && (remaining[dep] === 0 || missing.push( dep )) );
      if(missing.length == 0)
      {
         //console.log( "waiting for " + deps + " => all complete, triggering callback on delay" );
         defer( callback );
      }
      else
      {
         //console.log( "waiting for " + deps + " => need to wait, queuing callback" );
         var key = deps.sort().join( '|' );
         completionCallbacks[key] = completionCallbacks[key] || [];
         completionCallbacks[key].unshift( callback );
         waiting && waiting( missing );
      }
   }
}