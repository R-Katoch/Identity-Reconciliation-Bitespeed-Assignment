import express from 'express';
import routes from './routes/router.mjs';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors({
    origin: "*",
}));
app.use('/api', routes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
});

// Start server on port 3000
app.listen(3000, () => {
    console.log('Server started on port 3000');
});