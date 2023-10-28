const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cookieParser());
// app.use(cors({
//     origin: ['http://localhost:5173'],
//     credentials: true,
// }));
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
}))
app.use(express.json());

// MY MIDDLEWARE
const logger = async (req, res, next) => {
    console.log('called:', req.host, req.originalUrl);
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of token in middleware', token);
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized!' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        // error
        if (err) {
            console.log(err);
            return res.status(401).send({ message: 'forbidden!' })
        }
        // if token is valid then it would be decoded
        console.log('decoded value in the token: ', decoded);
        req.user = decoded;
        next();
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zjzxbzp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const servicesCollection = client.db('carDoctor').collection('services');
        const bookingsCollection = client.db('carDoctor').collection('bookings');

        // AUTH related api
        // app.post('/jwt', async (req, res) => {
        //     const user = req.body;
        //     console.log(user);
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        //     res
        //         .cookie('token', token, {
        //             httpOnly: true,
        //             secure: false, // http://localhost:5173/login
        //         })
        //         .send({ success: true });
        // });
        // AUTH related api REPEAT
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false, // http://localhost:5173/login
                })
                .send({ success: true });
        })

        // SERVICES related api
        // GET services
        app.get('/services', logger, async (req, res) => {
            const cursor = servicesCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // GET a specific service by id
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };
            const result = await servicesCollection.findOne(query, options);
            res.send(result);
        })

        // BOOKINGS
        // GET all bookings
        app.get('/bookings', logger, verifyToken, async (req, res) => {
            // console.log(req.query.email);
            // console.log('tok tok token', req.cookies.token);
            // console.log('tok tok token', req.cookies.token);
            console.log('user in the validated token::', req.user);

            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access!!!' })
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const cursor = bookingsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // POST a booking order
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            // console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        // PUT operation to edit the DB
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            // console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            // console.log(updateDoc);
            const result = await bookingsCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // DELETE a specific booking by id
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Doctor 👩‍⚕️ is running !!!');
});

app.listen(port, () => {
    console.log(`Car Doctor Server is running at port: ${port}`);
});