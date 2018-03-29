// @flow
const expect = require('chai').expect;
const _ = require('lodash');
let htmlparser2 = require('htmlparser2');

type HtmlNode = {
  tag: HtmlTag,
  attribute?: Attribute,
  notAttribute?: Attribute
}

// Use strings for now. Can be made more robust
// by defining valid html tags
type HtmlTag = string

type Attribute = {
  [attr: string]: string
}

class CharSeo {
  filePath: string;
  treePath: HtmlNode[]; // path in a tree with the first node closest to the root
  _htmlData: string

  constructor(filePath: string, data: string) {
    this.filePath = filePath;
    this.treePath = [];

    this._htmlData = data;
  }

  get appear(): CharSeo {
    return this;
  }

  tag(node: HtmlNode): CharSeo {
    this.treePath = [node];
    return this;
  }

  hasChildren(nodes: HtmlNode[]): CharSeo {
    // check for root existence
    this.treePath = [...this.treePath, ...nodes];
    return this;
  }

  hasChild(node: HtmlNode): CharSeo {
    // check for root existence
    this.treePath = [...this.treePath, node];
    return this;
  }

  hasAttributes(attribute: Attribute): CharSeo {
    return this;
  }

  /**
  Search for specified tree path in the DOM.

  The explored and unexplored nodes are maintained by the explored and unexplored stacks. Top of the unexplored stack contains the node in the tree path closest to the root, while the bottom of the explored stack is such a node. An explored nodes that is of the incorrect relationship with respect next unexplored node will be thrown back to the unexplored stack.

  If the tree path exists in the DOM, the unexplored stack will be emptied out into the explored stack, vice versa if such a path does not exist.

  This is a terminal verb
  */
  exist(): boolean {
    const treePath = this.treePath;
    let unexploredStack = [...treePath].reverse();
    let exploredStack = [];
    let treePathExplored = _.isEqual(treePath, exploredStack);
    let openedTags: {tag?: HtmlTag} = {}; // track open/close tag pairs

    const parser = new htmlparser2.Parser({
      onopentag: (tag, attr) => {
        if (unexploredStack.length <= 0) {
          return;
        }

        const top: HtmlNode = _.last(unexploredStack);
        if (top.tag === tag) {
          const topAttr = top.attributes || {};
          const topNotAttr = top.notAttributes || {};
          const topAttrKeys = Object.keys(topAttr);
          const topNotAttrKeys = Object.keys(topNotAttr);
          if (openedTags[tag]) {
            openedTags[tag] += 1;
          }

          // checks for topAttr ⊆ attr && notAttr ∩ attr == ∅
          if (topAttrKeys.every(key => topAttr[key] === attr[key]) &&
              !topNotAttrKeys.some(key => key && topNotAttr[key] === attr[key])) {
            exploredStack.push(unexploredStack.pop());
            openedTags[tag] = openedTags[tag] ? openedTags[tag] + 1 : 1
          }
        }

        // check if all target tags have been traversed
        // if path is found we stop parsing
        treePathExplored = _.isEqual(treePath, exploredStack);
        if (treePathExplored) {
          parser.reset();
        }

      },
      onclosetag: (tag) => {
        if (exploredStack.length <= 0) {
          return;
        }
        openedTags[tag] -= 1;

        const top = _.last(exploredStack);
        if (top.tag === tag && openedTags[tag] === 0) {
          const topAttr = top.attribute;
          unexploredStack.push(exploredStack.pop());
        }
      }
    });

    parser.write(this._htmlData); // need to change this to data
    parser.end();

    this._reset();

    return treePathExplored;
  }

  /**
   * Resets state so that another rule check can be performed on the same file/stream
   */
  _reset() {
    this.treePath = [];
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
    <div style='color:black' display='block'>
        <div style='color:blue'>
            <div style='color:green'>
            </div>
        </div>
    </div>
</body>

</html>
`;

expect(new CharSeo('', testHtml).tag({tag: 'div'}).exist()).to.be.true;
expect(new CharSeo('', testHtml).tag({tag: 'div', notAttributes: {display: 'inline'}}).exist()).to.be.true;
expect(new CharSeo('', testHtml).tag({tag: 'div'}).hasChild({tag: 'div'}).exist()).to.be.true;
expect(new CharSeo('', testHtml).tag({tag: 'div'}).hasChildren([{tag: 'div'}, {tag: 'div'}]).exist()).to.be.true;
expect(new CharSeo('', testHtml).tag({tag: 'h2'}).exist()).to.be.false;
expect(new CharSeo('', testHtml).tag({tag: 'img'}).exist()).to.be.true;
expect(new CharSeo('', testHtml)
  .tag({tag: 'div', attribute: {style: 'color:blue'}})
  .hasChild({tag: 'div', attribute: {style: 'color:black', display:'block'}})
  .hasChild({tag: 'div', attribute: {style: 'color:green'}})
  .exist()).to.be.true;
