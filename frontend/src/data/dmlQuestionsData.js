// =========================================================================
// 📘 50 DML PRACTICE QUESTIONS DATA (CURATED & STANDARDIZED)
// Target Table: employees (emp_id, name, department, salary, city)
// =========================================================================

export const DML_SECTIONS = [
  {
    "id": "all",
    "label": "All 50 Questions"
  },
  {
    "id": "insert",
    "label": "I: INSERT (Q1–12)"
  },
  {
    "id": "update",
    "label": "II: UPDATE (Q13–28)"
  },
  {
    "id": "delete",
    "label": "III: DELETE (Q29–38)"
  },
  {
    "id": "select",
    "label": "IV: SELECT (Q39–50)"
  }
];

export const DML_QUESTIONS_DATA = [
  {
    "id": 1,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Core DML",
    "difficulty": "Basic",
    "challengeId": "dml-01",
    "question": "Add one employee with values: 1, Amit, IT, 60000, Mumbai.",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city)\nVALUES (1, 'Amit', 'IT', 60000, 'Mumbai');",
    "explanation": "Explicitly maps all 5 columns and passes single-quoted strings for text columns."
  },
  {
    "id": 2,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Core DML",
    "difficulty": "Basic",
    "challengeId": "dml-02",
    "question": "Add one employee with values: 2, Ravi, HR, 40000, Pune.",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city)\nVALUES (2, 'Ravi', 'HR', 40000, 'Pune');",
    "explanation": "Inserts employee record for Ravi in HR department."
  },
  {
    "id": 3,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Core DML",
    "difficulty": "Basic",
    "challengeId": "dml-03",
    "question": "Add one employee with values: 3, Sneha, IT, 70000, Delhi.",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city)\nVALUES (3, 'Sneha', 'IT', 70000, 'Delhi');",
    "explanation": "Inserts employee record for Sneha in IT department located in Delhi."
  },
  {
    "id": 4,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Bulk Insert",
    "difficulty": "Easy",
    "challengeId": "dml-04",
    "question": "Add two employees together: (4, Priya, Finance, 50000, Mumbai) and (5, Karan, HR, 45000, Delhi).",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city) VALUES\n  (4, 'Priya', 'Finance', 50000, 'Mumbai'),\n  (5, 'Karan', 'HR', 45000, 'Delhi');",
    "explanation": "Multi-row batch insert: comma-separated value tuples execute in a single round-trip."
  },
  {
    "id": 5,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Bulk Insert",
    "difficulty": "Easy",
    "challengeId": "dml-05",
    "question": "Add three employees in one operation: (6, Rahul, IT, 55000, Pune), (7, Neha, HR, 48000, Mumbai), and (8, Arjun, Finance, 65000, Delhi).",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city) VALUES\n  (6, 'Rahul', 'IT', 55000, 'Pune'),\n  (7, 'Neha', 'HR', 48000, 'Mumbai'),\n  (8, 'Arjun', 'Finance', 65000, 'Delhi');",
    "explanation": "Three-row bulk insert saving engine lock and log flush overhead."
  },
  {
    "id": 6,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Core DML",
    "difficulty": "Basic",
    "challengeId": "dml-06",
    "question": "Add an employee whose salary is greater than 70000: 9, Meena, IT, 72000, Mumbai.",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city)\nVALUES (9, 'Meena', 'IT', 72000, 'Mumbai');",
    "explanation": "Inserts Meena with a salary of 72000."
  },
  {
    "id": 7,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Core DML",
    "difficulty": "Basic",
    "challengeId": "dml-07",
    "question": "Add an employee whose salary is less than 40000: 10, Suresh, HR, 38000, Pune.",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city)\nVALUES (10, 'Suresh', 'HR', 38000, 'Pune');",
    "explanation": "Inserts Suresh with a salary of 38000."
  },
  {
    "id": 8,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Core DML",
    "difficulty": "Basic",
    "challengeId": "dml-08",
    "question": "Add an employee working in Delhi: 11, Pooja, IT, 61000, Delhi.",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city)\nVALUES (11, 'Pooja', 'IT', 61000, 'Delhi');",
    "explanation": "Inserts Pooja working in Delhi city."
  },
  {
    "id": 9,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Core DML",
    "difficulty": "Basic",
    "challengeId": "dml-09",
    "question": "Add an employee working in Finance department: 12, Ramesh, Finance, 54000, Mumbai.",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city)\nVALUES (12, 'Ramesh', 'Finance', 54000, 'Mumbai');",
    "explanation": "Inserts Ramesh in the Finance department."
  },
  {
    "id": 10,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Core DML",
    "difficulty": "Basic",
    "challengeId": "dml-10",
    "question": "Add an employee whose name starts with \"A\": 13, Ankit, HR, 42000, Pune.",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city)\nVALUES (13, 'Ankit', 'HR', 42000, 'Pune');",
    "explanation": "Inserts Ankit in the HR department."
  },
  {
    "id": 11,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Core DML",
    "difficulty": "Basic",
    "challengeId": "dml-11",
    "question": "Add an employee with the highest salary so far: 14, Kavita, IT, 75000, Delhi.",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city)\nVALUES (14, 'Kavita', 'IT', 75000, 'Delhi');",
    "explanation": "Inserts Kavita with a top-bracket salary of 75000."
  },
  {
    "id": 12,
    "section": "insert",
    "sectionTitle": "INSERT",
    "type": "Core DML",
    "difficulty": "Basic",
    "challengeId": "dml-12",
    "question": "Add an employee with duplicate city but different department: 15, Mohit, Finance, 58000, Mumbai.",
    "sql": "INSERT INTO employees (emp_id, name, department, salary, city)\nVALUES (15, 'Mohit', 'Finance', 58000, 'Mumbai');",
    "explanation": "Inserts Mohit in Mumbai under the Finance department."
  },
  {
    "id": 13,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Targeted Update",
    "difficulty": "Easy",
    "challengeId": "dml-13",
    "question": "Update the salary to 65000 for the employee where emp_id is 1.",
    "sql": "UPDATE employees\nSET salary = 65000\nWHERE emp_id = 1;",
    "explanation": "Filters by primary key emp_id = 1 to guarantee exactly one row is modified."
  },
  {
    "id": 14,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Targeted Update",
    "difficulty": "Easy",
    "challengeId": "dml-14",
    "question": "Update the city to Mumbai for the employee where emp_id is 2.",
    "sql": "UPDATE employees\nSET city = 'Mumbai'\nWHERE emp_id = 2;",
    "explanation": "Modifies city string value for emp_id 2."
  },
  {
    "id": 15,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Targeted Update",
    "difficulty": "Easy",
    "challengeId": "dml-15",
    "question": "Update the department to Finance for the employee where emp_id is 3.",
    "sql": "UPDATE employees\nSET department = 'Finance'\nWHERE emp_id = 3;",
    "explanation": "Transfers employee 3 to the Finance department."
  },
  {
    "id": 16,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Multi-Column Update",
    "difficulty": "Easy",
    "challengeId": "dml-16",
    "question": "Update both salary and city for the employee where emp_id is 4 (salary = 55000, city = Pune).",
    "sql": "UPDATE employees\nSET salary = 55000, city = 'Pune'\nWHERE emp_id = 4;",
    "explanation": "Comma-separated SET clause updates multiple columns simultaneously."
  },
  {
    "id": 17,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Computed Update",
    "difficulty": "Medium",
    "challengeId": "dml-17",
    "question": "Increase the salary by 5000 for all employees working in HR department.",
    "sql": "UPDATE employees\nSET salary = salary + 5000\nWHERE department = 'HR';",
    "explanation": "Atomic in-place addition increments salary by 5000 for all matching HR employees."
  },
  {
    "id": 18,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Computed Update",
    "difficulty": "Medium",
    "challengeId": "dml-18",
    "question": "Increase the salary by 10% for all employees working in IT department.",
    "sql": "UPDATE employees\nSET salary = salary * 1.10\nWHERE department = 'IT';",
    "explanation": "Multiplies current salary by 1.10 for a 10% raise."
  },
  {
    "id": 19,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Batch Update",
    "difficulty": "Easy",
    "challengeId": "dml-19",
    "question": "Update the city to Delhi for all employees currently working in Pune.",
    "sql": "UPDATE employees\nSET city = 'Delhi'\nWHERE city = 'Pune';",
    "explanation": "Transfers all Pune-based employees to Delhi."
  },
  {
    "id": 20,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Conditional Update",
    "difficulty": "Medium",
    "challengeId": "dml-20",
    "question": "Update the department to IT for employees whose salary is greater than 70000.",
    "sql": "UPDATE employees\nSET department = 'IT'\nWHERE salary > 70000;",
    "explanation": "Filters with comparison operator > 70000."
  },
  {
    "id": 21,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Conditional Update",
    "difficulty": "Easy",
    "challengeId": "dml-21",
    "question": "Update salary to 50000 for employees whose salary is less than 40000.",
    "sql": "UPDATE employees\nSET salary = 50000\nWHERE salary < 40000;",
    "explanation": "Raises minimum floor compensation for lower-salary employees."
  },
  {
    "id": 22,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Batch Update",
    "difficulty": "Easy",
    "challengeId": "dml-22",
    "question": "Update the city to Mumbai for employees working in Finance department.",
    "sql": "UPDATE employees\nSET city = 'Mumbai'\nWHERE department = 'Finance';",
    "explanation": "Consolidates all Finance staff into Mumbai."
  },
  {
    "id": 23,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Batch Update",
    "difficulty": "Easy",
    "challengeId": "dml-23",
    "question": "Update the department to HR for employees working in Delhi.",
    "sql": "UPDATE employees\nSET department = 'HR'\nWHERE city = 'Delhi';",
    "explanation": "Assigns all Delhi employees to HR."
  },
  {
    "id": 24,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Targeted Update",
    "difficulty": "Easy",
    "challengeId": "dml-24",
    "question": "Update salary to 60000 for employees named Ravi.",
    "sql": "UPDATE employees\nSET salary = 60000\nWHERE name = 'Ravi';",
    "explanation": "Filters by name equality condition."
  },
  {
    "id": 25,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "List Filter Update",
    "difficulty": "Medium",
    "challengeId": "dml-25",
    "question": "Update salary to 62000 for employees whose emp_id is 11 or 12.",
    "sql": "UPDATE employees\nSET salary = 62000\nWHERE emp_id IN (11, 12);",
    "explanation": "Uses IN operator for clean multi-key matching."
  },
  {
    "id": 26,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Multi-Column Update",
    "difficulty": "Easy",
    "challengeId": "dml-26",
    "question": "Update city to Mumbai and department to IT for employee where emp_id is 13.",
    "sql": "UPDATE employees\nSET city = 'Mumbai', department = 'IT'\nWHERE emp_id = 13;",
    "explanation": "Updates both city and department in a single atomic statement."
  },
  {
    "id": 27,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Negation Update",
    "difficulty": "Medium",
    "challengeId": "dml-27",
    "question": "Increase salary by 3000 for all employees except those in Finance department.",
    "sql": "UPDATE employees\nSET salary = salary + 3000\nWHERE department != 'Finance';",
    "explanation": "Uses != (or <>) negation operator to exclude Finance employees."
  },
  {
    "id": 28,
    "section": "update",
    "sectionTitle": "UPDATE",
    "type": "Range Update",
    "difficulty": "Medium",
    "challengeId": "dml-28",
    "question": "Update department to Operations for employees whose salary is between 45000 and 55000.",
    "sql": "UPDATE employees\nSET department = 'Operations'\nWHERE salary BETWEEN 45000 AND 55000;",
    "explanation": "Uses inclusive BETWEEN range condition."
  },
  {
    "id": 29,
    "section": "delete",
    "sectionTitle": "DELETE",
    "type": "Targeted Delete",
    "difficulty": "Easy",
    "challengeId": "dml-29",
    "question": "Delete the employee where emp_id is 15.",
    "sql": "DELETE FROM employees\nWHERE emp_id = 15;",
    "explanation": "Deletes single targeted row using primary key filter."
  },
  {
    "id": 30,
    "section": "delete",
    "sectionTitle": "DELETE",
    "type": "Batch Delete",
    "difficulty": "Easy",
    "challengeId": "dml-30",
    "question": "Delete employees working in HR department.",
    "sql": "DELETE FROM employees\nWHERE department = 'HR';",
    "explanation": "Deletes all employees matching department HR."
  },
  {
    "id": 31,
    "section": "delete",
    "sectionTitle": "DELETE",
    "type": "Conditional Delete",
    "difficulty": "Easy",
    "challengeId": "dml-31",
    "question": "Delete employees whose salary is less than 40000.",
    "sql": "DELETE FROM employees\nWHERE salary < 40000;",
    "explanation": "Filters with < 40000."
  },
  {
    "id": 32,
    "section": "delete",
    "sectionTitle": "DELETE",
    "type": "Batch Delete",
    "difficulty": "Easy",
    "challengeId": "dml-32",
    "question": "Delete employees working in Pune city.",
    "sql": "DELETE FROM employees\nWHERE city = 'Pune';",
    "explanation": "Removes all records where city is Pune."
  },
  {
    "id": 33,
    "section": "delete",
    "sectionTitle": "DELETE",
    "type": "Multi-Condition Delete",
    "difficulty": "Medium",
    "challengeId": "dml-33",
    "question": "Delete employees from Finance department working in Delhi.",
    "sql": "DELETE FROM employees\nWHERE department = 'Finance' AND city = 'Delhi';",
    "explanation": "Combines multiple conditions using logical AND."
  },
  {
    "id": 34,
    "section": "delete",
    "sectionTitle": "DELETE",
    "type": "Conditional Delete",
    "difficulty": "Easy",
    "challengeId": "dml-34",
    "question": "Delete employees whose salary is greater than 75000.",
    "sql": "DELETE FROM employees\nWHERE salary > 75000;",
    "explanation": "Deletes rows meeting the upper salary threshold."
  },
  {
    "id": 35,
    "section": "delete",
    "sectionTitle": "DELETE",
    "type": "Targeted Delete",
    "difficulty": "Easy",
    "challengeId": "dml-35",
    "question": "Delete employees named Suresh.",
    "sql": "DELETE FROM employees\nWHERE name = 'Suresh';",
    "explanation": "Removes records with name Suresh."
  },
  {
    "id": 36,
    "section": "delete",
    "sectionTitle": "DELETE",
    "type": "List Filter Delete",
    "difficulty": "Medium",
    "challengeId": "dml-36",
    "question": "Delete employees whose emp_id is 10 or 11.",
    "sql": "DELETE FROM employees\nWHERE emp_id IN (10, 11);",
    "explanation": "Uses IN (10, 11) to delete specific IDs."
  },
  {
    "id": 37,
    "section": "delete",
    "sectionTitle": "DELETE",
    "type": "Negation Delete",
    "difficulty": "Medium",
    "challengeId": "dml-37",
    "question": "Delete all employees except those working in IT department.",
    "sql": "DELETE FROM employees\nWHERE department != 'IT';",
    "explanation": "Excludes IT staff from deletion using !=."
  },
  {
    "id": 38,
    "section": "delete",
    "sectionTitle": "DELETE",
    "type": "Full Table Delete",
    "difficulty": "Basic",
    "challengeId": "dml-38",
    "question": "Delete all records from the employees table.",
    "sql": "DELETE FROM employees;",
    "explanation": "DELETE without WHERE wipes all rows while preserving the table schema and column structure."
  },
  {
    "id": 39,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Basic SELECT",
    "difficulty": "Basic",
    "challengeId": "dml-39",
    "question": "Retrieve all employee records.",
    "sql": "SELECT * FROM employees;",
    "explanation": "The asterisk (*) selects all columns from the employees table."
  },
  {
    "id": 40,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Projection",
    "difficulty": "Basic",
    "challengeId": "dml-40",
    "question": "Retrieve only employee names and salaries.",
    "sql": "SELECT name, salary FROM employees;",
    "explanation": "Explicitly projects only the name and salary columns."
  },
  {
    "id": 41,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Filtering",
    "difficulty": "Easy",
    "challengeId": "dml-41",
    "question": "Retrieve employees working in IT department.",
    "sql": "SELECT * FROM employees\nWHERE department = 'IT';",
    "explanation": "Filters records matching department IT."
  },
  {
    "id": 42,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Filtering",
    "difficulty": "Easy",
    "challengeId": "dml-42",
    "question": "Retrieve employees working in Mumbai.",
    "sql": "SELECT * FROM employees\nWHERE city = 'Mumbai';",
    "explanation": "Filters records matching city Mumbai."
  },
  {
    "id": 43,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Comparison",
    "difficulty": "Easy",
    "challengeId": "dml-43",
    "question": "Retrieve employees whose salary is greater than 60000.",
    "sql": "SELECT * FROM employees\nWHERE salary > 60000;",
    "explanation": "Uses > 60000 numeric comparison filter."
  },
  {
    "id": 44,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Range Filtering",
    "difficulty": "Medium",
    "challengeId": "dml-44",
    "question": "Retrieve employees whose salary is between 45000 and 65000.",
    "sql": "SELECT * FROM employees\nWHERE salary BETWEEN 45000 AND 65000;",
    "explanation": "BETWEEN filter includes boundaries 45000 and 65000."
  },
  {
    "id": 45,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Multi-Condition",
    "difficulty": "Medium",
    "challengeId": "dml-45",
    "question": "Retrieve employees working in HR department and Delhi city.",
    "sql": "SELECT * FROM employees\nWHERE department = 'HR' AND city = 'Delhi';",
    "explanation": "Requires both department and city conditions to evaluate to TRUE."
  },
  {
    "id": 46,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Logical OR",
    "difficulty": "Medium",
    "challengeId": "dml-46",
    "question": "Retrieve employees working in IT or Finance department.",
    "sql": "SELECT * FROM employees\nWHERE department IN ('IT', 'Finance');",
    "explanation": "Uses IN operator for multi-value categorical matching."
  },
  {
    "id": 47,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Negation",
    "difficulty": "Easy",
    "challengeId": "dml-47",
    "question": "Retrieve employees not working in HR department.",
    "sql": "SELECT * FROM employees\nWHERE department != 'HR';",
    "explanation": "Excludes HR staff using != operator."
  },
  {
    "id": 48,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Subquery / Sorting",
    "difficulty": "Hard",
    "challengeId": "dml-48",
    "question": "Retrieve employees whose salary is the highest among all employees.",
    "sql": "SELECT * FROM employees\nWHERE salary = (SELECT MAX(salary) FROM employees);",
    "explanation": "Uses a scalar subquery with MAX(salary) to retrieve the top earner."
  },
  {
    "id": 49,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Compound Filter",
    "difficulty": "Medium",
    "challengeId": "dml-49",
    "question": "Retrieve employees whose city is Mumbai and salary is greater than 50000.",
    "sql": "SELECT * FROM employees\nWHERE city = 'Mumbai' AND salary > 50000;",
    "explanation": "Filters Mumbai residents with salary above 50,000."
  },
  {
    "id": 50,
    "section": "select",
    "sectionTitle": "SELECT",
    "type": "Sorting",
    "difficulty": "Medium",
    "challengeId": "dml-50",
    "question": "Retrieve employees sorted by salary in descending order.",
    "sql": "SELECT * FROM employees\nORDER BY salary DESC;",
    "explanation": "ORDER BY salary DESC sorts results from highest to lowest salary."
  }
];
