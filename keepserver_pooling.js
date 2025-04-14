const express = require('express');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3009;
const LARAVEL_API_URL = 'http://127.0.0.1:8000/api/get-data';
const LARAVEL_LOG_API_URL = 'http://127.0.0.1:8000/api/log-error';

// Middleware
app.use(cors());
app.use(express.json());

let latestData = null;

// Fungsi untuk mengecek apakah API bisa diakses
async function checkIfRunning(host, port, endpoint) {
    try {
        const url = `${host}:${port}/${endpoint}`;
        console.log(`Mengecek URL: ${url}`);

        const response = await axios.get(url, { timeout: 5000 });
        return { running: response.status === 200, error_log: null, response_value: response.data // ambil nilai dari response
        };
    } catch (error) {
        console.error(`Error cek running: ${error.message}`);
        return { running: false, error_log: error.message, response_value: null };
    }
}

// Fungsi untuk mencatat error ke Laravel
async function logErrorToLaravel(socketId, errorMessage) {
    try {
        await axios.post(LARAVEL_LOG_API_URL, {
            socket_id: socketId,
            error_message: errorMessage
        });
        console.log(`Log error disimpan untuk socket_id: ${socketId}`);
    } catch (error) {
        console.error(`Gagal menyimpan log error: ${error.message}`);
    }
}

// Fungsi untuk mengambil data dari Laravel
async function fetchDataFromLaravel() {
    try {
        const response = await axios.get(LARAVEL_API_URL);

        if (!response.data || !Array.isArray(response.data)) {
            console.error("Laravel mengembalikan data tidak valid.");
            return;
        }

        latestData = await Promise.all(
            response.data.map(async (api) => {
                const { running, error_log,response_value } = await checkIfRunning(api.host, api.port, api.endpoint);

                if (error_log) {
                    await logErrorToLaravel(api.id, error_log);
                }

                return {
                    ...api,
                    running,
                    running_well: running,
                    error_log,
                    response_value
                };
            })
        );

        console.log(`[${new Date().toLocaleString()}] Data dari Laravel:`, latestData);
        io.emit('data-update', latestData);
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Error mengambil data dari Laravel:`, error.message);
    }
}

// Jalankan polling setiap 5 detik
setInterval(async () => {
    await fetchDataFromLaravel();
}, 5000);

// Endpoint di Node.js untuk mengambil data terbaru
app.get('/api/read-tag', (req, res) => {
    if (latestData) {
        res.json({ success: true, data: latestData });
    } else {
        res.status(500).json({ success: false, error: 'Data belum tersedia' });
    }
});

// WebSocket connection
io.on('connection', (socket) => {
    console.log('Client terhubung ke WebSocket');

    if (latestData) {
        socket.emit('data-update', latestData);
    }

    socket.on('disconnect', () => {
        console.log('Client terputus dari WebSocket');
    });
});



// Menjalankan server
server.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    fetchDataFromLaravel();
});
