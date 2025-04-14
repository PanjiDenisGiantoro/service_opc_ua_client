const express = require("express");
const cors = require("cors");
const opcua = require("node-opcua");

const app = express();
const port = 3003; // Sesuaikan port jika perlu

app.use(cors());
app.use(express.json());

// OPC UA Client Setup
const client = opcua.OPCUAClient.create({ endpointMustExist: false });
const endpointUrl = "opc.tcp://localhost:4842/UA/MyServer"; // Sesuaikan
const temperatureNodeId = "ns=1;s=Temperature"; // Sesuaikan

// Endpoint GET untuk membaca suhu
app.get("/read-temperature", async (req, res) => {
    try {
        await client.connect(endpointUrl);
        console.log("✅ Connected to OPC UA Server");

        const session = await client.createSession();
        console.log("✅ Session created");

        // Membaca nilai dari OPC UA Server
        const dataValue = await session.readVariableValue(temperatureNodeId);
        const temperature = dataValue.value.value;

        // Tutup koneksi setelah membaca data
        await session.close();
        await client.disconnect();

        console.log(`🌡 Temperature: ${temperature} °C`);

        // Kirim respons ke Postman
        res.json({ success: true, temperature: temperature });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Jalankan server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
