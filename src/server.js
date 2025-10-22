import express from 'express';
import config from './config/index.js';
import mainRouter from './routes/index.js'

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bem-vindo!',
    status: 'ok'
  });
});

app.use('/api', mainRouter);

app.listen(config.port, () => {
  console.log(`Servidor rodando na porta ${config.port}`);
  console.log(`Acesso local: http://localhost:${config.port}`);
});