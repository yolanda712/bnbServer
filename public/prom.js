const client = require('prom-client');

// const collectDefaultMetrics = client.collectDefaultMetrics;

const bnb_connection_gauge = new client.Gauge(
    { name: 'bnb_connections_num', help: 'total numbers of bnb_server connections' });

const bnb_room_gauge = new client.Gauge(
    { name: 'bnb_room_num', help: 'total numbers of bnb_server rooms' });

module.exports = {
    bnb_connection_gauge : bnb_connection_gauge,
    bnb_room_gauge : bnb_room_gauge
}