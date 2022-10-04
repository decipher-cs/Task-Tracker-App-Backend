import mysql from "mysql2"
import cors from "cors"
import express from "express"
import dotenv from "dotenv"

const dot = dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const PORT = process.env.PORT || 8080

const db = mysql.createConnection(process.env.DATABASE_URL)
// db.end() // To drop the connection. need to check on usage details.

// Config to connect to localhost
// const db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "password",
//     database: "todos",
// })
db.connect((err) => {
    err
        ? console.log(
              "Error encountered while connecting to mySQL database.",
              err
          )
        : console.log(
              "Connection to mySQL established.",
              "Connected to PlanetScale!"
          )
})

// Send every item as a response
app.get("/todos", (req, res) => {
    let sqlReqText = `SELECT * FROM todoList`
    db.query(sqlReqText, (err, result) => {
        if (err) {
            console.log("Error while querying database.")
            throw err
        }
        let newRes = result.map((obj, index) => {
            obj.isComplete = obj.isComplete == 1
            obj.isHidden = obj.isHidden == 1
            return obj
        })
        console.log(newRes)
        res.status(200).send(newRes)
    })
})

// Add a single item to the database
app.post("/todos", (req, res) => {
    if ((req.body.length > 1) | (req.body.length < 1)) res.status(400)
    let data = req.body
    let sqlInsertQuery = `INSERT todoList (uuid, todoText, isComplete, isHidden) VALUES(?, ?, ?, ?)`
    db.query(
        sqlInsertQuery,
        [data.uuid, data.todoText, data.isComplete, data.isHidden],
        (err) => {
            if (err) throw err
            res.status(200).end("Deleted")
        }
    )
})

// Delete every item marked as completed from the database
app.post("/todos/removeCompleted", (req, res) => {
    let sqldelquery = `delete from todoList where isComplete = "1"`
    db.query(sqldelquery, (err) => {
        if (err) throw err
        res.status(200).end("deleted")
    })
})

// editSingleItemInServer: edit properties of a single item on the database
app.post("/todos/updateTodo", (req, res) => {
    let tempObj = req.body[0]
    tempObj.isHidden = tempObj.isHidden == true ? 1 : 0
    tempObj.isComplete = tempObj.isComplete == true ? 1 : 0
    let sqlupdateQuery = `update todoList set todoText = "${tempObj.todoText}", isHidden = "${tempObj.isHidden}", isComplete = "${tempObj.isComplete}" where uuid = '${tempObj.uuid}'`
    db.query(sqlupdateQuery, (err) => {
        if (err) throw err
        res.status(200).end("updated")
    })
})

// Delete a single item from database
app.post("/todos/:uuid", (req, res) => {
    let sqldelquery = `delete from todoList where uuid = '${req.params.uuid}'`
    db.query(sqldelquery, (err) => {
        if (err) throw err
        res.status(200).end("deleted")
    })
})

app.listen(PORT, () => console.log("Your app is running on port ", PORT))
