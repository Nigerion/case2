import 'dotenv/config';
import app from './app.js';
import { env } from "./config/env.js";

const port = Number(process.env.PORT) || 3000;

app.listen(env.port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});