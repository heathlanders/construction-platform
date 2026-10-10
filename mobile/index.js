// Local entry point. In a hoisted monorepo `expo/AppEntry.js` lives in the
// repo-root node_modules, so its `import App from '../../App'` resolves to the
// wrong path. Registering here resolves App from this package directly.
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
