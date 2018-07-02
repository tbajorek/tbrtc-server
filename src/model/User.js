import { User as UserParent } from 'tbrtc-common/model/User';
import { Unique as UniqueArray } from 'tbrtc-common/utilities/array/Unique';

/**
 * @module tbrtc-server/model
 */

export class User extends UserParent {
    constructor(id, name = null, email = null, connectionId = null) {
        super(id, name, email, connectionId);
        this._connection = null;
        this._sessions = new UniqueArray();
    }

    _setRepository(repository) {
        this._repository = repository;
    }

    save() {
        if (typeof this._repository !== 'undefined') {
            this._repository.update(this);
        }
    }

    _setConnection(connection) {
        this._connection = connection;
        if (typeof connection.id !== 'undefined') {
            this._connectionId = connection.id;
        }
    }

    get connection() {
        return this._connection;
    }

    get sessions() {
        return this._sessions;
    }

    joinSession(session) {
        this._sessions.push(session);
    }

    leaveSession(session) {
        this._sessions.remove(session);
    }

    get connectionId() {
        return this._connectionId;
    }

    set connectionId(value) {
        if (this.connection === null) {
            this._connectionId = value;
        }
    }

    static fromParent(parentModel) {
        return new User(
            parentModel.id,
            parentModel.name,
            parentModel.email,
            parentModel.connectionId,
        );
    }

    static _createEmpty() {
        return new User(null, null, null, null);
    }
}
