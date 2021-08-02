const { prompt } = require("inquirer");
const connection = require("./db/connection");
require("console.table");

// Main prompt
options();

async function options() {
  const { choice } = await prompt([
    {
      type: "list",
      name: "choice",
      message: "Here are your options\n",
      choices: [
        {
          name: "See all employees",
          value: "employees"
        },
        {
          name: "Add an employee to the database",
          value: "+employee"
        },
        {
          name: "Remove an employee from the database\n",
          value: "-employee"
        },
        {
          name: "Change an employee's role",
          value: "updateEmployee"
        },
        {
          name: "See all roles",
          value: "roles"
        },
        {
          name: "Add a role to the database\n",
          value: "+role"
        },
        {
          name: "See all departments",
          value: "departments"
        },
        {
          name: "Add a department to the database\n",
          value: "+department"
        },
        {
          name: "Exit the program\n",
          value: "EXIT"
        }
      ]
    }
  ]);

  // Depending on choice, run function
  switch (choice) {
    case "employees":
      return viewEmployees();
    case "+employee":
      return addEmployee();
    case "-employee":
      return removeEmployee();
    case "updateEmployee":
      return updateEmployeeRole();
    case "departments":
      return viewDepartments();
    case "+department":
      return addDepartment();
    case "roles":
      return viewRoles();
    case "+role":
      return addRole();
    default:
      return exit();
  }
}

async function viewEmployees() {

  connection.query("SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id LEFT JOIN employee manager on manager.id = employee.manager_id;", function (err, res) {
    console.table(res);
   
    options();
  });
}

async function removeEmployee() {

  connection.query("SELECT employee.id, employee.first_name, employee.last_name FROM employee", async function (err,res) {
    const Choices = res.map(({ id, first_name, last_name }) => ({
      name: `${first_name} ${last_name}`,
      value: id
    }));

    const { employeeId } = await prompt([
      {
        type: "list",
        name: "employeeId",
        message: "Which employee do you want to remove?",
        choices: Choices
      }
    ]);

    connection.query(`DELETE FROM employee WHERE id = ${employeeId}`)

    console.log("Removed selected employee from the database");

    options();
    
  });

}

async function updateEmployeeRole() {

  connection.query("SELECT employee.id, employee.first_name, employee.last_name FROM employee", async function (err,res) {
    const Choices = res.map(({ id, first_name, last_name }) => ({
      name: `${first_name} ${last_name}`,
      value: id
    }));

    const { employeeId } = await prompt([
      {
        type: "list",
        name: "employeeId",
        message: "Which employee's role do you want to update?",
        choices: Choices
      }
    ]);

    await connection.query("SELECT role.id, role.title FROM role", async function(err, res) {

      const roleChoices = res.map(({ id, title }) => ({
        name: title,
        value: id
      }));
    
      const { roleId } = await prompt([
        {
          type: "list",
          name: "roleId",
          message: "Which role do you want to assign the selected employee?",
          choices: roleChoices
        }
      ]);
    
      await connection.query(`UPDATE employee SET role_id = ${roleId} WHERE id = ${employeeId}`)
    
      console.log("Updated the selected employee's role");
    
      options();
    });
  });

}

async function viewRoles() {
  await connection.query("SELECT role.id, role.title, department.name AS department, role.salary FROM role LEFT JOIN department on role.department_id = department.id;", function(err ,res){

    console.table(res);
  
    options();
  });
}

async function addRole() {
  await connection.query(`SELECT department.id, department.name FROM department`, async function(err, res){
    const departmentChoices = res.map(({ id, name }) => ({
      name: name,
      value: id
    }));
    
    const role = await prompt([
      {
        name: "title",
        message: "What is the name of the role?"
      },
      {
        name: "salary",
        message: "What is the salary of the role?"
      },
      {
        type: "list",
        name: "department_id",
        message: "Which department does the role belong to?",
        choices: departmentChoices
      }
    ]);

    await connection.query(`INSERT INTO role (title, salary, department_id) VALUES ('${role.title}', ${role.salary}, ${role.department_id})`, (err, res) => {
      if (err) throw err;
      else; 
      
      console.log(`Added ${role.title} to the database`);
    
      options();
    });
  
  });
}

function viewDepartments() {
  connection.query("SELECT department.id, department.name, SUM(role.salary) AS utilized_budget FROM department LEFT JOIN role ON role.department_id = department.id LEFT JOIN employee ON employee.role_id = role.id GROUP BY department.id, department.name", function (err, res) {
    if (err) throw err;

    console.log('\n')
    console.table(res);

    options();
  })
}

async function addDepartment() {
  const department = await prompt([
    {
      name: "name",
      message: "What is the name of the department?"
    }
  ]);

  await connection.query(`INSERT INTO department (name) VALUES ('${department.name}')`, (err, res) => {
    if (err) throw err;

    console.log(`Added ${department.name} to the database`);
  
    options();
  })

}

async function addEmployee() {
  connection.query("SELECT role.id, role.title FROM role", async function(err, res){
    const roleChoices = res.map(({ id, title }) => ({
      name: title,
      value: id
    }));

    const employee = await prompt([
      {
        name: "first_name",
        message: "What is the employee's first name?"
      },
      {
        name: "last_name",
        message: "What is the employee's last name?"
      }
    ]);

    const { roleId } = await prompt({
      type: "list",
      name: "roleId",
      message: "What is the employee's role?",
      choices: roleChoices
    });

    employee.role_id = roleId;


    await connection.query(`
    SELECT employee.id, employee.first_name, employee.last_name 
    FROM employee`, async function(err,res){
      if (err) throw err;
      
      const managerChoices = res.map(({ id, first_name, last_name }) => ({
        name: `${first_name} ${last_name}`,
        value: id
      }));
      
      managerChoices.unshift({ name: "None", value: null });

      const { managerId } = await prompt({
        type: "list",
        name: "managerId",
        message: "Who manages this employee?",
        choices: managerChoices
      });

      employee.manager_id = managerId;

      await connection.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ('${employee.first_name}', '${employee.last_name}', ${roleId}, ${managerId})`, function(err,res){
        if (err) throw err;

        console.log(`Added ${employee.first_name} ${employee.last_name} to the database`);
      
        options();
      });
    });
  });
}

function exit() {
  console.log("Now exiting program");
  process.exit();
}
