
INSERT INTO reservations (
  user_id,
  book_isbn,
  request_date,
  queue_position,
  status,
  expiration_date,
  notes,
  "createdAt",
  "updatedAt"
) VALUES
(4, '978-0316769488', '2025-06-17T16:04:32.520Z', 1, 'canceled', NULL, 'test',                      '2025-06-17T16:04:32.520Z', '2025-06-17T16:05:49.584Z'),
(2, '978-0486415871', '2025-06-10T07:33:24.585Z', 1, 'canceled', NULL, 'test edit notes 2',       '2025-06-10T07:33:24.585Z', '2025-06-10T07:48:03.893Z'),
(2, '978-0547928227', '2025-06-10T07:32:31.360Z', 1, 'canceled', NULL, '',                          '2025-06-10T07:32:31.360Z', '2025-06-10T07:34:46.190Z'),
(2, '978-0743273565', '2025-06-05T07:40:04.922Z', 1, 'fulfilled','2025-06-07T07:41:39.886Z','tolong terima antrian saya','2025-06-05T07:40:04.922Z', '2025-06-05T07:42:48.602Z'),
(2, '978-0743273565', '2025-06-02T06:59:18.590Z', 1, 'canceled', '2025-06-07T07:38:31.639Z', NULL,                     '2025-06-02T06:59:18.591Z', '2025-06-05T07:39:37.232Z'),
(2, '978-0061120084', '2025-06-02T06:50:22.992Z', 1, 'expired',  '2025-06-04T06:55:25.247Z', NULL,                     '2025-06-02T06:50:22.993Z', '2025-06-04T14:19:40.512Z'),
(7, '978-0525536291', '2025-05-22T14:11:21.402Z', 1, 'pending',  NULL,                     NULL,                     '2025-05-22T14:11:21.403Z', '2025-05-22T14:11:21.403Z'),
(7, '978-1503290563', '2025-05-22T08:33:30.684Z', 1, 'canceled', NULL,                     NULL,                     '2025-05-22T08:33:30.685Z', '2025-05-22T08:33:43.200Z'),
(7, '978-0486415871', '2025-05-22T05:22:39.712Z', 1, 'canceled', NULL,                     NULL,                     '2025-05-22T05:22:39.713Z', '2025-05-22T05:22:47.455Z'),
(7, '978-0486415871', '2025-05-22T05:20:31.239Z', 1, 'canceled', NULL,                     NULL,                     '2025-05-22T05:20:31.239Z', '2025-05-22T05:20:37.646Z'),
(7, '978-0547928227', '2025-05-22T05:18:25.606Z', 1, 'canceled', NULL,                     NULL,                     '2025-05-22T05:18:25.606Z', '2025-05-22T05:18:31.378Z'),
(7, '978-0547928227', '2025-05-22T05:16:50.119Z', 1, 'canceled', NULL,                     'email1',                 '2025-05-22T05:16:50.121Z', '2025-05-22T05:18:06.859Z'),
(9,'978-0547928227','2025-05-16T08:32:12.443Z', 1,'canceled', NULL,                     '',                        '2025-05-16T08:32:12.443Z','2025-05-16T08:32:17.238Z'),
(1,'978-0547928227','2025-05-15T15:41:34.628Z', 1,'canceled','2025-05-17T15:41:49.788Z','',                        '2025-05-15T15:41:34.630Z','2025-05-15T15:42:24.901Z'),
(1,'978-0316769488','2025-05-15T15:40:20.484Z', 1,'canceled', NULL,                     '',                        '2025-05-15T15:40:20.485Z','2025-05-15T15:40:30.805Z'),
(8,'978-0316769488','2025-05-15T15:21:37.385Z', 2,'canceled', NULL,                     '',                        '2025-05-15T15:21:37.385Z','2025-05-15T15:27:28.908Z'),
(1,'978-0316769488','2025-05-15T15:21:34.010Z', 1,'fulfilled','2025-05-17T15:27:36.146Z','',                        '2025-05-15T15:21:34.011Z','2025-05-15T15:40:01.135Z'),
(2,'978-0743273565','2025-05-11T07:59:58.598Z', 1,'canceled', NULL,                     NULL,                     '2025-05-11T07:59:58.599Z','2025-05-11T08:00:04.816Z'),
(2,'978-0547928227','2025-05-06T03:21:26.964Z', 1,'canceled', NULL,                     '',                        '2025-05-06T03:21:26.965Z','2025-05-06T03:21:33.181Z'),
(2,'978-0547928227','2025-05-05T00:00:00.000Z', 1,'expired', '2025-05-01T00:00:00.000Z',NULL,                     '2025-05-05T11:38:22.138Z','2025-05-05T11:39:54.607Z'),
(2,'978-0547928227','2025-05-04T00:00:00.000Z', 1,'expired', '2025-05-01T00:00:00.000Z',NULL,                     '2025-05-04T02:40:48.891Z','2025-05-04T02:41:41.138Z'),
(2,'978-0451524935','2025-05-04T01:58:04.515Z', 1,'canceled', NULL,                     '',                        '2025-05-04T01:58:04.517Z','2025-05-04T01:58:14.422Z'),
(2,'978-0316769488','2025-04-26T00:00:00.000Z', 1,'canceled', NULL,                     NULL,                     '2025-04-26T03:42:03.319Z','2025-05-15T15:13:25.698Z'),
(8,'978-0547928227','2025-04-26T00:00:00.000Z', 1,'canceled', NULL,                     NULL,                     '2025-04-26T00:57:39.961Z','2025-04-26T01:31:48.369Z'),
(2,'978-0547928227','2025-04-21T21:49:52.771Z', 2,'canceled','2025-04-23T23:29:25.297Z','',                        '2025-04-21T21:49:52.773Z','2025-04-21T23:29:39.538Z'),
(1,'978-0547928227','2025-04-21T21:43:33.762Z', 1,'canceled','2025-04-23T23:29:14.905Z','test admin reservation','2025-04-21T21:43:33.764Z','2025-04-21T23:29:34.670Z'),
(7,'978-0743273565','2025-04-21T15:09:00.238Z', 1,'canceled', NULL,                     '',                        '2025-04-21T15:09:00.238Z','2025-04-21T15:23:09.230Z'),
(6,'978-0743273565','2025-04-21T15:08:58.565Z', 1,'canceled', NULL,                     '',                        '2025-04-21T15:08:58.565Z','2025-04-21T15:23:05.047Z'),
(5,'978-0743273565','2025-04-21T15:08:57.036Z', 1,'canceled', NULL,                     '',                        '2025-04-21T15:08:57.036Z','2025-04-21T15:23:00.266Z'),
(4,'978-0743273565','2025-04-21T15:08:55.391Z', 1,'canceled', NULL,                     '',                        '2025-04-21T15:08:55.391Z','2025-04-21T15:22:55.264Z'),
(3,'978-0743273565','2025-04-21T15:08:53.426Z', 3,'canceled', NULL,                     '',                        '2025-04-21T15:08:53.426Z','2025-04-21T15:22:49.618Z'),
(2,'978-0743273565','2025-04-21T15:08:51.918Z', 2,'canceled','2025-04-23T15:22:38.819Z','',                        '2025-04-21T15:08:51.918Z','2025-04-22T15:33:37.181Z'),
(1,'978-0743273565','2025-04-21T15:08:50.273Z', 1,'expired', '2025-04-23T15:16:27.272Z','',                        '2025-04-21T15:08:50.273Z','2025-04-24T06:12:12.624Z'),
(5,'978-0743273565','2025-04-21T14:55:13.235Z', 1,'fulfilled','2025-04-23T14:55:18.784Z','reserve a book for user 5 from admin ( 2)','2025-04-21T14:55:13.235Z','2025-04-21T15:01:18.341Z'),
(7,'978-0743273565','2025-04-21T14:45:28.500Z', 1,'canceled','2025-04-23T14:45:56.639Z',NULL,                     '2025-04-21T14:45:28.500Z','2025-04-21T15:00:31.510Z'),
(6,'978-0743273565','2025-04-21T14:34:24.342Z', 1,'canceled','2025-04-23T14:34:41.301Z',NULL,                     '2025-04-21T14:34:24.342Z','2025-04-21T15:00:25.797Z'),
(5,'978-0743273565','2025-04-21T14:22:35.731Z', 4,'canceled','2025-04-23T14:29:54.108Z','reserve a book for user 5 from admin ( 2)','2025-04-21T14:22:35.733Z','2025-04-21T14:55:07.803Z'),
(4,'978-0743273565','2025-04-21T14:12:31.482Z', 4,'canceled','2025-04-23T14:24:07.710Z',NULL,                     '2025-04-21T14:12:31.483Z','2025-04-21T14:58:57.811Z'),
(1,'978-0743273565','2025-04-21T14:12:20.401Z', 3,'canceled','2025-04-23T14:24:05.988Z',NULL,                     '2025-04-21T14:12:20.402Z','2025-04-21T14:58:50.991Z'),
(3,'978-0743273565','2025-04-21T14:12:07.534Z', 2,'canceled','2025-04-23T14:24:03.648Z',NULL,                     '2025-04-21T14:12:07.534Z','2025-04-21T14:58:45.526Z'),
(2,'978-0743273565','2025-04-21T14:06:52.822Z', 1,'canceled','2025-04-23T14:12:57.550Z','',                         '2025-04-21T14:06:52.823Z','2025-04-21T14:58:40.364Z'),
(2,'978-0743273565','2025-04-20T01:51:53.832Z', 1,'canceled','2025-04-22T07:25:40.296Z','test test',                 '2025-04-20T01:51:53.833Z','2025-04-20T07:29:03.669Z'),
(2,'978-0061120084','2025-04-09T00:00:00.000Z', 1,'canceled', NULL,                     'test test',                 '2025-04-09T14:09:30.766Z','2025-04-21T07:41:11.403Z'),
(1,'978-1400079988','2025-04-02T02:18:39.273Z', 1,'canceled','2025-04-22T03:18:53.226Z','test edit notes','2025-04-02T02:18:39.273Z','2025-04-20T07:38:15.384Z'),
(1,'978-0316769488','2025-04-02T02:18:24.721Z', 1,'fulfilled','2025-04-04T02:27:34.289Z',NULL,                     '2025-04-02T02:18:24.722Z','2025-04-02T13:55:01.476Z'),
(1,'978-0316769488','2025-04-01T15:30:23.708Z', 1,'canceled', NULL,                     NULL,                     '2025-04-01T15:30:23.711Z','2025-04-02T02:05:44.704Z'),
(1,'978-0547928227','2025-04-01T14:04:03.053Z', 1,'canceled', NULL,                     NULL,                     '2025-04-01T14:04:03.053Z','2025-04-02T02:05:39.557Z'),
(1,'978-0316769488','2025-04-01T13:58:39.486Z', 1,'fulfilled','2025-04-03T14:02:58.537Z',NULL,                     '2025-04-01T13:58:39.486Z','2025-04-01T14:16:23.885Z'),
(1,'978-0316769488','2025-04-01T13:58:39.486Z', 1,'fulfilled','2025-04-03T14:02:58.537Z',NULL,                     '2025-04-01T13:58:39.486Z','2025-04-01T14:16:23.885Z'),
(1,'978-0316769488','2025-04-01T13:58:39.486Z', 1,'fulfilled','2025-04-03T14:02:58.537Z',NULL,                     '2025-04-01T13:58:39.486Z','2025-04-01T14:16:23.885Z'),
(1,'978-0316769488','2025-04-01T13:58:39.486Z', 1,'fulfilled','2025-04-03T14:02:58.537Z',NULL,                     '2025-04-01T13:58:39.486Z','2025-04-01T14:16:23.885Z'),
(1,'978-0316769488','2025-04-01T13:58:39.486Z', 1,'fulfilled','2025-04-03T14:02:58.537Z',NULL,                     '2025-04-01T13:58:39.486Z','2025-04-01T14:16:23.885Z'),
(1,'978-0316769488','2025-04-01T13:58:39.486Z', 1,'fulfilled','2025-04-03T14:02:58.537Z',NULL,                     '2025-04-01T13:58:39.486Z','2025-04-01T14:16:23.885Z'),
(1,'978-0316769488','2025-04-01T13:58:39.486Z', 1,'fulfilled','2025-04-03T14:02:58.537Z',NULL,                     '2025-04-01T13:58:39.486Z','2025-04-01T14:16:23.885Z'),
(1,'978-1400079988','2025-04-01T13:58:28.232Z', 1,'canceled', NULL,                     'test test',                 '2025-04-01T13:58:28.233Z','2025-04-02T02:05:57.260Z'),
(1,'978-0451524935','2025-04-01T00:00:00.000Z', 1,'canceled', NULL,                     'test test edited',          '2025-04-01T14:03:58.979Z','2025-04-21T13:43:55.888Z'),
(1,'978-0743273565','2025-03-27T00:00:00.000Z', 1,'canceled', NULL,                     'test test edited',          '2025-03-27T06:50:17.560Z','2025-04-21T07:36:51.590Z')
;
