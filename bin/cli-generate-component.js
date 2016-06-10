#!/usr/bin/env node

const process = require('process');
const program = require('commander');
const changCase = require('change-case');
const path = require('path');
const fs = require('fs');
const util = require('./_generator-util');

const SUPPORT_PROP_TYPES = [
  'array',
  'bool',
  'func',
  'number',
  'object',
  'string',
  'node',
  'element',
  'arrayOf',
  'objectOf',
  'oneOf',
  'func',
  'any',
];

function splitProptypes(val) {
  return val.split(',').map((src) => {
    const params = src.split(':');
    const isRequire = params[2] === 'require';
    const propType = {
      name: params[0],
      type: params[1],
      require: isRequire,
    };
    if(propType.type !== undefined && SUPPORT_PROP_TYPES.every(
        (supportType) => propType.type.indexOf(supportType) === -1)) {
      console.error(`
      Abort.. ${propType.type} is invalid propType
      Look up https://facebook.github.io/react/docs/reusable-components.html
`);
      process.exit(1);
    }
    return propType;
  });
}

program
  .option('-p, --prop-types <propTypes>', 'Define propTypes', splitProptypes)
  .option('-c, --css-classes <cssClasses>', 'Define css class', (val) => val.split(','))
  .parse(process.argv);

const name = program.args[0];
const propTypes = program.propTypes;
const cssClasses = program.cssClasses;

if(name == undefined) {
  console.error('Abort.. [name] is required');
  process.exit(1);
}

const context = {
  className: changCase.pascalCase(name),
  directoryName: changCase.paramCase(name),
  cssClasses: cssClasses,
  propTypes: propTypes,
  pkg: require('../package.json'),
};

const GENERATE_FILES = [
  {
    from: path.join('src', 'component', 'component.jsx.njk'),
    to: path.join('src', 'components', context.directoryName, `${context.directoryName}.jsx`),
  },
  {
    from: path.join('src', 'component', 'README.md.njk'),
    to: path.join('src', 'components', context.directoryName, 'README.md'),
  },
  {
    from: path.join('src', 'component', 'style.scss.njk'),
    to: path.join('src', 'components', context.directoryName, 'style.scss'),
  },
  {
    from: path.join('src', 'stories', 'story.js.njk'),
    to: path.join('src', 'components', 'stories', `${context.directoryName}.jsx`),
  },
  {
    from: path.join('tests', 'test.js.njk'),
    to: path.join('test', 'components', context.directoryName, `${context.directoryName}_spec.jsx`),
  },
];

util.generate(GENERATE_FILES, context);

fs.appendFile(
  path.join(__dirname, '../', 'src', 'index.js'),
  `exports.${context.className} = require('${path.join("./", "components", context.directoryName, context.directoryName)}');`,
  'utf8',
  function (err) {
    console.log(err);
  }
);