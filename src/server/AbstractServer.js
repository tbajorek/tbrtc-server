import Intro, { Line } from 'jscon-intro';
import BadParamType from 'tbrtc-common/exceptions/BadParamType';
import { Message } from 'tbrtc-common/messages/Message';
import { Session as SessionMessage } from 'tbrtc-common/messages/Session';
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import { Unique as UniqueArray } from 'tbrtc-common/utilities/array/Unique';
import MessageFactory from 'tbrtc-common/factory/MessageFactory';
import { User as UserMessage } from 'tbrtc-common/messages/User';
import { Error as ErrorMessage } from 'tbrtc-common/messages/result/Error';
import { Success as SuccessMessage } from 'tbrtc-common/messages/result/Success';
import ClassWithEvents from 'tbrtc-common/event/ClassWithEvents';
import Event from 'tbrtc-common/event/Event';
import EventContainer from 'tbrtc-common/event/EventContainer';
import InMemoryAbstract from '../repository/InMemoryAbstract';
import { User } from '../model/User';
import { Session } from '../model/Session';
import { Auth } from '../service/Auth';
import { Connection } from '../model/Connection';

const uuidv4 = require('uuid');
const colors = require('colors/safe');

/**
 * @module tbrtc-server/server
 */

/**
 * Abstract signaling server
 */
class AbstractServer extends ClassWithEvents {
    /**
     * Initialize abstract signaling server
     * @param {object} config Configuration object
     */
    constructor(config) {
        super();
        /**
         * Session repository
         * @type {InMemoryAbstract}
         * @protected
         */
        this._sessions = new AbstractServer.SessionRepository();
        /**
         * User repository
         * @type {InMemoryAbstract}
         * @protected
         */
        this._users = new AbstractServer.UserRepository();
        /**
         * Connection repository
         * @type {InMemoryAbstract}
         * @protected
         */
        this._connections = new AbstractServer.ConnectionRepository();
        if (typeof config !== 'object') {
            throw new BadParamType('config', 'AbstractServer.constructor', 'object');
        }
        /**
         * Server configuration
         * @type {Object}
         * @protected
         */
        this._config = config;
        /**
         * Optional internal signaling server instance
         * @type {Object|null}
         * @protected
         */
        this._server = null;
        /**
         * Auth service
         * @type {Auth}
         * @protected
         */
        this._authService = new AbstractServer.AuthService();
    }

    /**
     * Return built-in events
     * @returns {string[]} Built-in events
     */
    get builtInEvents() {
        return [
            'server.started',
            'server.stopped',
            'connection.opened',
            'connection.closed',
            'session.checked',
            'session.created',
            'session.requested.before',
            'session.requested',
            'session.stopped',
            'session.joined',
            'session.rejected',
            'session.left',
            'session.disconnected',
            'session.closed',
            'user.checked',
            'user.connected',
            'user.disconnected',
            'message.received',
            'message.sent',
        ];
    }

    /**
     * Start the sever
     */
    start() {
        if (this._server === null) {
            this._server = this._getServer();
        }
        this._displayIntro();
        this.dispatch('server.started', { server: this._server });
    }

    /**
     * Stop the server
     */
    stop() {
        this.dispatch('server.stopped');
    }

    /**
     * Send a message to all connected users
     * @param {Message} message Message object
     */
    sendToAll(message) {
        ValueChecker.check({ message }, {
            message: {
                required: true,
                instanceof: Message,
            },
        });
        this.sendToUsers(message, this.users);
    }

    /**
     * Send a message to all users who joined to specified sessions
     * @param {Message} message Message to be sent
     * @param {Session[]} sessions Array of session objects
     */
    sendToSessions(message, sessions = []) {
        ValueChecker.check({ sessions, message }, {
            sessions: {
                typeof: 'array',
                elements: {
                    required: true,
                    instanceof: Session,
                },
                required: true,
            },
            message: {
                required: true,
                instanceof: Message,
            },
        });
        const users = new UniqueArray();
        sessions.forEach((session) => {
            session.members.forEach((user) => {
                users.push(user);
            });
        });
        this.sendToUsers(message, users.toArray());
    }

    /**
     * Send message to specified users
     * @param {Message} message Message to be sent
     * @param {User[]} users Array of users
     */
    sendToUsers(message, users = []) {
        if (!Array.isArray(users)) {
            users = [users];
        }
        ValueChecker.check({ users, message }, {
            users: {
                typeof: 'array',
                elements: {
                    required: true,
                    instanceof: User,
                    typeof: 'object',
                },
                required: true,
            },
            message: {
                required: true,
                instanceof: Message,
            },
        });
        users.forEach((user) => {
            this._sendMessage(message, user);
        });
    }

