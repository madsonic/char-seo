// @flow
const expect = require('chai').expect;
const _ = require('lodash');
let htmlparser2 = require('htmlparser2');

type HtmlNode = {
  tag: HtmlTag,
  attributes: Attribute,
  notAttributes: Attribute
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
  _notFlag: boolean;
  _strict: boolean;
  _htmlData: string;

  constructor(filePath: string, data: string, isStrict: ?boolean) {
    this.filePath = filePath;
    this.treePath = [];

    this._notFlag = false;
    this._strict = isStrict != null ? isStrict : true;

    this._htmlData = data;
  }

  get appear(): CharSeo {
    return this;
  }

  get does(): CharSeo {
    return this;
  }

  get not(): CharSeo {
    this._notFlag = !this._notFlag;
    return this;
  }

  tag(node: HtmlNode): CharSeo {
    this.treePath = [node];
    return this;
  }

  hasTag(tag: HtmlTag): CharSeo {
    this.treePath = [{tag: tag, attributes: {}, notAttributes: {}}];
    return this;
  }

  hasChildren(tags: HtmlTag[]): CharSeo {
    // check for root existence
    const treePath = [...this.treePath];
    const nodes = [...tags].map(tag => ({tag: tag, attributes: {}, notAttributes: {}}));
    this.treePath = treePath.concat(nodes);
    return this;
  }

  hasChild(tag: HtmlTag): CharSeo {
    // check for root existence
    this.hasChildren([tag])
    return this;
  }

  hasAttribute(attribute: Attribute): CharSeo {
    const treePath = [...this.treePath];
    const lastAddedNode = _.last(treePath);
    lastAddedNode.attributes = attribute;
    this.treePath = treePath;

    return this;
  }

  hasNoAttribute(attribute: Attribute): CharSeo {
    const treePath = [...this.treePath];
    const lastAddedNode = _.last(treePath);
    lastAddedNode.notAttributes = attribute;
    this.treePath = treePath;

    return this;
  }


  /**
  Search for specified tree path in the DOM.

  The explored and unexplored nodes are maintained by the explored and unexplored stacks. Top of the unexplored stack contains the node in the tree path closest to the root, while the bottom of the explored stack is such a node. An explored nodes that is of the incorrect relationship with respect next unexplored node will be thrown back to the unexplored stack.

  If the tree path exists in the DOM, the unexplored stack will be emptied out into the explored stack, vice versa if such a path does not exist.

  This is a terminal verb
  */
  exist(): boolean {
    const treePath = [...this.treePath];
    let unexploredStack = [...treePath].reverse();
    let exploredStack = [];
    let treePathExplored = _.isEqual(treePath, exploredStack);
    let openedTags: {tag?: HtmlTag} = {}; // track open/close tag pairs

    const parser = new htmlparser2.Parser({
      onopentag: (tag, attr) => {
        this._explore(tag, attr, unexploredStack, exploredStack, openedTags);
        // check if all target tags have been traversed
        // if path is found we stop parsing
        treePathExplored |= _.isEqual(treePath, exploredStack);
      },
      onclosetag: (tag) => {
        this._unexplore(tag, unexploredStack, exploredStack, openedTags);
      }
    });

    parser.write(this._htmlData); // need to change this to data
    parser.end();

    this._reset();

    return treePathExplored ? !this._notFlag : this._notFlag; //XOR
  }

  /*
  Count the number of subjects that appear more than @times
  */
  moreThan(times: number): boolean {
    const treePath = [...this.treePath];
    let unexploredStack = [...treePath].reverse();
    let exploredStack = [];
    let treePathExplored = _.isEqual(treePath, exploredStack);
    let openedTags: {tag?: HtmlTag} = {}; // track open/close tag pairs
    let pathsFound = 0;

    const parser = new htmlparser2.Parser({
      onopentag: (tag, attr) => {
        this._explore(tag, attr, unexploredStack, exploredStack, openedTags);
        // check if all target tags have been traversed
        // if path is found we stop parsing
        if (_.isEqual(treePath, exploredStack)) {
          pathsFound += 1;
        }
      },
      onclosetag: (tag) => {
        this._unexplore(tag, unexploredStack, exploredStack, openedTags);
      }
    });

    parser.write(this._htmlData); // need to change this to data
    parser.end();

    this._reset();

    return pathsFound > times;
  }

  /*
  Update the stacks and openedTags when tags are opened
  */
  _explore(tag: HtmlTag, attr: Attribute, unexploredStack: HtmlNode[], exploredStack: HtmlNode[], openedTags: {tag?: HtmlTag}) {
    if (unexploredStack.length <= 0) {
      return;
    }

    const top: HtmlNode = _.last(unexploredStack);
    if (top.tag === tag) {
      const topAttr = top.attributes;
      const topNotAttr = top.notAttributes;
      const topAttrKeys = Object.keys(topAttr);
      const topNotAttrKeys = Object.keys(topNotAttr);
      if (openedTags[tag]) {
        openedTags[tag] += 1;
      }

      if (this._checkAttributes(topAttr, topNotAttr, attr)) {
        exploredStack.push(unexploredStack.pop());
        openedTags[tag] = openedTags[tag] ? openedTags[tag] + 1 : 1
      }
    }
  }

  /*
  Reverse any changes to the stacks and openedTags when tags are closed
  */
  _unexplore(tag: HtmlTag, unexploredStack: HtmlNode[], exploredStack: HtmlNode[], openedTags: {tag?: HtmlTag}) {
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

  _checkAttributes(topAttr: Attribute, topNotAttr: Attribute, foundAttr: Attribute) {
    const topAttrKeys = Object.keys(topAttr);
    const topNotAttrKeys = Object.keys(topNotAttr);

    // checks for topAttr ⊆ attr && notAttr ∩ attr == ∅
    // strict checks for attribute value
    const isSubset = topAttrKeys.every(key => {
      return this._strict ? topAttr[key] === foundAttr[key] : foundAttr.hasOwnProperty(key);
    });

    const nullIntersection = !topNotAttrKeys.some(key => {
      return key && this._strict ? topNotAttr[key] === foundAttr[key] : foundAttr.hasOwnProperty(key);
    });

    return isSubset && nullIntersection;
  }

  /**
   * Resets state so that another rule check can be performed on the same file/stream
   */
  _reset() {
    this.treePath = [];
  }
}

const html1 = `
<!DOCTYPE html>
<head>
  <meta charset='UTF-8'>
</head>
<html lang=en>
  <body>
    <h1>Title1</h1>
    <h1>Title2</h1>
    <div>
      <img alt='f' />
      <img />
      <a rel='next'>link</a>
      <a>link</a>
    </div>
    <p>
      <strong>word1</strong>
      <strong>word2</strong>
      <strong>word3</strong>
    </p>
  </body>
</html>
`;

// Rule 1 check
expect(new CharSeo('', html1, false)
  .hasTag('img')
  .hasNoAttribute({alt: ''})
  .exist()).to.be.true;
expect(new CharSeo('', html1, false)
  .hasTag('img')
  .hasAttribute({alt: ''})
  .does.not.exist()).to.be.false;
expect(new CharSeo('', html1)
  .hasTag('img')
  .hasAttribute({alt: 'f'})
  .exist()).to.be.true;

// Rule 2
expect(new CharSeo('', html1, false)
  .hasTag('a')
  .hasNoAttribute({rel: ''})
  .exist()).to.be.true;
expect(new CharSeo('', html1)
  .hasTag('a')
  .hasAttribute({rel: 'next'})
  .exist()).to.be.true;

// Rule 3.1
expect(new CharSeo('', html1)
  .hasTag('head')
  .hasChild('title')
  .does.not.exist()).to.be.true;

// Rule 3.2
expect(new CharSeo('', html1)
  .hasTag('head')
  .hasChild('meta')
  .hasAttribute({name: 'descriptions'})
  .does.not.exist()).to.be.true;

// Rule 3.3.
expect(new CharSeo('', html1)
  .hasTag('head')
  .hasChild('meta')
  .hasAttribute({name: 'keywords'})
  .does.not.exist()).to.be.true;

// Rule 4
expect(new CharSeo('', html1)
  .hasTag('strong')
  .appear
  .moreThan(2)).to.be.true;

// Rule 5
expect(new CharSeo('', html1)
  .hasTag('h1')
  .appear
  .moreThan(1)).to.be.true;
expect(new CharSeo('', html1)
  .hasTag('div')
  .hasChild('h1')
  .appear
  .moreThan(0)).to.be.false;
