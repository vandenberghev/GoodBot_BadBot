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
    PRIMARY KEY (shill_id, voter_id),
    FOREIGN KEY (shill_id) REFERENCES shill (shill_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (voter_id) REFERENCES voter (voter_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;