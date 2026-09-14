/**
 * Lets TypeScript understand `import Logo from './logo.svg'`.
 * The runtime side of this is react-native-svg-transformer, wired up in
 * metro.config.js.
 */
declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}
