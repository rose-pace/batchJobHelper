var utils = require('./utils'),
    EventEmitter = require('events'),
    util = require('util');

module.exports = {
    create: createBatchObject,
    fromArray: createModelFromArray,
    fromStream: createModelFromStream
};

function createBatchObject(obj) {
    if (Array.isArray(obj)) {
        return createModelFromArray(obj);
    }
    if (utils.isFunction(obj['on'])) {
        return createModelFromStream(obj);
    }
    
    throw new Error('Unknown object type; Must be an array or valid stream object');
}

function createModelFromArray(arr) {
    if (!Array.isArray(arr)) throw new Error('Must be a valid array');

    var BatchObject = function (array) {
        this.data = array;
        // add events
        EventEmitter.call(this);
    }
    
    util.inherits(BatchObject, EventEmitter);
    
    BatchObject.prototype.next = function () {
        return this.data.shift();
    };
    
    BatchObject.prototype.isComplete = function () {
        return this.data.length === 0;
    }
    
    BatchObject.prototype.toString = function () {
        return 'BatchObject';
    }
    
    return new BatchObject(arr);
}

function createModelFromStream(str) {
    if (!str) throw new Error('Must be a valid stream');
    
    return (function (stream) {
        var model = createModelFromArray([]),
            isComplete = false;
            
        model.isComplete = function () {
            return isComplete && model.data.length === 0;
        };
        
        stream.on('data', function (d) {
            model.data.push(d);
            model.emit('ready');
        });
        
        stream.on('end', function () {
            isComplete = true;
            model.emit('end');
        });
        
        return model;
    })(str);
}