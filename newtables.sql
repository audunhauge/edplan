
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
    saletime int(4)
);
CREATE INDEX tickets ON tickets (userid);
CREATE INDEX tickets ON tickets (showid);
CREATE INDEX tickets ON tickets (showtime);

CREATE TABLE tickets_trace (
    id SERIAL primary key,
    showid  int references show on delete cascade,
    showtime varchar(50),
    price    int,
    kk       varchar(10) default 'kort',
    ant      smallint default 0,
    jd       int,
    userid  int references users on delete cascade,
    saletime int(4)
);

