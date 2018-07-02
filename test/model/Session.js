import { Session } from '../../src/model/Session'
import { User } from '../../src/model/User'

import {InMemoryAbstract} from "../../src/repository/InMemoryAbstract";

var assert = require('assert');

const user1JSON = {
    "id": 15,
    "name": "John Black",
    "email": "jblack@example.com"
};

const user2JSON = {
    "id": 1,
    "name": "Bobbie Edgardo",
    "email": "bobbie@example.com"
};

const user3JSON = {
    "id": 35,
    "name": "Spencer Sosimo",
    "email": "spencer@example.com"
};

const sessionJSON = {
    "id": 17,
    "creator": user1JSON,
    "members": [
        user2JSON, user3JSON
    ]
};

var user1 = new User(user1JSON.id, user1JSON.name, user1JSON.email);
var user2 = new User(user2JSON.id, user2JSON.name, user2JSON.email);
var user3 = new User(user3JSON.id, user3JSON.name, user3JSON.email);
const members = [user2, user3];

var session = new Session(sessionJSON.id, user1, members);

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
            var sessionFrom = Session.fromJSON(sessionJSON);
            assert.deepEqual(sessionFrom, session);
        });
    });

    describe('#save()', function() {
        it('should save changes in the repository', function() {
            var repository = new InMemoryAbstract();
            repository.add(session);
            session.memberLeave(user3.id);
            session.save();
            var newSession = repository.get(session.id);
            assert.deepEqual(newSession, session);
        });
    });
});