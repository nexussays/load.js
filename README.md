# load.js

`load.js` provides an easy and robust API to let you manage your script dependencies in your code instead of an external HTML file and then asynchronously load Javascript files in parallel without blocking CSS, images, or other scripts.

---

Using script tags is bad for three primary reasons:

1. Your dependencies are defined external to your code.
2. Script loading will block other scripts, CSS, and images in most cases.
3. If you use `async` to alleviate #2, then you can't manage complex dependencies.

So this:
```html
<script src="/scripts/analytics.js"></script>
<script src="/scripts/jquery/jquery.js"></script>
<script src="/scripts/other-library.js"></script>
<script src="/scripts/yet-another-library.js"></script>
<script src="/scripts/jquery/jquery-plugin1.js"></script>
<script src="/scripts/jquery/jquery-plugin2.js"></script>
<script src="/scripts/jquery/jquery-plugin3.js"></script>
<script src="/scripts/app/my-app-lib.js"></script>
<script src="/scripts/app/my-app-mainjs"></script>
```

Turns into this with `load.js`:
```js
load.setBaseUrl("/scripts/");
load("analytics.js")
    .then({ libs: ["jquery/jquery.js", "other-library.js", "yet-another-library.js"] });
load.when("jquery.js", { plugins: ["jquery/jquery-plugin1.js", "jquery/jquery-plugin2.js", "jquery/jquery-plugin3.js"] });
load.when(["libs", "plugins"], "app/my-app-lib.js");
load.when("my-app-lib.js", "app/my-app-main.js");
```

Hopefully the API is simple enough that the above is self-explanatory.

Your dependencies are now explicitly defined, and your scripts will load in parallel -- saving significant load time for your users and getting them into your app/website quicker.

## Browser Support

Don't know, haven't tested yet, but pretty sure IE > 8.

## Usage

To save on an HTTP request and keep Javascript out of your HTML, recommended usage is to define your project's dependencies (such as in the example above) in a single config file and concatenate that file to the end of `load.js` as part of your build process, often renaming the file to `init.js` or similar in the process.

Then simply add a single script tag to `<head>` in your HTML.

### Without a build process in place

If you believe your project simple enough to not need a build process, you can simply manually edit `load.js` and define your dependencies at the end of the file.

Or, (even less recommended) put them in your HTML file directly:
```HTML
<script src="load.js"></script>
<script>
load( "thing.js" ).then( "otherthing.js" );
//etc...
</script>
```

### Defining dependencies in code

It is entirely possible to define your dependencies in your code instead of a singular configuration file, though this is generally not recommended since a proper build process will be combining your various source files into different output files.

The result looks similar to an AMD definition:
```js
/// dependency1.js
var foo = "foo";

/// dependency2.js
load.when("dependency1.js", function()
{
   function bar()
   {
      return foo + "bar";
   }
});

/// file1.js
load.when(["dependency1.js", "dependency2.js"], function()
{
   console.log(foo);
   console.log(bar());
});
```

### Using with TypeScript

A declaration file `load.d.ts` is provided. Given the recommended usage, you don't need to import/require anything. Simple add a reference `/// <reference path="load.d.ts"/>` in any files that need to call `load`.

## API / Examples

We'll discuss the API using our initial example:
```js
load.setBaseUrl("/scripts/");
load("analytics.js")
    .then({ libs: ["jquery/jquery.js", "other-library.js", "yet-another-library.js"] });
load.when("jquery.js", { plugins: ["jquery/jquery-plugin1.js", "jquery/jquery-plugin2.js", "jquery/jquery-plugin3.js"] });
load.when(["libs", "plugins"], "app/my-app-lib.js");
load.when("my-app-lib.js", "app/my-app-main.js");
```

### Setting a root path

```ts
function setBaseUrl(path: string): void
```

Prepends this path to all load requests from the point it was called onward.

So given `load.setBaseUrl("/scripts/");`, `load("analytics.js")` will load `/scripts/analytics.js`.

Note that this is literally just doing a string concatenation, so make sure your slashes are in the right spot:

* `load.setBaseUrl("/scripts/");load("/foo.js")` will load `/scripts//foo.js`
* `load.setBaseUrl("/scripts");load("foo.js")` will load `/scriptsfoo.js`

### Loading files in parallel

```ts
function load(file: string): promise;
function load(fileWithLabel: any): promise;
function load(...files: any[]): promise;
```

