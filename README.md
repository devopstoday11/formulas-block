# Formulas superblock

Extendible formula calculator with out of the box support for 188 functions, including financial, engineering and many other functions that are available in excel and google sheets.

This block can be extended with functions from dynamically loaded javascript files. See below for instructions.

## Installation

1. This is a custom block. To install custom blocks, you need to join Airtable's custom blocks developer preview, by filling [this form](https://airtable.com/shrEvq5IlQqYxWkaS).

2. Follow the instructions [here](https://airtable.com/developers/blocks/guides/hello-world-tutorial#create-a-new-block) to create a new block - but in _Start from an example_, choose _Remix from GitHub_ and in _GitHub repository_, enter the URL for this repository:

https://github.com/superblocks-at/formulas-block

3. Install the block into your base by releasing it, using the following command:

```
block release
```

## Known Issues

- No support for field names with spaces in them. Will be added soon.

## Extending the block with dynamically loaded functions

Please use the [@superblocks-at/formulajs-functions](https://www.npmjs.com/package/@superblocks-at/formulajs-functions) as a reference implementation. The package dynamically adds additional excel functions that exist in the [@formulajs/formulajs](https://www.npmjs.com/package/@formulajs/formulajs) npm package to the block.

In short, the steps are:

1. Create an npm package with the functions you want to add.

2. Create an object with a mapping from function names to function implementations and pass this object to window.superblocks.formulas.addFunctions():

```js
const funcs = {
	myfunc1: myfunc1,
	myfunc2: myfunc2,
};

window.superblocks.formulas.addFunctions(funcs);
```

3. Bundle your package as a umd script. The reference implementation uses rollup for that. See the [package.json](https://github.com/superblocks-at/formulajs-functions/blob/master/package.json) and [rollup.config.json](https://github.com/superblocks-at/formulajs-functions/blob/master/rollup.config.js) files for implementation examples.

4. Publish your package so that the bundled umd script can be downloaded from the [unpkg cdn](https://unpkg.com/). See the files section in the [package.json](https://github.com/superblocks-at/formulajs-functions/blob/master/package.json) of the reference implementation for one way of doing that.

If you need additional guidance, please create an [issue](issues).

## LICENSE

[MIT](LICENSE.md)

## Contributions

Are more than welcome. The goal is to have the community improve the block and expand the block's function selection so that the entire Airtable community can benefit.

Some things that will benefit the community:

- Add support for field names with spaces in them.

- Add all the missing excel functions from [@formulajs/formulajs](https://www.npmjs.com/package/@formulajs/formulajs) to the [@superblocks-at/formulajs-functions](https://www.npmjs.com/package/@superblocks-at/formulajs-functions) package.

- Add the [@superblocks-at/formulajs-functions](https://www.npmjs.com/package/@superblocks-at/formulajs-functions) package to this block and eliminate the need to load the package functions dynamically via script.

- Improve the formula editor with:

      	- Typeahead / autocomplete for fields and functions.
      	- Syntax highlighting.
      	- Realtime display of formula parse errors.

## Implementation Details

This block uses:

1. The compact and stable [formula](https://www.npmjs.com/package/formula) compiler and function library.

2. The amazing [mobx library](https://mobx.js.org/README.html) for state management. Mobx promotes clear separation between view (react components), and state / view model (the data they depend on for rendering), which:

- Reduces code size and complexity.
- Allows for easier and faster testing.
- Creates components that re-render truly only when something they directly depend on in their rendering changes.

## Looking for help with custom blocks development?

We at [Superblocks](https://superblocks.at) have already developed quite a few [custom blocks](https://superblocks.at/#blocks) and more are coming soon. We also offer extremely quick and reliable [custom blocks development services](https://superblocks.at/#services). Feel free to [contact us](https://superblocks.at/#services).
