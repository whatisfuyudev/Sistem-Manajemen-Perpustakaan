INSERT INTO users (
  name,
  email,
  password,
  role,
  phone,
  address,
  profile_picture,
  "createdAt",
  "updatedAt",
  account_status
) VALUES
  ( 'haniflibrarian', 'haniflibrarian@gmail.com',
    '$2b$10$Wm.dYvEtxCMXeLJnLn1Ji.uD7invnjbCwjw1nVmuT4yEmlnl.Nbk.',
    'Librarian', '', '',
    '/public/images/profile-pictures/f38779dc-43aa-466e-a94f-27ce9a539277-pria 3.png',
    '2025-04-26T01:48:04.073Z', '2025-06-20T14:53:39.499Z', 'Active'
  ),
  ('fuyu man', 'fuyuvengeancedev@gmail.com',
    '$2b$10$WyVDYEtodhSvmpvmqJQeDOeXCk8nZIoORS4PsaakNB/8w24.HlP2e',
    'Patron', NULL, NULL,
    '/public/images/profile-pictures/178d47e4-e2d8-4985-8dcb-7dc1a5d284eb-pria 2.png',
    '2025-04-21T14:33:54.652Z', '2025-06-20T14:53:48.648Z', 'Active'
  ),
  ('hanif5', 'hanif5@gmail.com',
    '$2b$10$6PrEnSXX.iM836UJD84njeVg9vqiKEEUHCL3wuKICzStICayj2sky',
    'Patron', NULL, NULL,
    '/public/images/profile-pictures/f22a3ec4-7026-4b42-a9bb-f517c1967130-pria 1.png',
    '2025-04-21T14:18:14.521Z', '2025-06-20T14:54:09.542Z', 'Active'
  ),
  ('aman', 'tes@gmail.com',
    '$2b$10$158jTwZjoG6Pj4ijrNPzmOsujOBJtzbkw8zZqwAQN3M2IlsA99BOO',
    'Patron', '', '',
    '/public/images/profile-pictures/f9c0958a-f187-4879-a78c-2bcc39b5948e-pria 3.png',
    '2025-04-01T14:18:31.158Z', '2025-06-20T14:53:55.771Z', 'Active'
  ),
  ('hanifthird', 'hanif3@gmail.com',
    '$2b$10$9C44CM4eEPyYFPg1HOxIA.SzpM27pbh5Fdg86UnxtkdjN2MpX.1Ve',
    'Patron', '', 'password=hanif3',
    '/public/images/profile-pictures/424ca605-304b-462e-8f69-4cf576050405-pria 2.png',
    '2025-04-01T14:07:12.484Z', '2025-06-20T14:54:17.949Z', 'Active'
  ),
  ('hanifadmin', 'hanifadmin@gmail.com',
    '$2b$10$uax.WjXF8fsBAWgsGGnGnOtKXZkSDPfuG8EPPx5mVY9wJ/8lB7uPW',
    'Admin', '', 'password=hanifadmin',
    '/public/images/profile-pictures/c952df3c-4b66-4636-a551-c98eb591770b-pria tua.png',
    '2025-03-27T06:50:40.101Z', '2025-06-20T14:54:29.594Z', 'Active'
  ),
  ('hanif', 'hanif@gmail.com',
    '$2b$10$yEtk.yGSrgrjyHHJfzhQ9OxXptw8B80AFiaASmZ/jJ74TNYw6MTMC',
    'Patron', '', 'password=hanif',
    '/public/images/profile-pictures/948829cf-1a98-41d5-9e3f-fe60e791eba9-pria 1.png',
    '2025-03-25T14:00:40.964Z', '2025-06-20T14:54:39.511Z', 'Active'
  );
