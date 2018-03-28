const expect = require('chai').expect;
let htmlparser2 = require('htmlparser2');

class CharSeo {
  constructor(filePath = '', data = '') {
    this.filePath = filePath;
    this.treePath = [];
    this.attributesPresent = [];
    this.attributesAbsent = [];

    this._checkAttrExistence = true;
    this._checkTagExistence = true;
    this._htmlData = data;
  }

  get appear() {
    return this;
  }

  tag(htmlTag) {
    this.treePath = [htmlTag];
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
    const treePath = this.treePath;
    let tagStack = [...treePath].reverse();
    let undoStack = [];
    let result = false;

    const parser = new htmlparser2.Parser({
      onopentag: (tag, attr) => {
        if (tag === tagStack[tagStack.length - 1]) {
          undoStack.push(tagStack.pop());
        }

        // check if all target tags have been traversed
        if (treePath.length !== 0 && undoStack.length === treePath.length) {
          for (let i = 0; i < undoStack.length; ++i) {
            // check for equality in case stack manipulation was incorrect
            if (undoStack[i] !== treePath[i]) {
              return;
            }
          }
          result = true;
        }
      },
      onclosetag: (tag) => {
        if (tag === undoStack[undoStack.length - 1]) {
          tagStack.push(undoStack.pop());
        }
      }
    });

    parser.write(this._htmlData); // need to change this to data
    parser.end();

    // reset state
    this._reset();

    return result;
  }

  /**
   * Resets state so that another rule check can be performed on the same file/stream
   */
  _reset() {
    this.treePath = [];
    this.attributesPresent = [];
    this.attributesAbsent = [];

    this._checkAttrExistence = true;
    this._checkTagExistence = true;
  }
}

const testHtml = `
<!DOCTYPE html>
<html lang=en>
<head>

</head>
<body>
    <img alt='f'>
    <h1>My First Heading</h1>
    <p>My first paragraph.</p>
    <div style='color:black'>
        <div style='color:blue'>
            <div style='color:green'>
            </div>
        </div>
    </div>
</body>

</html>
`;

expect(new CharSeo('', testHtml).tag('div').exist()).to.be.true;
expect(new CharSeo('', testHtml).tag('div').hasChild('div').exist()).to.be.true;
expect(new CharSeo('', testHtml).tag('div').hasChildren(['div', 'div']).exist()).to.be.true;
expect(new CharSeo('', testHtml).tag('h2').exist()).to.be.false;
expect(new CharSeo('', testHtml).tag('img').with('alt').exist()).to.be.true;
