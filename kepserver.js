const axios = require('axios');

// URL endpoint KEPServerEX
const url = 'http://127.0.0.1:39320/iotgateway/read?ids=Channel1.Device1.tag1';

// Fungsi untuk membaca data dari KEPServerEX tanpa autentikasi
async function readTag() {
    try {
        const response = await axios.get(url);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

// Jalankan fungsi baca data
readTag();
