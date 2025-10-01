-- Fixture: create default administrator registration and credentials
INSERT INTO registrations (email, first_name, last_name, question1, question2, is_organizer)
VALUES ('admin@sample.com', 'Admin', 'Strator', 'N/A', 'N/A', TRUE)
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    question1 = VALUES(question1),
    question2 = VALUES(question2),
    is_organizer = VALUES(is_organizer);

INSERT INTO credentials (registration_id, login_pin)
VALUES (
    (SELECT id FROM registrations WHERE email = 'mm@mm.mm'),
    '992025'
)
ON DUPLICATE KEY UPDATE
    login_pin = VALUES(login_pin);
