const expect = require('chai').expect;
const CharSeo = require('../lib/index');
const path = require('path');
const html1 = path.join(__dirname, 'html1.html')

// Rule 1 check
expect(new CharSeo(html1, false)
  .hasTag('img')
  .hasNoAttribute({alt: ''})
  .exist()).to.be.true;
expect(new CharSeo(html1, false)
  .hasTag('img')
  .hasAttribute({alt: ''})
  .does.not.exist()).to.be.false;
expect(new CharSeo(html1)
  .hasTag('img')
  .hasAttribute({alt: 'f'})
  .exist()).to.be.true;

// Rule 2
expect(new CharSeo(html1, false)
  .hasTag('a')
  .hasNoAttribute({rel: ''})
  .exist()).to.be.true;
expect(new CharSeo(html1)
  .hasTag('a')
  .hasNoAttribute({rel: ''})
  .exist()).to.be.true;
expect(new CharSeo(html1)
  .hasTag('a')
  .hasAttribute({rel: 'next'})
  .exist()).to.be.true;
expect(new CharSeo(html1)
  .hasTag('div')
  .hasChild('img')
  .exist()).to.be.true;

// Rule 3.1
expect(new CharSeo(html1)
  .hasTag('head')
  .hasChild('title')
  .does.not.exist()).to.be.true;

// Rule 3.2
expect(new CharSeo(html1)
  .hasTag('head')
  .hasChild('meta')
  .hasAttribute({name: 'descriptions'})
  .does.not.exist()).to.be.true;

// Rule 3.3.
expect(new CharSeo(html1)
  .hasTag('head')
  .hasChild('meta')
  .hasAttribute({name: 'keywords'})
  .does.not.exist()).to.be.true;

// Rule 4
expect(new CharSeo(html1)
  .hasTag('strong')
  .appear
  .moreThan(2)).to.be.true;
expect(new CharSeo(html1)
  .hasTag('strong')
  .appear
  .not
  .moreThan(3)).to.be.true;


// Rule 5
expect(new CharSeo(html1)
  .hasTag('h1')
  .appear
  .moreThan(1)).to.be.true;
expect(new CharSeo(html1)
  .hasTag('div')
  .hasChild('h1')
  .appear
  .moreThan(0)).to.be.false;
