import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import { User } from './User';
import { Session } from './Session';

class MessageTarget
{
    constructor(user, session = null) {
        ValueChecker.check({ user, session }, {
            user: {
                required: true,
                instanceof: User,
            },
            session: {
                typeof: ['object', 'null'],
                instanceof: Session,
            },
        });
        this._user = user;
        this._session = session;
    }

    get user() {
        return this._user;
    }

    get session() {
        return this._session;
    }
}

export default MessageTarget;
