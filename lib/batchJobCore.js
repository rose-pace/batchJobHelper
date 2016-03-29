var batchObject = require('./batchObject'),
    utils = require('./utils.js'),
    fork = require('child_process').fork;

module.exports = BatchJobCore;

function BatchJobCore(processesPerCpu) {
    this.processesPerCpu = Math.max(utils.asNumber(processesPerCpu, 2), 1);
} 

BatchJobCore.prototype.processBatchItems = function (data, workerPath, options, callback) {
    if (!data) throw new Error('Please pass in valid data');
    
    // is data a batchObject?
    if (data.toString() !== 'BatchObject') {
        data = batchObject.create(data);
    }
    
    if (!callback && utils.isFunction(options)) {
        callback = options;
        options = {};
    }
    
    // start workers
    var workers = [], // all workers
        waiting = [], // workers waiting for work
        maxProcesses = require('os').cpus().length * this.processesPerCpu;
    
    for (var i = 0; i < maxProcesses; i++) {
        var procNum = i + 1;
        console.log('creating process ' + procNum);
        var w = startProcess(procNum);
        workers.push(w);
    }
    
    data.on('ready', function () {
        if (waiting.length) {
            processNext(waiting.shift());
        }
    });
    data.on('end', function () {
        checkComplete();
    })
    
    function startProcess(procNum) {
        var w = fork(workerPath, [procNum], (options || {} )['forkOptions']);
        w.on('message', function (m) {
			if (m === 'next') {
				processNext(w);
			}
		});
        w.on('exit', function (code) {
			if (!data.isComplete()) {
				//restart process
				console.log('restarting closed process ' + procNum + ' due to early exit (probably caused by an error)');
				workers[procNum - 1] = startProcess(procNum);
                processNext(workers[procNum - 1]);
			} else {
				console.log('worker ' + procNum + ' has completed processing.');
				checkComplete();
			}
		});
		processNext(w);
		return w;
    }
    
    function processNext(worker) {
        var item = data.next();
        if (item !== undefined) {
            worker.send({ item: item, options: options })
        } else if (!data.isComplete()) {
            waiting.push(worker);
        } else {
            worker.kill();
            worker.disconnect();
        }
    }
    
    function checkComplete() {
        // if data is complete kill any waiting workers
        if (data.isComplete()) {
            var worker = waiting.shift();
            if (worker) {
                // killing this worker will cause this function to be called again
                worker.kill();
                worker.disconnect();
            }
        }
        
        var stillWorking = waiting.length > 0;
		workers.forEach(function (w) {
			stillWorking |= w.connected;
		});
		if (!stillWorking) {
			//all workers completed
			(callback || utils.noop)();
			//don't call callback again
			callback = utils.noop;
		}
    }
};