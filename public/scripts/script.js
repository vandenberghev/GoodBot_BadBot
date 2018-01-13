// set up ======================================================================
var snoowrap            = require('snoowrap'),
    db                  = require('./db.js');

// configuration ===============================================================

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
     * Grab the 100 newest comments from /r/CryptoCurrency and check if
     * the comment says "good shill" or "bad shill". If so,
     * obtain the parent name, commenter's name, and good/bad result
     * to store in the database.
     * */
    scrape: function() {
		print('Trying to get comments...');
        /**
         * commentObj stores a returned promise containing 100 comments as JSON
         * */
        var commentObj = r.getNewComments('CryptoCurrency', {
            limit: 100
        });
    
	    print('Processing...');
		
        commentObj.then(function(listing) {
            listing.forEach(function(key) {
                /**
                 * Check if comment meets the search criteria. 
                 * If so, pass the comment object and vote to storeVote() to 
                 * handle the database insertions and commenting
                 * */
                var comment = key.body.substring(0,8).toLowerCase();
                
                
                if(comment.includes("good shill")) {
                    print("Found comment '" + key.body + "'");
                    _storeVote(key, "good");
                }
                else if(comment.includes("bad shill")) {
                    print("Found comment '" + key.body + "'");
                    _storeVote(key, "bad");
                }
            });
        });
    }
};

// helper function =============================================================

/**
 * @summary Grabs the parent comment's name and sends relevant information
 *      to addToDb();
 * @param {object} comment object containing the comment's metadata
 * @param {string} the vote (good or bad)
 * @returns No return value
 * */
function _storeVote(commentObj, result) {
    /**
	* TODO VVDB 20180113: does't need to be a comment, can be a post as well
     * The type prefix ("t1_") indicates that the comment's parent is a comment
     * */
    if (commentObj.parent_id.substring(0,2) == "t1") {
        var voterName = commentObj.author.name;
        print("The voter is " + voterName);
        
        /**
         * Find the username of the parent comment. This is the shill's name.
         * */
        r.getComment(commentObj.parent_id).fetch().then(function (obj) {
            var shillName = obj.author.name;
            var voterID = commentObj.name;
            var linkID = obj.link_id;
            print("The shill is " + shillName);
            /**
             * Check if the voter and shill name are the same. If not then
             * send shill name, voter name, vote result, and voter ID to addToDb found in
             * the db.js file. This handles the database interaction and commenting.
             * */
            if (shillName != voterName) {
                console.log('Adding to DB disabled');
				//db.addToDb(shillName, voterName, result, voterID, linkID);
            }
        });
    } else {
        print(voterName + " did not respond to a comment");
    }
}

function print(msg)
{
    console.log(new Date().toLocaleTimeString('nl-BE', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric"}) + ' ' + msg);
}