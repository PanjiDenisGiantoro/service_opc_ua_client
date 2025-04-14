const opcua = require("node-opcua");

// Buat OPC UA Server
const server = new opcua.OPCUAServer({
    port: 4842, // Port default OPC UA
    resourcePath: "/UA/MyServer", // Endpoint URL
    buildInfo: {
        productName: "TemperatureServer",
        buildNumber: "1",
        buildDate: new Date()
    }
});

// Inisialisasi Server
async function startServer() {
    try {
        await server.initialize();
        console.log("✅ OPC UA Server Initialized");

        // Buat address space (struktur data)
        const addressSpace = server.engine.addressSpace;
        const namespace = addressSpace.getOwnNamespace();

        // Buat Object "Sensor"
        const sensor = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "Sensor"
        });

        // Buat Variable "Temperature" (°C)
        let temperature = 25; // Nilai awal
        namespace.addVariable({
            componentOf: sensor,
            browseName: "Temperature",
            nodeId: "ns=1;s=Temperature", // Namespace dan identifier
            dataType: "Double",
            value: {
                get: () => new opcua.Variant({ dataType: opcua.DataType.Double, value: temperature })
            }
        });

        // Buat Variable "RandomValue"
        let randomValue = Math.random() * 100;
        namespace.addVariable({
            componentOf: sensor,
            browseName: "RandomValue",
            nodeId: "ns=1;s=RandomValue",
            dataType: "Double",
            value: {
                get: () => new opcua.Variant({ dataType: opcua.DataType.Double, value: randomValue })
            }
        });

        // Mulai Server
        await server.start();
        console.log("🚀 Server Running at:", server.endpoints[0].endpointDescriptions()[0].endpointUrl);

        // Update nilai setiap 1 detik
        setInterval(() => {
            temperature = 20 + Math.random() * 10; // Simulasi suhu antara 20-30°C
            randomValue = Math.random() * 100;    // Nilai random 0-100

            console.log(`🌡️ Temp: ${temperature.toFixed(2)}°C | 🎲 Random: ${randomValue.toFixed(2)}`);
        }, 1000);

    } catch (err) {
        console.error("❌ Error initializing OPC UA Server:", err.message);
    }
}

startServer();
