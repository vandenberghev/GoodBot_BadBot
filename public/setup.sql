DROP TABLE IF EXISTS shill_voter;
DROP TABLE IF EXISTS shill;
DROP TABLE IF EXISTS voter;

CREATE TABLE shill (
    shill_id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    shillName varchar(255) NOT NULL UNIQUE KEY,
    goodCount int(11) NOT NULL,
    badCount int(11) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE voter (
    voter_id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    voterName varchar(255) NOT NULL UNIQUE KEY
) ENGINE=InnoDB;

CREATE TABLE shill_voter (
    shill_id int(11) NOT NULL,
    voter_id int(11) NOT NULL,
	vote varchar(4) NOT NULL, 
	time varchar(50) NOT NULL, 
	vote_hour int(2) NOT NULL, 
	vote_day int(2) NOT NULL, 
	vote_month int(2) NOT NULL, 
	vote_year int(4) NOT NULL,
    PRIMARY KEY (shill_id, voter_id),
    FOREIGN KEY (shill_id) REFERENCES shill (shill_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (voter_id) REFERENCES voter (voter_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE link (
    link_id varchar(255) NOT NULL PRIMARY KEY
) ENGINE=InnoDB;