### Step 1: Set Up Your Project

1. **Create a new directory for your project**:
   ```bash
   mkdir my-project
   cd my-project
   ```

2. **Initialize a new Node.js project**:
   ```bash
   npm init -y
   ```

3. **Install necessary packages**:
   ```bash
   npm install express mysql2 dotenv cors body-parser
   ```

   - `express`: Web framework for Node.js.
   - `mysql2`: MySQL client for Node.js.
   - `dotenv`: For loading environment variables from a `.env` file.
   - `cors`: Middleware to enable CORS (Cross-Origin Resource Sharing).
   - `body-parser`: Middleware to parse incoming request bodies.

### Step 2: Create the Database

1. **Set up your SQL database** (e.g., MySQL):
   - Create a database and a table. For example:
   ```sql
   CREATE DATABASE my_database;

   USE my_database;

   CREATE TABLE users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email VARCHAR(255) NOT NULL UNIQUE
   );
   ```

### Step 3: Create the `.env` File

1. **Create a `.env` file in the root of your project**:
   ```plaintext
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=my_database
   PORT=3000
   ```

   Replace `your_password` with your actual MySQL password.

### Step 4: Set Up the Node.js Backend

1. **Create a file named `server.js`**:
   ```javascript
   const express = require('express');
   const mysql = require('mysql2');
   const dotenv = require('dotenv');
   const cors = require('cors');
   const bodyParser = require('body-parser');

   dotenv.config();

   const app = express();
   const port = process.env.PORT || 3000;

   // Middleware
   app.use(cors());
   app.use(bodyParser.json());

   // Create a MySQL connection
   const db = mysql.createConnection({
       host: process.env.DB_HOST,
       user: process.env.DB_USER,
       password: process.env.DB_PASSWORD,
       database: process.env.DB_NAME
   });

   // Connect to the database
   db.connect(err => {
       if (err) {
           console.error('Database connection failed:', err);
           return;
       }
       console.log('Connected to the database.');
   });

   // API endpoint to get users
   app.get('/api/users', (req, res) => {
       db.query('SELECT * FROM users', (err, results) => {
           if (err) {
               return res.status(500).json({ error: err.message });
           }
           res.json(results);
       });
   });

   // API endpoint to create a user
   app.post('/api/users', (req, res) => {
       const { name, email } = req.body;
       db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], (err, results) => {
           if (err) {
               return res.status(500).json({ error: err.message });
           }
           res.status(201).json({ id: results.insertId, name, email });
       });
   });

   // Start the server
   app.listen(port, () => {
       console.log(`Server is running on http://localhost:${port}`);
   });
   ```

### Step 5: Set Up the Frontend

1. **Create a simple frontend** (e.g., using HTML and JavaScript):
   - Create an `index.html` file:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>User Management</title>
   </head>
   <body>
       <h1>User Management</h1>
       <form id="userForm">
           <input type="text" id="name" placeholder="Name" required>
           <input type="email" id="email" placeholder="Email" required>
           <button type="submit">Add User</button>
       </form>
       <ul id="userList"></ul>

       <script>
           const userForm = document.getElementById('userForm');
           const userList = document.getElementById('userList');

           // Fetch users from the backend
           async function fetchUsers() {
               const response = await fetch('http://localhost:3000/api/users');
               const users = await response.json();
               userList.innerHTML = '';
               users.forEach(user => {
                   const li = document.createElement('li');
                   li.textContent = `${user.name} (${user.email})`;
                   userList.appendChild(li);
               });
           }

           // Add a new user
           userForm.addEventListener('submit', async (e) => {
               e.preventDefault();
               const name = document.getElementById('name').value;
               const email = document.getElementById('email').value;

               await fetch('http://localhost:3000/api/users', {
                   method: 'POST',
                   headers: {
                       'Content-Type': 'application/json'
                   },
                   body: JSON.stringify({ name, email })
               });

               userForm.reset();
               fetchUsers();
           });

           // Initial fetch
           fetchUsers();
       </script>
   </body>
   </html>
   ```

### Step 6: Run Your Application

1. **Start the Node.js server**:
   ```bash
   node server.js
   ```

2. **Open `index.html` in your browser**. You should be able to add users and see them listed.

### Conclusion

You now have a basic setup with a Node.js backend connected to a MySQL database, and a simple frontend that interacts with the backend. You can expand this project by adding more features, improving error handling, and implementing user authentication as needed.