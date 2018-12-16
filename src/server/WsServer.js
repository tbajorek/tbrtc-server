import fs from 'fs';
import https from 'https';
import http from 'http';
import WebSocket from 'ws';
import Intro, { Line } from 'jscon-intro';

import AbstractServer from './AbstractServer';

const WebSocketServer = WebSocket.Server;
const uuidv4 = require('uuid');
const colors = require('colors/safe');

/**
 * @module tbrtc-server/server
 */

/**
 * WebSocket signaling server
 * @extends AbstractServer
 */
class WsServer extends AbstractServer {
    constructor(config) {
        if(typeof config.ip === 'undefined') {
            config.ip = '0.0.0.0';
        }
        if(typeof config.port === 'undefined') {
            config.port = 9876;
        }
        super(config);
    }

    stop() {
        this._server.close();// here should be also closed all opened connections
    }

    _getServer() {
        let httpServer;
        if (typeof this.config.security !== 'undefined') {
            httpServer = this._getHttpsServer();
        } else {
            httpServer = this._getHttpServer();
        }
        const server = new WebSocketServer({ server: httpServer });
        server.on('connection', (connection, request) => {
            const connectionId = this._connectionOpened(connection, request);
            connection.on('message', (message) => {
                this._receiveMessage(message, connection);
            });
            connection.on('close', () => {
                this._connectionClosed(connectionId);
            });

            this._checkingAvailability(connection);
        });
        return server;
    }

    _displayIntro() {
        const intro = new Intro();
        intro._displayMethod = (input) => {
            console.log(colors.green(input));
        };
        intro.addLine(Line.EMPTY);
        const version = __VERSION__;
        intro.addLine(`tbrtc-server v${version}`);
        intro.addLine('created by Tomasz Bajorek <tbajorek3@gmail.com>');
        intro.addLine(Line.EMPTY);
        const address = 'ws' + (typeof this.config.security !== 'undefined' ? 's' : '') + '://'
                      + this.config.ip + ':' + this.config.port;
        intro.addLine(`Server is running on: ${address}`);
        intro.addLine(Line.EMPTY);
        intro.addLine('This is basic WebSocket server. It can be extended.');
        intro.addLine('For more information please visit: http://github.com/tbajorek/tbrtc-server');
        intro.addLine(Line.EMPTY);
        intro.display();
    }

    _checkingAvailability(connection) {
        connection.isAlive = true;
        connection.on('pong', () => {
            connection.isAlive = true;
        });

        const interval = setInterval(() => {
            this.users.forEach((user) => {
                if (user.connection === connection && connection.isAlive === false) {
                    this._userLost(user, connection);
                }
                connection.isAlive = false;
                connection.ping(() => {});
                return true;
            });
        }, 10000);
    }

    _getHttpsServer() {
        const serverConfig = {
            key: fs.readFileSync(this.config.security.key),
            cert: fs.readFileSync(this.config.security.cert),
        };
        const httpsServer = https.createServer(serverConfig);
        httpsServer.listen(this.config.port, this.config.ip);
        return httpsServer;
    }

    _getHttpServer() {
        const httpServer = http.createServer();
        httpServer.listen(this.config.port, this.config.ip);
        return httpServer;
    }

    _send(connection, message) {
        if(!!connection && connection.readyState === connection.OPEN) {
            connection.send(message.toString());
        }
    }
}

export default WsServer;

/*
{
    "security": {
        "key": "",
        "cert": ""
    },
    "port": 8443,
    "ip", "0.0.0.0"
}
 */
