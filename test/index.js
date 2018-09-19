import { Error } from 'tbrtc-common/messages/result/Error';
import WsServer from '../src/server/WsServer';
import "@babel/polyfill";

const uuidv4 = require('uuid');

const server = new WsServer({
    port: 9876,
    temporaryTime: 15,
    confirmType: 'creator',
});

server.on('server.started', (e) => {
    console.log('server.started');
});
server.on('user.checked', (e) => {
    console.log('user.checked');
    //e.data.checked = false;
    //e.data.message = new Error(10, `User ${e.data.user.name} is not authorized`);
    return e;
});
server.on('user.connected', (e) => {
    console.log('user.connected: '+e.data.user.id);
    // console.log(e.data.server.users.toArray());
});
server.on('user.disconnected', (e) => {
    console.log('user.disconnected: '+e.data.user.id);
    // console.log(e.data.server.users.toArray());
});
server.on('connection.opened', (e) => {
    console.log('connection.opened');
});
server.on('connection.closed', (e) => {
    console.log('connection.closed');
});
server.on('session.created', (e) => {
    console.log('session.created');
    //console.log(e.data.session);
});
server.on('message.received', (e) => {
    console.log('message.received', e.data.message);
});

server.start();
