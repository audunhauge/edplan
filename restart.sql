-- clean-up for rerunning import
-- redefine these so all autoincrements start at zero
drop table starb;
drop table enrol;
drop table teacher;
drop table course;
drop table room;
drop table members;
drop table groups;
drop table subject;

delete from users;
delete from periode;






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


CREATE TABLE starb (
    id SERIAL primary key,
    julday  int not null,
    userid  int references users on delete set null,
    teachid int references users on delete set null,
    roomid  int default 1 references room on delete set default
    );

delete from plan where state=0;
delete from calendar where eventtype != 'aarsplan' and eventtype != 'fridager';
insert into periode (id,name,info,startyear,startweek,numweeks) values (1,'2011/2012','skoleåret 2011/2012',2011,33,45);
insert into plan (id,name) values (1,'noplan');
