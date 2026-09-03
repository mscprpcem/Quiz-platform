// =========================================================================
// 📘 50 DDL PRACTICE QUESTIONS DATA (CURATED & STANDARDIZED)
// =========================================================================

export const DDL_SECTIONS = [
  {
    "id": "all",
    "label": "All 50 Questions",
    "count": 50
  },
  {
    "id": "SECTION A",
    "label": "A: CREATE",
    "count": 5
  },
  {
    "id": "SECTION B",
    "label": "B: ADD COL",
    "count": 5
  },
  {
    "id": "SECTION C",
    "label": "C: MODIFY",
    "count": 5
  },
  {
    "id": "SECTION D",
    "label": "D: RENAME COL",
    "count": 5
  },
  {
    "id": "SECTION E",
    "label": "E: DROP COL",
    "count": 5
  },
  {
    "id": "SECTION F",
    "label": "F: RENAME TABLE",
    "count": 5
  },
  {
    "id": "SECTION G",
    "label": "G: TRUNCATE",
    "count": 5
  },
  {
    "id": "SECTION H",
    "label": "H: DROP TABLE",
    "count": 5
  },
  {
    "id": "SECTION I",
    "label": "I: CREATE/DROP DB",
    "count": 5
  },
  {
    "id": "SECTION J",
    "label": "J: INTERVIEW",
    "count": 5
  }
];

