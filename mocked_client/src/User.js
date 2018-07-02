import WebSocket from 'ws';
import MessageFactory from 'tbrtc-common/factory/MessageFactory';

class User {
    constructor(url, registry, id = null) {
        this.registry = registry;
        this.id = id;
        this.events = {};
        this.latestType = null;
        this.ws = new WebSocket(url, {
            perMessageDeflate: false,
        });
        this.ws.on('open', () => {
            console.log(`---- CONNECTED: ${this.constructor.name}${this.id !== null ? this.id : ''} ----`);
        });
        this.ws.on('message', (data) => {
            console.log(`${this.constructor.name}${this.id !== null ? this.id : ''} INCOMING:`);
            console.log(data);
            console.log('');
            const message = MessageFactory.createFromJson(data);
            this.doActions(message);
            this.latestType = message.type;
        });
    }

    doActions(message) {}

    doLater(callback, time = 1000) {
        setTimeout(callback, time);
    }

    on(eventName, callback) {
        this.events[eventName] = callback;
    }

    dispatch(eventName) {
        if (typeof this.events[eventName] !== 'undefined') {
            this.events[eventName]();
        }
    }

    send(data) {
        const stringified = JSON.stringify(data);
        this.ws.send(stringified);
        console.log(`${this.constructor.name}${this.id !== null ? this.id : ''} OUTGOING:`);
        console.log(stringified);
        console.log('');
    }
}

export default User;
