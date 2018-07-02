import User from './User';
import sessionRequestMessage from './messages/session.request';
import sessionLeaveMessage from './messages/session.leave';
import userConnectMessage from './messages/user.connect';

class UserNormal extends User
{
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
                    this.send(this.requestSessionMsg());
                });
            }
            break;
        case 'session.data':
            this.dispatch('session.data');
            break;
        default:
            break;
        }
        return null;
    }

    requestSessionMsg() {
        return {
            ...sessionRequestMessage,
            sessionId: this.registry.sessionId,
            user: {
                ...sessionRequestMessage.user,
                name: sessionRequestMessage.user.name+this.id,
                id: this.user.id,
                connectionId: this.user.connectionId,
            },
        };
    }

    leaveSessionMsg() {
        return {
            ...sessionLeaveMessage,
            sessionId: this.registry.sessionId,
            user: {
                ...sessionLeaveMessage.user,
                name: sessionRequestMessage.user.name+this.id,
                id: this.user.id,
                connectionId: this.user.connectionId,
            },
        };
    }

    connectUserMessage() {
        return {
            ...userConnectMessage,
            user: {
                ...userConnectMessage.user,
                name: sessionRequestMessage.user.name+this.id,
                connectionId: this.user.connectionId,
            },
        };
    }
}

export default UserNormal;
