import _ from 'underscore';

const uuidv4 = require('uuid/v4');

/**
 * @module tbrtc-server/repository
 */

class InMemoryAbstract
{
    constructor() {
        this._data = [];
    }

    get(objectId, key = 'id') {
        const foundIndex = this._findInStorage(objectId, key);
        return foundIndex !== null ? this._data[foundIndex] : null;
    }

    isUnique(objectId) {
        return this.get(objectId) === null;
    }

    add(object) {
        if (typeof object !== 'object') {
            object = {};
        }
        // object id is empty
        if(object.id === null) {
            object.id = this._generateId();
        }
        this._bindWithRepository(object);
        this._data.push(object);
    }

    update(object) {
        if (typeof object === 'object') {
            if (object.id === null) {
                this.add(object);
            } else {
                const foundIndex = this._findInStorage(object);
                if (foundIndex !== null) {
                    this._bindWithRepository(object);
                    this._data[foundIndex] = object;
                } else {
                    this.add(object);
                }
            }
        }
    }

    remove(object) {
        const foundIndex = this._findInStorage(object);
        if (foundIndex !== null) {
            this._data.splice(foundIndex, 1);
        }
    }

    _generateId() {
        let uuid;
        do {
            uuid = uuidv4();
        } while (!this.isUnique(uuid));
        return uuid;
    }

    _findInStorage(objectId, key = 'id') {
        if (objectId !== null && typeof objectId === 'object' && key in objectId) {
            objectId = objectId[key];
        }
        const foundIndex = _.findIndex(this._data, elem => elem[key] === objectId);
        return foundIndex >= 0 ? foundIndex : null;
    }

    // binding for correct usage save() method on stored object
    _bindWithRepository(object) {
        if (typeof object === 'object' && '_setRepository' in object && typeof object._setRepository === 'function') {
            object._setRepository(this);
        }
    }

    forEach(callback) {
        return this._data.forEach(callback);
    }

    [Symbol.iterator]() {
        let index = 0;
        const data = this._data;
        return {
            next: () => {
                if (index < data.length) {
                    return { value: data[index++], done: false };
                } else {
                    index = 0;
                    return { done: true };
                }
            },
        };
    }

    toArray() {
        return this._data;
    }

    get length() {
        return this._data.length;
    }
}

export default InMemoryAbstract;
