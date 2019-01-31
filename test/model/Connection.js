import {Connection} from '../../src/model/Connection'
import sinon from 'sinon';
import { assert } from 'chai';

const original = {
    readyState: 4,
    OPEN: 4,
    send: () => (null)
};

describe('model > Connection', function() {
    describe('#send()', function() {
        it('should send a message using original object', function() {
            const spy = sinon.spy(original, 'send');
            const connection = new Connection('5', original, null);
            const message = 'test';
            connection.send(message);
            assert.isTrue(spy.withArgs(message).calledOnce);
        });
    });
});