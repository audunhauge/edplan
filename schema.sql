--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = off;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET escape_string_warning = off;

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: calendar; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE calendar (
    id integer NOT NULL,
    julday integer NOT NULL,
    userid integer,
    teachid integer,
    roomid integer,
    courseid integer,
    eventtype character varying(32),
    day smallint DEFAULT 0,
    slot smallint DEFAULT 0,
    class smallint DEFAULT 0,
    name character varying(32) DEFAULT ''::character varying,
    value character varying DEFAULT ''::character varying
);


ALTER TABLE public.calendar OWNER TO admin;

--
-- Name: calendar_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE calendar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.calendar_id_seq OWNER TO admin;

--
-- Name: calendar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE calendar_id_seq OWNED BY calendar.id;


--
-- Name: course; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE course (
    id integer NOT NULL,
    shortname character varying(30) NOT NULL,
    fullname character varying(80) NOT NULL,
    category smallint DEFAULT 0,
    subjectid integer DEFAULT 1,
    planid integer DEFAULT 1
);


ALTER TABLE public.course OWNER TO admin;

--
-- Name: course_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE course_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.course_id_seq OWNER TO admin;

--
-- Name: course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE course_id_seq OWNED BY course.id;


--
-- Name: enrol; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE enrol (
    id integer NOT NULL,
    courseid integer,
    groupid integer
);


ALTER TABLE public.enrol OWNER TO admin;

--
-- Name: enrol_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE enrol_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.enrol_id_seq OWNER TO admin;

--
-- Name: enrol_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE enrol_id_seq OWNED BY enrol.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE groups (
    id integer NOT NULL,
    groupname character varying(62) NOT NULL,
    roleid integer DEFAULT 0
);


ALTER TABLE public.groups OWNER TO admin;

--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.groups_id_seq OWNER TO admin;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE groups_id_seq OWNED BY groups.id;


--
-- Name: members; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE members (
    id integer NOT NULL,
    userid integer,
    groupid integer,
    flag smallint DEFAULT 0
);


ALTER TABLE public.members OWNER TO admin;

--
-- Name: members_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.members_id_seq OWNER TO admin;

--
-- Name: members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE members_id_seq OWNED BY members.id;


--
-- Name: periode; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE periode (
    id integer NOT NULL,
    name character varying(30) NOT NULL,
    info character varying,
    startyear integer,
    startweek integer,
    numweeks integer DEFAULT 47
);


ALTER TABLE public.periode OWNER TO admin;

--
-- Name: periode_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE periode_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.periode_id_seq OWNER TO admin;

--
-- Name: periode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE periode_id_seq OWNED BY periode.id;


--
-- Name: plan; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE plan (
    id integer NOT NULL,
    name character varying(30) NOT NULL,
    info character varying,
    userid integer,
    periodeid integer DEFAULT 1,
    category smallint DEFAULT 0,
    state smallint DEFAULT 0
);


ALTER TABLE public.plan OWNER TO admin;

--
-- Name: plan_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE plan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.plan_id_seq OWNER TO admin;

--
-- Name: plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE plan_id_seq OWNED BY plan.id;


--
-- Name: question_container; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE question_container (
    id integer NOT NULL,
    cid integer,
    qid integer
);


ALTER TABLE public.question_container OWNER TO admin;

--
-- Name: question_container_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE question_container_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.question_container_id_seq OWNER TO admin;

--
-- Name: question_container_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE question_container_id_seq OWNED BY question_container.id;


--
-- Name: quiz; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE quiz (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    julday integer DEFAULT 0,
    "time" integer DEFAULT 0,
    teachid integer,
    cid integer,
    courseid integer
);


ALTER TABLE public.quiz OWNER TO admin;

--
-- Name: quiz_container; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE quiz_container (
    id integer NOT NULL,
    cid integer,
    qizid integer
);


ALTER TABLE public.quiz_container OWNER TO admin;