export const DDL_50_QUESTIONS = [
  {
    "id": 1,
    "challengeId": "ddl-01",
    "section": "SECTION A",
    "sectionTitle": "CREATE DATABASE & TABLE",
    "question": "Create a database named school_db.",
    "sql": "CREATE DATABASE school_db;",
    "explanation": "CREATE DATABASE allocates a new logical database instance within the RDBMS catalog.",
    "type": "DDL",
    "difficulty": "Basic"
  },
  {
    "id": 2,
    "challengeId": "ddl-02",
    "section": "SECTION A",
    "sectionTitle": "CREATE DATABASE & TABLE",
    "question": "Switch to school_db.",
    "sql": "USE school_db;",
    "explanation": "USE selects the default database schema for all subsequent SQL statements in the current session.",
    "type": "DDL",
    "difficulty": "Basic"
  },
  {
    "id": 3,
    "challengeId": "ddl-03",
    "section": "SECTION A",
    "sectionTitle": "CREATE DATABASE & TABLE",
    "question": "Create a table students (student_id, name, age, city).",
    "sql": "CREATE TABLE students (\n    student_id INT PRIMARY KEY,\n    name VARCHAR(50) NOT NULL,\n    age INT,\n    city VARCHAR(50)\n);",
    "explanation": "Defines the structural blueprint for students with student_id as primary key.",
    "type": "DDL",
    "difficulty": "Basic"
  },
  {
    "id": 4,
    "challengeId": "ddl-04",
    "section": "SECTION A",
    "sectionTitle": "CREATE DATABASE & TABLE",
    "question": "Create a table teachers (teacher_id, name, subject).",
    "sql": "CREATE TABLE teachers (\n    teacher_id INT PRIMARY KEY,\n    name VARCHAR(50) NOT NULL,\n    subject VARCHAR(50) NOT NULL\n);",
    "explanation": "Establishes the teachers entity with primary key and subject attribute.",
    "type": "DDL",
    "difficulty": "Basic"
  },
  {
    "id": 5,
    "challengeId": "ddl-05",
    "section": "SECTION A",
    "sectionTitle": "CREATE DATABASE & TABLE",
    "question": "Create a table classes (class_id, class_name).",
    "sql": "CREATE TABLE classes (\n    class_id INT PRIMARY KEY,\n    class_name VARCHAR(50) NOT NULL\n);",
    "explanation": "Establishes the classes entity for classroom and grade level management.",
    "type": "DDL",
    "difficulty": "Basic"
  },
  {
    "id": 6,
    "challengeId": "ddl-06",
    "section": "SECTION B",
    "sectionTitle": "ALTER – ADD COLUMN",
    "question": "Add email column to students.",
    "sql": "ALTER TABLE students ADD COLUMN email VARCHAR(100);",
    "explanation": "Extends students schema by adding a new attribute for email storage.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 7,
    "challengeId": "ddl-07",
    "section": "SECTION B",
    "sectionTitle": "ALTER – ADD COLUMN",
    "question": "Add phone column to students.",
    "sql": "ALTER TABLE students ADD COLUMN phone VARCHAR(20);",
    "explanation": "Appends a phone contact number attribute to the students table.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 8,
    "challengeId": "ddl-08",
    "section": "SECTION B",
    "sectionTitle": "ALTER – ADD COLUMN",
    "question": "Add salary column to teachers.",
    "sql": "ALTER TABLE teachers ADD COLUMN salary DECIMAL(10,2);",
    "explanation": "Appends compensation attribute using exact decimal precision for financial reliability.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 9,
    "challengeId": "ddl-09",
    "section": "SECTION B",
    "sectionTitle": "ALTER – ADD COLUMN",
    "question": "Add experience column to teachers.",
    "sql": "ALTER TABLE teachers ADD COLUMN experience INT;",
    "explanation": "Adds an integer column to track total years of teaching experience.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 10,
    "challengeId": "ddl-10",
    "section": "SECTION B",
    "sectionTitle": "ALTER – ADD COLUMN",
    "question": "Add room_no column to classes.",
    "sql": "ALTER TABLE classes ADD COLUMN room_no INT;",
    "explanation": "Adds physical classroom number allocation to the classes table.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 11,
    "challengeId": "ddl-11",
    "section": "SECTION C",
    "sectionTitle": "ALTER – MODIFY COLUMN",
    "question": "Change datatype of age to SMALLINT.",
    "sql": "ALTER TABLE students MODIFY COLUMN age SMALLINT;",
    "explanation": "Optimizes storage by reducing age from 4-byte INT to 2-byte SMALLINT.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 12,
    "challengeId": "ddl-12",
    "section": "SECTION C",
    "sectionTitle": "ALTER – MODIFY COLUMN",
    "question": "Increase size of name to VARCHAR(100).",
    "sql": "ALTER TABLE students MODIFY COLUMN name VARCHAR(100);",
    "explanation": "Expands character limit to accommodate longer student names without data loss.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 13,
    "challengeId": "ddl-13",
    "section": "SECTION C",
    "sectionTitle": "ALTER – MODIFY COLUMN",
    "question": "Change phone datatype to VARCHAR(20).",
    "sql": "ALTER TABLE students MODIFY COLUMN phone VARCHAR(20);",
    "explanation": "Allows storing international dialing prefixes, spaces, and formatting characters.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 14,
    "challengeId": "ddl-14",
    "section": "SECTION C",
    "sectionTitle": "ALTER – MODIFY COLUMN",
    "question": "Change salary datatype to BIGINT.",
    "sql": "ALTER TABLE teachers MODIFY COLUMN salary BIGINT;",
    "explanation": "Converts salary to an 8-byte integer for large-scale enterprise compensation ranges.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 15,
    "challengeId": "ddl-15",
    "section": "SECTION C",
    "sectionTitle": "ALTER – MODIFY COLUMN",
    "question": "Increase subject size to VARCHAR(100).",
    "sql": "ALTER TABLE teachers MODIFY COLUMN subject VARCHAR(100);",
    "explanation": "Expands string capacity for multi-discipline course titles.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 16,
    "challengeId": "ddl-16",
    "section": "SECTION D",
    "sectionTitle": "ALTER – RENAME COLUMN",
    "question": "Rename city to location in students.",
    "sql": "ALTER TABLE students RENAME COLUMN city TO location;",
    "explanation": "Updates column identifier in metadata without rebuilding or copying table rows.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 17,
    "challengeId": "ddl-17",
    "section": "SECTION D",
    "sectionTitle": "ALTER – RENAME COLUMN",
    "question": "Rename name to student_name in students.",
    "sql": "ALTER TABLE students RENAME COLUMN name TO student_name;",
    "explanation": "Clarifies attribute naming to avoid collision with SQL reserved keywords.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 18,
    "challengeId": "ddl-18",
    "section": "SECTION D",
    "sectionTitle": "ALTER – RENAME COLUMN",
    "question": "Rename name to teacher_name in teachers.",
    "sql": "ALTER TABLE teachers RENAME COLUMN name TO teacher_name;",
    "explanation": "Renames faculty name attribute to explicit teacher_name identifier.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 19,
    "challengeId": "ddl-19",
    "section": "SECTION D",
    "sectionTitle": "ALTER – RENAME COLUMN",
    "question": "Rename room_no to room_number in classes.",
    "sql": "ALTER TABLE classes RENAME COLUMN room_no TO room_number;",
    "explanation": "Converts abbreviated identifier to descriptive production naming convention.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 20,
    "challengeId": "ddl-20",
    "section": "SECTION D",
    "sectionTitle": "ALTER – RENAME COLUMN",
    "question": "Rename experience to years_of_experience.",
    "sql": "ALTER TABLE teachers RENAME COLUMN experience TO years_of_experience;",
    "explanation": "Improves schema self-documentation by making unit of measure explicit.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 21,
    "challengeId": "ddl-21",
    "section": "SECTION E",
    "sectionTitle": "ALTER – DROP COLUMN",
    "question": "Drop email from students.",
    "sql": "ALTER TABLE students DROP COLUMN email;",
    "explanation": "Permanently removes the email column and frees storage page slot offsets.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 22,
    "challengeId": "ddl-22",
    "section": "SECTION E",
    "sectionTitle": "ALTER – DROP COLUMN",
    "question": "Drop phone from students.",
    "sql": "ALTER TABLE students DROP COLUMN phone;",
    "explanation": "Removes the phone attribute from students table definition.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 23,
    "challengeId": "ddl-23",
    "section": "SECTION E",
    "sectionTitle": "ALTER – DROP COLUMN",
    "question": "Drop salary from teachers.",
    "sql": "ALTER TABLE teachers DROP COLUMN salary;",
    "explanation": "Drops compensation column from public teachers schema.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 24,
    "challengeId": "ddl-24",
    "section": "SECTION E",
    "sectionTitle": "ALTER – DROP COLUMN",
    "question": "Drop room_number from classes.",
    "sql": "ALTER TABLE classes DROP COLUMN room_number;",
    "explanation": "Removes physical room reference from the classes blueprint.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 25,
    "challengeId": "ddl-25",
    "section": "SECTION E",
    "sectionTitle": "ALTER – DROP COLUMN",
    "question": "Drop years_of_experience from teachers.",
    "sql": "ALTER TABLE teachers DROP COLUMN years_of_experience;",
    "explanation": "Purges experience column from data dictionary and disk pages.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 26,
    "challengeId": "ddl-26",
    "section": "SECTION F",
    "sectionTitle": "RENAME TABLE",
    "question": "Rename students to school_students.",
    "sql": "RENAME TABLE students TO school_students;",
    "explanation": "Swaps table metadata pointer and renames physical .ibd file without moving data rows.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 27,
    "challengeId": "ddl-27",
    "section": "SECTION F",
    "sectionTitle": "RENAME TABLE",
    "question": "Rename teachers to school_teachers.",
    "sql": "RENAME TABLE teachers TO school_teachers;",
    "explanation": "Updates catalog table name identifier for the teachers relation.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 28,
    "challengeId": "ddl-28",
    "section": "SECTION F",
    "sectionTitle": "RENAME TABLE",
    "question": "Rename classes to school_classes.",
    "sql": "RENAME TABLE classes TO school_classes;",
    "explanation": "Standardizes table naming under the school_ namespace prefix.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 29,
    "challengeId": "ddl-29",
    "section": "SECTION F",
    "sectionTitle": "RENAME TABLE",
    "question": "Rename school_students to students_info.",
    "sql": "RENAME TABLE school_students TO students_info;",
    "explanation": "Modifies table identity in microseconds with zero row copying overhead.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 30,
    "challengeId": "ddl-30",
    "section": "SECTION F",
    "sectionTitle": "RENAME TABLE",
    "question": "Rename school_teachers to teachers_info.",
    "sql": "RENAME TABLE school_teachers TO teachers_info;",
    "explanation": "Atomic identifier change registered directly in the transactional data dictionary.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 31,
    "challengeId": "ddl-31",
    "section": "SECTION G",
    "sectionTitle": "TRUNCATE TABLE",
    "question": "Remove all records from students_info.",
    "sql": "TRUNCATE TABLE students_info;",
    "explanation": "Deallocates data storage pages, wipes all records in milliseconds, and resets AUTO_INCREMENT to 1.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 32,
    "challengeId": "ddl-32",
    "section": "SECTION G",
    "sectionTitle": "TRUNCATE TABLE",
    "question": "Truncate teachers_info.",
    "sql": "TRUNCATE TABLE teachers_info;",
    "explanation": "Fast-path page wipe of all faculty rows while preserving table schema and constraints.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 33,
    "challengeId": "ddl-33",
    "section": "SECTION G",
    "sectionTitle": "TRUNCATE TABLE",
    "question": "Truncate school_classes.",
    "sql": "TRUNCATE TABLE school_classes;",
    "explanation": "Empties the classroom allocation table instantly without row-by-row undo logging.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 34,
    "challengeId": "ddl-34",
    "section": "SECTION G",
    "sectionTitle": "TRUNCATE TABLE",
    "question": "Truncate students_info again.",
    "sql": "TRUNCATE TABLE students_info;",
    "explanation": "Idempotent storage page re-initialization on already emptied table.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 35,
    "challengeId": "ddl-35",
    "section": "SECTION G",
    "sectionTitle": "TRUNCATE TABLE",
    "question": "Truncate teachers_info again.",
    "sql": "TRUNCATE TABLE teachers_info;",
    "explanation": "Ensures teachers_info root page is cleanly reallocated.",
    "type": "DDL",
    "difficulty": "Medium"
  },
  {
    "id": 36,
    "challengeId": "ddl-36",
    "section": "SECTION H",
    "sectionTitle": "DROP TABLE",
    "question": "Drop students_info.",
    "sql": "DROP TABLE students_info;",
    "explanation": "Permanently deletes both table structure and data, unlinking physical .ibd storage from OS.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 37,
    "challengeId": "ddl-37",
    "section": "SECTION H",
    "sectionTitle": "DROP TABLE",
    "question": "Drop teachers_info.",
    "sql": "DROP TABLE teachers_info;",
    "explanation": "Purges faculty table definition from system catalog and evicts pages from buffer pool.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 38,
    "challengeId": "ddl-38",
    "section": "SECTION H",
    "sectionTitle": "DROP TABLE",
    "question": "Drop school_classes.",
    "sql": "DROP TABLE school_classes;",
    "explanation": "Completely removes school_classes table from the active schema.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 39,
    "challengeId": "ddl-39",
    "section": "SECTION H",
    "sectionTitle": "DROP TABLE",
    "question": "Drop classes if exists.",
    "sql": "DROP TABLE IF EXISTS classes;",
    "explanation": "Idempotent deletion guard: safely checks for table existence without raising errors.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 40,
    "challengeId": "ddl-40",
    "section": "SECTION H",
    "sectionTitle": "DROP TABLE",
    "question": "Drop students if exists.",
    "sql": "DROP TABLE IF EXISTS students;",
    "explanation": "Safe defensive syntax commonly used in migration scripts and CI/CD pipelines.",
    "type": "DDL",
    "difficulty": "Easy"
  },
  {
    "id": 41,
    "challengeId": "ddl-41",
    "section": "SECTION I",
    "sectionTitle": "CREATE & DROP DATABASE",
    "question": "Drop the school_db database.",
    "sql": "DROP DATABASE school_db;",
    "explanation": "Permanently destroys the entire school_db schema catalog and all contained tables.",
    "type": "DDL",
    "difficulty": "Basic"
  },
  {
    "id": 42,
    "challengeId": "ddl-42",
    "section": "SECTION I",
    "sectionTitle": "CREATE & DROP DATABASE",
    "question": "Create a new database named office_db.",
    "sql": "CREATE DATABASE office_db;",
    "explanation": "Initializes a new database catalog container for corporate office operations.",
    "type": "DDL",
    "difficulty": "Basic"
  },
  {
    "id": 43,
    "challengeId": "ddl-43",
    "section": "SECTION I",
    "sectionTitle": "CREATE & DROP DATABASE",
    "question": "Permanently drop the office_db database.",
    "sql": "DROP DATABASE office_db;",
    "explanation": "Removes the office_db directory and unregisters it from the database server.",
    "type": "DDL",
    "difficulty": "Basic"
  },
  {
    "id": 44,
    "challengeId": "ddl-44",
    "section": "SECTION I",
    "sectionTitle": "CREATE & DROP DATABASE",
    "question": "Create a new database named test_db.",
    "sql": "CREATE DATABASE test_db;",
    "explanation": "Sets up an isolated test sandbox environment for QA and development verification.",
    "type": "DDL",
    "difficulty": "Basic"
  },
  {
    "id": 45,
    "challengeId": "ddl-45",
    "section": "SECTION I",
    "sectionTitle": "CREATE & DROP DATABASE",
    "question": "Permanently drop the test_db database.",
    "sql": "DROP DATABASE test_db;",
    "explanation": "Tears down test sandbox environment after test suite completion.",
    "type": "DDL",
    "difficulty": "Basic"
  },
  {
    "id": 46,
    "challengeId": "ddl-46",
    "section": "SECTION J",
    "sectionTitle": "INTERVIEW / THINKING",
    "question": "Delete only table structure but keep database.",
    "sql": "DROP TABLE table_name;",
    "explanation": "DROP TABLE destroys the schema blueprint and records of a specific table, leaving the parent database intact.",
    "type": "Interview",
    "difficulty": "Basic"
  },
  {
    "id": 47,
    "challengeId": "ddl-47",
    "section": "SECTION J",
    "sectionTitle": "INTERVIEW / THINKING",
    "question": "Delete all records but keep table structure.",
    "sql": "TRUNCATE TABLE table_name;",
    "explanation": "TRUNCATE TABLE deallocates all row data pages while preserving the table schema, columns, and indexes.",
    "type": "Interview",
    "difficulty": "Easy"
  },
  {
    "id": 48,
    "challengeId": "ddl-48",
    "section": "SECTION J",
    "sectionTitle": "INTERVIEW / THINKING",
    "question": "Identify which is faster: DELETE or TRUNCATE.",
    "sql": "-- TRUNCATE is significantly faster than DELETE!\n-- Reason:\n-- 1. DELETE scans and deletes rows one-by-one, generating undo logs for each row.\n-- 2. TRUNCATE drops and reallocates entire 16KB data pages in milliseconds without row logging.",
    "explanation": "TRUNCATE operates at the storage page level via DDL; DELETE operates at the individual row level via DML.",
    "type": "Interview",
    "difficulty": "Easy"
  },
  {
    "id": 49,
    "challengeId": "ddl-49",
    "section": "SECTION J",
    "sectionTitle": "INTERVIEW / THINKING",
    "question": "Identify which DDL command cannot be rolled back.",
    "sql": "-- ALL DDL commands cannot be rolled back in MySQL/Oracle!\n-- DDL commands (CREATE, ALTER, DROP, TRUNCATE, RENAME)\n-- trigger an implicit AUTO-COMMIT before and after execution.",
    "explanation": "Because DDL updates the internal System Data Dictionary, engines commit changes permanently without transactional rollback.",
    "type": "Interview",
    "difficulty": "Easy"
  },
  {
    "id": 50,
    "challengeId": "ddl-50",
    "section": "SECTION J",
    "sectionTitle": "INTERVIEW / THINKING",
    "question": "Permanently delete a database.",
    "sql": "DROP DATABASE database_name;",
    "explanation": "DROP DATABASE irrevocably removes all data files, tables, views, triggers, and catalog metadata.",
    "type": "Interview",
    "difficulty": "Easy"
  }
];
