require('./init');
var express = require('express');
var app = express();
var getRawBody = require('raw-body');
var Pool = require('./Pool').Pool;

class MyPool extends Pool {
    constructor(res) {
        super();
        this.res = res;
    }
    doneCallback(url, status) {
        var color = 'orange';
        if (status >= 200 && status <= 300) {
            color = 'green';
        } else if (status >= 400 && status <= 600) {
            color = 'red';
        }
        this.res.write('<li><b style="color:' + color + '; font-weight: bold;">[' + status + ']</b> '+ S.escape(url) + '</li>');
    }
    endCallback() {
        this.res.end();
    }
}

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        'production': 'prod'
    }
});

app.locals.basepath = argv.basepath || '/';

if (!argv.production) {
    console.log('Dev mode');
    app.use(require('connect-livereload')({
        port: argv.livereloadPort
    }));
    ['src', 'node_modules'].forEach((folder) => {
        app.use('/' + folder, express.static(__dirname +'/../../' + folder));
    });
} else {
    console.log('Production mode');
}

app.get('/', (req, res) => res.render('index', { URL: req.path }));
app.post('/', (req, res, next) => {
  getRawBody(req, {
        length: req.headers['content-length'],
        limit: '1mb',
        encoding: 'utf8'
  }, function (err, string) {
        if (err) {
            return next(err);
        }
        var pool = new MyPool(res);
        var strings = string.toString().split("\n");
        strings.forEach((string) => pool.add(string));
  });
});

app.use(express.static(__dirname +'/../../public'));

var port = argv.port || 3000;
app.listen(port, console.log.bind(null, 'Listening on port ' + port));