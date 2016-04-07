var BatchObject = require('./batchObject'),
    utils = require('./utils.js'),
    fork = require('child_process').fork;

module.exports = BatchJobCore;

/**
 * Creates a new BatchJobCore instance
 * @class BatchJobCore
 * @property processesPerCpu {integer} number of child process to generate per CPU
 * @return {BatchJobCore} a BatchJobCore instance
 */
function BatchJobCore(processesPerCpu) {
    this.processesPerCpu = Math.max(utils.asNumber(processesPerCpu, 2), 1);
} 

/**
 * Start a batch job process
 * @method
 * @param {BatchObject|array|stream} The data to process
 * @param {string} Path to the script that will process each item of data
 * @param {object} options that will be passed to the child process along with the data item
 * @param {function} [callback] called when the batch processing is complete
 */
BatchJobCore.prototype.processBatchItems = function (data, workerPath, options, callback) {
    if (!data) throw new Error('Please pass in valid data');
    
    // is data a batchObject?
    if (!(data instanceof BatchObject)) {
        data = new BatchObject(data);
    }
    
    if (!callback && utils.isFunction(options)) {
        callback = options;
        options = {};
    }
    
    // start workers
    var workers = [], // all workers
        waiting = [], // workers waiting for work
        maxProcesses = require('os').cpus().length * this.processesPerCpu;
        
    // create child processes
    for (var i = 0; i < maxProcesses; i++) {
        var procNum = i + 1;
        console.log('creating process ' + procNum);
        var w = startProcess(procNum);
        workers.push(w);
    }
    
    // handle BatchObject ready event
    data.on('ready', function () {
        if (waiting.length) {
            processNext(waiting.shift());
        }
    });
    // handle BatchObject end event
    data.on('end', function () {
        checkComplete();
    })
    
    // creates a new worker process and assigns work to it
    function startProcess(procNum) {
        var w = fork(workerPath, [procNum], (options || {} )['forkOptions']);
        // handle worker process message event
        w.on('message', function (m) {
			if (m === 'next') {
				processNext(w);
			}
		});
        // handle worker process exit event
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
    
    // assigns work to a worker process
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
    
    // check if all processes are complete
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