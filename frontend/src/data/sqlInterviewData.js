import { COMMON_SCHEMAS } from './sqlChallenges';

export const SQL_INTERVIEW_PROBLEMS = [
  {
    id: 'int-01',
    title: 'Find Second Highest Salary',
    difficulty: 'Intermediate',
    companyTags: ['Amazon', 'Microsoft', 'Google', 'TCS', 'Infosys'],
    category: 'Subqueries & Window Functions',
    frequency: 'Extremely High (Top 3 in Tech Interviews)',
    description: `
Table: \`employees\`

| Column Name | Type | Description |
| :--- | :--- | :--- |
| **id** | INTEGER | Primary Key |
| **first_name** | TEXT | First name |
| **last_name** | TEXT | Last name |
| **salary** | INTEGER | Monthly/Annual compensation |
| **department_id** | INTEGER | Department foreign key |

---

Write a SQL query to find the **second highest salary** from the \`employees\` table. If there is no second highest salary (e.g., table has only 1 record or all salaries are equal), the query should ideally return \`NULL\`.

Return the result with column header alias **\`SecondHighestSalary\`**.
    `,
    setupSql: COMMON_SCHEMAS.hrCompany,
    starterSql: `-- Method 1: Using Subquery / MAX() or DENSE_RANK()
SELECT MAX(salary) AS SecondHighestSalary
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);`,
    expectedSql: `SELECT MAX(salary) AS SecondHighestSalary
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);`,
    checkOrder: false,
    hints: [
      'To find the 2nd highest, select the MAX(salary) where salary is strictly less than the overall MAX(salary).',
      'Alternatively, in modern SQL you can use `DENSE_RANK() OVER (ORDER BY salary DESC)` inside a CTE or subquery.'
    ],
    explanation: `
Approach 1: Scalar Subquery with \`MAX()\`
\`\`\`sql
SELECT MAX(salary) AS SecondHighestSalary
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
\`\`\`
Why this works:
1. The inner subquery \`(SELECT MAX(salary) FROM employees)\` finds the maximum salary ($145,000).
2. The outer query finds the highest salary strictly less than $145,000 ($125,000).
3. If no second salary exists, \`MAX()\` returns \`NULL\` cleanly without throwing an empty set error.
    `,
    tips: 'Interviewers love asking what happens when two employees share the highest salary. Always mention DISTINCT or DENSE_RANK to handle ties correctly.'
  },

  {
    id: 'int-02',
    title: 'Find Nth-Highest Salary by Department',
    difficulty: 'Advanced',
    companyTags: ['Meta', 'Amazon', 'Apple', 'Uber'],
    category: 'Window Functions',
    frequency: 'Very High',
    description: `
Table: \`employees\` and \`departments\`

Write an SQL query to find the employee(s) who earn the **2nd highest salary in each department**.

Return the result with columns:
- **\`department_name\`**
- **\`first_name\`**
- **\`salary\`**

Order by \`department_name\` ASC, then \`salary\` DESC.
    `,
    setupSql: COMMON_SCHEMAS.hrCompany,
    starterSql: `-- Use DENSE_RANK() PARTITION BY department_id
WITH RankedSalaries AS (
  SELECT 
    d.department_name,
    e.first_name,
    e.salary,
    DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rnk
  FROM employees e
  JOIN departments d ON e.department_id = d.id
)
SELECT department_name, first_name, salary
FROM RankedSalaries
WHERE rnk = 2
ORDER BY department_name ASC, salary DESC;`,
    expectedSql: `WITH RankedSalaries AS (
  SELECT 
    d.department_name,
    e.first_name,
    e.salary,
    DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rnk
  FROM employees e
  JOIN departments d ON e.department_id = d.id
)
SELECT department_name, first_name, salary
FROM RankedSalaries
WHERE rnk = 2
ORDER BY department_name ASC, salary DESC;`,
    checkOrder: true,
    hints: [
      'Use `DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)` to rank within each department without skipping numbers for ties.',
      'Filter for `WHERE rnk = 2` in the outer query.'
    ],
    explanation: `
Using a CTE with \`DENSE_RANK()\`:
\`\`\`sql
WITH RankedSalaries AS (
  SELECT 
    d.department_name,
    e.first_name,
    e.salary,
    DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rnk
  FROM employees e
  JOIN departments d ON e.department_id = d.id
)
SELECT department_name, first_name, salary
FROM RankedSalaries
WHERE rnk = 2
ORDER BY department_name ASC, salary DESC;
\`\`\`
    `,
    tips: 'Be prepared to explain why DENSE_RANK() is preferred over ROW_NUMBER() (handles tied salaries) and RANK() (prevents skipping ranks).'
  },

  {
    id: 'int-03',
    title: 'Find Duplicate Records in a Table',
    difficulty: 'Beginner',
    companyTags: ['TCS', 'Infosys', 'Cognizant', 'Wipro', 'Accenture'],
    category: 'GROUP BY & HAVING',
    frequency: 'Extremely High',
    description: `
Table: \`customers\`

| Column Name | Type |
| :--- | :--- |
| **id** | INTEGER |
| **name** | TEXT |
| **email** | TEXT |
| **city** | TEXT |
| **country** | TEXT |

Write an SQL query to find all **emails that appear more than once** in the \`customers\` table, along with their occurrence count.

Return columns:
- **\`email\`**
- **\`occurrence_count\`**
    `,
    setupSql: COMMON_SCHEMAS.ecommerce,
    starterSql: `-- Find emails with COUNT > 1
SELECT email, COUNT(*) AS occurrence_count
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;`,
    expectedSql: `SELECT email, COUNT(*) AS occurrence_count
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;`,
    checkOrder: false,
    hints: [
      'Group by the email column and count rows per group.',
      'Use HAVING COUNT(*) > 1 to filter only duplicates.'
    ],
    explanation: `
\`\`\`sql
SELECT email, COUNT(*) AS occurrence_count
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;
\`\`\`
1. \`GROUP BY email\` groups records with the same email.
2. \`HAVING COUNT(*) > 1\` filters only groups containing 2 or more records.
    `,
    tips: 'Remember that WHERE filters rows BEFORE grouping, while HAVING filters aggregated groups AFTER grouping.'
  },

  {
    id: 'int-04',
    title: 'Find Customers Who Never Placed an Order',
    difficulty: 'Beginner',
    companyTags: ['Amazon', 'Walmart Labs', 'Target', 'Flipkart'],
    category: 'Outer Joins & Subqueries',
    frequency: 'Very High',
    description: `
Tables: \`customers\` and \`orders\`

Write a SQL query to report all **customers who have NEVER placed any order**.

Return columns:
- **\`customer_id\`** (id)
- **\`name\`**
- **\`email\`**

Order by \`customer_id\` ASC.
    `,
    setupSql: COMMON_SCHEMAS.ecommerce,
    starterSql: `-- Method 1: LEFT JOIN with IS NULL
SELECT c.id AS customer_id, c.name, c.email
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL
ORDER BY c.id ASC;`,
    expectedSql: `SELECT c.id AS customer_id, c.name, c.email
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL
ORDER BY c.id ASC;`,
    checkOrder: true,
    hints: [
      'A LEFT JOIN keeps all customer rows. When a customer has no orders, the orders columns will be NULL.',
      'Use `WHERE o.id IS NULL` to pick only unmatched customers.'
    ],
    explanation: `
\`\`\`sql
SELECT c.id AS customer_id, c.name, c.email
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL
ORDER BY c.id ASC;
\`\`\`
Alternative with NOT EXISTS:
\`\`\`sql
SELECT id AS customer_id, name, email
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
)
ORDER BY id ASC;
\`\`\`
    `,
    tips: 'Mention that NOT EXISTS is often more performant than NOT IN because NOT IN evaluates to NULL when the subquery contains a NULL value.'
  },

  {
    id: 'int-05',
    title: 'Find Departments with No Employees',
    difficulty: 'Beginner',
    companyTags: ['Oracle', 'Salesforce', 'Cisco'],
    category: 'Outer Joins',
    frequency: 'Common',
    description: `
Tables: \`departments\` and \`employees\`

Write a SQL query to find all **departments that currently have NO assigned employees**.

Return columns:
- **\`department_id\`** (d.id)
- **\`department_name\`**
- **\`location\`**

Order by \`department_id\` ASC.
    `,
    setupSql: COMMON_SCHEMAS.hrCompany,
    starterSql: `-- Find departments without employees
SELECT d.id AS department_id, d.department_name, d.location
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
WHERE e.id IS NULL
ORDER BY d.id ASC;`,
    expectedSql: `SELECT d.id AS department_id, d.department_name, d.location
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
WHERE e.id IS NULL
ORDER BY d.id ASC;`,
    checkOrder: true,
    hints: [
      'Perform a LEFT JOIN from departments to employees.',
      'Filter where employee ID IS NULL.'
    ],
    explanation: `
\`\`\`sql
SELECT d.id AS department_id, d.department_name, d.location
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
WHERE e.id IS NULL
ORDER BY d.id ASC;
\`\`\`
    `,
    tips: 'Great way to verify understanding of relational key joins.'
  },

  {
    id: 'int-06',
    title: 'Find Employees Earning Above Department Average',
    difficulty: 'Intermediate',
    companyTags: ['Microsoft', 'Goldman Sachs', 'Morgan Stanley', 'Adobe'],
    category: 'Correlated Subqueries & Window Functions',
    frequency: 'High',
    description: `
Tables: \`employees\` and \`departments\`

Write a SQL query to find all employees whose salary is **strictly greater than the average salary of their respective department**.

Return columns:
- **\`first_name\`**
- **\`last_name\`**
- **\`department_name\`**
- **\`salary\`**

Order by \`department_name\` ASC, then \`salary\` DESC.
    `,
    setupSql: COMMON_SCHEMAS.hrCompany,
    starterSql: `-- Correlated subquery or Window AVG
SELECT 
  e.first_name,
  e.last_name,
  d.department_name,
  e.salary
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
)
ORDER BY d.department_name ASC, e.salary DESC;`,
    expectedSql: `SELECT 
  e.first_name,
  e.last_name,
  d.department_name,
  e.salary
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
)
ORDER BY d.department_name ASC, e.salary DESC;`,
    checkOrder: true,
    hints: [
      'Use a correlated subquery in the WHERE clause: `WHERE e.salary > (SELECT AVG(salary) FROM employees e2 WHERE e2.department_id = e.department_id)`',
      'Or calculate `AVG(salary) OVER (PARTITION BY department_id)` in a CTE.'
    ],
    explanation: `
\`\`\`sql
SELECT 
  e.first_name,
  e.last_name,
  d.department_name,
  e.salary
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
)
ORDER BY d.department_name ASC, e.salary DESC;
\`\`\`
    `,
    tips: 'Mention that Window Functions reduce multiple table scans compared to correlated subqueries on large datasets.'
  },

  {
    id: 'int-07',
    title: 'Find Cumulative Running Total of Orders',
    difficulty: 'Advanced',
    companyTags: ['Stripe', 'PayPal', 'Square', 'Visa'],
    category: 'Window Functions',
    frequency: 'High in FinTech',
    description: `
Table: \`orders\`

Write a SQL query to calculate the **cumulative running total of order revenue over time**, ordered by \`order_date\` and \`id\`.

Return columns:
- **\`id\`** (order id)
- **\`order_date\`**
- **\`total_amount\`**
- **\`running_total\`**
    `,
    setupSql: COMMON_SCHEMAS.ecommerce,
    starterSql: `-- Use SUM() OVER (ORDER BY order_date, id)
SELECT 
  id,
  order_date,
  total_amount,
  SUM(total_amount) OVER (ORDER BY order_date ASC, id ASC) AS running_total
FROM orders
ORDER BY order_date ASC, id ASC;`,
    expectedSql: `SELECT 
  id,
  order_date,
  total_amount,
  SUM(total_amount) OVER (ORDER BY order_date ASC, id ASC) AS running_total
FROM orders
ORDER BY order_date ASC, id ASC;`,
    checkOrder: true,
    hints: [
      'Use `SUM(total_amount) OVER (ORDER BY order_date ASC, id ASC)` to accumulate amounts row by row.'
    ],
    explanation: `
\`\`\`sql
SELECT 
  id,
  order_date,
  total_amount,
  SUM(total_amount) OVER (ORDER BY order_date ASC, id ASC) AS running_total
FROM orders
ORDER BY order_date ASC, id ASC;
\`\`\`
The \`OVER (ORDER BY ...)\` clause defines a window that expands from the first row up to the current row, calculating the cumulative sum.
    `,
    tips: 'FinTech interviewers test this regularly to evaluate transaction ledger querying.'
  },

  {
    id: 'int-08',
    title: 'Find Employee Hierarchy (Employee & Manager Name)',
    difficulty: 'Intermediate',
    companyTags: ['LinkedIn', 'Meta', 'Netflix'],
    category: 'Self Join',
    frequency: 'Very High',
    description: `
Table: \`employees\`

Write a SQL query to report the name of every employee along with their direct **Manager name**. If an employee has no manager (e.g. CEO / VP), display \`'No Manager'\` or \`NULL\`.

Return columns:
- **\`employee_name\`** (first_name || ' ' || last_name)
- **\`manager_name\`**

Order by \`employee_name\` ASC.
    `,
    setupSql: COMMON_SCHEMAS.hrCompany,
    starterSql: `-- Self JOIN between employees (e) and employees (m)
SELECT 
  e.first_name || ' ' || e.last_name AS employee_name,
  COALESCE(m.first_name || ' ' || m.last_name, 'No Manager') AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
ORDER BY employee_name ASC;`,
    expectedSql: `SELECT 
  e.first_name || ' ' || e.last_name AS employee_name,
  COALESCE(m.first_name || ' ' || m.last_name, 'No Manager') AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
ORDER BY employee_name ASC;`,
    checkOrder: true,
    hints: [
      'Join the employees table to itself using `LEFT JOIN employees m ON e.manager_id = m.id`.',
      'Use `COALESCE` to replace NULL manager with "No Manager".'
    ],
    explanation: `
\`\`\`sql
SELECT 
  e.first_name || ' ' || e.last_name AS employee_name,
  COALESCE(m.first_name || ' ' || m.last_name, 'No Manager') AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
ORDER BY employee_name ASC;
\`\`\`
    `,
    tips: 'Self joins are the bread and butter of organizational and relational hierarchy questions.'
  },

  {
    id: 'int-09',
    title: 'Find Top 3 Best-Selling Products by Revenue',
    difficulty: 'Intermediate',
    companyTags: ['Amazon', 'Shopify', 'Instacart'],
    category: 'Aggregations & Joins',
    frequency: 'Common',
    description: `
Table: \`order_items\`

Write a SQL query to report the **Top 3 products that have generated the highest total revenue** (\`unit_price * quantity\`).

Return columns:
- **\`product_name\`**
- **\`total_revenue\`**

Order by \`total_revenue\` DESC, then \`product_name\` ASC. Limit to 3 records.
    `,
    setupSql: COMMON_SCHEMAS.ecommerce,
    starterSql: `-- Group by product_name and compute revenue
SELECT 
  product_name,
  SUM(unit_price * quantity) AS total_revenue
FROM order_items
GROUP BY product_name
ORDER BY total_revenue DESC, product_name ASC
LIMIT 3;`,
    expectedSql: `SELECT 
  product_name,
  SUM(unit_price * quantity) AS total_revenue
FROM order_items
GROUP BY product_name
ORDER BY total_revenue DESC, product_name ASC
LIMIT 3;`,
    checkOrder: true,
    hints: [
      'Calculate revenue as `SUM(unit_price * quantity)`.',
      'Group by product_name, sort descending, and LIMIT 3.'
    ],
    explanation: `
\`\`\`sql
SELECT 
  product_name,
  SUM(unit_price * quantity) AS total_revenue
FROM order_items
GROUP BY product_name
ORDER BY total_revenue DESC, product_name ASC
LIMIT 3;
\`\`\`
    `,
    tips: 'Clarify if there are ties for 3rd place; in production DENSE_RANK() is safer than hard LIMIT.'
  },

  {
    id: 'int-10',
    title: 'Customer Spending Breakdown with CASE Tiers',
    difficulty: 'Intermediate',
    companyTags: ['Airbnb', 'Uber', 'Booking.com'],
    category: 'CASE & Aggregations',
    frequency: 'High',
    description: `
Tables: \`customers\` and \`orders\`

Write a SQL query to categorize each customer into a loyalty tier based on their total spending:
- **'VIP'**: Total spending >= $1,000
- **'Regular'**: Total spending between $200 and $999.99
- **'Starter'**: Total spending < $200 (including customers with 0 orders)

Return columns:
- **\`customer_name\`** (c.name)
- **\`total_spent\`** (COALESCE sum to 0)
- **\`tier\`**

Order by \`total_spent\` DESC, then \`customer_name\` ASC.
    `,
    setupSql: COMMON_SCHEMAS.ecommerce,
    starterSql: `-- Use LEFT JOIN, SUM, and CASE
SELECT 
  c.name AS customer_name,
  COALESCE(SUM(o.total_amount), 0) AS total_spent,
  CASE 
    WHEN COALESCE(SUM(o.total_amount), 0) >= 1000 THEN 'VIP'
    WHEN COALESCE(SUM(o.total_amount), 0) >= 200 THEN 'Regular'
    ELSE 'Starter'
  END AS tier
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
ORDER BY total_spent DESC, customer_name ASC;`,
    expectedSql: `SELECT 
  c.name AS customer_name,
  COALESCE(SUM(o.total_amount), 0) AS total_spent,
  CASE 
    WHEN COALESCE(SUM(o.total_amount), 0) >= 1000 THEN 'VIP'
    WHEN COALESCE(SUM(o.total_amount), 0) >= 200 THEN 'Regular'
    ELSE 'Starter'
  END AS tier
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
ORDER BY total_spent DESC, customer_name ASC;`,
    checkOrder: true,
    hints: [
      'Join customers to orders with a LEFT JOIN so customers with 0 orders are preserved.',
      'Use `COALESCE(SUM(o.total_amount), 0)` to avoid NULL sums.',
      'Write a CASE WHEN statement to categorize tiers.'
    ],
    explanation: `
\`\`\`sql
SELECT 
  c.name AS customer_name,
  COALESCE(SUM(o.total_amount), 0) AS total_spent,
  CASE 
    WHEN COALESCE(SUM(o.total_amount), 0) >= 1000 THEN 'VIP'
    WHEN COALESCE(SUM(o.total_amount), 0) >= 200 THEN 'Regular'
    ELSE 'Starter'
  END AS tier
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
ORDER BY total_spent DESC, customer_name ASC;
\`\`\`
    `,
    tips: 'A staple for business intelligence and data analyst interview rounds.'
  }
];
