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
- $npm install graphql express-graphql

- add schema folder to server
- add schema.js file to schema folder


**** Alternativ modszer ****
https://www.freecodecamp.org/news/a-beginners-guide-to-graphql-86f849ce1bec/

** HÁROM LEGFONTOSABB: QUERY, MUTATION(CUD), SUBSCRIPTION!!!! **

- $npm install --save-dev graphpack

- add code to package.json:

/*

"scripts": {
    "dev": "graphpack",
    "build": "graphpack build"
}

*/

- create src folder and add files:
- db.js
- resolvers.js
- schema.graphql

- $npm run dev


