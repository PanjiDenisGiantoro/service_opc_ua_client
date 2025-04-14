const WebSocket = require('ws');

// URL WebSocket dari IoT Gateway KEPServerEX
const wsUrl = 'ws://127.0.0.1:39320/iotgateway';

// Buat koneksi WebSocket
const ws = new WebSocket(wsUrl);

// Ketika koneksi berhasil
ws.on('open', function open() {
    console.log('Connected to KEPServerEX WebSocket');

    // Kirim permintaan untuk membaca data Channel1.Device1.tag1
    const request = {
        "type": "read",
        "ids": ["Channel1.Device1.tag1"]
    };

    ws.send(JSON.stringify(request));
});

// Ketika menerima pesan dari server
ws.on('message', function incoming(data) {
    console.log('Received:', data);
});

// Ketika koneksi ditutup
ws.on('close', function close() {
    console.log('Disconnected from KEPServerEX');
});

// Ketika terjadi error
ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});
