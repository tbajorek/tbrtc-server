import { Error } from 'tbrtc-common/messages/result/Error';
import WsServer from '../src/server/WsServer';

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
    //e.data.user.id = uuidv4();
    /* e.data.checked = false;
    e.data.message = new Error(10, `User ${e.data.user.name} is not authorized`); */
    return e;
});
server.on('user.connected', (e) => {
    console.log('user.connected');
    // console.log(e.data.server.users.toArray());
});
server.on('connection.opened', (e) => {
    console.log('connection.opened');
});
server.on('connection.closed', (e) => {
    console.log('connection.closed');
});
server.on('session.created', (e) => {
    console.log('message.received');
    //console.log(e.data.session);
});
server.on('message.received', (e) => {
    console.log('message.received');
});

server.start();
