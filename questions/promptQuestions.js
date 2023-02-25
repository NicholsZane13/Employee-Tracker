const db = require('../config/connection');

const whatToDoQuestions = {
  type: 'list',
  name: 'option',
  message: 'What would you like to do?',
  choices: [
    'View all departments',
    'View all roles',
    'View all employees',
    'Add a department',
    'Add a role',
    'Add an employee',
    'Update an employee role',
    'Exit',
  ],
};

const addDepQuestion = {
  type: 'input',
  name: 'departmentName',
  message: 'What is the name of the department you would like to add?',
};

module.exports = { whatToDoQuestions, addDepQuestion };
