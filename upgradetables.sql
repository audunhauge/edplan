ALTER TABLE quiz_useranswer ADD COLUMN feedback varchar default '';
ALTER TABLE quiz_useranswer ADD COLUMN hintcount smallint default 0;
ALTER TABLE quiz_question   ADD COLUMN subject varchar(50) not null default '';
