// set up ======================================================================

var mysql           = require("mysql"),
    express         = require("express"),
    router          = express.Router();

// configuration ===============================================================

// DATABASE CONFIGURATION
const con = mysql.createConnection({
    host        :       process.env.DB_HOST,
    user        :       process.env.DB_USER,
    password    :       process.env.DB_PASSWORD,
    database    :       process.env.DB_DATABASE
});

// routes ======================================================================

// ROUTE FOR HOMEPAGE, DISPLAYS TOP 10 BEST BOTS
router.get('/', function (req, res) {
    
    var total;                  //Total number of shill votes
    var goodCount;              //Total number of good shill votes
    var badCount;               //Total number of bad shill votes
    var bestShillNameArr = [];    //Array of best shill names
    var bestShillScoreArr = [];   //Array of highest confidence interval scores
    
    /**
     * Query for total number of votes
     * */
    var sql = "SELECT SUM(goodCount), SUM(badCount), SUM(goodCount) + SUM(badCount) FROM shill;";
    con.query(sql, function(err, result) {
        if (err) {
            throw (err);
        }
        total = result[0]['SUM(goodCount) + SUM(badCount)'];
        goodCount = result[0]['SUM(goodCount)'];
        badCount = result[0]['SUM(badCount)'];
    });
    
    /**
     * Query for top 10 best shills
     * */
    var sql = "SELECT shillName, ((goodCount + 1.9208) / (goodCount + badCount) - " +
                "1.96 * SQRT((goodCount * badCount) / (goodCount + badCount) + 0.9604) / " +
                "(goodCount + badCount)) / (1 + 3.8416 / (goodCount + badCount)) " +
                "AS ci_lower_bound FROM shill WHERE goodCount + badCount > 0 " +
                "ORDER BY ci_lower_bound DESC limit 10;";

    con.query(sql, function(err, result) {
        if (err) 
            throw (err);
            
        result.forEach(function(key) {
            bestShillNameArr.push(key.shillName);
            bestShillScoreArr.push(key.ci_lower_bound);
        });
    
        res.render('home.ejs', 
            {
                total: total,
                goodCount: goodCount,
                badCount: badCount,
                bestShillName: bestShillNameArr,
                bestShillScore: bestShillScoreArr
            }
        );
        
    });
});

// ROUTE FOR DISPLAYING TOP 10 WORST BOTS
router.get('/worst_filter', function (req, res) {
    
    var total;                  //Total number of shill votes
    var goodCount;              //Total number of good shill votes
    var badCount;               //Total number of bad shill votes
    var worstShillNameArr = [];    //Array of worst shill names
    var worstShillScoreArr = [];   //Array of lowest confidence interval scores
    
    /**
     * Query for total number of votes
     * */
    var sql = "SELECT SUM(goodCount), SUM(badCount), SUM(goodCount) + SUM(badCount) FROM shill;";
    con.query(sql, function(err, result) {
        if (err) {
            throw (err);
        }
        total = result[0]['SUM(goodCount) + SUM(badCount)'];
        goodCount = result[0]['SUM(goodCount)'];
        badCount = result[0]['SUM(badCount)'];
    });
    
    /**
     * Query for top 10 worst shills
     * */
    var sql = "SELECT shillName, ((badCount + 1.9208) / (badCount + goodCount) - " +
                "1.96 * SQRT((badCount * goodCount) / (badCount + goodCount) + 0.9604) / " +
                "(badCount + goodCount)) / (1 + 3.8416 / (badCount + goodCount)) " +
                "AS one_minus_ci_upper_bound FROM shill WHERE badCount + goodCount > 0 " +
                "ORDER BY one_minus_ci_upper_bound DESC limit 10;";

    con.query(sql, function(err, result) {
        if (err) 
            throw (err);
            
        result.forEach(function(key) {
            worstShillNameArr.push(key.shillName);
            worstShillScoreArr.push(key.one_minus_ci_upper_bound);
        });
        
        res.render('worst_filter.ejs', 
            {
                total: total,
                goodCount: goodCount,
                badCount: badCount,
                worstShillName: worstShillNameArr,
                worstShillScore: worstShillScoreArr
            }
        );
        
    });
});

// ROUTE FOR SHOWING ALL BOTS
router.get('/all_filter', function(req, res) {
    
    var byBestArr = [];
    
    /**
     * Query for all shills and scores
     * */
    var sql = "SELECT shillName, goodCount, badCount, ROUND(((goodCount + 1.9208) / (goodCount + badCount) - " +
                "1.96 * SQRT((goodCount * badCount) / (goodCount + badCount) + 0.9604) / " +
                "(goodCount + badCount)) / (1 + 3.8416 / (goodCount + badCount)),4) " +
                "AS ci_lower_bound FROM shill WHERE goodCount + badCount > 0 " +
                "ORDER BY ci_lower_bound DESC;";
    
    con.query(sql, function(err, result) {
        if (err) {
            throw (err);
        }
        byBestArr = result;
        res.render('all_filter.ejs', {byBestArr: byBestArr});
    });
});

// ROUTE FOR CHECKING USER VOTES
router.post('/voter', function(req, res) {
    
    /**
     * Query for all shills a voter has voted for
     * */
    var sql = "SELECT shillName FROM shill INNER JOIN shill_voter ON shill.shill_id = shill_voter.shill_id " +
        "INNER JOIN voter ON shill_voter.voter_id = voter.voter_id " +
        "WHERE voter.voterName = ? ORDER BY shillName;";
    
    var inserts = [req.body.voter];
    sql = mysql.format(sql, inserts);
    
    con.query(sql, function(err, result) {
        if (err) {
            throw (err);
        }
        res.render('voter.ejs', {voter: req.body.voter, shill: result});
    });
});

module.exports = router;