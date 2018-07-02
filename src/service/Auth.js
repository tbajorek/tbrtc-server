import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import { User } from '../model/User';

/**
 * @module tbrtc-server/service
 */

export class Auth {
    isAuthorized(user) {
        ValueChecker.check({ user }, {
            user: {
                typeof: 'object',
                instanceof: User,
            },
        });
        return true;
    }
}
