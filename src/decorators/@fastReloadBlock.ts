import {yellow} from "colors/safe";
import {Observable} from "rxjs/Observable";

import "rxjs/add/observable/timer";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/debounce";

export default function FastReloadBlock(maxCalls: number, wait: number) {

    return function FastReloadingThrottleDecorator(target: any, property: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        let logInterval = null;

        const initialState = {calls: 0, lock: false};
        const call$ = Observable.create(obs => {
            descriptor.value = function (...args) {
                obs.next({context: this, args});
            };
        });

        call$.scan((state, call) => {
            if (state.lock) {
                return state;
            }

            let stCopy = {...state, ...call};
            stCopy.lock || stCopy.calls++;
            stCopy.lock = stCopy.calls % maxCalls === 0;

            if (stCopy.lock && !logInterval) {
                let interval = wait / 1000;
                console.warn(yellow(`Please wait ${interval} secs. for next reload to prevent your extension being blocked`));

                logInterval = setInterval(() => {
                    interval === 1 ? clearInterval(logInterval = null) : console.warn(yellow(`${--interval} ...`));
                }, 1000);
            }
            return stCopy;
        }, initialState)
            .debounce(state => Observable.timer(state.lock ? wait : 0))
            .subscribe(
                (state) => {
                    state.lock = false;
                    originalMethod.apply(state.context, state.args)
                },
                (err) => console.trace(err)
            );
    }
}


