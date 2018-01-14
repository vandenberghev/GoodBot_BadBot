// set up ======================================================================

const NUMBER_OF_POSTS	= 500;
//const SUBREDDIT			= 'CryptoCurrency';
const SUBREDDIT			= 'test';

var snoowrap            = require('snoowrap'),
    db                  = require('./db.js'),
	treatedCache		= new Array(NUMBER_OF_POSTS),
	cachePointer		= 0;

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
    scrape: function()
	{
		print('Fetching comments and processing...');

		// commentObj stores a returned promise containing X comments as JSON
        var commentObj = r.getNewComments(SUBREDDIT, { limit: NUMBER_OF_POSTS });	
		var newComments = 0;
		
        commentObj.then(function(listing) {		
            listing.forEach(function(key) {
				//Check if we haven't already processed this comment
				var commentId = key.id;
				var treated = treatedCache.includes(commentId); 
				
				if (!treated) 
				{
					/**
					 * Check if comment meets the search criteria. 
					 * If so, pass the comment object and vote to storeVote() to 
					 * handle the database insertions and commenting
					 * */

					var comment = key.body.substring(0,10).toLowerCase();
					
					if(comment.includes("good shill")) {
						print("Found comment '" + key.body + "'");
						_storeVote(key, "good");
					}
					else if(comment.includes("bad shill")) {
						print("Found comment '" + key.body + "'");
						_storeVote(key, "bad");
					}
					
					newComments++;
					markAsTreated(commentId);
				}
				/*else
				{
					//print("ALREADY TREATED");
				}*/
            });
			
			print(newComments + ' new comments treated.');
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
	* TODO VVDB 20180113: does't need to be a comment, can be a submission (t3) as well
     * The type prefix ("t1_") indicates that the comment's parent is a comment
     * */
	var voterName = commentObj.author.name;
	
    if (commentObj.parent_id.substring(0,2) == "t1") {
        //print("The voter replied to a comment and is " + voterName);
        r.getComment(commentObj.parent_id).fetch().then(function(obj){checkAndAddShill(obj, commentObj, result);});
    }
	else if (commentObj.parent_id.substring(0,2) == "t3")
	{
        //print(voterName + " replied to a post");
		r.getSubmission(commentObj.parent_id).fetch().then(function(obj){checkAndAddShill(obj, commentObj, result);});
    }
}

function markAsTreated(commentId) //Rolling array
{
	treatedCache[cachePointer++] = commentId;
	if (cachePointer >= NUMBER_OF_POSTS) cachePointer = 0;
	//print('cachePointer [' + cachePointer + ']');
}

function checkAndAddShill(shillObj, commentObj, result)
{
	if (shillObj === null)
	{
		print("Parent could not be fetched");
		return;
	}
	
	var voterName = commentObj.author.name;
	var shillName = shillObj.author.name;
	var voterID = commentObj.name;
	var linkID = shillObj.link_id;
	
	print('Processing [' + result + '] vote by [' + voterName + '] for shill [' + shillName + ']');
	
	/**
	 * Check if the voter and shill name are the same. If not then
	 * send shill name, voter name, vote result, and voter ID to addToDb found in
	 * the db.js file. This handles the database interaction and commenting.
	 * */
	if (shillName != voterName) {
		console.log('Adding to DB disabled');
		//db.addToDb(shillName, voterName, result, voterID, linkID);
	}
}

function print(msg)
{
    console.log(new Date().toLocaleTimeString('nl-BE', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric"}) + ' ' + msg);
}

function dump(o)
{
	console.log("%o", o);
}