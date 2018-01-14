// set up ======================================================================

var express         = require('express'),
    app             = express(),
    bodyParser      = require('body-parser'),
    script          = require('./public/scripts/script.js');
    
// ROUTES
var indexRoutes     = require('./routes/index');

// configuration ===============================================================

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// routes ======================================================================

app.use("/", indexRoutes);

app.listen(process.env.PORT, process.env.IP, function() {
    console.log('GoodShill_BadShill app starting on port ' + process.env.PORT);
});

// scraper ====================================================================

// Every 2.2 seconds, call scrape() to search Reddit for new comments
setInterval(function() {
  script.scrape();
}, 10000);