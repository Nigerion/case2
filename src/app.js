import express from 'express';
import helmet from 'helmet';

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(helmet());

app.get('/api/health', (req, res) => {
  res.status(200).json(
    {
        status: "ok",
        message:"I'm alive!"
    }
  );
});


export default app;