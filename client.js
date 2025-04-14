const opcua = require("node-opcua");
const Queue = require("bull");
const express = require("express");
const bodyParser = require("body-parser");

// Setup Redis Queue
const dataQueue = new Queue("sensorData", { redis: { port: 6379, host: "127.0.0.1" } });

// Simpan data terakhir dibaca
let latestTemperatureData = null;

// OPC UA Client Setup
const client = opcua.OPCUAClient.create({ endpointMustExist: false });
const endpointUrl = "opc.tcp://localhost:4842/UA/MyServer";
const temperatureNodeId = "ns=1;s=Temperature";

let countOverTemp = 0;

async function readData() {
    try {
        await client.connect(endpointUrl);
        console.log("✅ Connected to OPC UA Server");

        const session = await client.createSession();
        console.log("📡 Session Created");

        setInterval(async () => {
            try {
                const tempData = await session.readVariableValue(temperatureNodeId);
                const temperature = tempData.value.value;
                const datetime = new Date().toISOString();
                const status = temperature > 29 ? 1 : 0;

                if (temperature > 29) countOverTemp++;

                latestTemperatureData = {
                    name: "Temperature",
                    value: temperature.toFixed(2),
                    node_id: temperatureNodeId,
                    status: status,
                    count_over_temp: countOverTemp,
                    datetime: datetime
                };
                if (countOverTemp % 5 === 0) {
                    await dataQueue.add(latestTemperatureData);
                    countOverTemp = 0;
                }

                console.log("📥 Temperature:", latestTemperatureData);

            } catch (err) {
                console.error("❌ Error reading data:", err.message);
            }
        }, 1000);

    } catch (err) {
        console.error("❌ Connection Error:", err.message);
    }
}

readData();

// 🚀 Setup Express API
const app = express();
const PORT = 3010;

app.use(bodyParser.json());

// GET endpoint: /temperature
app.get("/temperature", (req, res) => {
    if (latestTemperatureData) {
        res.json(latestTemperatureData);
    } else {
        res.status(404).json({ message: "No data yet" });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 API Server running at http://localhost:${PORT}`);
});
