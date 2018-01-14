// set up ======================================================================
var mysql               = require('mysql'),
    snoowrap            = require('snoowrap'),
    stringSimilarity    = require('string-similarity');

// configuration ===============================================================

// DATABASE CONFIGURATION
const con = mysql.createConnection({
    host        :       process.env.DB_HOST,
    user        :       process.env.DB_USER,
    password    :       process.env.DB_PASSWORD,
    database    :       process.env.DB_DATABASE
});

// REDDIT API CONFIGURATION
const r = new snoowrap({
    userAgent       :       process.env.SNOO_USERAGENT,
    clientId        :       process.env.SNOO_CLIENTID,
    clientSecret    :       process.env.SNOO_CLIENTSECRET,
    username        :       process.env.SNOO_USERNAME,
    password        :       process.env.SNOO_PASSWORD
});

r.config({requestDelay: 1000, warnings: false});

// export function =============================================================

module.exports = {
    /**
    * @summary Called from app.js to store a hit into the database. Check if the shill
    *          exists in the database. Generate a score if not, otherwise tally the vote
    * @param {string} the shill's name
    * @param {string} the voter's name
    * @param {string} the vote (good or bad)
    * @param {string} the voter's ID
    * @param {string} the thread's unique ID
    * @returns No return value
    * */
    addToDb: function addToDb(shillName, vName, vote, voter_id, link_id) {
            
        var sql = "SELECT shillName FROM shill WHERE shillName = ?;";
    
        con.query(sql, [shillName], function(err, result) {
            if (err) {
                throw (err);
            }
            /**
             * Shill is not in database if result is empty
             * */
            if (Object.keys(result).length == 0) {
                _shillScore(shillName, vName, vote, voter_id, link_id);
            } else {
                console.log(shillName + " is already in the database");
                _addVoter(vName);
                _voterShillMatch(shillName, vName, vote, voter_id, link_id);
            }
        });
    }
};

// helper functions ============================================================

/**
* @summary Escapes underscores in usernames to prevent Reddit from italicising text
* @param {string} the username
* @return {string} the escaped username
* */
function _formatUName (username) {
    return (username).replace(/_/g, "\\_");
}

/**
* @summary Shill filtering score generator 
* @param {string} the shill's name
* @param {string} the voter's name
* @param {string} the vote (good or bad)
* @param {string} the voter's ID
* @param {string} the thread's unique ID
* @returns No return value
* */
function _shillScore (shillName, vName, vote, voter_id, link_id) {
    /*
    var counter = 30;
    var total = 0;
    var shillScore = 0;
    
    r.getUser(shillName).getComments({limit: counter}).then(function(listing) {
    */     
        /**
        * If the shill has less than (counter) comments, it is too new and defaults to 0.
        * */
		/*
        if (listing.length < counter) {
            console.log(shillName + " has too few comments");
        } else {
            var dataPoints = 0;
            
            listing.forEach(function(value, listIndex) {
                for(var i = listIndex; i < listing.length - 1; i++) {
                    dataPoints++;
                    total += stringSimilarity.compareTwoStrings(listing[listIndex].body, listing[i+1].body);
                }
            });
            
            shillScore = (total/dataPoints).toFixed(2);
            console.log(shillName + ": " + shillScore);
        }
		*/
        /**
         * A value of 0.3 or higher is a good indicator this is actually a shill
         * */
		 /*
        if (shillScore >= 0.3) {
            console.log(shillName + " is a shill: " + shillScore);
			*/
            _addShill(shillName);
            _addVoter(vName);
            _voterShillMatch(shillName, vName, vote, voter_id, link_id);
			/*
        } else {
            console.log(shillName + " is likely not a shill: " + shillScore);
        }
		
    });
	*/
}

/**
* @summary Inserts the shill's name into the shill table
* @param {string} the shill's name
* @returns No return value
* */
function _addShill (shillName) {
    
    var sql = "INSERT INTO shill (shillName, goodCount, badCount) VALUES (?, 0, 0)";
    
    con.query(sql, [shillName], function(err, result) {
        if (err) {
            if (err.code == "ER_DUP_ENTRY") {
                console.log(shillName + " is already in the database");
            } else { 
              throw(err);
            }
        } else {
            console.log(shillName + " was inserted into the shill table");
        }
    });
}

/**
* @summary Inserts the voter's name into the voter table if it does not exist
* @param {string} the voter's name
* @returns No return value
* */
function _addVoter (vName) {
    
    var sql = "SELECT voterName FROM voter WHERE voterName = ?;";
    
    con.query(sql, [vName], function(err, result) {
        if (err) {
            throw (err);
        }
        /**
         * Shill is not in database if result is empty
         * */
        if (Object.keys(result).length == 0) {
            var sql = "INSERT INTO voter (voterName) VALUES (?)";
            con.query(sql, [vName], function(err, result) {
                if (err) {
                    if (err.code == "ER_DUP_ENTRY")
                        console.log(vName + " is already in the database");
                    else
                        throw (err);
                } else {
                    console.log(vName + " was inserted into the voter table");
                }
            });
        } else {
            console.log(vName + " is already in the database");
        }
    });
}

