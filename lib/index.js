//      
const expect = require('chai').expect;
const _ = require('lodash');
let htmlparser2 = require('htmlparser2');

                 
               
                        
 

// Use strings for now. Can be made more robust
// by defining valid html tags
                     

                  
              
 

class CharSeo {
                   
                       
                                 
                                
                               
                              
                   

  constructor(filePath        , data        ) {
    this.filePath = filePath;
    this.treePath = [];

    this._htmlData = data;
  }

  get appear()          {
    return this;
  }

  tag(node          )          {
    this.treePath = [node];
    return this;
  }

  hasChildren(nodes            )          {
    // check for root existence
    this.treePath = [...this.treePath, ...nodes];
    return this;
  }

  hasChild(node          )          {
    // check for root existence
    this.treePath = [...this.treePath, node];
    return this;
  }

  hasAttributes(attributes             )          {
    this.attributesPresent = [...attributes];
    return this;
  }

  exist()          {
    const treePath = this.treePath;
    let unexploredStack = [...treePath].reverse();
    let exploredStack = [];
    let treePathExplored = _.isEqual(treePath, exploredStack);
    let openedTags                  = {}; // track open/close tag pairs

    const parser = new htmlparser2.Parser({
      onopentag: (tag, attr) => {
        if (unexploredStack.length <= 0) {
          return;
        }

        const top           = _.last(unexploredStack);
        if (top.tag === tag) {
          const topAttr = top.attributes || {};
          if (openedTags[tag]) {
            openedTags[tag] += 1;
          }

          // passes when top node attributes are subset of
          // current node. null attributes is considered subset
          if (Object.keys(topAttr).every(key => topAttr[key] === attr[key])) {
            exploredStack.push(unexploredStack.pop());
            openedTags[tag] = openedTags[tag] ? openedTags[tag] + 1 : 1
          }
        }

        // check if all target tags have been traversed
        treePathExplored = _.isEqual(treePath, exploredStack);
        if (treePathExplored) {
          parser.reset(); // stop parsing since we have found a path
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
    this.attributesPresent = [];
    this.attributesAbsent = [];

    this._checkAttrExistence = true;
    this._checkTagExistence = true;
  }
}

// Array.prototype.shalllowEquals = (array) => {
//   if (typeof array !== Array) {
//     return false；
//   }
//
//   if（this.length !== array.length) {
//     return false;
//   }
//
//   for (let i = 0; i < this.length; ++i) {
//     if (this[i] !== array[i]) {
//       return false;
//     }
//   }
//   return true;
// };
//
// Object.prototype.shalllowEquals = (obj) => {
//   if (typeof obj !== Object) {
//     return false；
//   }
//
//   if（Object.keys(this).length !== Object.keys(obj).length) {
//     return false;
//   }
//
//   for (propName in this) {
//     if (!obj.hasOwnProperty(propName) || this[propName] !== obj[propName]) {
//       return false;
//     }
//   }
//
//   return true;
// };

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
expect(new CharSeo('', testHtml).tag({tag: 'div'}).hasChild({tag: 'div'}).exist()).to.be.true;
expect(new CharSeo('', testHtml).tag({tag: 'div'}).hasChildren([{tag: 'div'}, {tag: 'div'}]).exist()).to.be.true;
expect(new CharSeo('', testHtml).tag({tag: 'h2'}).exist()).to.be.false;
expect(new CharSeo('', testHtml).tag({tag: 'img'}).exist()).to.be.true;
expect(new CharSeo('', testHtml)
  .tag({tag: 'div', attribute: {style: 'color:blue'}})
  .hasChild({tag: 'div', attribute: {style: 'color:black', display:'block'}})
  .hasChild({tag: 'div', attribute: {style: 'color:green'}})
  .exist()).to.be.true;
