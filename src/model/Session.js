import { Session as SessionParent } from 'tbrtc-common/model/Session';
import { Unique } from 'tbrtc-common/utilities/array/Unique';

/**
 * @module tbrtc-server/model
 */

export class Session extends SessionParent {
    constructor(id, creator, members = []) {
        super(id, creator, members);
        this._requests = new Unique();
    }

    _setRepository(repository) {
        this._repository = repository;
    }

    save() {
        if (typeof this._repository !== 'undefined') {
            this._repository.update(this);
        }
    }

    newRequest(user) {
        this._requests.push(user);
    }

    hasRequest(user) {
        return this._requests.get(user.id) !== null;
    }

    removeRequest(user) {
        this._requests.remove(user.id);
    }

    get requests() {
        return this._requests.toArray();
    }

    static _createEmpty() {
        return new Session(null, null);
    }
}
