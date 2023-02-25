const db = require('./config/connection');
const cTable = require('console.table');
const { type } = require('os');
const inquirer = require('inquirer');
const quest = require('./questions/promptQuestions');
require('dotenv').config();

//Prompts question
const promptFirstQ = () => {
  inquirer.prompt([quest.whatToDoQuestions]).then((data) => {
    if (data.option === 'Add a role') {
      grabDepartment();
    } else if (data.option === 'View all departments') {
      showDepartments();
    } else if (data.option === 'View all roles') {
      showRoles();
    } else if (data.option === 'Add a department') {
      addDepartment();
    } else if (data.option === 'View all employees') {
      showEmployees();
    } else if (data.option === 'Add an employee') {
      grabManager();
      grabDataEmployee();
    } else if (data.option === 'Update an employee role') {
      grabRole();
      grabEmployee();
    }
  });
};

let managerOfEmployee;
let role;

//query that get data from the database

const grabRole = () => {
  db.query('SELECT * FROM role', async function (err, res) {
    role = res.map((roleTitle) => roleTitle.title);
  });
};

const grabEmployee = () => {
  db.query('SELECT * FROM employee', async function (err, res) {
    updateRoleEmployee(res);
  });
};

const grabManager = () => {
  db.query('SELECT * FROM employee', async function (err, res) {
    managerOfEmployee = res.map((name) => name.first_name);
  });
};

//Add employee prompts
const addEmployee = (titleRole) => {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'firstName',
        message: 'What is the employees first name?',
      },
      {
        type: 'input',
        name: 'lastName',
        message: 'What is the employees last name?',
      },
      {
        type: 'list',
        name: 'role',
        message: 'What is the role of the employee?',
        choices: titleRole,
      },
      {
        type: 'list',
        name: 'manager',
        message: 'Who is the manager of this employee?',
        choices: managerOfEmployee,
      },
    ])
    .then((data) => {
      db.query(
        'SELECT * FROM role WHERE title = ?',
        [data.role],
        async function (err, res) {
          let roleId = res[0].id;
          db.query(
            'SELECT * FROM employee WHERE first_name = ?',
            [data.manager],
            async function (err, res) {
              let managerID = res[0].id;
              db.query(
                `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ('${data.firstName}', '${data.lastName}', '${roleId}', '${managerID}')`
              );
            }
          );
        }
      );
      promptFirstQ();
    });
};

//Update employee prompts
const updateRoleEmployee = (empName) => {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'nameOfEmployee',
        message: 'What employee would you like to update?',
        choices: empName.map((name) => name.first_name),
      },
      {
        type: 'list',
        name: 'roleName',
        message: 'Select a new role for this employee',
        choices: role,
      },
    ])
    .then((data) => {
      db.query(
        'SELECT * FROM role WHERE title = ?',
        [data.roleName],
        async function (err, res) {
          let roleT = res[0].id;
          db.query('UPDATE employee SET role_id = ? WHERE first_name = ? ', [
            roleT,
            data.nameOfEmployee,
          ]);
        }
      );
      console.log('Employee Updated!');
      promptFirstQ();
    });
};
const grabDataEmployee = () => {
  db.query('SELECT * FROM role', async function (err, res) {
    try {
      const roleData = await res.map((title) => title.title);
      addEmployee(roleData);
    } catch (err) {
      console.log(err);
    }
  });
};

//Prompts for adding department
const addDepartment = () => {
  inquirer.prompt([quest.addDepQuestion]).then((data) => {
    db.query(
      `INSERT INTO department (name) VALUES ('${data.departmentName}')`,
      async function () {
        try {
          console.log('Added new department!');
          promptFirstQ();
        } catch (err) {
          console.log(err);
        }
      }
    );
  });
};

//Query for viewing all employees
const showEmployees = () => {
  db.query(
    `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
    FROM employee
    LEFT JOIN employee manager on manager.id = employee.manager_id
    INNER JOIN role ON (role.id = employee.role_id)
    INNER JOIN department ON (department.id = role.department_id)
    ORDER BY employee.id;`,
    async function (err, result) {
      console.table(result);
      promptFirstQ();
    }
  );
};

//Query for viewing all departments
const showDepartments = () => {
  db.query('SELECT * FROM department', async function (err, results) {
    try {
      console.table(results);
      promptFirstQ();
    } catch (err) {
      console.log(err);
    }
  });
};

const showRoles = () => {
  db.query(
    `SELECT role.title as 'Role Title', role.id as 'Role ID', department.name as 'Department Name', role.salary as 'Salary' FROM role JOIN department ON role.department_id = department.id;`,
    async function (err, results) {
      try {
        console.table(results);
        promptFirstQ();
      } catch (err) {
        console.log(err);
      }
    }
  );
};

const grabDepartment = () => {
  db.query('SELECT * FROM department', async function (err, result) {
    try {
      rolePrompts(result);
    } catch (err) {
      console.log(err);
    }
  });
};

//Prompts for adding a new role
const rolePrompts = (depName) => {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'roleName',
        message: 'What is the name of the role?',
      },
      {
        type: 'input',
        name: 'salary',
        message: 'What is the salary of the role?',
      },
      {
        type: 'list',
        name: 'departmentName',
        message: 'What department does this role belong to?',
        choices: depName.map((name) => name.name),
      },
    ])
    .then((data) => {
      db.query(
        'SELECT * FROM department WHERE name = ?',
        [data.departmentName],
        function (err, res) {
          let departmentId = res[0].id;
          db.query(
            `INSERT INTO role (title, salary, department_id) VALUES ('${data.roleName}', '${data.salary}', '${departmentId}')`,
            function (err, res) {
              if (err) {
                console.log(err);
                return;
              }
              console.log(`${data.roleName} added\n`);
              promptFirstQ();
            }
          );
        }
      );
    });
};

promptFirstQ();