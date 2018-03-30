// @flow
const _ = require('lodash');
const fs = require('fs');
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
  _filePath: string;
  _treePath: HtmlNode[]; // path in a tree with the first node closest to the root
  _notFlag: boolean;
  _strict: boolean;
  _htmlData: string;
  _print: boolean;

  constructor(filePath: string, isStrict: ?boolean, print: ?boolean) {
    this._filePath = filePath;
    this._treePath = [];

    this._notFlag = false;
    this._strict = isStrict != null ? isStrict : true;
    this._print = print != null ? print : true;

    this._htmlData = fs.readFileSync(this._filePath, 'utf8');
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
    this._treePath = [node];
    return this;
  }

  hasTag(tag: HtmlTag): CharSeo {
    this._treePath = [{tag: tag, attributes: {}, notAttributes: {}}];
    return this;
  }

  hasChildren(tags: HtmlTag[]): CharSeo {
    const treePath = [...this._treePath];
    const nodes = [...tags].map(tag => ({tag: tag, attributes: {}, notAttributes: {}}));
    this._treePath = treePath.concat(nodes);
    return this;
  }

  hasChild(tag: HtmlTag): CharSeo {
    this.hasChildren([tag])
    return this;
  }

  hasAttribute(attribute: Attribute): CharSeo {
    const treePath = [...this._treePath];
    const lastAddedNode = _.last(treePath);
    lastAddedNode.attributes = attribute;
    this._treePath = treePath;

    return this;
  }

  hasNoAttribute(attribute: Attribute): CharSeo {
    const treePath = [...this._treePath];
    const lastAddedNode = _.last(treePath);
    lastAddedNode.notAttributes = attribute;
    this._treePath = treePath;

    return this;
  }

  /**
  Search for specified tree path in the DOM.

  The explored and unexplored nodes are maintained by the explored and unexplored stacks. Top of the unexplored stack contains the node in the tree path closest to the root, while the bottom of the explored stack is such a node. An explored nodes that is of the incorrect relationship with respect next unexplored node will be thrown back to the unexplored stack.

  If the tree path exists in the DOM, the unexplored stack will be emptied out into the explored stack, vice versa if such a path does not exist.

  This is a terminal word
  */
  exist(): boolean {
    const treePath = [...this._treePath];
    let unexploredStack = [...treePath].reverse();
    let exploredStack: HtmlNode[] = [];
    let treePathExplored = _.isEqual(treePath, exploredStack);
    let openedTags: {tag?: HtmlTag} = {}; // track open/close tag pairs

    const parser = new htmlparser2.Parser({
      onopentag: (tag, attr) => {
        this._explore(tag, attr, unexploredStack, exploredStack, openedTags);
        // check if all target tags have been traversed
        treePathExplored |= _.isEqual(treePath, exploredStack);
      },
      onclosetag: (tag) => {
        this._unexplore(tag, unexploredStack, exploredStack, openedTags);
      }
    });

    parser.write(this._htmlData);
    parser.end();

    if (this._print && treePathExplored) {
      let output = treePath.map(node => this._toString(node)).join(', ');
      process.stdout.write(
        `${output}` +
        `${this._notFlag ? ' do not exists' : ' exists'}` +
        '\n'
      );
    }

    this._reset();

    return treePathExplored ? !this._notFlag : this._notFlag;
  }

  /*
  Count the number of subjects that appear more than @times

  This is a terminal word
  */
  moreThan(times: number): boolean {
    const treePath = [...this._treePath];
    let unexploredStack = [...treePath].reverse();
    let exploredStack: HtmlNode[] = [];
    let openedTags: {tag?: HtmlTag} = {}; // track open/close tag pairs
    let pathsFound = 0;

    const parser = new htmlparser2.Parser({
      onopentag: (tag, attr) => {
        this._explore(tag, attr, unexploredStack, exploredStack, openedTags);
        // check if all target tags have been traversed
        if (_.isEqual(treePath, exploredStack)) {
          pathsFound += 1;
        }
      },
      onclosetag: (tag) => {
        this._unexplore(tag, unexploredStack, exploredStack, openedTags);
      }
    });

    parser.write(this._htmlData);
    parser.end();

    const limitSatisfied = this._notFlag ?
                            pathsFound <= times :
                            pathsFound > times;

    if (this._print) {
      let output = treePath.map(node => this._toString(node)).join(', ');
      process.stdout.write(
        'There are ' +
        `${limitSatisfied && this._notFlag ? 'not ' : ''}` +
        `more than ${times} ${output}\n`
      );
    }

    this._reset();

    return limitSatisfied;
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

  _toString(htmlNode: HtmlNode) {
    const formAttr = attr => (
      Object.entries(attr)
        .map(pair => this._strict ? pair : pair.slice(0, 1))
        .map(pair => pair.join('='))
        .join(' ')
    );
    let attrString = formAttr(htmlNode.attributes);
    let notAttrString = formAttr(htmlNode.notAttributes);

    return `<${htmlNode.tag}` +
            `${attrString.length > 0 ? ` ${attrString}>` : '>'}` +
            `${notAttrString.length > 0 ? ` without ${notAttrString}` : ''}`;
  }

  /**
   * Resets state so that another rule check can be performed on the same file/stream
   */
  _reset() {
    this._treePath = [];
  }
}

module.exports = CharSeo;
