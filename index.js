import mysql from "mysql2"
import cors from "cors"
import express from "express"

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const PORT = process.env.PORT || 8080

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "todos",
})
db.connect((err) => {
    err
        ? console.log(
              "Error encountered while connecting to mySQL database.",
              err
          )
        : console.log("Connection to mySQL established.")
})

app.route("/todos")
    .get((req, res) => {
        let sqlReqText = `SELECT * FROM todoList`
        db.query(sqlReqText, (err, result) => {
            if (err) {
                console.log("Error while querying database.")
                throw err
            }
            res.status(200).send(result)
        })
    })
    .post((req, res) => {
        // if (req.body.length > 1 | req.body.length < 1) res.status(400)
        let data = req.body[0]
        let sqlInsertQuery = `INSERT todoList (todoText, isComplete, isHidden) VALUES(?, ?, ?)`
        db.query(sqlInsertQuery, [
            data.todoText,
            data.isComplete,
            data.isHidden,
        ])
        res.status(200).end("request OK")
    })
    .delete((req, res) => {
        let sqlDelQuery = `DROP`
    })

app.listen(PORT, () => console.log("Your app is running on port ", PORT))
