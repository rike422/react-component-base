import { configure } from '@kadira/storybook';

function loadStories() {
  console.log("load ")
  require('../src/components/stories/button')
  // require as many stories as you need.
}

configure(loadStories, module);