Provide as many file names (strings) as you'd like and they will all be loaded in parallel:
```js
load("analytics.js"/*, "foo.js", "bar.js", "baz.js", etc... */);
```

You can also pass an array, which is useful if you're calling load dynamically from other code and prevents the need to call `.apply()`
```js
var dependencies = ["foo.js", "bar.js", "baz.js"];
load(dependencies);
```

### Loading files, or executing code, sequentially

This is the type returned from `load()`:
```ts
interface promise
{
   then(callback: () => void): promise;
   then(file: string): promise;
   then(fileWithLabel: any): promise;
   then(...files: any[]): promise;
}
```

The arguments to `then()` are the same as those to `load()` with the addition of accepting functions.

You can use it to ensure dependencies are loaded by only loading files after completion of the ones preceding it.
```js
load("analytics.js")
    .then({ libs: ["jquery/jquery.js", "other-library.js", "yet-another-library.js"] });
```
The above will load `jquery/jquery.js`, `other-library.js`, and `yet-another-library.js` in parallel **after** `analytics.js` has completed.

You can chain `then()` calls as much as you'd like:
```js
load("a.js").then("b.js").then("c.js").then("d.js").then("e.js").then(function()
{
   console.log("a, b, c, d, and e have all been loaded");
});
```

This can be especially useful to load some ability-checking library and load further files depending on the results:
```js
load("check-for-things.js").then(function()
{
   if(!CheckForThings.websockets)
   {
      load("websockets-polyfill.js");
   }
   // etc...
});
```

### Labels

You can provide a label to single files or to arrays of files to make it easier to reference for dependency management.
```js
load("analytics.js")
    .then({ libs: ["jquery/jquery.js", "other-library.js", "yet-another-library.js"] });
```

The above now let's us reference `libs` when we want to ensure that all three of `jquery/jquery.js`, `other-library.js`, and `yet-another-library.js` have completed loading without having to repeatedly type all three file paths out.

This works for single files as well:
```js
load({ awesome: "really-awesome-library-v2.14.1932-beta3.min.js" });
```

### Loading files, or executing code, on completion of certain items

```ts
// when complete trigger a callback
function when(dependency: string, callback: () => void, waiting?: (missing: string[]) => void): void;
function when(dependencies: string[], callback: () => void, waiting?: (missing: string[]) => void): void;
// when complete, load the provided file
function when(dependency: string, file: string, waiting?: (missing: string[]) => void): void;
function when(dependencies: string[], file: string, waiting?: (missing: string[]) => void): void;
// when complete, load all of the provided files
function when(dependency: string, files: string[], waiting?: (missing: string[]) => void): void;
function when(dependencies: string[], files: string[], waiting?: (missing: string[]) => void): void;
// when complete, load the provided file(s) with a label
function when(dependency: string, fileWithLabel: any, waiting?: (missing: string[]) => void): void;
function when(dependencies: string[], fileWithLabel: any, waiting?: (missing: string[]) => void): void;
```

Use `load.when()` to wait for specific dependencies to then load further files or execute code. This is very similar to `then()` but it can be called from another point in your code or provide more specific dependencies.

Dependencies are either file names or labels, and multiple dependencies can be provided.

```js
load("analytics.js")
    .then({ libs: ["jquery/jquery.js", "other-library.js", "yet-another-library.js"] });
load.when("jquery.js", { plugins: ["jquery/jquery-plugin1.js", "jquery/jquery-plugin2.js", "jquery/jquery-plugin3.js"] });
load.when(["libs", "plugins"], "app/my-app-lib.js");
```

Note that we load `jquery/jquery.js` but only use `jquery.js` in the first call to `when()`. And the second call to `when()` lists two dependencies, `libs`, and `plugins`, both of which are labels.

You can also call `when()` at any point in your code, even prior to the file being loaded. For example, the following is completely fine and will load everything in the right order:

```js
load.when(["libs", "plugins"], "app/my-app-lib.js");
load.when("jquery.js", { plugins: ["jquery/jquery-plugin1.js", "jquery/jquery-plugin2.js", "jquery/jquery-plugin3.js"] });
load("analytics.js")
    .then({ libs: ["jquery/jquery.js", "other-library.js", "yet-another-library.js"] });
```

### Set query string arguments

```ts
function setQuerystring(args: string): void
```

You can call `load.setQuerystring` to set query string arguments that will be appended to every loaded file.

This can be useful for rudimentary cache-busting, eg, `load.setQuerystring("rnd=" + Math.random())`.