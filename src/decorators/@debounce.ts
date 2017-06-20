import {debounce, runInContext} from "lodash";
import "rxjs/operator/debounceTime";

export default function debounceDecorator(debouncerFrame: number, context: any = null) {
    if (context) {
        runInContext(context);
    }

    return function (target: any, property: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = debounce(function (...args) {
            return originalMethod.apply(this, args);
        }, debouncerFrame);
    }
}

