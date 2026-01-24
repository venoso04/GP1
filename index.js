import express from 'express';
import './db/connection.js'
import { authRouter } from './modules/auth/auth.routes.js';


const app = express()
const port = 3001

app.use(express.json())
app.use('/auth',authRouter)

app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`listening on port ${port}!`))