/**
* @summary Determines if the voter has voted on the shill before
* @param {string} the shill's name
* @param {string} the voter's name
* @param {string} the vote (good or bad)
* @param {string} the voter's ID
* @returns no return value
* */
function _voterShillMatch (shillName, vName, vote, voter_id, link_id) {
    
    var sql = "SELECT * FROM shill INNER JOIN shill_voter ON shill.shill_id = shill_voter.shill_id INNER JOIN voter ON shill_voter.voter_id = voter.voter_id " +
        "WHERE shill.shillName = ? AND voter.voterName = ?;";
    
    con.query(sql, [shillName, vName], function(err, result) {
        if (err) {
            throw (err);
        }
        /**
         * an empty object will return if there is no match between the voter and shill
         * */
        if (Object.keys(result).length == 0) {
            console.log(vName + " has not yet voted for " + shillName);
            _createMatch(shillName, vName, vote);
            _addVoteToShill(shillName, vote);
            _replyToComment(vName, shillName, voter_id, link_id);
        } else {
            console.log(vName + " has already voted for " + shillName);
        }
    });
}

/**
* @summary Creates a match in the shill_voter table
* @param {string} the shill's name
* @param {string} the voter's name
* @returns No return value
* */
function _createMatch (shillName, vName, vote) {
    /**
     * Insert the shill ID, voter ID, vote, and time/date into the shill_voter table to prevent duplicate votes
     * */
    var date = new Date();
    var hour, day, month, year;

    hour = date.getHours();
    day = date.getDate();
    month = date.getMonth();
    year = date.getFullYear();
    
    var sql = "INSERT INTO shill_voter (shill_id, voter_id, vote, time, vote_hour, vote_day, vote_month, vote_year) VALUES ((SELECT shill_id FROM shill WHERE shillName = ?), " +
        "(SELECT voter_id FROM voter WHERE voterName = ?), ?, ?, ?, ?, ?, ?);";
    
    con.query(sql, [shillName, vName, vote, JSON.stringify(date), hour, day, month, year], function(err, result) {
        if (err) 
            throw (err);
        else
            console.log("Stored that " + vName + " has voted for " + shillName + " where:\nHour: " + hour + "\nDay: " + day +
            "\nMonth: " + month + "\nYear: " + year);
    });
}

/**
* @summary Increments the shill's goodCount or badCount by 1 in the shill table
* @param {string} the shill's name
* @param {string} the vote (good or bad)
* @returns No return value
* */
function _addVoteToShill(shillName, vote) {
    /**
     * Increment the goodCount or badCount depending on the voter comment
     * */
    if (vote == "good") {
        
        var sql = "UPDATE shill SET goodCount = goodCount + 1 WHERE shillName = ?;";
        
        con.query(sql, [shillName], function(err, result) {
            if (err) 
                throw (err);
            else
                console.log("Added a good shill vote to " + shillName);
        });
    } else {
        
        var sql = "UPDATE shill SET badCount = badCount + 1 WHERE shillName = ?;";
        
        con.query(sql, [shillName], function(err, result) {
            if (err) 
                throw (err);
            else
                console.log("Added a bad shill vote to " + shillName);
        });
    }
}

/**
* @summary Reply to voter (once per thread) 
* @param {string} the voter's name
* @param {string} the shill's name
* @param {string} the voter's ID
* @param {string} the thread's unique ID
* @returns No return value
* */
function _replyToComment(vName, shillName, voter_id, link_id) {
    
    var message = "Thank you, " + _formatUName(vName) + ", for voting on " + _formatUName(shillName) + ".  \n\n" +
        "This bot wants to find the best and worst shills on /r/CryptoCurrency." +
		/* [You can view results here](" + process.env.RESULTS_LINK + ")." + */
        "  \n\n ***  \n\n" +
        "^^Even ^^if ^^I ^^don't ^^reply ^^to ^^your ^^comment, ^^I'm ^^still ^^listening ^^for ^^votes. " +
		"\n\n^^I'm ^^still ^^work ^^in ^^progress.";
        /* "^^Check ^^the ^^webpage ^^to ^^see ^^if ^^your ^^vote ^^registered!"; */
    
    var sql = "SELECT link_id FROM link WHERE link_id = ?;";
    
    con.query(sql, [link_id], function(err, result) {
        if (err) {
            throw (err);
        }
        /**
         * link_id is not in database if result is empty
         * */
        if (Object.keys(result).length == 0) {
            /**
             * Reply to voter with a link to the results page if there is no reply in the thread.
             * */
            console.log("Replying to " + vName);
            r.getSubmission(voter_id).reply(message);
            
            /**
             * Insert the link_id into the link table
             * */
            var sql = "INSERT INTO link (link_id) VALUES (?)";
            
            con.query(sql, [link_id], function(err, result) {
                if (err) {
                    if (err.code == "ER_DUP_ENTRY") {
                        console.log(link_id + " is already in the database");
                    } else { 
                      throw(err);
                    }
                } else {
                    console.log(link_id + " was inserted into the link table");
                }
            });
        } else {
            console.log("Thread " + link_id + " already has a shill comment");
        }
    });
}