    _displayIntro() {
        const intro = new Intro();
        intro._displayMethod = (input) => {
            console.log(colors.green(input));
        };
        intro.addLine(Line.EMPTY);
        const version = __VERSION__;
        intro.addLine(`'tbrtc-server v${version}'`);
        intro.addLine('created by Tomasz Bajorek <tbajorek3@gmail.com>');
        intro.addLine(Line.EMPTY);
        intro.addLine('This is basic server. It can be extended.');
        intro.addLine('For more information please visit: http://github.com/tbajorek/tbrtc-server');
        intro.addLine(Line.EMPTY);
        intro.display();
    }

    /**
     * Produce Message object from JSON data. Event 'message.received' is dispatched.
     * @param {Object} jsonMessage JSON object with message data
     * @protected
     */
    _receiveMessage(jsonMessage, connection) {
        const message = MessageFactory.createFromJson(jsonMessage);
        this.dispatch('message.received', { message });
        if (message.type === 'user.connect') {
            return this._userConnect(User.fromParent(message.user), connection);
        }
        console.log(message);
        if (typeof message.user !== 'object' || message.user === null) {
            this._send(
                connection,
                new ErrorMessage(
                    ErrorMessage.codes.USER_NOT_FOUND,
                    null,
                    { uname: '<undefined>' },
                ),
            );
            return null;
        }
        const user = message.user.id !== null ? this.users.get(message.user.id) : null;
        if (user === null) {
            this._send(
                connection,
                new ErrorMessage(
                    ErrorMessage.codes.USER_NOT_FOUND,
                    null,
                    { uname: message.user.name },
                ),
            );
            return null;
        }
        switch (message.type) {
        case 'session.new':
            this._sessionNew(user, connection);
            break;
        case 'session.request':
            this._sessionRequest(message, user, connection);
            break;
        case 'session.stop':
            this._sessionStop(message.sessionId, user, connection);
            break;
        case 'session.confirm':
            this._sessionConfirm(message.sessionId, user, connection);
            break;
        case 'session.reject':
            this._sessionReject(message.sessionId, user, connection);
            break;
        case 'sdp.transfer':
            this._sdpReceived(message, connection);
            break;
        case 'ice.candidate':
            this._iceReceived(message, connection);
            break;
        case 'session.leave':
            this._sessionLeave(message.sessionId, user, connection);
            break;
        default:
            break;
        }
        return true;
    }

    /**
     *
     * @param connection
     * @param request
     * @protected
     */
    _connectionOpened(connection, request) {
        const connectionModel = new Connection(this._getNewIdentifier(), connection, request);
        this._connections.add(connectionModel);
        this.dispatch('connection.opened', { connection: connectionModel });
        const user = new User(this._getNewIdentifier());
        user.connectionId = connectionModel.id;
        const message = new UserMessage('user.init', user);
        this._send(connection, message);
        connectionModel.user = user;
        this._connections.update(connectionModel);
        return connectionModel.id;
    }

    /**
     *
     * @param {User} user
     * @param sourceConnection
     * @protected
     */
    _userConnect(user, sourceConnection) {
        const { checked, message } = this.dispatch('user.checked', {
            checked: true,
            message: null,
        });
        if (checked) {
            const connection = this._connections.get(user.connectionId);
            if (connection === null) {
                this._send(
                    sourceConnection,
                    new ErrorMessage(
                        ErrorMessage.codes.CONN_NOT_FOUND,
                        null,
                        { connid: user.connectionId },
                    ),
                );
                return;
            }
            connection.user = user;
            this.users.add(user);
            this._connections.update(connection);
            this.dispatch(
                'user.connected',
                { user },
            );
            this.sendToUsers(new SuccessMessage('User {uname} has been connected', null, { uname: user.name, user }), user);
        } else {
            if (message !== null) {
                this.sendToUsers(message, user);
            }
            this._userDisonnect(user);
        }
    }

    /**
     *
     * @param {User} user
     * @protected
     */
    _sessionNew(user, sourceConnection) {
        const session = new Session(this._getNewIdentifier(), user);
        const { checked, message } = this.dispatch('session.checked', {
            user,
            checked: true,
            message: null,
        });
        if (checked) {
            this.sessions.add(session);
            this.users.update(user);
            this.sendToUsers(new SessionMessage('session.new', session.id, user), user);
            this.dispatch(
                'session.created',
                { session },
            );
        } else if (message !== null) {
            this.sendToUsers(message, user);
        }
    }

