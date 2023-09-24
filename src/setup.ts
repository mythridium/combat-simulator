import { App } from './app/main';

export async function setup(context: Modding.ModContext) {
    new App(context);
}
