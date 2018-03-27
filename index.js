const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
let htmlparser2 = require('htmlparser2');

const parser = new htmlparser2.Parser({
  onopentag: function(tag, attributes) {
    console.log(`tag open: ${tag}`);
    console.log(attributes);
    // switch (tag) {
    //   case 'img':
    //     console.log('img');
    //     break;
    //   case 'a':
    //     console.log('a');
    //     break;
    //   case 'title':
    //     console.log('title');
    //     break;
    //   default:
    //     console.log(tag);
    // }
  },
  onclosetag: function(tag) {
    console.log(`tag close: ${tag}`);
  }
});

class CharSeo {
  constructor(filePath) {
    this.filePath = filePath;
    this.treePath = [];
    this.attributesPresent = [];
    this.attributesAbsent = [];

    this._checkAttrExistence = true;
    this._checkTagExistence = true;
  }

  get appear() {
    return this;
  }

  tag(htmlTags) {
    this.treePath = [...htmlTags];
    return this;
  }

  hasChildren(htmlTags) {
    // check for root existence
    this.treePath = [...this.treePath, ...htmlTags];
    return this;
  }

  hasChild(htmlTag) {
    // check for root existence
    this.treePath = [...this.treePath, htmlTag];
    return this;
  }

  hasAttributes(attributes) {
    this.attributesPresent = [...this.attributesPresent, ...attributes];
    return this;
  }

  exist() {
    let nodeStack =
    const parser = new htmlparser2.Parser({
      onopentag: (tag, attr) {

      },
      onclosetag: (tag) {

      }
    })
  }
}

const filePath = path.join(__dirname, 'test.html');
fs.readFile(filePath, 'utf-8', (err, data) => {
  expect(true).to.be.true;
});

// parser.write();
// parser.end();