--
-- Name: quiz_container_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE quiz_container_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.quiz_container_id_seq OWNER TO admin;

--
-- Name: quiz_container_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE quiz_container_id_seq OWNED BY quiz_container.id;


--
-- Name: quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE quiz_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.quiz_id_seq OWNER TO admin;

--
-- Name: quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE quiz_id_seq OWNED BY quiz.id;


--
-- Name: quiz_qtag; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE quiz_qtag (
    tid integer,
    qid integer
);


ALTER TABLE public.quiz_qtag OWNER TO admin;

--
-- Name: quiz_question; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE quiz_question (
    id integer NOT NULL,
    name character varying(64) DEFAULT ''::character varying,
    points smallint DEFAULT 1,
    qtype character varying(32) DEFAULT 'multiple'::character varying NOT NULL,
    qtext character varying DEFAULT ''::character varying,
    qfasit character varying DEFAULT ''::character varying,
    teachid integer,
    created bigint NOT NULL,
    modified bigint NOT NULL,
    parent integer DEFAULT 0,
    subject character varying(50) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.quiz_question OWNER TO admin;

--
-- Name: quiz_question_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE quiz_question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.quiz_question_id_seq OWNER TO admin;

--
-- Name: quiz_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE quiz_question_id_seq OWNED BY quiz_question.id;


--
-- Name: quiz_tag; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE quiz_tag (
    id integer NOT NULL,
    tagname character varying(36) NOT NULL,
    teachid integer
);


ALTER TABLE public.quiz_tag OWNER TO admin;

--
-- Name: quiz_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE quiz_tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.quiz_tag_id_seq OWNER TO admin;

--
-- Name: quiz_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE quiz_tag_id_seq OWNED BY quiz_tag.id;


--
-- Name: quiz_useranswer; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE quiz_useranswer (
    id integer NOT NULL,
    qid integer,
    cid integer,
    userid integer,
    response character varying DEFAULT ''::character varying,
    score real DEFAULT 0.0,
    attemptnum smallint DEFAULT 0,
    teachcomment character varying DEFAULT ''::character varying,
    usercomment character varying DEFAULT ''::character varying,
    certanty smallint DEFAULT 0,
    "time" bigint,
    param character varying DEFAULT ''::character varying,
    instance integer DEFAULT 0,
    feedback character varying DEFAULT ''::character varying,
    hintcount smallint DEFAULT 0
);


ALTER TABLE public.quiz_useranswer OWNER TO admin;

--
-- Name: quiz_useranswer_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE quiz_useranswer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.quiz_useranswer_id_seq OWNER TO admin;

--
-- Name: quiz_useranswer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE quiz_useranswer_id_seq OWNED BY quiz_useranswer.id;


--
-- Name: room; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE room (
    id integer NOT NULL,
    name character varying(32) NOT NULL
);


ALTER TABLE public.room OWNER TO admin;

--
-- Name: room_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE room_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.room_id_seq OWNER TO admin;

--
-- Name: room_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE room_id_seq OWNED BY room.id;


--
-- Name: show; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE show (
    id integer NOT NULL,
    name character varying(250),
    showtime character varying(250),
    pricenames character varying(250),
    authlist character varying(250) DEFAULT ''::character varying,
    userid integer
);


ALTER TABLE public.show OWNER TO admin;

--
-- Name: show_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE show_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.show_id_seq OWNER TO admin;

--
-- Name: show_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE show_id_seq OWNED BY show.id;


--
-- Name: starb; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE starb (
    id integer NOT NULL,
    julday integer NOT NULL,
    userid integer,
    teachid integer,
    roomid integer DEFAULT 1,
    ip character varying(20) DEFAULT ''::character varying
);


ALTER TABLE public.starb OWNER TO admin;

--
-- Name: starb_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE starb_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.starb_id_seq OWNER TO admin;

--
-- Name: starb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE starb_id_seq OWNED BY starb.id;


--
-- Name: starbkey; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE starbkey (
    id integer NOT NULL,
    julday integer NOT NULL,
    roomid integer DEFAULT 1,
    teachid integer,
    regkey integer NOT NULL,
    ecount integer DEFAULT 30,
    start smallint DEFAULT ((60 * 12) + 10),
    minutes smallint DEFAULT 20
);


ALTER TABLE public.starbkey OWNER TO admin;

--
-- Name: starbkey_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE starbkey_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.starbkey_id_seq OWNER TO admin;

--
-- Name: starbkey_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE starbkey_id_seq OWNED BY starbkey.id;


--
-- Name: subject; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE subject (
    id integer NOT NULL,
    subjectname character varying(42) NOT NULL,
    description character varying
);


ALTER TABLE public.subject OWNER TO admin;

--
-- Name: subject_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE subject_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.subject_id_seq OWNER TO admin;

--
-- Name: subject_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE subject_id_seq OWNED BY subject.id;


--
-- Name: teacher; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE teacher (
    id integer NOT NULL,
    courseid integer,
    userid integer,
    roleid integer DEFAULT 0
);


ALTER TABLE public.teacher OWNER TO admin;

--
-- Name: teacher_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE teacher_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.teacher_id_seq OWNER TO admin;

--
-- Name: teacher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE teacher_id_seq OWNED BY teacher.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE tickets (
    id integer NOT NULL,
    showid integer,
    showtime character varying(50),
    price integer,
    kk character varying(10) DEFAULT 'kort'::character varying,
    ant smallint DEFAULT 0,
    jd integer,
    userid integer,
    saletime integer
);


ALTER TABLE public.tickets OWNER TO admin;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE tickets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.tickets_id_seq OWNER TO admin;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE tickets_id_seq OWNED BY tickets.id;


--
-- Name: tickets_trace; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE tickets_trace (
    id integer NOT NULL,
    showid integer,
    showtime character varying(50),
    price integer,
    kk character varying(10) DEFAULT 'kort'::character varying,
    ant smallint DEFAULT 0,
    jd integer,
    userid integer,
    saletime integer
);


ALTER TABLE public.tickets_trace OWNER TO admin;

--
-- Name: tickets_trace_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE tickets_trace_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.tickets_trace_id_seq OWNER TO admin;

--
-- Name: tickets_trace_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE tickets_trace_id_seq OWNED BY tickets_trace.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE users (
    id integer NOT NULL,
    username character varying(20) NOT NULL,
    firstname character varying(80) NOT NULL,
    lastname character varying(80) NOT NULL,
    password character varying(32) NOT NULL,
    email character varying(132) DEFAULT ''::character varying,
    institution character varying(32) DEFAULT ''::character varying,
    department character varying(32) DEFAULT ''::character varying,
    feide character varying(32) DEFAULT ''::character varying,
    ini4 character varying(4)
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO admin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: weekplan; Type: TABLE; Schema: public; Owner: admin; Tablespace: 
--

CREATE TABLE weekplan (
    id integer NOT NULL,
    plantext character varying,
    sequence smallint DEFAULT 0,
    planid integer
);


ALTER TABLE public.weekplan OWNER TO admin;

--
-- Name: weekplan_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE weekplan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


ALTER TABLE public.weekplan_id_seq OWNER TO admin;

--
-- Name: weekplan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE weekplan_id_seq OWNED BY weekplan.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE calendar ALTER COLUMN id SET DEFAULT nextval('calendar_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE course ALTER COLUMN id SET DEFAULT nextval('course_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE enrol ALTER COLUMN id SET DEFAULT nextval('enrol_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE groups ALTER COLUMN id SET DEFAULT nextval('groups_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE members ALTER COLUMN id SET DEFAULT nextval('members_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE periode ALTER COLUMN id SET DEFAULT nextval('periode_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE plan ALTER COLUMN id SET DEFAULT nextval('plan_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE question_container ALTER COLUMN id SET DEFAULT nextval('question_container_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE quiz ALTER COLUMN id SET DEFAULT nextval('quiz_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE quiz_container ALTER COLUMN id SET DEFAULT nextval('quiz_container_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE quiz_question ALTER COLUMN id SET DEFAULT nextval('quiz_question_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE quiz_tag ALTER COLUMN id SET DEFAULT nextval('quiz_tag_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE quiz_useranswer ALTER COLUMN id SET DEFAULT nextval('quiz_useranswer_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE room ALTER COLUMN id SET DEFAULT nextval('room_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE show ALTER COLUMN id SET DEFAULT nextval('show_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE starb ALTER COLUMN id SET DEFAULT nextval('starb_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE starbkey ALTER COLUMN id SET DEFAULT nextval('starbkey_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE subject ALTER COLUMN id SET DEFAULT nextval('subject_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE teacher ALTER COLUMN id SET DEFAULT nextval('teacher_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE tickets ALTER COLUMN id SET DEFAULT nextval('tickets_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE tickets_trace ALTER COLUMN id SET DEFAULT nextval('tickets_trace_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE weekplan ALTER COLUMN id SET DEFAULT nextval('weekplan_id_seq'::regclass);


--
-- Name: calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY calendar
    ADD CONSTRAINT calendar_pkey PRIMARY KEY (id);


--
-- Name: course_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY course
    ADD CONSTRAINT course_pkey PRIMARY KEY (id);


--
-- Name: course_shortname_key; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY course
    ADD CONSTRAINT course_shortname_key UNIQUE (shortname);


--
-- Name: enrol_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY enrol
    ADD CONSTRAINT enrol_pkey PRIMARY KEY (id);


--
-- Name: groups_groupname_key; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY groups
    ADD CONSTRAINT groups_groupname_key UNIQUE (groupname);


--
-- Name: groups_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: members_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: periode_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY periode
    ADD CONSTRAINT periode_pkey PRIMARY KEY (id);


--
-- Name: plan_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY plan
    ADD CONSTRAINT plan_pkey PRIMARY KEY (id);


--
-- Name: question_container_cid_key; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY question_container
    ADD CONSTRAINT question_container_cid_key UNIQUE (cid, qid);


--
-- Name: question_container_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY question_container
    ADD CONSTRAINT question_container_pkey PRIMARY KEY (id);


--
-- Name: quiz_container_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY quiz_container
    ADD CONSTRAINT quiz_container_pkey PRIMARY KEY (id);


--
-- Name: quiz_courseid_key; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY quiz
    ADD CONSTRAINT quiz_courseid_key UNIQUE (courseid, name);


--
-- Name: quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY quiz
    ADD CONSTRAINT quiz_pkey PRIMARY KEY (id);


--
-- Name: quiz_qtag_tid_key; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY quiz_qtag
    ADD CONSTRAINT quiz_qtag_tid_key UNIQUE (tid, qid);


--
-- Name: quiz_question_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY quiz_question
    ADD CONSTRAINT quiz_question_pkey PRIMARY KEY (id);


--
-- Name: quiz_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY quiz_tag
    ADD CONSTRAINT quiz_tag_pkey PRIMARY KEY (id);


--
-- Name: quiz_tag_teachid_key; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY quiz_tag
    ADD CONSTRAINT quiz_tag_teachid_key UNIQUE (teachid, tagname);


--
-- Name: quiz_useranswer_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY quiz_useranswer
    ADD CONSTRAINT quiz_useranswer_pkey PRIMARY KEY (id);


--
-- Name: room_name_key; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY room
    ADD CONSTRAINT room_name_key UNIQUE (name);


--
-- Name: room_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY room
    ADD CONSTRAINT room_pkey PRIMARY KEY (id);


--
-- Name: show_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY show
    ADD CONSTRAINT show_pkey PRIMARY KEY (id);


--
-- Name: starb_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY starb
    ADD CONSTRAINT starb_pkey PRIMARY KEY (id);


--
-- Name: starbkey_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY starbkey
    ADD CONSTRAINT starbkey_pkey PRIMARY KEY (id);


--
-- Name: subject_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY subject
    ADD CONSTRAINT subject_pkey PRIMARY KEY (id);


--
-- Name: subject_subjectname_key; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY subject
    ADD CONSTRAINT subject_subjectname_key UNIQUE (subjectname);


--
-- Name: teacher_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY teacher
    ADD CONSTRAINT teacher_pkey PRIMARY KEY (id);


--
-- Name: tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets_trace_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY tickets_trace
    ADD CONSTRAINT tickets_trace_pkey PRIMARY KEY (id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_username_key; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: weekplan_pkey; Type: CONSTRAINT; Schema: public; Owner: admin; Tablespace: 
--

ALTER TABLE ONLY weekplan
    ADD CONSTRAINT weekplan_pkey PRIMARY KEY (id);


--
-- Name: calendar_eventtype; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX calendar_eventtype ON calendar USING btree (eventtype);


--
-- Name: calendar_julday; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX calendar_julday ON calendar USING btree (julday);


--
-- Name: calendar_roomid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX calendar_roomid ON calendar USING btree (roomid);


--
-- Name: calendar_teachid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX calendar_teachid ON calendar USING btree (teachid);


--
-- Name: calendar_userid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX calendar_userid ON calendar USING btree (userid);


--
-- Name: course_planid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX course_planid ON course USING btree (planid);


--
-- Name: enrol_courseid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX enrol_courseid ON enrol USING btree (courseid);


--
-- Name: enrol_groupid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX enrol_groupid ON enrol USING btree (groupid);


--
-- Name: groups_roleid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX groups_roleid ON groups USING btree (roleid);


--
-- Name: members_courseid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX members_courseid ON members USING btree (userid);


--
-- Name: members_groupid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX members_groupid ON members USING btree (groupid);


--
-- Name: plan_name; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX plan_name ON plan USING btree (name);


--
-- Name: qncontainer; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX qncontainer ON question_container USING btree (cid, qid);


--
-- Name: qncontainer_cid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX qncontainer_cid ON question_container USING btree (cid);


--
-- Name: qncontainer_qid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX qncontainer_qid ON question_container USING btree (qid);


--
-- Name: qtag_tq; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX qtag_tq ON quiz_qtag USING btree (tid, qid);


--
-- Name: question_qtype; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX question_qtype ON quiz_question USING btree (qtype);


--
-- Name: question_teachid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX question_teachid ON quiz_question USING btree (teachid);


--
-- Name: quiz_tag_tagname; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX quiz_tag_tagname ON quiz_tag USING btree (tagname);


--
-- Name: quiz_tag_teachid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX quiz_tag_teachid ON quiz_tag USING btree (teachid);


--
-- Name: quiz_ua_qid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX quiz_ua_qid ON quiz_useranswer USING btree (qid);


--
-- Name: quiz_ua_qiz; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX quiz_ua_qiz ON quiz_useranswer USING btree (cid, qid);


--
-- Name: quiz_ua_qu; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX quiz_ua_qu ON quiz_useranswer USING btree (userid, qid);


--
-- Name: quiz_ua_qzid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX quiz_ua_qzid ON quiz_useranswer USING btree (cid);


--
-- Name: quiz_ua_uid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX quiz_ua_uid ON quiz_useranswer USING btree (userid);


--
-- Name: qzcontainer; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX qzcontainer ON quiz_container USING btree (cid, qizid);


--
-- Name: qzcontainer_cid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX qzcontainer_cid ON quiz_container USING btree (cid);


--
-- Name: qzcontainer_qizid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX qzcontainer_qizid ON quiz_container USING btree (qizid);


--
-- Name: show_name; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX show_name ON show USING btree (name);


--
-- Name: show_time; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX show_time ON show USING btree (showtime);


--
-- Name: show_user; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX show_user ON show USING btree (userid);


--
-- Name: starb_ip; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX starb_ip ON starb USING btree (ip);


--
-- Name: starb_julday; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX starb_julday ON starb USING btree (julday);


--
-- Name: starb_julip; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX starb_julip ON starb USING btree (julday, ip);


--
-- Name: starb_roomid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX starb_roomid ON starb USING btree (roomid);


--
-- Name: starb_teachid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX starb_teachid ON starb USING btree (teachid);


--
-- Name: starb_userid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX starb_userid ON starb USING btree (userid);


--
-- Name: starb_userid_jd; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE UNIQUE INDEX starb_userid_jd ON starb USING btree (userid, julday);


--
-- Name: starbkey_regkey; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX starbkey_regkey ON starbkey USING btree (regkey);


--
-- Name: starbkey_teachid; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX starbkey_teachid ON starbkey USING btree (teachid);


--
-- Name: teacher_course; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX teacher_course ON teacher USING btree (courseid);


--
-- Name: teacher_user; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX teacher_user ON teacher USING btree (userid);


--
-- Name: tickets_show; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX tickets_show ON tickets USING btree (showid);


--
-- Name: tickets_time; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX tickets_time ON tickets USING btree (showtime);


--
-- Name: tickets_user; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX tickets_user ON tickets USING btree (userid);


--
-- Name: user_department; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX user_department ON users USING btree (department);


--
-- Name: user_institution; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX user_institution ON users USING btree (institution);


--
-- Name: weekplan_sequence; Type: INDEX; Schema: public; Owner: admin; Tablespace: 
--

CREATE INDEX weekplan_sequence ON weekplan USING btree (sequence);


--
-- Name: course_planid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY course
    ADD CONSTRAINT course_planid_fkey FOREIGN KEY (planid) REFERENCES plan(id) ON DELETE SET DEFAULT;


--
-- Name: course_subjectid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY course
    ADD CONSTRAINT course_subjectid_fkey FOREIGN KEY (subjectid) REFERENCES subject(id) ON DELETE SET DEFAULT;


--
-- Name: enrol_courseid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY enrol
    ADD CONSTRAINT enrol_courseid_fkey FOREIGN KEY (courseid) REFERENCES course(id);


--
-- Name: enrol_groupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY enrol
    ADD CONSTRAINT enrol_groupid_fkey FOREIGN KEY (groupid) REFERENCES groups(id);


--
-- Name: members_groupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY members
    ADD CONSTRAINT members_groupid_fkey FOREIGN KEY (groupid) REFERENCES groups(id);


--
-- Name: members_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY members
    ADD CONSTRAINT members_userid_fkey FOREIGN KEY (userid) REFERENCES users(id);


--
-- Name: plan_periodeid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY plan
    ADD CONSTRAINT plan_periodeid_fkey FOREIGN KEY (periodeid) REFERENCES periode(id) ON DELETE SET DEFAULT;


--
-- Name: plan_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY plan
    ADD CONSTRAINT plan_userid_fkey FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: question_container_cid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY question_container
    ADD CONSTRAINT question_container_cid_fkey FOREIGN KEY (cid) REFERENCES quiz_question(id) ON DELETE CASCADE;


--
-- Name: question_container_qid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY question_container
    ADD CONSTRAINT question_container_qid_fkey FOREIGN KEY (qid) REFERENCES quiz_question(id) ON DELETE CASCADE;


--
-- Name: quiz_cid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz
    ADD CONSTRAINT quiz_cid_fkey FOREIGN KEY (cid) REFERENCES quiz_question(id) ON DELETE SET NULL;


--
-- Name: quiz_container_cid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz_container
    ADD CONSTRAINT quiz_container_cid_fkey FOREIGN KEY (cid) REFERENCES quiz_question(id) ON DELETE CASCADE;


--
-- Name: quiz_container_qizid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz_container
    ADD CONSTRAINT quiz_container_qizid_fkey FOREIGN KEY (qizid) REFERENCES quiz(id) ON DELETE CASCADE;


--
-- Name: quiz_courseid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz
    ADD CONSTRAINT quiz_courseid_fkey FOREIGN KEY (courseid) REFERENCES course(id) ON DELETE CASCADE;


--
-- Name: quiz_qtag_qid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz_qtag
    ADD CONSTRAINT quiz_qtag_qid_fkey FOREIGN KEY (qid) REFERENCES quiz_question(id) ON DELETE CASCADE;


--
-- Name: quiz_qtag_tid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz_qtag
    ADD CONSTRAINT quiz_qtag_tid_fkey FOREIGN KEY (tid) REFERENCES quiz_tag(id) ON DELETE CASCADE;


--
-- Name: quiz_question_teachid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz_question
    ADD CONSTRAINT quiz_question_teachid_fkey FOREIGN KEY (teachid) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: quiz_tag_teachid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz_tag
    ADD CONSTRAINT quiz_tag_teachid_fkey FOREIGN KEY (teachid) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: quiz_teachid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz
    ADD CONSTRAINT quiz_teachid_fkey FOREIGN KEY (teachid) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: quiz_useranswer_cid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz_useranswer
    ADD CONSTRAINT quiz_useranswer_cid_fkey FOREIGN KEY (cid) REFERENCES quiz_question(id) ON DELETE SET NULL;


--
-- Name: quiz_useranswer_qid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz_useranswer
    ADD CONSTRAINT quiz_useranswer_qid_fkey FOREIGN KEY (qid) REFERENCES quiz_question(id) ON DELETE CASCADE;


--
-- Name: quiz_useranswer_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY quiz_useranswer
    ADD CONSTRAINT quiz_useranswer_userid_fkey FOREIGN KEY (userid) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: show_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY show
    ADD CONSTRAINT show_userid_fkey FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: starb_roomid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY starb
    ADD CONSTRAINT starb_roomid_fkey FOREIGN KEY (roomid) REFERENCES room(id) ON DELETE SET DEFAULT;


--
-- Name: starb_teachid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY starb
    ADD CONSTRAINT starb_teachid_fkey FOREIGN KEY (teachid) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: starb_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY starb
    ADD CONSTRAINT starb_userid_fkey FOREIGN KEY (userid) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: starbkey_roomid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY starbkey
    ADD CONSTRAINT starbkey_roomid_fkey FOREIGN KEY (roomid) REFERENCES room(id) ON DELETE SET DEFAULT;


--
-- Name: starbkey_teachid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY starbkey
    ADD CONSTRAINT starbkey_teachid_fkey FOREIGN KEY (teachid) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: teacher_courseid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY teacher
    ADD CONSTRAINT teacher_courseid_fkey FOREIGN KEY (courseid) REFERENCES course(id);


--
-- Name: teacher_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY teacher
    ADD CONSTRAINT teacher_userid_fkey FOREIGN KEY (userid) REFERENCES users(id);


--
-- Name: tickets_showid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY tickets
    ADD CONSTRAINT tickets_showid_fkey FOREIGN KEY (showid) REFERENCES show(id) ON DELETE CASCADE;


--
-- Name: tickets_trace_showid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY tickets_trace
    ADD CONSTRAINT tickets_trace_showid_fkey FOREIGN KEY (showid) REFERENCES show(id) ON DELETE CASCADE;


--
-- Name: tickets_trace_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY tickets_trace
    ADD CONSTRAINT tickets_trace_userid_fkey FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: tickets_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY tickets
    ADD CONSTRAINT tickets_userid_fkey FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: weekplan_planid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY weekplan
    ADD CONSTRAINT weekplan_planid_fkey FOREIGN KEY (planid) REFERENCES plan(id) ON DELETE CASCADE;


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

