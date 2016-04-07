var utils = require('./utils'),
    EventEmitter = require('events'),
    util = require('util');

/**
 * Creates a new BatchObject instance
 * @class BatchObject
 * @extends EventEmitter
 * @property {array|stream} data The data that will be processed
 * @fires BatchObject#ready
 * @fires BatchObject#end
 * @returns {BatchObject} a BatchObject instance
 */
function BatchObject(batchData) {
    this.data = [];
    initialize(batchData, this);
    // add events
    EventEmitter.call(this);
}

module.exports = BatchObject;

util.inherits(BatchObject, EventEmitter);
    
/**
 * Returns the next object in the batch if it is available
 * @method
 * @returns {Object|null} Returns null if no object is currently available, else it returns the object
 * 
 * Implementation of this function is created below based on the type of the batchData entered when
 * the object is instantiated
 */
BatchObject.prototype.next = function () { return null; };

/**
 * Returns whether the batch is complete
 * @method
 * @returns {boolean} returns true if the batch is complete
 * 
 * Implementation is dependent upon the object passed in to the contstructor
 * Look below for implementation details
 */
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
        // resume stream if buffer is drained below minimum level
        if (this.data.length < 2000) { stream.resume(); }
        return this.data.shift();
    };
    
    model.isComplete = function () {
        return isComplete && model.data.length === 0;
    };
    
    stream.on('data', function (d) {
        model.data.push(d);
        model.emit('ready');
        // throttle stream if buffer gets too large
        if (model.data.length > 10000) { stream.pause(); }
    });
    
    stream.on('end', function () {
        isComplete = true;
        model.emit('end');
    });
}