-- table definitions for eduplanner
drop table starb;
drop table enrol;
drop table teacher;
drop table course;
drop table weekplan;
drop table plan;
drop table room;
drop table members;
drop table groups;
drop table users;
drop table periode;
drop table calendar;
drop table subject;
drop table quiz;
drop table quiz_question;
drop table quiz_useranswer;
drop table quiz_container;


CREATE TABLE users (
    id SERIAL primary key,
    username     varchar(20) not null UNIQUE,
    firstname    varchar(80) not null,
    lastname     varchar(80) not null,
    password     varchar(32) not null,
    email        varchar(132) default '',
    institution  varchar(32) default '',
    department   varchar(32) default '',
    feide        varchar(32) default '',
    ini4         varchar(4)   -- initials used by SATS
    );

CREATE INDEX user_institution ON users (institution);
CREATE INDEX user_department ON users (department);
--insert into users (username,firstname,lastname,password,institution,department) values ('ole','ole','olsen','ole','1sta','oili');
--insert into users (username,firstname,lastname,password,institution,department) values ('audun','audun','hauge','audun','teach','realfag');

-- a periode for plans
CREATE TABLE periode (
    id SERIAL primary key,
    name varchar(30) not null ,
    info  varchar,
    startyear int,  -- year the plan starts
    startweek int, -- week the plan starts
    numweeks int default 47 -- number of weeks (including free weeks) the plan covers
    );
insert into periode (name,info,startyear,startweek,numweeks) values ('2011/2012','skoleåret 2011/2012',2011,33,45);

-- a plan for a course - can be used for more than one
CREATE TABLE plan (
    id SERIAL primary key,
    name varchar(30) not null ,
    info  varchar,
    userid  int references users on delete cascade,
    periodeid  int default 1 references periode on delete set default,
    category smallint default 0,
    state smallint default 0
    );
CREATE INDEX plan_name ON plan (name);

insert into plan (name) values ('noplan');

-- weekly entries for a plan
CREATE TABLE weekplan (
    id SERIAL primary key,
    plantext varchar,
    sequence smallint default 0,
    planid  int references plan on delete cascade
    );
CREATE INDEX weekplan_sequence ON weekplan (sequence);

-- groups
CREATE TABLE groups (       -- all students are enrolled in groups
    id SERIAL primary key,
    groupname varchar(62) not null UNIQUE,
    roleid int default 0
    );
CREATE INDEX groups_roleid ON groups (roleid);
insert into groups (groupname) values ('nogroup');
insert into groups (groupname) values ('students');
insert into groups (groupname) values ('teachers');

-- members
CREATE TABLE members (       -- student mebers of a group
    id SERIAL primary key,
    userid   int references users,
    groupid  int references groups
    );
CREATE INDEX members_courseid ON members (userid);
CREATE INDEX members_groupid ON members (groupid);
--insert into members (userid,groupid) values (1,2);
--insert into members (userid,groupid) values (2,3);

-- subjects
CREATE TABLE subject (      -- all courses are based on a subject and a group
    id SERIAL primary key,
    subjectname varchar(42) not null UNIQUE,
    description varchar
    );

--insert into subject (subjectname) values ('nosubject');

-- courses
CREATE TABLE course (
    id SERIAL     primary key,
    shortname     varchar(30) not null UNIQUE,
    fullname      varchar(80) not null,
    category      smallint default 0,
    subjectid     int default 1 references subject on delete set default,
    planid        int default 1 references plan on delete set default
    );
CREATE INDEX course_planid ON course (planid);
--insert into course (shortname,fullname,category) values ('test_1234','test is just a name',1);

-- teachers   all teachers and teach-like roles defined here
-- this saves creating groups of teachers - most with only a single member
CREATE TABLE teacher (
    id       SERIAL primary key,
    courseid int references course,
    userid   int references users,
    roleid   int default 0
    );
CREATE INDEX teacher_course ON teacher (courseid);
CREATE INDEX teacher_user ON teacher (userid);
--insert into teacher (userid,courseid) values (2,1);

-- enrolment   enrol groups into courses
CREATE TABLE enrol (
    id       SERIAL primary key,
    courseid int references course,
    groupid  int references groups
    );
CREATE INDEX enrol_groupid ON enrol (groupid);
CREATE INDEX enrol_courseid ON enrol (courseid);
--insert into enrol (groupid,courseid) values (2,1);

-- rooms
CREATE TABLE room (
    id SERIAL primary key,
    name varchar(32) not null UNIQUE
    );
--insert into room (name) values ('nn');



CREATE TABLE calendar (
    id SERIAL    primary key,
    julday       int not null,
    userid       int ,
    teachid      int ,
    roomid       int ,
    courseid     int ,
    eventtype    varchar(32),
    day          smallint default 0,
    slot         smallint default 0,
    class        smallint default 0,
    name         varchar(32) default '',
    value        varchar default ''
    );
CREATE INDEX calendar_julday ON calendar (julday);
CREATE INDEX calendar_userid ON calendar (userid);
CREATE INDEX calendar_teachid ON calendar (teachid);
CREATE INDEX calendar_roomid ON calendar (roomid);
CREATE INDEX calendar_eventtype ON calendar (eventtype);

CREATE TABLE quiz_question (
    id SERIAL primary key,
    name varchar(64) not null,
    tags varchar default '',
    points  smallint default 1,
    qtype varchar(32) not null default 'multiple',
    qtext varchar
    teachid int references users on delete set null,
    created  int not null,
    modified  int not null,
    parent int default 0,    -- if this question is a copy - id of source
);

CREATE TABLE quiz_useranswer (
    id SERIAL primary key,
    qid int references quiz_question on delete set null,
    userid int references users on delete set null,
    response varchar,
    score smallint default 0,
    attemptnum smallint default 0,
    teachcomment varchar,
    usercomment varchar,
    certanty smallint default 0,
    time int,
    param varchar,   -- used by dynamically generated questions
    instance int default 0   -- for dynamic questions ( text generated by sympy etc) 
    -- we may have more than one instance of a given question on the page
);


CREATE TABLE quiz_container (
    id SERIAL primary key,
    cid int references quiz_question on delete set null,  -- the question containing this question
    qid int references quiz_question on delete set null  -- the contained question
);

CREATE TABLE quiz (
    id SERIAL primary key,
    name varchar(64) not null,
    julday  int not null,
    time int,
    teachid int references users on delete set null,
    cid int references quiz_question on delete set null
);

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




