
drop table tickets_trace;
drop table tickets;
drop table show;
drop table starb;

CREATE TABLE show (
    id SERIAL primary key,
    name        varchar(250),
    showtime    varchar(250),
    pricenames  varchar(250) ,
    authlist    varchar(250) default '',
    userid  int references users on delete cascade
);

CREATE INDEX show_user ON show (userid);
CREATE INDEX show_name ON show (name);
CREATE INDEX show_time ON show (showtime);


CREATE TABLE tickets (
    id SERIAL primary key,
    showid  int references show on delete cascade,
    showtime varchar(50),
    price    int,
    kk       varchar(10) default 'kort',
    ant      smallint default 0,
    jd       int,
    userid  int references users on delete cascade,
    saletime int
);
CREATE INDEX tickets_user ON tickets (userid);
CREATE INDEX tickets_show ON tickets (showid);
CREATE INDEX tickets_time ON tickets (showtime);

CREATE TABLE tickets_trace (
    id SERIAL primary key,
    showid  int references show on delete cascade,
    showtime varchar(50),
    price    int,
    kk       varchar(10) default 'kort',
    ant      smallint default 0,
    jd       int,
    userid  int references users on delete cascade,
    saletime int
);

CREATE TABLE tickets_trace (
    id SERIAL primary key,
    showid  int references show on delete cascade,
    showtime varchar(50),
    price    int,
    kk       varchar(10) default 'kort',
    ant      smallint default 0,
    jd       int,
    userid  int references users on delete cascade,
    saletime int
);

-- store each starbreg in this table
-- ip will be set if stud uses starbkey to register
-- will be empty if registered by teacher
CREATE TABLE starb (
    id SERIAL primary key,
    julday  int not null,
    userid  int references users on delete set null,
    teachid int references users on delete set null,
    roomid  int default 1 references room on delete set default,
    ip varchar(20) default '',
    UNIQUE (userid,julday)
    );

CREATE INDEX starb_julday ON starb (julday);
CREATE INDEX starb_userid ON starb (userid);
CREATE INDEX starb_teachid ON starb (teachid);
CREATE INDEX starb_roomid ON starb (roomid);
CREATE INDEX starb_ip ON starb (ip);
CREATE INDEX starb_julip ON starb (julday,ip);

-- teacher generates a new starbkey for users to
-- register with - its time-limited and
-- is counted down (ecount) for each stud
-- using strabkey will logg ip of stud
-- this ip can not be used to register with again
--  old ip (from day before and older) are pruned
--  each time a new starbkey is generated
CREATE TABLE starbkey (
    id SERIAL primary key,
    julday  int not null,
    roomid  int default 1 references room on delete set default,
    teachid int references users on delete set null,
    regkey  int not null,
    ecount  int default 30,
    start   smallint default 60*12 + 10, -- default start-time for starb
    minutes smallint default 20
);

CREATE INDEX starbkey_regkey ON starbkey (regkey);
CREATE INDEX starbkey_teachid ON starbkey (teachid);

