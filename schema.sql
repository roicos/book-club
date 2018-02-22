Create table if not exists states (id serial primary key, name varchar(100), code char (2));

Insert into states (name, code) values
	('Alabama', 'AL'),
	('Alaska', 'AK'),
	('Arizona', 'AZ'),
	('Arkansas', 'AR'),
	('Armed Forces America', 'AA'),
	('Armed Forces Europe', 'AE'),
	('Armed Forces Pacific', 'AP'),
	('California', 'CA'),
	('Colorado', 'CO'),
	('Connecticut', 'CT'),
	('Delaware', 'DE'),
	('District of Columbia', 'DC'),
	('Florida', 'FL'),
	('Georgia', 'GA'),
	('Hawaii', 'HI'),
	('Idaho', 'ID'),
	('Illinois', 'IL'),
	('Indiana', 'IN'),
	('Iowa', 'IA'),
	('Kansas', 'KS'),
	('Kentucky', 'KY'),
	('Louisiana', 'LA'),
	('Maine', 'ME'),
	('Maryland', 'MD'),
	('Massachusetts', 'MA'),
	('Michigan', 'MI'),
	('Minnesota', 'MN'),
	('Mississippi', 'MS'),
	('Missouri', 'MO'),
	('Montana', 'MT'),
	('Nebraska', 'NE'),
	('Nevada', 'NV'),
	('New Hampshire', 'NH'),
	('New Jersey', 'NJ'),
	('New Mexico', 'NM'),
	('New York', 'NY'),
	('North Carolina', 'NC'),
	('North Dakota', 'ND'),
	('Ohio', 'OH'),
	('Oklahoma', 'OK'),
	('Oregon', 'OR'),
	('Pennsylvania', 'PA'),
	('Rhode Island', 'RI'),
	('South Carolina', 'SC'),
	('South Dakota', 'SD'),
	('Tennessee', 'TN'),
	('Texas', 'TX'),
	('Utah', 'UT'),
	('Vermont', 'VT'),
	('Virginia', 'VA'),
	('Washington', 'WA'),
	('West Virginia', 'WV'),
	('Wisconsin', 'WI'),
	('Wyoming', 'WY');

Create table if not exists users (id serial primary key, username varchar(100) not null, password varchar(255) not null, city varchar (255) not null, stateid int);

Create table if not exists books (id serial primary key, isbn varchar(20) not null, picture varchar (225), title varchar (255) not null, authors varchar (255) not null);

Create table if not exists usertobook (id serial primary key, userid int not null, bookid int not null);

Create type status as enum('open', 'closed', 'rejected');

Create table if not exists requests (id serial primary key, usertobook int not null, userid int not null, status status default 'open', created timestamp, updated timestamp);
