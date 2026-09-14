/**
 * Stand-in for `import Icon from './icon.svg'` under Jest — Metro's SVG
 * transformer doesn't run in tests, so imports resolve to a plain component.
 */
const React = require('react');

module.exports = {
  __esModule: true,
  default: props => React.createElement('SvgMock', props),
};
