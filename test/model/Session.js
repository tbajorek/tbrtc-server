import { Session } from '../../src/model/Session'
import { User } from '../../src/model/User'
import sinon from 'sinon';

import InMemoryAbstract from "../../src/repository/InMemoryAbstract";

import { assert } from 'chai';

const user1JSON = {
    "id": 15,
    "name": "John",
    "surname": "Black",
    "email": "jblack@example.com",
    "_securedFields": ['token'],
    "avatar": null,
    "connectionId": null,
    "token": null
};

const user2JSON = {
    "id": 1,
    "name": "Bobbie",
    "surname": "Edgardo",
    "email": "bobbie@example.com",
    "_securedFields": ['token'],
    "avatar": null,
    "connectionId": null,
    "token": null
};

const user3JSON = {
    "id": 35,
    "name": "Spencer",
    "surname": "Sosimo",
    "email": "spencer@example.com",
    "_securedFields": ['token'],
    "avatar": null,
    "connectionId": null,
    "token": null
};

const sessionJSON = {
    "id": 17,
    "creator": user1JSON,
    "members": [
        user2JSON, user3JSON, user1JSON
    ],
    "_securedFields": []
};

const user1 = new User(user1JSON.id, user1JSON.name, user1JSON.surname, user1JSON.email);
const user2 = new User(user2JSON.id, user2JSON.name, user2JSON.surname, user2JSON.email);
const user3 = new User(user3JSON.id, user3JSON.name, user3JSON.surname, user3JSON.email);
const user4 = new User('932', '', '', '');
const members = [user2, user3, user1];

const session = new Session(sessionJSON.id, user1, members);

describe('model > Session', function() {
    describe('#constructor()', function() {
        it('should create correct Session model', function() {
            assert.equal(session.id, sessionJSON.id);
            assert.deepEqual(session.creator, user1);
            assert.deepEqual(session.members, members);
        });
    });

    describe('#toJSON()', function() {
        it('should convert model to JSON object', function() {
            assert.deepEqual(session.toJSON(), sessionJSON);
        });
    });

    describe('#fromJSON()', function() {
        it('should create model from JSON object', function() {
            const sessionFrom = Session.fromJSON(sessionJSON);
            assert.deepEqual(sessionFrom, session);
        });
    });

    describe('#save()', function() {
        it('should save changes in the repository', function() {
            const repository = new InMemoryAbstract();
            const spy = sinon.spy(repository, 'update');
            repository.add(session);
            session.save();
            assert.isTrue(spy.withArgs(session).calledOnce);
        });
    });

    describe('#newRequest() && hasRequest() && removeRequest()', function() {
        it('should add new request and detect it', function() {
            session.newRequest(user1);
            assert.isTrue(session.hasRequest(user1));
        });

        it('should remove request and detect it', function() {
            session.removeRequest(user1);
            assert.isFalse(session.hasRequest(user1));
        });
    });

    describe('#join()', function() {
        it('should join a user to the session', function() {
            const spy = sinon.spy(user4, 'joinSession');
            assert.isTrue(session.join(user4));
            assert.isTrue(session.hasMember(user4.id));
            assert.isTrue(spy.withArgs(session).calledOnce);
        });
    });

    describe('#leave()', function() {
        it('should leave session', function() {
            const spy = sinon.spy(user4, 'leaveSession');
            assert.deepEqual(session.leave(user4.id), user4);
            assert.isFalse(session.hasMember(user4.id));
            assert.isTrue(spy.withArgs(session.id).calledOnce);
        });
    });
});