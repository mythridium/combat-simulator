import './styles.scss';
import { Main } from './main';

export function setup(context: Modding.ModContext) {
    new Main(context).init();
}
