import mysql from 'mysql2'
import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cookie from 'cookie'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080
const db = mysql.createConnection(process.env.DATABASE_URL)
const whitelist = ['https://golden-liger-9ba371.netlify.app', 'http://192.168.1.17:5173', 'http://localhost:5173']
const corsOptions = {
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionSuccessStatus: 200,
    origin: (origin, callback) => {
        if (whitelist.includes(origin)) return callback(null, true)
        callback(new Error('Not allowed by CORS'))
    },
}
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Config to connect to localhost during and for backend testing.
// const db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "password",
//     database: "todos",
// })

db.connect((err) => {
    err
        ? console.log('Error encountered while connecting to mySQL database', err)
        : console.log('Connection to mySQL database established.')
})

// Send every item as a response
app.get('/todos/:userId', (req, res) => {
    let sqlReqText = `SELECT * FROM items where owner = '${req.params.userId}'`
    db.query(sqlReqText, (err, result) => {
        if (err) res.status(400).send("Couldn't get items form server. " + err)
        if (!result) res.status(200).send()
        let newRes = result.map((obj) => {
            obj.isComplete = obj.isComplete == 1
            obj.isHidden = obj.isHidden == 1
            return obj
        })
        res.status(200).send(newRes)
    })
})

// Add a single item to the database
app.post('/todos', (req, res) => {
    if ((req.body.length > 1) | (req.body.length < 1)) res.status(400)
    let data = req.body
    let sqlInsertQuery = `INSERT items (uuid, todoText, isComplete, isHidden, owner) VALUES(?, ?, ?, ?, ?)`
    db.query(sqlInsertQuery, [data.uuid, data.todoText, data.isComplete, data.isHidden, data.userId], (err) => {
        if (err) res.status(400).end('Unable to insert data. ' + err)
        res.status(200).end('Inserted')
    })
})

// Delete every item marked as completed from the database
app.post('/todos/removeCompleted', (req, res) => {
    let { userId } = req.body
    let sqldelquery = `delete from items where isComplete = "1" and owner = '${userId}'`
    db.query(sqldelquery, (err) => {
        if (err) res.status(400).end('Unable to remove completed items. ' + err)
        res.status(200).end('Removed all completed')
    })
})

// editSingleItemInServer: edit properties of a single item on the database
app.post('/todos/updateTodo', (req, res) => {
    let { userId } = req.body
    let tempObj = req.body
    tempObj.isHidden = tempObj.isHidden == true ? 1 : 0
    tempObj.isComplete = tempObj.isComplete == true ? 1 : 0
    let sqlupdateQuery = `update items set todoText = "${tempObj.todoText}", isHidden = "${tempObj.isHidden}", isComplete = "${tempObj.isComplete}" where uuid = '${tempObj.uuid}' and owner = '${userId}' `
    db.query(sqlupdateQuery, (err) => {
        if (err) res.status(400).end('Unable to update. ' + err)
        res.status(200).end('Updated item')
    })
})

// Delete a single item from database
app.post('/todos/:uuid', (req, res) => {
    let { userId } = req.body
    let sqldelquery = `delete from items where uuid = '${req.params.uuid}' and owner = '${userId}'`
    db.query(sqldelquery, (err) => {
        if (err) res.status(400).end('Not deleted. ' + err)
        res.status(200).end('Deleted')
    })
})

app.listen(PORT, () => console.log('Node alive and listening. Your app is running on port', PORT))
