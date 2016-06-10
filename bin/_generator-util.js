#!/usr/bin/env node

const process = require('process');
const nunjucks = require('nunjucks');
const program = require('commander');
const changCase = require('change-case');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const TEMPLATE_PATH = path.join(__dirname, '../', 'templates');
const mkdirp = require('mkdirp');

nunjucks.configure({
  trimBlocks: true,
  lstripBlocks: true
})

function render(template, context) {
  return new Promise(function(resolve) {
    nunjucks.render(path.join(TEMPLATE_PATH, template.from), context, (err, content) => {
      if(err != null) {
        console.error(err);
        process.exit(1);
      }
      mkdir(template.to);
      writeFile(template.to, content);
      resolve();
    });
  });
}

function resolveConflict(_template) {
  return inquirer.prompt({
    type: 'expand',
    name: 'choice',
    message: `Overwrite ${_template.to}? (enter "h" for help) [Ynaqh]`,
    choices: [
      {
        key: 'y',
        name: 'yes, overwrite',
        value: 'overwrite',
      },
      {
        key: 'a',
        name: 'all, Overwrite this one and all next',
        value: 'overwrite_all',
      },
      {
        key: 'n',
        name: 'no, do not overwrite',
        value: 'no',
      },
      new inquirer.Separator(),
      {
        key: 'q',
        name: 'Quit this process',
        value: 'quit',
      },
    ],
  }).then((answer) => answer);
}

function mkdir(outputPath, cb) {
  mkdirp(path.join(__dirname, '../', path.dirname(outputPath)));
}

function writeFile(path, content) {
  console.log(`write ${path}`);
  fs.writeFile(path, content);
}

module.exports = {
  walkSync: function(dir) {
    const dirFiles = fs.readdirSync(dir);
    const files = dirFiles.map((file) => {
      if(fs.statSync(path.join(dir, file)).isDirectory()) {
        return walkSync(path.join(dir, file));
      } else {
        return path.join(dir, file);
      }
    });
    return Array.prototype.concat.apply([], files);
  },

  generate: function(files, context) {
    files.reduce((promise, template) => {
      return promise.then((answerHistory) => {
        var answerHistory = answerHistory || [];
        if(fs.existsSync(template.to) && (answerHistory.every((history) => history !== 'overwrite_all'))) {
          return resolveConflict(template).then((answer) => {
            answerHistory.push(answer.choice);
            switch (answer.choice) {
              case 'overwrite':
              case 'overwrite_all':
                return render(template, context).then(() => Promise.resolve(answerHistory));
              case 'no':
                return Promise.resolve(answerHistory);
              case 'quit':
                console.log('Aborting...');
                process.exit(0);
                break;
            }
          });
        }
        return render(template, context).then(() => Promise.resolve(answerHistory));
      });
    }, Promise.resolve([])).catch(console.error);
  }
}
