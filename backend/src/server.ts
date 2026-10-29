import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🛡️  UNIFIED RECONNAISSANCE PLATFORM API SERVER`);
      console.log(`📡 Listening on http://localhost:${PORT}`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });
  } catch (error: any) {
    console.error('Fatal bootstrap error:', error.message);
    process.exit(1);
  }
}

bootstrap();
