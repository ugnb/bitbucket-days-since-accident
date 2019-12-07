const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');

const port = process.env.PORT || 3000;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    const app = express();

    app.use(express.static('./static'));
    app.get('/', (req, res) => {
        res.sendFile('./static/index.html', { root: __dirname });
    });
    app.listen(port, () => console.log(`Worker ${process.pid} listening on port ${port}`));
}
