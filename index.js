const swaggerJSDoc = require('swagger-jsdoc');
const bodyparser = require('body-parser');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3')

const serverPort = 8090
const { dbPath } = require('./config/explorer.json')

const swaggerSpec = swaggerJSDoc({
    definition: {
        info: {
            title: 'FIBOS history API by FibosRocks',
            version: '1.0.0',
        },
    },
    apis: ['./api/v2.history.js', './api/explorer.js'],
});

const express = require('express');
const app = express();
app.use(bodyparser.json())
app.use(bodyparser.json({ type: 'text/plain' }))
app.use('/', express.static(__dirname + '/html'));

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1')
    if (req.method == "OPTIONS") {
        res.sendStatus(200);/*让options请求快速返回*/
    } else {
        next();
    }
});

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// db
sqlite.open({
    filename: dbPath,
    driver: sqlite3.Database
}).then(db => {    // history
    require('./api/v2.history.js')(app, db);
    // explorer
    const memory = require('./loader/memory.js')
    require('./api/explorer.js')(app, memory, db);
})

process.on('uncaughtException', (err) => {
    console.error(`======= UncaughtException API Server :  ${err}`);
});

const http = require('http').Server(app);
http.listen(serverPort, () => {
    console.log('=== Listening on port:', serverPort);
});
http.on('error', (err) => {
    console.error('=== Http server error', err);
});
