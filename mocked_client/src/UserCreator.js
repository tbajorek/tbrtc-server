import User from './User';

import userConnectMessage from './messages/user.connect';
import sessionNewMessage from './messages/session.new';
import sessionConfirmMessage from './messages/session.confirm';
import sessionRejectMessage from './messages/session.reject';
import sessionLeaveMessage from './messages/session.leave';
import sessionRequestMessage from './messages/session.request';

class UserCreator extends User {
    constructor(url, registry, id = null) {
        super(url, registry, id);
        this.rejectFlag = false;
    }
    doActions(message) {
        switch (message.type) {
        case 'user.init':
            this.user = message.user;
            return this.doLater(() => {
                this.send(this.connectUserMessage());
            });
        case 'success':
            if (this.latestType === 'user.init') {
                this.user = message.details.user;
                return this.doLater(() => {
                    this.send(this.createSessionMsg());
                });
            }
            break;
        case 'session.new':
            this.sessionId = message.sessionId;
            this.registry.sessionId = this.sessionId;
            this.dispatch('session.new');
            break;
        case 'session.request':
            this.userRequested = message.user;
            return this.doLater(() => {
                if (this.rejectFlag === true) {
                    this.send(this.rejectSessionMsg());
                } else {
                    this.send(this.confirmSessionMsg());
                }
            });
        default:
            break;
        }
        return null;
    }

    rejected(flag) {
        this.rejectFlag = flag;
    }

    connectUserMessage() {
        return {
            ...userConnectMessage,
            user: {
                ...userConnectMessage.user,
                name: sessionRequestMessage.user.name + this.id,
                connectionId: this.user.connectionId,
            },
        };
    }

    createSessionMsg() {
        return {
            ...sessionNewMessage,
            user: {
                ...sessionNewMessage.user,
                name: sessionRequestMessage.user.name + this.id,
                id: this.user.id,
                connectionId: this.user.connectionId,
            },
        };
    }

    confirmSessionMsg() {
        return {
            ...sessionConfirmMessage,
            sessionId: this.sessionId,
            user: {
                id: this.userRequested.id,
                name: this.userRequested.name,
                email: this.userRequested.email,
                sdp: this.userRequested.sdp,
                connectionId: this.user.connectionId,
            },
        };
    }

    rejectSessionMsg() {
        return {
            ...sessionRejectMessage,
            sessionId: this.sessionId,
            user: {
                id: this.userRequested.id,
                name: this.userRequested.name,
                email: this.userRequested.email,
                sdp: this.userRequested.sdp,
                connectionId: this.user.connectionId,
            },
        };
    }

    leaveSessionMsg() {
        return {
            ...sessionLeaveMessage,
            sessionId: this.registry.sessionId,
            name: sessionRequestMessage.user.name + this.id,
            user: {
                ...sessionLeaveMessage.user,
                id: this.user.id,
                connectionId: this.user.connectionId,
            },
        };
    }
}

export default UserCreator;
