import { render } from 'preact';
import { App } from '../App';
import { STYLE } from '../styles/styles';
import config from '../config.json';

// Inject main CRM stylesheet
const styleTag = document.createElement('style');
styleTag.textContent = STYLE;
document.head.appendChild(styleTag);

document.title = `${config.appName} Standalone`;

render(<App />, document.getElementById('app'));
