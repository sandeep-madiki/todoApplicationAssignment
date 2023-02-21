const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
var isValid = require("date-fns/isValid");
const path = require("path");

const myApp = express();
myApp.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let database;

const initializeaServerAndDB = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    myApp.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

const statusValues = ["TO DO", "IN PROGRESS", "DONE"];
const pvalues = ["HIGH", "MEDIUM", "LOW"];
const categoryVal = ["WORK", "HOME", "LEARNING"];

initializeaServerAndDB();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

myApp.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  let newStatus = "";
  if (status !== "") {
    const statusSearch = ["TO%20DO", "IN%20PROGRESS", "DONE"];
    if (statusSearch.includes(status)) {
      newStatus = status.replace("%20", " ");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (priority !== "") {
    if (pvalues.includes(priority)) {
      //   priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (category !== "") {
    if (categoryVal.includes(category)) {
      //fff
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (priority === "HIGH" && status === "IN PROGRESS") {
    const test1 = `
      SELECT *
      FROM todo
      WHERE 
        priority = HIGH
        AND status = IN PROGRESS`;
    const resd = await database.all(test1);
    response.send(resd);
  }
  const getTodo = `
    SELECT *
    FROM todo 
    WHERE priority LIKE '%${priority}%'
    AND status LIKE '%${newStatus}%'
    AND todo LIKE '%${search_q}%'
    AND category LIKE '%${category}%'`;
  try {
    const res = await database.all(getTodo);
    response.send(
      res.map((each) => {
        return {
          id: each.id,
          todo: each.todo,
          priority: each.priority,
          status: each.status,
          category: each.category,
          dueDate: each.due_date,
        };
      })
    );
  } catch (e) {
    console.log(e.message);
  }
});

//API 2
myApp.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoById = `
    SELECT *
    FROM todo
    WHERE id = '${todoId}'
    `;
  try {
    const res = await database.get(getTodoById);
    const func = (each) => {
      return {
        id: each.id,
        todo: each.todo,
        priority: each.priority,
        status: each.status,
        category: each.category,
        dueDate: each.due_date,
      };
    };
    response.send(func(res));
  } catch (e) {
    console.log(e.message);
  }
});

//api 3
myApp.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const result = isValid(new Date(date));
  if (result === true) {
    const formattedDate = isValid(new Date(date), "yyyy-MM-dd");
    const query = `
        SELECT *
        FROM todo
        WHERE due_date = '${formattedDate}'`;
    try {
      const res = await database.all(query);
      response.send(res);
    } catch (e) {
      console.log(e.message);
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

const statusMiddleWare = (request, response, next) => {
  const { status } = request.body;
  if (statusValues.includes(status)) {
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
};

const priorityMiddleWare = (request, response, next) => {
  const { priority } = request.body;
  if (pvalues.includes(priority)) {
    next();
  } else {
    response.status(400);
    response.send("'Invalid Todo Priority");
  }
};

const categoryMiddleWare = (request, response, next) => {
  const { category } = request.body;
  if (categoryVal.includes(category)) {
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
};

const dueDateMiddleware = (request, response, next) => {
  const { dueDate } = request.body;
  const dateValidation = isValid(new Date(dueDate));
  if (dateValidation === true) {
    next();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

// //api 4 /todos/ post
myApp.post(
  "/todos/",
  statusMiddleWare,
  priorityMiddleWare,
  categoryMiddleWare,
  dueDateMiddleware,
  async (request, response) => {
    const todoDetails = request.body;
    const { id, todo, priority, status, category, dueDate } = todoDetails;
    const addTodo = `
    INSERT INTO
        todo (id, todo, priority, status, category, due_date)
    VALUES
        (
            '${id}',
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${dueDate}'
        )`;
    const dbResponse = await database.run(addTodo);
    response.send("Todo Successfully Added");
  }
);

//api 5
myApp.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  //   const pvalues = ["HIGH", "MEDIUM", "LOW"];
  //   const categoryVal = ["WORK", "HOME", "LEARNING"];
  //   const statusValues = ["TO DO", "IN PROGRESS", "DONE"];
  //   const categoryVal = ["WORK", "HOME", "LEARNING"];
  if (status !== undefined) {
    if (statusValues.includes(status)) {
      const updateQuery = `
        UPDATE
          todo
        SET
          status = '${status}'
        WHERE
          id = '${todoId}'`;
      const res = await database.run(updateQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (priority !== undefined) {
    if (pvalues.includes(priority)) {
      const updateQuery = `
        UPDATE
          todo
        SET
          priority = '${priority}'
        WHERE
          id = '${todoId}'`;
      const res = await database.run(updateQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (todo !== undefined) {
    const updateQuery = `
        UPDATE
          todo
        SET
          todo = '${todo}'
        WHERE
          id = '${todoId}'`;
    const res = await database.run(updateQuery);
    response.send("Todo Updated");
  }

  if (category !== undefined) {
    if (categoryVal.includes(category)) {
      const updateQuery = `
        UPDATE
          todo
        SET
          category = '${category}'
        WHERE
          id = '${todoId}'`;
      const res = await database.run(updateQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (dueDate !== undefined) {
    const dateValidation = isValid(new Date(dueDate));
    if (dateValidation === true) {
      const updateQuery = `
          UPDATE
            todo
          SET
            due_date = '${dueDate}'
          WHERE
            id = '${todoId}'`;
      const res = await database.run(updateQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

// //api 6
myApp.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = '${todoId}'`;
  const res = await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = myApp;
