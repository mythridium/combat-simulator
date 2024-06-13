import { Global } from 'src/app/global';

export function LoadTemplate(template: string) {
    return function (_constructor: Function) {
        Global.templates.push(template);
    };
}
