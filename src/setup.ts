import './styles.scss';
import { Global } from './app/global';
import { Main } from './app/main';

export async function setup(context: Modding.ModContext) {
    Global.context = context;

    await Main.init();
}
