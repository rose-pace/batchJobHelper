
module.exports = {
    batchObject: require('./lib/batchObject'),
    BatchJob: require('./lib/batchJobCore'),
    handleError: handleError,
    next: next
};

function handleError(err, details, callback) {
    if (err) {
        if (!details) details = 'BatchJob received error:';
        console.error(details, '\n', err);
        (callback || utils.noop)(err, details);
        // kill worker; main process will respawn if it is needed
		process.exit(1);
    }
};

function next() { process.send('next'); }