    /**
     *
     * @param {SessionMessage} sessionMessage 'session.request' message object
     * @private
     */
    _sessionRequest(sessionMessage, user, sourceConnection) {
        const session = this._findSession(sessionMessage.sessionId, sourceConnection);
        if (session === null) {
            return;
        }
        const { checked, message } = this.dispatch('session.requested.before', {
            user,
            session,
            checked: true,
            message: Message._createEmpty(),
        });
        if (checked) {
            if (!session.hasMember(user)) {
                session.newRequest(user);
                this.sessions.update(session);
                switch (this.config.confirmType) {
                case 'creator':
                    this.sendToUsers(sessionMessage, session.creator);
                    this.dispatch(
                        'session.requested',
                        { session },
                    );
                    break;
                case 'members':
                    this.sendToUsers(sessionMessage, session.members);
                    this.dispatch(
                        'session.requested',
                        { session },
                    );
                    break;
                default:
                    this.dispatch(
                        'session.requested',
                        { session },
                    );
                    // auto-confirm
                    this._sessionConfirm(session.id, user.id, sourceConnection);
                }
            } else {
                this.sendToUsers(
                    new ErrorMessage(
                        ErrorMessage.codes.DOUBLE_SESS_MEMB,
                        null,
                        { uname: user.name, sessid: session.id },
                    ),
                    user,
                );
            }
        } else if (message !== null) {
            this.sendToUsers(message, user);
        }
    }

    _sessionConfirm(sessionId, user, sourceConnection) {
        const session = this._findSession(sessionId, sourceConnection);
        if (session === null) {
            this._send(
                sourceConnection,
                new ErrorMessage(
                    ErrorMessage.codes.SESS_NOT_FOUND,
                    null,
                    { sessid: sessionId },
                ),
            );
            return;
        }
        if (!session.hasRequest(user)) {
            this._send(
                sourceConnection,
                new ErrorMessage(
                    ErrorMessage.codes.REQ_NOT_FOUND,
                    null,
                    { uname: user.name },
                ),
            );
            return;
        }
        session.removeRequest(user);
        const members = session.members.slice();
        const member = session.join(user);
        this.sendToUsers(
            new SessionMessage('session.confirm', sessionId, user),
            members,
        );
        this.sessions.update(session);
        this.users.update(member);
        this.dispatch(
            'session.joined',
            { session, user },
        );
        this.sendToUsers(
            new SessionMessage('session.data', sessionId, null, { session }),
            user,
        );
    }

    _sessionReject(sessionId, user, sourceConnection) {
        const session = this._findSession(sessionId, sourceConnection);
        if (session === null) {
            return;
        }
        session.removeRequest(user);
        this.sessions.update(session);
        this.sendToUsers(
            new SessionMessage('session.reject', sessionId, user),
            user,
        );
        this.dispatch(
            'session.rejected',
            { session, user },
        );
    }

    _sessionStop(sessionId, user, sourceConnection) {
        const session = this._findSession(sessionId, sourceConnection);
        if (session === null) {
            return;
        }
        session.removeRequest(user);
        this.sessions.update(session);
        this.sendToUsers(
            new SessionMessage('session.stop', sessionId, user),
            user,
        );
        this.dispatch(
            'session.stopped',
            { session, user },
        );
    }

    _sdpReceived(message, sourceConnection) {
        const session = this.sessions.get(message.sessionId);
        if (session === null) {
            this._send(
                sourceConnection,
                new ErrorMessage(
                    ErrorMessage.codes.SESS_NOT_FOUND,
                    null,
                    { sessid: message.sessionId },
                ),
            );
            return;
        }
        this.sendToUsers(message, session.members);
    }

    _iceReceived(message, sourceConnection) {
        const session = this.sessions.get(message.sessionId);
        if (session === null) {
            this._send(
                sourceConnection,
                new ErrorMessage(
                    ErrorMessage.codes.SESS_NOT_FOUND,
                    null,
                    { sessid: message.sessionId },
                ),
            );
            return;
        }
        this.sendToUsers(message, session.members);
    }

