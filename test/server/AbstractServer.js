import AbstractServer from '../../src/server/AbstractServer';
import sinon from 'sinon';
import { assert } from 'chai';
import {User} from "../../src/model/User";
import {Message} from "tbrtc-common/messages/Message";
import {Session} from "../../src/model/Session";
import {Connection} from "../../src/model/Connection";
import {Sdp} from "tbrtc-common/model/Sdp";
import {IceCandidate} from "tbrtc-common/model/IceCandidate";

const user1 = new User('1', '', '', '', '', '1');
const user2 = new User('2', '', '', '', '', '2');
const user3 = new User('3', '', '', '', '', '3');
const user4 = new User('4', '', '', '', '', '4');
const session1 = new Session('2', user1, [user2]);
const session2 = new Session('3', user3, [user4]);
const message1 = new Message('message');
const connection1 = new Connection('1', {}, null);
const connection2 = new Connection('2', {}, null);
let session3 = 'ok';

const abstractServer = new AbstractServer({confirmType: 'auto'});


describe('server > AbstractServer', function() {
    describe('#start()', function() {
        it('should start the server', function() {
            const displayIntroStub = sinon.stub(abstractServer, '_displayIntro');// wyłączenie komunikatu
            const getServerStub = sinon.stub(abstractServer, '_getServer');
            getServerStub.returns({});
            const serverStartedSpy = sinon.spy();
            abstractServer.on('server.started', serverStartedSpy);
            abstractServer.start();
            assert.isTrue(getServerStub.called);
            assert.isTrue(serverStartedSpy.calledOnce);
            assert.isTrue(displayIntroStub.calledOnce);
            abstractServer._displayIntro.restore();
        });
    });

    describe('#_sendMessage()', function() {
        it('should send a message to specific user', function() {
            const sendSpy = sinon.spy(abstractServer, '_send');
            const sendMessageSpy = sinon.spy();
            abstractServer.on('message.sent', sendMessageSpy);
            abstractServer._sendMessage(message1, user1);
            assert.isTrue(sendSpy.calledOnce);
            assert.isTrue(sendMessageSpy.calledOnce);
            abstractServer._send.restore();
        });
    });

    describe('#sendToUsers()', function() {
        it('should send a message to set of users', function() {
            const sendSpy = sinon.spy(abstractServer, '_send');
            const sendMessageSpy = sinon.spy();
            abstractServer.on('message.sent', sendMessageSpy);
            abstractServer.sendToUsers(message1, [user1, user1, user1]);
            assert.isTrue(sendSpy.calledThrice);
            assert.isTrue(sendMessageSpy.calledThrice);
            abstractServer._send.restore();
        });
    });

    describe('#sendToSessions()', function() {
        it('should send a message to members of one session', function() {
            const sendSpy = sinon.spy(abstractServer, '_send');
            const sendMessageSpy = sinon.spy();
            abstractServer.on('message.sent', sendMessageSpy);
            abstractServer.sendToSessions(message1, [session1]);
            assert.isTrue(sendSpy.calledTwice);
            assert.isTrue(sendMessageSpy.calledTwice);
            abstractServer._send.restore();
        });

        it('should send a message to members of many sessions', function() {
            const sendSpy = sinon.spy(abstractServer, '_send');
            const sendMessageSpy = sinon.spy();
            abstractServer.on('message.sent', sendMessageSpy);
            abstractServer.sendToSessions(message1, [session1, session2]);
            assert.equal(sendSpy.callCount, 4);
            assert.equal(sendMessageSpy.callCount, 4);
            abstractServer._send.restore();
        });
    });

    describe('#_receiveMessage()', function() {
        it('should receive a message', function() {
            const messageReceivedSpy = sinon.spy();
            abstractServer.on('message.received', messageReceivedSpy);
            abstractServer._receiveMessage(JSON.stringify(message1.toJSON()), connection1);
            assert.isTrue(messageReceivedSpy.calledOnce);
        });
    });

    describe('#_receiveMessage(user.connect)', function() {
        const userCheckedSpy = sinon.spy();
        const userConnectedSpy = sinon.spy();
        connection1.id = abstractServer._connectionOpened(connection1, {});
        user1.connectionId = connection1.id;
        connection2.id = abstractServer._connectionOpened(connection2, {});
        user2.connectionId = connection2.id;
        abstractServer.on('user.checked.success', userCheckedSpy);
        abstractServer.on('user.connected', userConnectedSpy);
        const message1 = new Message('user.connect', null, user1);
        const message2 = new Message('user.connect', null, user2);
        abstractServer._receiveMessage(JSON.stringify(message1.toJSON()), connection1);
        abstractServer._receiveMessage(JSON.stringify(message2.toJSON()), connection2);

        it('should check user', function() {
            assert.isTrue(userCheckedSpy.calledTwice);
        });

        it('should connect user', function() {
            assert.isTrue(userConnectedSpy.calledTwice);
        });
    });

    describe('#_receiveMessage(session.new)', function() {
        const sessionCheckedStub = sinon.stub();
        sessionCheckedStub.callsFake(function fakeFn(obj) {
            return obj;
        });
        const sessionCreatedStub = sinon.stub();
        sessionCreatedStub.callsFake(function fakeFn(e) {
            session3 = e.data.session;
        });
        abstractServer.on('session.checked', sessionCheckedStub);
        abstractServer.on('session.created', sessionCreatedStub);
        const message = new Message('session.new', null, user1);
        const result = abstractServer._receiveMessage(JSON.stringify(message.toJSON()), connection1);

        it('should perform the message correctly', function() {
            assert.isTrue(result);
        });

        it('should check user rights', function() {
            assert.isTrue(sessionCheckedStub.calledOnce);
        });

        it('should create a new session', function() {
            assert.isTrue(sessionCreatedStub.calledOnce);
        });
    });

    describe('#_receiveMessage(session.request)', function() {
        const sessionRequestedBefStub = sinon.stub();
        const sessionJoinSpy = sinon.spy();
        sessionRequestedBefStub.callsFake(function fakeFn(obj) {
            return obj;
        });
        const sessionRequestedSpy = sinon.spy();
        abstractServer.on('session.requested.before', sessionRequestedBefStub);
        abstractServer.on('session.requested', sessionRequestedSpy);
        abstractServer.on('session.joined', sessionJoinSpy);
        const message = new Message('session.request', session3.id, user2);
        abstractServer._receiveMessage(JSON.stringify(message.toJSON()), connection2);

        it('should request before asking others', function() {
            assert.isTrue(sessionRequestedBefStub.calledOnce);
        });

        it('should ask for an agreement', function() {
            assert.isTrue(sessionRequestedSpy.calledOnce);
        });

        it('should accept a request', function() {
            assert.isTrue(sessionJoinSpy.calledOnce);
        });
    });

    describe('#_receiveMessage(sdp.transfer)', function() {
        const sdpReceivedSpy = sinon.spy();
        const sendSpy = sinon.spy(abstractServer, '_send');
        abstractServer.on('sdp.received', sdpReceivedSpy);
        const message = new Message('sdp.transfer', session3.id, user2, {sdp: new Sdp('offer', '', user1)});
        abstractServer._receiveMessage(JSON.stringify(message.toJSON()), connection2);

        it('should dispatch an event', function() {
            assert.isTrue(sdpReceivedSpy.calledOnce);
        });

        it('should broadcast a message', function() {
            assert.isTrue(sendSpy.calledOnce);
        });

        abstractServer._send.restore();
    });

    describe('#_receiveMessage(ice.candidate)', function() {
        const iceReceivedSpy = sinon.spy();
        const sendSpy = sinon.spy(abstractServer, '_send');
        abstractServer.on('ice.received', iceReceivedSpy);
        const message = new Message('ice.candidate', session3.id, user2, {ice: new IceCandidate({}, user1)});
        abstractServer._receiveMessage(JSON.stringify(message.toJSON()), connection2);

        it('should dispatch an event', function() {
            assert.isTrue(iceReceivedSpy.calledOnce);
        });

        it('should broadcast a message', function() {
            assert.isTrue(sendSpy.calledOnce);
        });

        abstractServer._send.restore();
    });

    describe('#_receiveMessage(chat.message)', function() {
        const sendSpy = sinon.spy(abstractServer, '_send');
        const message = new Message('chat.message', session3.id, user2);
        abstractServer._receiveMessage(JSON.stringify(message.toJSON()), connection2);

        it('should broadcast a message', function() {
            assert.isTrue(sendSpy.calledTwice);
        });

        abstractServer._send.restore();
    });

    describe('#_receiveMessage(user.communication)', function() {
        const sendSpy = sinon.spy(abstractServer, '_send');
        const userCommunicationSpy = sinon.spy();
        const message = new Message('user.communication', session3.id, user2);
        abstractServer.on('user.communication', userCommunicationSpy);
        abstractServer._receiveMessage(JSON.stringify(message.toJSON()), connection2);

        it('should broadcast a message', function() {
            assert.isTrue(sendSpy.calledOnce);
        });

        it('should dispatch an event', function() {
            assert.isTrue(userCommunicationSpy.calledOnce);
        });

        abstractServer._send.restore();
    });

    describe('#_receiveMessage(session.leave)', function() {
        const sendSpy = sinon.spy(abstractServer, '_send');
        const sessionLeftSpy = sinon.spy();
        const message = new Message('session.leave', session3.id, user2);
        abstractServer.on('session.left', sessionLeftSpy);
        abstractServer._receiveMessage(JSON.stringify(message.toJSON()), connection2);

        it('should broadcast a message', function() {
            assert.isTrue(sendSpy.calledTwice);
        });

        it('should dispatch an event', function() {
            assert.isTrue(sessionLeftSpy.calledTwice);
        });

        abstractServer._send.restore();
    });

    describe('#_receiveMessage(session.close)', function() {
        const sendSpy = sinon.spy(abstractServer, '_send');
        const sessionClosedSpy = sinon.spy();
        const message = new Message('session.close', session3.id, user1);
        abstractServer.on('session.closed', sessionClosedSpy);
        abstractServer._receiveMessage(JSON.stringify(message.toJSON()), connection1);

        it('should broadcast a message', function() {
            assert.isTrue(sendSpy.calledTwice);
        });

        it('should dispatch an event', function() {
            assert.isTrue(sessionClosedSpy.calledOnce);
        });

        abstractServer._send.restore();
    });

    describe('#dispatch()', function() {
        const dispatchSpy = sinon.spy();
        abstractServer.on('connection.closed', dispatchSpy);
        abstractServer.dispatch('connection.closed');

        it('should dispatch an event', function() {
            assert.isTrue(dispatchSpy.calledOnce);
        });
    });

    describe('#stop()', function() {
        it('should stop the server', function() {
            const serverStoppedSpy = sinon.spy();
            abstractServer.on('server.stopped', serverStoppedSpy);
            abstractServer.stop();
            assert.isTrue(serverStoppedSpy.calledOnce);
        });
    });
});