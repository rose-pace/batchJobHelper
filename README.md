# batchJobHelper
A node js helper for processing data concurrently. Creates child processes to process a collection of items concurrently.

## Example of starting a batch job:
```
var batchJobHelper = require('batchjobhelper'),
    BatchObject = batchJobHelper.BatchObject,
    batchJob = new batchJobHelper.BatchJob(),
    data = [];
    
// Creating array data for example
for (var index = 0; index < 100; index++) {
  data.push(index);
}
// Creating a BatchObject from an array (can also be created from a stream)
// You don't need to explicitly create the BatchObject. 
// You can just pass the array or stream to the processBatchItems function
var arrayBatchObject = new BatchObject(data); 

// starting a new batch job
batchJob.processBatchItems(arrayBatchObject, './path_to_my_processing_script.js', { test: 'fromArray' }, function () {
  console.log('job is over');
});
```

## Example of the worker process script:
```
var batchJobHelper = require('batchjobhelper'),
    arg = process.argv[2]; // the number of the worker process

// data is passed to the worker process through the message event
process.on('message', function (m) {
    // handle message 
    console.log('Process ' + arg + ' received message: ', m);
    // call for next item in batch
    batchJobHelper.next();
});
```

## Handling the message sent to the worker process
The message sent to the worker process is an object with two properties:
`{ item: item, options: options }`

**item** is a single item from the BatchObject. In the example above it would be in integer.

**options** is the options object passed in to the processBatchItems function. In the example above it would be `{ test: 'fromArray' }`.

You can use the same script to kick off the batch and process the batch. Use the process arg to tell whether you are in the master process or in the child worker process:
```
var arg = process.argv[2];
if (!arg) {
  // this is the master process so; start the batch job here
  ...
} else {
  // this is the worker process; process your data here
  ...
}
```
