import {Subject} from "rxjs/Subject";
import {blue, red, yellow} from "colors/safe";

import WebsocketServerFactory from "./WebsocketServerFactory";
import {FAST_RELOAD_CALLS, FAST_RELOAD_WAIT} from "../constants/fast-reloading.constants";
import {signChange} from "./signals";
import fastReloadBlock from "../decorators/@fastReloadBlock";

export default class HotReloaderServer {
    private _server$: Subject<any>;

    constructor(port: number) {
        this._server$ = WebsocketServerFactory.build(port);
    }

    listen() {
        this._server$.subscribe(
            event => console.info(blue(`Message from the client: ${JSON.parse(event.data).payload}`)),
            err => console.error(red(err)),
            () => console.warn(yellow('Connection closed'))
        );
    }

    @fastReloadBlock(FAST_RELOAD_CALLS, FAST_RELOAD_WAIT)
    signChange(reloadPage) {
        console.info(blue("\n[ Notifying changes to the extension ]"));
        this._server$.next(signChange({reloadPage}));
    }
}
