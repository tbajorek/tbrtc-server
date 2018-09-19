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

    /**
     * It joins a new user to the session
     *
     * @param {User} user User who is joining to the session
     * @return {boolean}
     */
    join(user) {
        if(super.join(user)) {
            user.joinSession(this);
            return true;
        }
        return false;
    }

    /**
     * It removes a user with passed identifier from a set of session members
     *
     * @param {string} userId User identifier
     * @return {User|null}
     */
    leave(userId) {
        const member = super.leave(userId);
        if(member !== null) {
            member.leaveSession(this.id);
            return member;
        }
        return null;
    }

    get requests() {
        return this._requests.toArray();
    }

    static _createEmpty() {
        return new Session(null, null);
    }
}