    _sessionLeave(sessionId, user, sourceConnection, messageType = 'session.leave') {
        const session = this._findSession(sessionId, sourceConnection);
        if (session === null) {
            return;
        }
        const members = session.members.slice();

        // normal user
        this.sendToUsers(
            new SessionMessage(messageType, sessionId, user),
            members,
        );
        const member = session.leave(user.id);
        this.sessions.update(session);
        this.users.update(member);
        if (messageType === 'session.disconnect') {
            this.dispatch(
                'session.disconnected',
                { session, user },
            );
        } else {
            this.dispatch(
                'session.left',
                { session, user },
            );
        }
        if (session.isCreator(user)) {
            // creator user
            this._sessionClose(sessionId, user, sourceConnection);
        }
    }

    _sessionClose(sessionId, user, sourceConnection) {
        const session = this._findSession(sessionId, sourceConnection);
        if (session === null) {
            return;
        }
        if (user.id !== session.creator.id) {
            this.sendToUsers(
                ErrorMessage.codes.PERM_REQ,
                null,
                { uname: user.name, sessionId, aname: 'session.close' },
            );
        }
        const members = session.members.slice();
        for (const member of members) {
            this._sessionLeave(sessionId, member);
        }
        this.sessions.remove(session);
        this.dispatch(
            'session.closed',
            { session },
        );
    }

    /**
     *
     * @param {string} sessionId
     * @param {Object/null} sourceConnection
     * @returns {Session}
     * @private
     */
    _findSession(sessionId, sourceConnection = null) {
        const session = this.sessions.get(sessionId);
        if (session === null && sourceConnection !== null) {
            this._send(
                sourceConnection,
                new ErrorMessage(
                    ErrorMessage.codes.SESS_NOT_FOUND,
                    null,
                    { sessid: sessionId },
                ),
            );
        }
        return session;
    }

    /**
     *
     * @param {User} user
     * @param sourceConnection
     * @protected
     */
    _userDisonnect(user, sourceConnection = null) {
        const foundUser = this.users.get(user);
        if (foundUser === null) {
            if (sourceConnection !== null) {
                this._send(
                    sourceConnection,
                    new ErrorMessage(
                        ErrorMessage.codes.USER_NOT_FOUND,
                        null,
                        { uname: { uname: user.id } },
                    ),
                );
                return;
            }
        }

        for (const session of user.sessions) {
            this._sessionLeave(session.id, user, sourceConnection, 'session.disconnect');
        }
        this.users.remove(user);
        this.dispatch('user.disconnected', {
            user,
        });
    }

    _userLost(user) {
        const { connection } = user;
        for (const session of user.sessions) {
            this._sessionLeave(session.id, user, connection, 'session.disconnect');
        }
        this.users.remove(user);
        this.dispatch('user.disconnected', {
            user,
        });
        return connection.terminate();
    }

    /**
     *
     * @param connectionId
     * @protected
     */
    _connectionClosed(connectionId) {
        const foundUser = this.users.get(connectionId, 'connectionId');
        if (foundUser !== null) {
            this._userDisonnect(foundUser);
        }
        this.dispatch('connection.closed', {
            connectionId,
        });
    }

    /**
     * Send the message to the specified user
     * @param {Message} message Message object
     * @param {User} user User object
     * @protected
     */
    _sendMessage(message, user) {
        ValueChecker.check({ user, message }, {
            user: {
                instanceof: User,
                required: true,
            },
            message: {
                required: true,
                instanceof: Message,
            },
        });
        this._send(user.connection, message);
        this.dispatch('message.sent', { message, user });
    }

    /**
     * Send message through the given connection
     * @param {Object} connection Connection object
     * @param {Message} message Message object
     * @protected
     * @abstract
     */
    _send(connection, message) {

    }

    /**
     *
     * @returns {InMemoryAbstract}
     */
    get sessions() {
        return this._sessions;
    }

    get users() {
        return this._users;
    }

    get events() {
        return this._events;
    }

    get config() {
        return this._config;
    }

    dispatch(eventName, params) {
        return this.dispatch(eventName, { ...params, server: this });
    }

    _getServer() {
        return null;
    }

    _getNewIdentifier() {
        return uuidv4();
        // return 'test';
    }
}

/**
 * Set used event container
 * @type {EventContainer}
 */
AbstractServer.EventContainer = EventContainer;
/**
 * Set used session repository
 * @type {InMemoryAbstract}
 */
AbstractServer.SessionRepository = InMemoryAbstract;
/**
 * Set used user repository
 * @type {InMemoryAbstract}
 */
AbstractServer.UserRepository = InMemoryAbstract;
/**
 * Set used connection repository
 * @type {InMemoryAbstract}
 */
AbstractServer.ConnectionRepository = InMemoryAbstract;
/**
 * Set used auth service
 * @type {Auth}
 */
AbstractServer.AuthService = Auth;

export default AbstractServer;
