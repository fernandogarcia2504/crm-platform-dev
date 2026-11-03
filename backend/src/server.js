import "dotenv/config";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 4000;

const start = async () => {
    try {
        await connectDatabase();
        app.listen(PORT, () => {
            console.log(`Plataforma de operación Atalaya en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("No se pudo iniciar la plataforma:", error.message);
        process.exit(1);
    }
};

start();
