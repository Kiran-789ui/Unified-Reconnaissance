import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoMemoryServerInstance: any = null;

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unified-recon-db';
  const forceInMemory = process.env.USE_IN_MEMORY_DB === 'true';

  if (forceInMemory) {
    console.log('[Database] USE_IN_MEMORY_DB is set to true. Starting in-memory MongoDB...');
    await startInMemoryMongo();
    return;
  }

  try {
    // Attempt connecting to the configured MongoDB instance with a short timeout
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick fail if local MongoDB is not running
    });
    console.log(`[Database] Successfully connected to MongoDB at ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  } catch (error: any) {
    console.warn(`[Database] Unable to connect to MongoDB server (${error.message}).`);
    console.log('[Database] Falling back automatically to MongoMemoryServer for development & testing...');
    await startInMemoryMongo();
  }
};

const startInMemoryMongo = async (): Promise<void> => {
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] In-memory MongoDB started successfully at ${memoryUri}`);
  } catch (err: any) {
    console.error('[Database] Failed to start in-memory MongoDB:', err.message);
    throw err;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      mongoMemoryServerInstance = null;
    }
    console.log('[Database] Disconnected from MongoDB.');
  } catch (error: any) {
    console.error('[Database] Disconnect error:', error.message);
  }
};
