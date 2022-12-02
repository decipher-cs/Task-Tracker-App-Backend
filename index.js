import mysql from 'mysql2'
import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080
const db = mysql.createConnection(process.env.DATABASE_URL)
const whitelist = [
    'https://golden-liger-9ba371.netlify.app',
    'http://192.168.1.17:5173',
    'http://localhost:5173',
    'http://localhost:4173',
]
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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

db.connect((err) => {
    err
        ? console.log('Error encountered while connecting to mySQL database', err)
        : console.log('Connection to mySQL database established.')
})

// Send every item as a response
app.get('/todos/:userId', (req, res) => {
    let sqlReqText = `SELECT * FROM items where owner = '${req.params.userId}'`
    db.execute(sqlReqText, (err, result) => {
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

// sync everything with server
app.post('/todos/sync', async (req, res) => {
    // 1) GET DATA FROM FONTEND
    let { userId = -1, todos = [] } = req.body

    // 2) GET DATA FROM DB
    let remoteData = []
    remoteData = await new Promise((resolve, reject) => {
        const sqlReqData = `SELECT * FROM items where owner = '${userId}'`
        db.execute(sqlReqData, (err, dataPayload) => {
            if (err) res.status(500).end('Unable to get data from database. ERROR : ' + err)
            resolve(
                dataPayload
                    ? dataPayload.map((obj) => {
                          obj.isComplete = obj.isComplete == 1
                          obj.isHidden = obj.isHidden == 1
                          return obj
                      })
                    : []
            )
        })
    })

    // 3) COMPARE DATA
    let missingFromBackend = todos.filter((item) => !remoteData.includes(item))
    let missingFromFrontend = remoteData.filter((item) => !todos.includes(item))

    // 4) IF DATA MISSING FROM DB/ FRONT-END SEND A REQUEST TO SAVE IT
    if (missingFromBackend.length) {
        let sqlInsertQuery = `INSERT items (uuid, todoText, isComplete, isHidden, owner) VALUES `
        missingFromBackend.forEach((item) => {
            sqlInsertQuery += `('${item.uuid}', '${item.todoText}','${item.isComplete ? 1 : 0}','${
                item.isHidden ? 1 : 0
            }','${userId}'),`
        })
        sqlInsertQuery = sqlInsertQuery.slice(0, -1)
        db.query(sqlInsertQuery, (err) => {
            if (err) res.status(400).end('Unable to insert data. ' + err)
        })
    }
    res.status(200).send(missingFromFrontend)
})

// Add a single item to the database
app.post('/todos', (req, res) => {
    if ((req.body.length > 1) | (req.body.length < 1)) res.status(400)
    let data = req.body
    let sqlInsertQuery = `INSERT items (uuid, todoText, isComplete, isHidden, owner) VALUES(?, ?, ?, ?, ?)`
    db.execute(sqlInsertQuery, [data.uuid, data.todoText, data.isComplete, data.isHidden, data.userId], (err) => {
        if (err) res.status(400).end('Unable to insert data. ' + err)
        res.status(200).end('Inserted')
    })
})

// Delete every item marked as completed from the database
app.post('/todos/removeCompleted', (req, res) => {
    let { userId } = req.body
    let sqldelquery = `delete from items where isComplete = "1" and owner = '${userId}'`
    db.execute(sqldelquery, (err) => {
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
    db.execute(sqlupdateQuery, (err) => {
        if (err) res.status(400).end('Unable to update. ' + err)
        res.status(200).end('Updated item')
    })
})

// Delete a single item from database
app.post('/todos/:uuid', (req, res) => {
    let { userId } = req.body
    let sqldelquery = `delete from items where uuid = '${req.params.uuid}' and owner = '${userId}'`
    db.execute(sqldelquery, (err) => {
        if (err) res.status(400).end('Not deleted. ' + err)
        res.status(200).end('Deleted')
    })
})

app.listen(PORT, () => console.log('Node alive and listening. Your app is running on port', PORT))

// app.post('/todos/sync', (req, res) => {
//     userId = '57ac23c5-bdff-426a-9dd0-e114f752ff67'
//     remoteData = []
//     const sqlReqData = `SELECT * FROM items where owner = '${userId}'`
//     db.query(sqlReqData, (err, dataPayload) => {
//         if (err) res.status(500).end('Unable to get data from database. ERROR : ' + err)
//         remoteData = dataPayload
//     })
//     // some stuff done to remoteData
// })
