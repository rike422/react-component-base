#!/usr/bin/env node

const process = require('process');
const program = require('commander');
const path = require('path');
const fs = require('fs');
const util = require('./_generator-util');
const TEMPLATE_FILES = [
  {
    from: path.join('.storybook', 'config.js.njk'),
    to: path.join('.storybook', 'config.js'),
  },
];

program.parse(process.argv);

const storyFiles = util.walkSync(path.join('src', 'components', 'stories'));
const context = {
  storyFilePaths: storyFiles.map((file) => path.relative('./.storybook', file)),
};

util.generate(TEMPLATE_FILES, context);
