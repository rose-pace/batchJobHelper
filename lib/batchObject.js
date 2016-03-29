var utils = require('./utils'),
    EventEmitter = require('events'),
    util = require('util');

function BatchObject(batchData) {
    this.data = [];
    initialize(batchData, this);
    // add events
    EventEmitter.call(this);
}

module.exports = BatchObject;

util.inherits(BatchObject, EventEmitter);
    
BatchObject.prototype.next = function () { return null; };
BatchObject.prototype.isComplete = function () { return true; };

function initialize(obj, model) {
    if (Array.isArray(obj)) {
        return initModelFromArray(obj, model);
    }
    if (utils.isFunction(obj['on'])) {
        return initModelFromStream(obj, model);
    }
    
    throw new Error('Unknown object type; Must be an array or valid stream object');
}

function initModelFromArray(arr, model) {
    if (!Array.isArray(arr)) throw new Error('Must be a valid array');

    model.data = arr;
    
    model.next = function () {
        return this.data.shift();
    };
    
    model.isComplete = function () {
        return this.data.length === 0;
    };
}

function initModelFromStream(stream, model) {
    if (!stream) throw new Error('Must be a valid stream');
    var isComplete = false;
    
    model.next = function () {
        return this.data.shift();
    };
    
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
}