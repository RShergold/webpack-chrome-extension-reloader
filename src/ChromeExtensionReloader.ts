import AbstractChromePluginReloader from "./webpack/AbstractPlugin";
import HotReloaderServer from "./utils/HotReloaderServer";
import middlewareSourceBuilder from "./utils/middleware-source-builder";
import middlewareInjector from "./utils/middleware-injector";
import {green} from "colors/safe";

import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/share";

import {Observable} from "rxjs/Observable";
import {DEBOUNCING_FRAME} from "./constants/fast-reloading.constants";

export default class ChromeExtensionReloader extends AbstractChromePluginReloader {
    private _opts: PluginOptions;
    private _source: string;
    private _hash: string;

    constructor(options?: PluginOptions) {
        super();
        this._hash = '';
        this._opts = {reloadPage: true, port: 9090, ...options};
        this._opts.entries = {contentScript: 'contentScript', background: 'background', ...this._opts.entries};

        this._source = middlewareSourceBuilder({
            port: this._opts.port,
            reloadPage: this._opts.reloadPage
        });
    }

    apply(compiler) {
        const {port, reloadPage} = this._opts;
        compiler.plugin("compilation", compilation => middlewareInjector(compilation, this._source));

        console.info(green("[ Starting the Chrome Hot Plugin Reload Server... ]"));
        const server = new HotReloaderServer(port);
        server.listen();

        let compilation$ = Observable.create(obs => compiler.plugin("emit", (comp, call) => {
            call();
            obs.next(comp);
        }));

        compilation$
            .distinctUntilChanged((prev, curr) => prev.hash === curr.hash)
            .debounceTime(DEBOUNCING_FRAME)
            .subscribe(() => server.signChange(reloadPage));
    }
}
