var http = require('http');
var url = require('url');

export class Pool {
    constructor() {
        this.processingCount = 0;
        this.max = 5;
        this.queue = [];
    }
    add(url) {
        this.queue.push(url);
        this.check();
    }
    check() {
        if (this.queue.length === 0) {
            if (this.processingCount === 0) {
                this.endCallback();
            }
            return false;
        }
        if (this.processingCount >= this.max) {
            return false;
        }
        this.process();
    }
    process() {
        this.processingCount++;
        var item = this.queue.shift();
        var options = url.parse(item);
        options.method = 'HEAD';
        console.log('starting ' + item);
        var req = http.request(options, (res) => {
            console.log('done ' + item, 'STATUS: ' + res.statusCode);
            this.doneCallback(item, res.statusCode);
            this.processingCount--;
            this.check();
        });
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });
        req.end();
    }
}