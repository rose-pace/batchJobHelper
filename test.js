var batchObjectHelper = require('./'),
    batchObject = batchObjectHelper.batchObject,
    batchJob = new batchObjectHelper.BatchJob(),
    EventEmitter = require('events'),
    util = require('util'),
    data = [],
    stream = null;
    fromArray = null,
    fromStream = null,
    arg = process.argv[2];
  
if (!arg) {  
    for (var index = 0; index < 15; index++) {
        data.push(index);
    }

    console.log('creating from array');
    try {
        fromArray = batchObject.create(data);
    } catch (ex) {
        console.error('fromArray: ', ex);
    }
    
    console.log('creating from stream');
    try {
        var MyStream = function () {
            EventEmitter.call(this);
        };
        util.inherits(MyStream, EventEmitter);
        stream = new MyStream();
        fromStream = batchObject.create(stream);
    } catch (ex) {
        console.error('fromStream: ', ex);
    }
        
    console.log('starting fromArray job');
    batchJob.processBatchItems(fromArray, './test.js', { test: 'fromArray' }, function () {
        console.log('finished from array job');
           
        console.log('starting fromStream job');
        batchJob.processBatchItems(fromStream, './test.js', { test: 'fromStream' }, function () {         
            console.log('finished from stream job');
        });
        runStream(0);
    })
    
    function runStream (i) {
        setTimeout(function (val) {
            if (val < 15) {                
                console.log('emit data: ', val);
                stream.emit('data', val);
                var n = val + 1;
                runStream(n);
            } else {
                console.log('emit end');
                stream.emit('end');
            }
        }, 100, i);
    }
} else {
    process.on('message', function (m) {
        // log message
        console.log('Process ' + arg + ' received message: ', m);
        batchObjectHelper.next();
    });
}