import InMemoryAbstract from "../../src/repository/InMemoryAbstract";

var assert = require('assert');

const object1 = {
    id: 5,
    value: 9
};

const object2 = {
    id: 2,
    value: 1
};

const object3 = {
    id: 7,
    value: 4
};

const objects = [object1, object2, object3];
var repository = new InMemoryAbstract();

describe('repository > InMemoryAbstract', function() {
    describe('#add() && get()', function() {
        it('should add objects to repository correctly', function() {
            assert.equal(repository.get(object1.id), null);
            repository.add(object1);
            repository.add(object2);
            assert.equal(repository.get(object1.id), object1);
            assert.equal(repository.get(object2.id), object2);
            assert.equal(repository.get(object3.id), null);
        });
    });

    describe('#forEach()', function() {
        it('should allow to iterate', function() {
            let index = 0;
            repository.forEach(object => {
                assert.deepEqual(object, objects[index++]);
            });
        });
    });

    describe('#[Symbol.iterator]', function() {
        it('should allow to iterate', function() {
            let index = 0;
            for(const object of repository) {
                assert.deepEqual(object, objects[index++]);
            }
        });
    });

    describe('#isUnique()', function() {
        it('should check uniqueness of object id', function() {
            assert.equal(repository.isUnique(object1.id), false);
            assert.equal(repository.isUnique(object3.id), true);
        });
    });

    describe('#update() && get()', function() {
        it('should update models in repository', function() {
            let newObject = object2;
            newObject.value = 19;
            repository.update(newObject);
            assert.deepEqual(repository.get(newObject.id), newObject);

            repository.update(object3);
            assert.equal(repository.get(object3.id), object3);
        });
    });

    describe('#remove() && get()', function() {
        it('should remove model from repository', function() {
            repository.remove(object1);
            assert.deepEqual(repository.get(object1.id), null);

            repository.remove(object2.id);
            assert.deepEqual(repository.get(object2.id), null);
        });
    });
});
