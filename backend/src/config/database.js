import mongoose from "mongoose";

export const connectDatabase = async () => {

    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error("Falta MONGO_URI en el archivo .env");
    }

    await mongoose.connect(uri);

    console.log("Plataforma conectada a MongoDB");
};

export default connectDatabase;
