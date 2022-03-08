- create new mapp (server)
- $cd server
- $npm init
- $npm install express

- create new file (app.js)
- add express app

** 
const express = require('express');

const app = express();

app.listen(4000, () => {
    console.log('Now listening for request on port 4000');
});
**

- $node app