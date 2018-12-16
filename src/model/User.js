import { User as UserParent } from 'tbrtc-common/model/User';
import { Unique as UniqueArray } from 'tbrtc-common/utilities/array/Unique';

/**
 * @module tbrtc-server/model
 */

export class User extends UserParent {
    constructor(id, name = null, surname=null, email = null, avatar = null, connectionId = null) {
        super(id, name, surname, email, avatar, connectionId);
        this._connection = null;
        this._sessions = new UniqueArray();
        this._token = null;
        this._securedFields = ['token'];
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

    get token() {
        return this._token;
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

    static fromJSON(input) {
        let object = super.fromJSON(input);
        if(!!input.token) {
            object._token = input.token;
        }
        console.log(input);
        return object;
    }

    static fromParent(parentModel) {
        const user = new User(
            parentModel.id,
            parentModel.name,
            parentModel.surname,
            parentModel.email,
            parentModel.avatar,
            parentModel.connectionId,
        );
        user._token = parentModel.token;
        return user;
    }

    static _createEmpty() {
        return new User(null);
    }
}
