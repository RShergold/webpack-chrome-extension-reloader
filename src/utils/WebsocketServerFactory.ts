import {OPEN, Server} from "ws";
import {Subscriber} from "rxjs/Subscriber";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

export default class WebsocketServerFactory {
    static build(port: number) {
        const wss: Server = new Server({port});

        const observable = Observable.create(function (obs) {
            wss.on("connect", () => wss.on("message", obs.next.bind(obs)));
            wss.on("error", obs.error.bind(obs));
            wss.on("close", obs.complete.bind(obs));

            return wss.close.bind(wss);
        });

        const observer = Subscriber.create(function (msg) {
            wss.clients.forEach(client => {
                if (client.readyState === OPEN) {
                    client.send(JSON.stringify(msg));
                }
            });
        });

        return Subject.create(observer, observable);
    }
}