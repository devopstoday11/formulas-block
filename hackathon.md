## Inspiration

Add support for formula functions that are available in excel, google sheets and other spreadsheet solutions, thus opening up financial, engineering and many other business and scientific use cases previously not possible with Airtable.

Create a formula calculation engine that is easily extendible with scripts, thus creating a platform that can answer almost any formula calculation use case.

## What it does

A formula calculation engine that saves the calculation into a field in a selected view or record.

For a list of functions supported out of the box, see [here](https://formula.github.io/formula/docs/code/src/functions).

For a list of additional functions that can easily be added to the engine, see [here](https://formulajs.info/functions/).

### Edit and run a formula

The user:

1. Selects the table and view to run the calculation in.

2. Selects the "result" field to save the calculation in.

3. Specifies the formula with the capability to easily insert into the formula:

   - Table fields

   - Supported functions - with out of the box support for 188 functions

The user can then select to:

1. Run the calculation on the selected record without saving it into the result field.

2. Run the calculation on the selected record and save the calculation into the result field.

3. Run the calculation on all records in the selected view and save the calculations into the result field.

Everything is persisted.

### Add functions from dynamcially loaded scripts

The formula calculation engine can be extended with functions from dynamically loaded scripts.

To help users easily find available scripts, extension script authors should publish those scripts as umd scripts to the npm package repository, with the keyword:

```
formulas-superblock-functions
```

The user can then click on a link in the block to view all the [extension scripts available on npmjs.com](https://www.npmjs.com/search?q=keywords:formulas-superblock-functions).

The README of each package will document the list of extension functions and will specify the url of the script the user can dynamically load into the engine.

### Create and publish an extension functions script

Users with use cases that require functions not available out-of-the-box or with existing extension scripts can create and publish scripts by following the instructions in the [GitGub repository](https://github.com/superblocks-at/formulas-block). A reference implementation has also been created to ease with the creation and publishing of such scripts.

## How I built it

I used:

1. The [formula](https://www.npmjs.com/package/formula) compiler and function library. It comes with out of the box support for [188 functions](https://formula.github.io/formula/docs/code/src/functions), including partial support for financial, engineering and math functions available in spreadsheet solutions such as excel and google sheets.

2. The [@formulajs/formulajs](https://www.npmjs.com/package/@formulajs/formulajs) functions library that includes JavaScript implementations of almost all [Microsoft Excel formula functions](https://formulajs.info/functions/), including the ones not available in the formula library above. I used this library to demonstrate the creation of an extension functions script.

3. [mobx](https://mobx.js.org/README.html) for state management. Mobx promotes clear separation between view (react components), and state / view model (the data they depend on for rendering), which:

- Reduces code size and complexity.

- Allows for easier and faster testing.

- Creates components that re-render truly only when something they directly depend on in their rendering changes.

## Challenges I ran into

It took me a while to find a suitable formula compiler and functions library that is stable and works as advertised. Luckily I found a great one, which wasn't one of the immediate suspects.

## Accomplishments that I'm proud of

1. That in a short period of time, I created something that can benefit a huge potential user base coming from spreadsheet solutions and that can ease the transition to Airtable for many many people.

2. That in such a short period of time, using the expertise (and code) I acquired in developing other blocks, I was able to create a block that is only a few days of work away from primetime use.

3. That I was able to easily modify the formula compiler to add support for extension functions.

4. That I was able to easily create an extendible formula calculation engine.

5. That I was able to find another functions library that will provide almost all of the functions from excel and google sheets that don't exist in the core library.

## What I learned

1. How to use rollup to bundle scripts as [umd - Universal Module Definition](https://github.com/umdjs/umd) scripts.

2. How to publish a umd script to npmjs.com so that it immediately becomes available on the [unpkg cdn](https://unpkg.com/) (Content Delivery Network) so extension script authors will not have to host scripts by themselves.

## What's next for Formulas by Superblocks.at

The sky is the limit. With the help of the community:

1. Add all the missing functions found in excel and google sheets.

2. Improve the editor with autocomplete, syntax highlighting and display of real-time formula parsing errors.

3. Add proper support for xlookup, vlookup and hlookup functions, with support for looking up values in other tables too.

In addition:

4. Errors need to be better handled. Since errors are returned as JavaScript errors with string representations like "#ERROR!" and since result fields may be number fields where strings cannot be stored, support for selecting a calculation error field of type "Single line text" will be added.
