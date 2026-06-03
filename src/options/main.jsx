import { render } from 'preact';
import { App } from '../App';
import { STYLE } from '../styles/styles';

// Inject main CRM stylesheet
const styleTag = document.createElement('style');
styleTag.textContent = STYLE;
document.head.appendChild(styleTag);

render(<App />, document.getElementById('app'));
