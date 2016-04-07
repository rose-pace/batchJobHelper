
module.exports = {
    BatchObject: require('./lib/batchObject'),
    BatchJob: require('./lib/batchJobCore'),
    handleError: handleError,
    next: next
};

/**
 * Helper function for handling errors in a worker process; Will exit the worker process in an error exists
 * @method
 * @param {Error|string} error object
 * @param {string|object} details to be reported with error
 * @param {function} [callback] callback will be passed both error and details
 */
function handleError(err, details, callback) {
    if (err) {
        if (!details) details = 'BatchJob received error:';
        console.error(details, '\n', err);
        (callback || utils.noop)(err, details);
        // kill worker; main process will respawn if it is needed
		process.exit(1);
    }
};

/**
 * Helper function used by a worker process to call for the next batch item
 * @method
 */
function next() { process.send('next'); }