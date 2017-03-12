const express = require('express'),
    app = express(),
    port = process.env.PORT || 9000;

app.use(express.static(__dirname + '/public'));

app.listen(port, () => {
    console.log("Listen to port " + port);
});