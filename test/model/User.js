import {User} from '../../src/model/User';
import sinon from 'sinon';
import { assert } from 'chai';
import InMemoryAbstract from "../../src/repository/InMemoryAbstract";
import {Session} from "../../src/model/Session";

describe('model > User', function() {
    const user1 = new User('1', '', '', '', '', '1');
    const user2= new User('2', '', '', '', '', '2');
    const session = new Session('2', user1, []);

    describe('#save()', function() {
        it('should save changes in the repository', function() {
            const repository = new InMemoryAbstract();
            const spy = sinon.spy(repository, 'update');
            repository.add(user1);
            user1.save();
            assert.isTrue(spy.withArgs(user1).calledOnce);
        });
    });

    describe('#joinSession()', function() {
        it('should join the user to session', function() {
            assert.equal(user2.sessions.toArray(), 0);
            user2.joinSession(session);
            assert.deepEqual(user2.sessions.toArray()[0], session);
        });
    });

    describe('#leaveSession()', function() {
        it('should leave the session', function() {
            assert.deepEqual(user2.sessions.toArray()[0], session);
            user2.leaveSession(session);
            assert.equal(user2.sessions.toArray(), 0);
        });
    });
});