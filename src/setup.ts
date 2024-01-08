import './styles.scss';
import { App } from './app/app';

export function setup(context: Modding.ModContext) {
    const app = new App(context);

    app.init();
}
