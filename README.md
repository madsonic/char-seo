# [CharSeo](https://en.wikipedia.org/wiki/Char_siu)
SEO rules checking in natural language style.

# Getting Started
```js
npm run build
```

```html
<!DOCTYPE html>
<head>
  <meta charset='UTF-8'>
</head>
```
```js
const CharSeo = require('lib/index');

const doc = CharSeo(html1)
doc.hasTag('head')
    .hasChild('meta')
    .hasAttribute({name: 'keywords'})
    .does.not.exist(); // true
// prints: <head>, <meta name=keywords> do not exists
```


# Design approach
CharSeo API has been inspired by [Chai](http://www.chaijs.com/api/bdd/) and tries to mimic the natural language as much as possible. The grammar words can be broadly grouped in to 3 categories; subject, connective and action.

Subjects are built as a tree path, specifying the relative relationship between DOM nodes.

## Constructor
### CharSeo(filePath: string, isStrict: ?boolean, print: ?boolean)
`isStrict`: specify if attribute values are check. default to `true`

`print`: will print check result

## Subject

### hasTag(tag: HtmlTag)
Sets the root DOM node to check for.
```js
.hasTag('div')
```

### hasChild(tag: HtmlTag)
Similar to `hasTag` but appends the child to the existing path
```js
.hasTag('div').hasChild('div') // will look for nested div tag
```

### hasChildren(tags: HtmlTag[])
Similar to `hasChild`.
```js
// These 2 statements are equivalent
.hasChildren(['div', 'div'])
.hasChild('div').hasChild('div')
```
### hasAttribute
Specify attribute for last added tag. A subset check rather than a equivalent set check is performed
```js
// <div style='color:black'>
.hasTag('div').hasAttribute({style: 'color:black'})
```
### hasNoAttribute
Specify attribute that should not be present for last added tag. A null intersection check rather than a equivalent set check is performed

```js
// any <div> without style='color:black'
.hasTag('div').hasNoAttribute({style: 'color:black'})
```

### not
Flips the result of checking

## Connective
- appear
- does

The only purpose of connectives is to allow the constructor statement to be read like a natural language. It has not impact on the outcome of the check.
```js
// will yield same result
.hasTag('div').exist()
.hasTag('div').to.exist()
.hasTag('div').to.appear.to.exist()
```
__Note__: Ungrammatical sentence are not forbidden

## Action
Action does all the heavy lifting and check for the subjects that have been specified.

__Note__ action words are terminal words; no other words should come after them.

### exist()
Checks if the subjects specified in the order exists

### moreThan(times: number)
Check if the subjects specified in the order appear more than given number of times

# Know Limitations
Currently only relative ordering is supported, i.e. immediate children relationship cannot be specified.

```html
<div>
    <p></p>
    <div></div>
</div>
```
```js
.hasTag('div').hasChild('div').exist() // will yield for the given HTML
```

However, it can be easily extended to support such a relationship by adding more words such as `.hasImmediateChild` and specify the check routine.

# Testing
Use Chai to assert for the outcomes. New tests should be named with `*.test.js` e.g. `foo.test.js`
```js
// run the tests with
npm test
```
