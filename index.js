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
    credentials: true,
    optionSuccessStatus: 200,
    origin: (origin, callback) => {
        console.log('origin is : ', origin)
        if (whitelist.includes(origin)) return callback(null, true)
        callback(new Error('Not allowed by CORS'))
    },
}
app.use(cookieParser())
app.use(cors(corsOptions))
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

app.get('', (req, res) => {
    console.log('req.header files : ', req.headers)
    console.log('req.headers.cookie : ', req.headers.cookie, "and parser's req.cookie is : ", req.cookies)
    console.log('Signed cookie : ', req.signedCookies)
    // let cookie = req.headers.cookie.trim().split('=')[1]
    // console.log('value of cookie after trim and split is : ', cookie)
    res.status(200).end()
})

app.get('/todos', (req, res) => {
    // let {
    //     headers: { cookie },
    // } = req
    console.log('req.headers.cookie : ', req.headers.cookie, "and parser's req.cookie is : ", req.cookies)
    let cookie = req.headers.cookie.trim().split('=')[1]
    console.log('value of cookie after trim and split is : ', cookie)
    let sqlReqText = `SELECT * FROM items where owner = '${cookie}'`
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
    let {
        headers: { cookie },
    } = req
    cookie = cookie.trim().split('=')[1]
    let data = req.body
    let sqlInsertQuery = `INSERT items (uuid, todoText, isComplete, isHidden, owner) VALUES(?, ?, ?, ?, ?)`
    db.query(sqlInsertQuery, [data.uuid, data.todoText, data.isComplete, data.isHidden, cookie], (err) => {
        if (err) res.status(400).end('Unable to insert data. ' + err)
        res.status(200).end('Inserted')
    })
})

// Delete every item marked as completed from the database
app.post('/todos/removeCompleted', (req, res) => {
    let {
        headers: { cookie },
    } = req
    cookie = cookie.trim().split('=')[1]
    let sqldelquery = `delete from items where isComplete = "1" and owner = '${cookie}'`
    db.query(sqldelquery, (err) => {
        if (err) res.status(400).end('Unable to remove completed items. ' + err)
        res.status(200).end('Removed all completed')
    })
})

// editSingleItemInServer: edit properties of a single item on the database
app.post('/todos/updateTodo', (req, res) => {
    let {
        headers: { cookie },
    } = req
    cookie = cookie.trim().split('=')[1]
    let tempObj = req.body
    tempObj.isHidden = tempObj.isHidden == true ? 1 : 0
    tempObj.isComplete = tempObj.isComplete == true ? 1 : 0
    let sqlupdateQuery = `update items set todoText = "${tempObj.todoText}", isHidden = "${tempObj.isHidden}", isComplete = "${tempObj.isComplete}" where uuid = '${tempObj.uuid}' and owner = '${cookie}' `
    db.query(sqlupdateQuery, (err) => {
        if (err) res.status(400).end('Unable to update. ' + err)
        res.status(200).end('Updated item')
    })
})

// Delete a single item from database
app.post('/todos/:uuid', (req, res) => {
    let {
        headers: { cookie },
    } = req
    cookie = cookie.trim().split('=')[1]
    let sqldelquery = `delete from items where uuid = '${req.params.uuid}' and owner = '${cookie}'`
    db.query(sqldelquery, (err) => {
        if (err) res.status(400).end('Not deleted. ' + err)
        res.status(200).end('Deleted')
    })
})

app.listen(PORT, () => console.log('Node alive and listening. Your app is running on port', PORT))
