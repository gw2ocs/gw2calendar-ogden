CREATE TABLE answers (
    id serial PRIMARY KEY,
    question_id integer NOT NULL,
    content character varying NOT NULL
);

COMMENT ON COLUMN answers.question_id IS 'ID of the question on GW2Trivia';
COMMENT ON COLUMN answers.content IS 'Expected answer(s)';

CREATE TABLE participations (
    id serial PRIMARY KEY,
    account character varying NOT NULL,
    date timestamp without time zone DEFAULT LOCALTIMESTAMP,
    valid boolean DEFAULT false,
    ip character varying,
    content text
);

COMMENT ON COLUMN participations.account IS 'GW2 Account name';
COMMENT ON COLUMN participations.date IS 'Datetime of the submit';
COMMENT ON COLUMN participations.valid IS 'Whether the answer is valid';
COMMENT ON COLUMN participations.ip IS 'IP of the request';
COMMENT ON COLUMN participations.content IS 'Answer content';

CREATE TABLE questions (
    id serial PRIMARY KEY,
	date date NOT NULL CONSTRAINT one_question_per_day UNIQUE,
    external_id integer,
    title text,
    displayed_response character varying
);

COMMENT ON COLUMN questions.external_id IS 'ID of the question on GW2Trivia';
COMMENT ON COLUMN questions.title IS 'Question title';
COMMENT ON COLUMN questions.displayed_response IS 'Human-readable response';