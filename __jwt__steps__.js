/** SERVER SIDE
 * install jwt
 * require jwt
 * create post api
 * jwt.sign(payload,secret,{expiresIn:})
 * token send to >>> client
 */
// ____________________________________________________________________________
/** CLIENT SIDE
 * HOW TO STORE TOKEN IN CLIENT SIDE
 * 1. memory --> not safe
 * 2. local storage --> ok but not safe (cross site scripting XSS)
 * 3. cookies: http only
 */
// ____________________________________________________________________________
/**
 * Now to send cookie token to server
 * setup express cookie parser
 * 1. set cookies with http only. for dev- secure:false(http), for prod- secure:true(https).
 * 2. cors setting:
 *    app.use(cors({
        origin: ['http://localhost:5173'],
        credentials: true,
    }));
 * 3. client side axios setting with credential: in axios set withCredentials:true
* 


1. to send cookies from the client make sure you added withCredentials:true for the api call using axios
2. use cookie parser as middleware for the server to be able to read it.

    */

// Verify token middleware to get token, verify and send to match token & user:::

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized!' });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'forbidden' });
        }
        req.user = decoded;
        next();
    })
}
