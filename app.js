const express = require('express')
const bodyParser = require("body-parser");
 
const app = express()
const port = 31415

app.use(express.static(__dirname + '/static'))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
    console.log(`Starting VideoGrabber server...`)
    console.log(`Running on port ${port}!`)
    console.log(`Connect through a browser at \"http://localhost:${port}\"!`)
});

app.get('/hello', function (req, res) {
    res.send("mukyu!")
});

app.get('*', function(req, res){
    res.status(404).send("myonmyonmyonmyonmyon<br/>" +
        "<br/>" +
        "I've been told that I can't put any Touhou images. Unfortunate.<br/>" +
        "Oh, you're here because your file doesn't exist. Only the root (static stuff) exists.<br/>" +
        "<a href='/'>Go back. >:[</a><hr/>" +
        "<i>Powered by William-was-too-lazy-to-make-a-proper-404-page</i>");
});