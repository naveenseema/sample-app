const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send(`Hello from sample-app (version=${process.env.VERSION || 'dev'})`));
app.listen(port, () => console.log(`Listening on ${port}`));

