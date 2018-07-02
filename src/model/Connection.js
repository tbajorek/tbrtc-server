import { AbstractModel } from 'tbrtc-common/model/AbstractModel';

/**
 * @module tbrtc-server/model
 */

export class Connection extends AbstractModel {
    /**
     *
     * @param {string} id Connection identifier
     * @param {object} original WS connection object
     * @param {object} request Request object
     */
    constructor(id, original, request) {
        super();
        this._id = id;
        this._original = original;
        this._request = request;
        this._user = null;
    }

    get _serializedMap() {
        return {
            id: '_id',
            original: '_original',
            request: '_request',
            user: '_user',
        };
    }

    static _createEmpty() {
        return new Connection(null, null, null);
    }

    get id() {
        return this._id;
    }

    get original() {
        return this._original;
    }

    get request() {
        return this._request;
    }

    get user() {
        return this._user;
    }

    set user(value) {
        this._user = value;
        value._setConnection(this);
    }

    send(message) {
        if (this.original !== null && this.original.readyState === this.original.OPEN) {
            return this.original.send(message);
        }
        return null;
    }
}
