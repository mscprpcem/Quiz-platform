// 4 Production-Grade Real-World Database Schemas & Business Case Scenarios

export const REAL_WORLD_DATABASES = [
  {
    id: 'db-hr',
    title: 'Employee & HR Analytics Database',
    industry: 'Human Resources & Corporate Operations',
    icon: 'Users',
    badge: 'Enterprise Schema',
    description: 'Analyze departmental headcount, salary distributions, compensation bands, reporting lines, and manager oversight.',
    tables: [
      {
        name: 'departments',
        description: 'Organizational business units and branch office locations',
        columns: ['id (PK)', 'department_name', 'location', 'budget']
      },
      {
        name: 'employees',
        description: 'Staff directory with salaries, hire dates, and manager IDs',
        columns: ['id (PK)', 'first_name', 'last_name', 'email', 'department_id (FK)', 'salary', 'hire_date', 'manager_id (FK)']
      },
      {
        name: 'performance_reviews',
        description: 'Annual performance evaluations and rating scores',
        columns: ['review_id (PK)', 'employee_id (FK)', 'review_year', 'rating (1-5)', 'bonus_pct']
      }
    ],
    setupSql: `
      CREATE TABLE departments (
        id INTEGER PRIMARY KEY,
        department_name TEXT NOT NULL,
        location TEXT NOT NULL,
        budget INTEGER NOT NULL
      );

      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        department_id INTEGER,
        salary INTEGER NOT NULL,
        hire_date TEXT NOT NULL,
        manager_id INTEGER,
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (manager_id) REFERENCES employees(id)
      );

      CREATE TABLE performance_reviews (
        review_id INTEGER PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        review_year INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        bonus_pct REAL NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      );

      INSERT INTO departments (id, department_name, location, budget) VALUES
        (1, 'Engineering', 'San Francisco', 2500000),
        (2, 'Product & Design', 'New York', 1200000),
        (3, 'Data Science & AI', 'San Francisco', 1800000),
        (4, 'Marketing & Sales', 'Chicago', 950000),
        (5, 'Human Resources', 'Austin', 500000),
        (6, 'Legal & Compliance', 'London', 650000);

      INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, manager_id) VALUES
        (1, 'Vikram', 'Aditya', 'vikram.a@company.com', 1, 165000, '2020-03-15', NULL),
        (2, 'Ananya', 'Iyer', 'ananya.i@company.com', 1, 125000, '2021-06-01', 1),
        (3, 'Rohan', 'Deshmukh', 'rohan.d@company.com', 1, 95000, '2022-01-10', 2),
        (4, 'Priya', 'Sharma', 'priya.s@company.com', 2, 118000, '2021-04-18', 1),
        (5, 'Kabir', 'Mehta', 'kabir.m@company.com', 2, 82000, '2023-02-20', 4),
        (6, 'Sneha', 'Nair', 'sneha.n@company.com', 3, 140000, '2020-11-05', 1),
        (7, 'Arjun', 'Reddy', 'arjun.r@company.com', 3, 105000, '2022-08-14', 6),
        (8, 'Tanvi', 'Joshi', 'tanvi.j@company.com', 4, 88000, '2021-09-01', NULL),
        (9, 'Dev', 'Patel', 'dev.p@company.com', 4, 65000, '2023-05-12', 8),
        (10, 'Ishaan', 'Gupta', 'ishaan.g@company.com', 5, 72000, '2024-01-08', NULL);

      INSERT INTO performance_reviews (review_id, employee_id, review_year, rating, bonus_pct) VALUES
        (1, 1, 2023, 5, 15.0),
        (2, 2, 2023, 4, 10.0),
        (3, 3, 2023, 4, 8.5),
        (4, 4, 2023, 5, 12.0),
        (5, 5, 2023, 3, 5.0),
        (6, 6, 2023, 5, 14.0),
        (7, 7, 2023, 4, 9.0),
        (8, 8, 2023, 4, 10.0),
        (9, 9, 2023, 3, 4.0),
        (10, 10, 2023, 4, 7.5);
    `,
    businessQueries: [
      {
        title: 'Department Headcount & Payroll Spend',
        prompt: 'Calculate the total number of employees, total payroll salary expenditure, and average salary for each department.',
        query: `SELECT 
  d.department_name,
  COUNT(e.id) AS total_employees,
  COALESCE(SUM(e.salary), 0) AS total_payroll,
  COALESCE(ROUND(AVG(e.salary), 2), 0) AS avg_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.department_name
ORDER BY total_payroll DESC;`
      },
      {
        title: 'Top Performers Earning Top Bonuses',
        prompt: 'Find employees who received a rating of 5 in 2023, along with their calculated bonus dollar amount.',
        query: `SELECT 
  e.first_name || ' ' || e.last_name AS employee_name,
  d.department_name,
  e.salary,
  pr.rating,
  pr.bonus_pct,
  ROUND(e.salary * (pr.bonus_pct / 100.0), 2) AS bonus_amount
FROM employees e
JOIN performance_reviews pr ON e.id = pr.employee_id
JOIN departments d ON e.department_id = d.id
WHERE pr.rating = 5 AND pr.review_year = 2023
ORDER BY bonus_amount DESC;`
      }
    ]
  },

  {
    id: 'db-sales',
    title: 'B2B & Retail Sales Database',
    industry: 'Commercial Sales & Account Management',
    icon: 'TrendingUp',
    badge: 'Revenue Operations',
    description: 'Track client accounts, sales rep pipelines, customer purchase history, product gross margins, and fulfillment statuses.',
    tables: [
      {
        name: 'customers',
        description: 'Account directory with regional billing locations',
        columns: ['id (PK)', 'name', 'email', 'city', 'country']
      },
      {
        name: 'products',
        description: 'Catalog items, categories, cost basis, and inventory units',
        columns: ['id (PK)', 'product_name', 'category', 'price', 'stock_qty']
      },
      {
        name: 'orders',
        description: 'Sales orders and fulfillment timestamps',
        columns: ['id (PK)', 'customer_id (FK)', 'order_date', 'total_amount', 'status']
      },
      {
        name: 'order_items',
        description: 'Individual line items per order invoice',
        columns: ['id (PK)', 'order_id (FK)', 'product_name', 'category', 'unit_price', 'quantity']
      }
    ],
    setupSql: `
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL
      );

      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock_qty INTEGER NOT NULL
      );

      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      INSERT INTO customers (id, name, email, city, country) VALUES
        (1, 'Aarav Mehta', 'aarav.m@example.com', 'Mumbai', 'India'),
        (2, 'Sophia Taylor', 'sophia.t@example.com', 'New York', 'USA'),
        (3, 'Rajesh Patel', 'rajesh.p@example.com', 'Pune', 'India'),
        (4, 'Liam O Connor', 'liam.o@example.com', 'Dublin', 'Ireland'),
        (5, 'Emma Watson', 'emma.w@example.com', 'London', 'UK'),
        (6, 'Neha Kulkarni', 'neha.k@example.com', 'Nagpur', 'India');

      INSERT INTO products (id, product_name, category, price, stock_qty) VALUES
        (1, 'Mechanical Keyboard', 'Electronics', 150.00, 45),
        (2, 'Wireless Mouse', 'Electronics', 100.00, 80),
        (3, '4K Ultra Gaming Monitor', 'Displays', 800.00, 20),
        (4, 'Ergonomic Desk Chair', 'Furniture', 400.50, 15),
        (5, 'USB-C Fast Hub', 'Electronics', 89.99, 120),
        (6, 'Noise-Canceling Headphones', 'Audio', 420.00, 30);

      INSERT INTO orders (id, customer_id, order_date, total_amount, status) VALUES
        (1001, 1, '2024-01-15', 350.00, 'Delivered'),
        (1002, 2, '2024-01-18', 1200.50, 'Delivered'),
        (1003, 1, '2024-02-01', 89.99, 'Delivered'),
        (1004, 3, '2024-02-14', 420.00, 'Shipped'),
        (1005, 2, '2024-03-02', 750.00, 'Processing'),
        (1006, 5, '2024-03-10', 940.00, 'Delivered');

      INSERT INTO order_items (id, order_id, product_name, category, unit_price, quantity) VALUES
        (1, 1001, 'Mechanical Keyboard', 'Electronics', 150.00, 1),
        (2, 1001, 'Wireless Mouse', 'Electronics', 100.00, 2),
        (3, 1002, '4K Ultra Gaming Monitor', 'Displays', 800.00, 1),
        (4, 1002, 'Ergonomic Desk Chair', 'Furniture', 400.50, 1),
        (5, 1003, 'USB-C Fast Hub', 'Electronics', 89.99, 1),
        (6, 1004, 'Noise-Canceling Headphones', 'Audio', 420.00, 1),
        (7, 1005, 'Standing Desk Converter', 'Furniture', 750.00, 1),
        (8, 1006, 'Mechanical Keyboard', 'Electronics', 150.00, 2),
        (9, 1006, 'Noise-Canceling Headphones', 'Audio', 420.00, 1),
        (10, 1006, 'Wireless Mouse', 'Electronics', 100.00, 2);
    `,
    businessQueries: [
      {
        title: 'Category-Wise Gross Sales Breakdown',
        prompt: 'Calculate total units sold and total revenue for each product category.',
        query: `SELECT 
  category,
  SUM(quantity) AS total_units_sold,
  ROUND(SUM(unit_price * quantity), 2) AS total_revenue
FROM order_items
GROUP BY category
ORDER BY total_revenue DESC;`
      },
      {
        title: 'Customer Lifetime Value (LTV) Leaderboard',
        prompt: 'Identify top customers ranked by total spend, order count, and average order value (AOV).',
        query: `SELECT 
  c.name AS customer_name,
  c.country,
  COUNT(o.id) AS total_orders,
  ROUND(SUM(o.total_amount), 2) AS lifetime_spend,
  ROUND(AVG(o.total_amount), 2) AS average_order_value
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.country
ORDER BY lifetime_spend DESC;`
      }
    ]
  },

  {
    id: 'db-ecommerce',
    title: 'E-Commerce Platform & Reviews Database',
    industry: 'Consumer Tech & Digital Marketplace',
    icon: 'ShoppingCart',
    badge: 'Marketplace Schema',
    description: 'Track digital product catalogs, ratings, cart abandonment, buyer feedback, and seasonal revenue trends.',
    tables: [
      {
        name: 'users',
        description: 'Customer profiles and subscription tiers',
        columns: ['user_id (PK)', 'username', 'email', 'signup_date', 'is_prime']
      },
      {
        name: 'categories',
        description: 'Departmental taxonomy trees',
        columns: ['cat_id (PK)', 'category_name', 'tax_rate']
      },
      {
        name: 'items',
        description: 'Listed products and stock quantities',
        columns: ['item_id (PK)', 'cat_id (FK)', 'item_title', 'price', 'inventory']
      },
      {
        name: 'reviews',
        description: 'Verified buyer product reviews and 1-5 star ratings',
        columns: ['review_id (PK)', 'item_id (FK)', 'user_id (FK)', 'rating', 'comment']
      }
    ],
    setupSql: `
      CREATE TABLE users (
        user_id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        signup_date TEXT NOT NULL,
        is_prime INTEGER NOT NULL
      );

      CREATE TABLE categories (
        cat_id INTEGER PRIMARY KEY,
        category_name TEXT NOT NULL,
        tax_rate REAL NOT NULL
      );

      CREATE TABLE items (
        item_id INTEGER PRIMARY KEY,
        cat_id INTEGER NOT NULL,
        item_title TEXT NOT NULL,
        price REAL NOT NULL,
        inventory INTEGER NOT NULL,
        FOREIGN KEY (cat_id) REFERENCES categories(cat_id)
      );

      CREATE TABLE reviews (
        review_id INTEGER PRIMARY KEY,
        item_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        FOREIGN KEY (item_id) REFERENCES items(item_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      );

      INSERT INTO users VALUES 
        (1, 'alex_coder', 'alex@tech.io', '2023-01-10', 1),
        (2, 'sarah_m', 'sarah@design.org', '2023-02-15', 0),
        (3, 'david_k', 'david@corp.net', '2023-03-20', 1),
        (4, 'priya_dev', 'priya@ai.co', '2023-05-12', 1);

      INSERT INTO categories VALUES 
        (1, 'Compute & Hardware', 0.08),
        (2, 'Smart Audio', 0.05),
        (3, 'Desk Accessories', 0.06);

      INSERT INTO items VALUES 
        (101, 1, 'M3 Pro Laptop 16-inch', 2499.00, 15),
        (102, 1, 'Mechanical Split Keyboard', 189.99, 40),
        (103, 2, 'Noise Canceling ANC Pods', 249.00, 60),
        (104, 3, 'Solid Walnut Monitor Stand', 99.00, 25),
        (105, 3, 'Braided USB-C Cable 2M', 24.99, 150);

      INSERT INTO reviews VALUES 
        (1, 101, 1, 5, 'Blazing fast compilation times.'),
        (2, 101, 3, 5, 'Best workstation purchase ever.'),
        (3, 102, 1, 4, 'Great tactile feel, takes time to adjust.'),
        (4, 103, 2, 5, 'Crystal clear sound isolation.'),
        (5, 104, 4, 3, 'Looks good but wood has minor imperfections.'),
        (6, 103, 4, 4, 'Battery lasts over 30 hours.');
    `,
    businessQueries: [
      {
        title: 'Product Satisfaction & Rating Ranking',
        prompt: 'Calculate the average star rating and review count for each product, sorted by top rating.',
        query: `SELECT 
  i.item_title,
  c.category_name,
  i.price,
  COUNT(r.review_id) AS total_reviews,
  ROUND(AVG(r.rating), 2) AS average_rating
FROM items i
JOIN categories c ON i.cat_id = c.cat_id
LEFT JOIN reviews r ON i.item_id = r.item_id
GROUP BY i.item_id, i.item_title, c.category_name, i.price
ORDER BY average_rating DESC, total_reviews DESC;`
      }
    ]
  },

  {
    id: 'db-banking',
    title: 'Core Banking & Ledger Database',
    industry: 'Financial Services & Core Banking',
    icon: 'Landmark',
    badge: 'FinTech Ledger',
    description: 'Manage checking/savings accounts, ledger balances, debit/credit transaction flows, and branch allocations.',
    tables: [
      {
        name: 'bank_customers',
        description: 'Account holder KYC and credit verification',
        columns: ['cust_id (PK)', 'first_name', 'last_name', 'pan_ssn', 'kyc_status']
      },
      {
        name: 'accounts',
        description: 'Deposit, savings, and checking balances',
        columns: ['account_no (PK)', 'cust_id (FK)', 'account_type', 'balance', 'created_date', 'status']
      },
      {
        name: 'transactions',
        description: 'Double-entry transaction ledger with audit trail',
        columns: ['txn_id (PK)', 'account_no (FK)', 'txn_type (DEPOSIT/WITHDRAWAL/TRANSFER)', 'amount', 'txn_timestamp', 'description']
      }
    ],
    setupSql: `
      CREATE TABLE bank_customers (
        cust_id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        pan_ssn TEXT NOT NULL,
        kyc_status TEXT NOT NULL
      );

      CREATE TABLE accounts (
        account_no INTEGER PRIMARY KEY,
        cust_id INTEGER NOT NULL,
        account_type TEXT NOT NULL,
        balance REAL NOT NULL,
        created_date TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (cust_id) REFERENCES bank_customers(cust_id)
      );

      CREATE TABLE transactions (
        txn_id INTEGER PRIMARY KEY,
        account_no INTEGER NOT NULL,
        txn_type TEXT NOT NULL,
        amount REAL NOT NULL,
        txn_timestamp TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (account_no) REFERENCES accounts(account_no)
      );

      INSERT INTO bank_customers VALUES 
        (1, 'Aditya', 'Verma', 'ABCDE1234F', 'VERIFIED'),
        (2, 'Radhika', 'Sen', 'WXYZ9876G', 'VERIFIED'),
        (3, 'Manish', 'Khurana', 'JKLM5678H', 'PENDING'),
        (4, 'Sunita', 'Rao', 'PQRS3456K', 'VERIFIED');

      INSERT INTO accounts VALUES 
        (10001, 1, 'SAVINGS', 45000.00, '2022-04-10', 'ACTIVE'),
        (10002, 1, 'CHECKING', 12500.50, '2022-09-15', 'ACTIVE'),
        (10003, 2, 'SAVINGS', 98000.00, '2021-11-20', 'ACTIVE'),
        (10004, 3, 'SAVINGS', 5000.00, '2024-01-05', 'DORMANT'),
        (10005, 4, 'SAVINGS', 152000.75, '2020-02-18', 'ACTIVE');

      INSERT INTO transactions VALUES 
        (1, 10001, 'DEPOSIT', 15000.00, '2024-01-05 10:30:00', 'Salary Credit'),
        (2, 10001, 'WITHDRAWAL', 2500.00, '2024-01-08 14:15:00', 'ATM Cash'),
        (3, 10002, 'DEPOSIT', 5000.00, '2024-01-10 11:00:00', 'Client Retainer'),
        (4, 10003, 'WITHDRAWAL', 12000.00, '2024-01-12 16:45:00', 'Wire Transfer'),
        (5, 10005, 'DEPOSIT', 25000.00, '2024-01-15 09:20:00', 'Dividend Inflow');
    `,
    businessQueries: [
      {
        title: 'Customer Total Assets Across Multiple Accounts',
        prompt: 'Calculate the total combined financial net worth and count of active accounts for each customer.',
        query: `SELECT 
  bc.cust_id,
  bc.first_name || ' ' || bc.last_name AS customer_name,
  bc.kyc_status,
  COUNT(a.account_no) AS total_accounts,
  ROUND(SUM(a.balance), 2) AS total_liquid_assets
FROM bank_customers bc
JOIN accounts a ON bc.cust_id = a.cust_id
WHERE a.status = 'ACTIVE'
GROUP BY bc.cust_id, bc.first_name, bc.last_name, bc.kyc_status
ORDER BY total_liquid_assets DESC;`
      }
    ]
  }
];
