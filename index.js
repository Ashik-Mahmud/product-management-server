/* init server  */
const { MongoClient, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const app = express();

require("dotenv").config();

const port = process.env.PORT || 5000;

/* middleware */
app.use(cors())
app.use(express.json())


/* test api url */
app.get("/", (req, res) =>{
    res.send("YAH! NEW API CREATING STARTED NOW")
})





/* Verify JWT */
function VerifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: "Unauthorized user"})
    }

    const token = authHeader.split(" ")[1];
    // invalid token
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded) {
        if(err){
            return res.status(403).send({message: "Forbidden Request"})
        }
        req.decoded = decoded;
        next();
    });

    
}


const uri = `mongodb+srv://${process.env.PRODUCT_USER}:${process.env.PRODUCT_PASS}@cluster0.fykr4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function run(){
    await client.connect();
    const productCollection = client.db("products-db").collection("products");

    try{
        /* SENT DATA FROM MONGODB */
       app.post("/products", async(req, res) => {
           const productContent = req.body;
           const result = await productCollection.insertOne(productContent);
           res.send(result)
       })
       /* GET DATA FROM MONGODB */
       app.get("/products",   async(req, res) => { 
            const query = {};
            const result = await productCollection.find(query);
            const productData = await result.toArray();
            res.send(productData)
       })

       /* SEARCH DATA FROM MONGODB */

        app.get("/products/search", async(req, res) => {
           const query = req.query.name.toLowerCase();
           const result = await productCollection.find({});
           const productData = await result.toArray();
           const filterData = productData.filter(product => product.productName.toLowerCase().includes(query));
           res.send(filterData)
        })

       /*  UPDATE DATA FROM MONGODB */
       app.put("/products/:id", async(req, res) => {
        const id = req.params.id;
        const productBody = req.body;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
 
          const updateDoc = {
            $set: {
                buyingUrl: productBody?.buyingUrl,
                productName: productBody?.productName,
                category: productBody?.category,
                price: productBody?.price,
                brand: productBody?.brand,
                shortDescription: productBody?.shortDescription,
                photoUrl: productBody?.photoUrl,
            },
          };
        const result = await productCollection.updateOne(filter, updateDoc, options);
        res.send(result)
       })

       /* DELETE DATA FROM MONGODB */
       app.delete("/products/:id", async(req, res) =>{
           const deleteId = req.params.id;
           const query = {_id: ObjectId(deleteId)};
           const result = await productCollection.deleteOne(query);
           res.send(result)
       })


       /* SEND ORDER DATA IN MONGODB */
       const orderCollection = client.db("orders-db").collection("orders");
       app.post("/order", async(req, res) => {
           const orderBody = req.body;
           const result = await orderCollection.insertOne(orderBody);
           res.send(result)
           
       })

       /* GET ORDER DATA FROM MONGODB  */
       app.get("/order", VerifyJWT, async(req, res) =>{
           const uid = req.query.uid;
           const decodedUid = req.decoded;
           if(decodedUid.uid === uid){
            const query =  {uid: uid}
            const result = orderCollection.find(query);
            const orderData = await result.toArray();
            res.send(orderData)
           }else{
               res.status(403).send({message: "Forbidden Request"});
           }
                     
       })


      /*  LOGIN  */
      app.post("/login", async(req, res) => {
          const userInfo = req.body;
          const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN, {
              expiresIn: '1d'
          })

          res.send({accessToken})
          
      })

            
    }finally{}
}

run().catch(console.dir)




/* listen */
app.listen(port , ()=>{
    console.log(`SERVER RUNNING ON ${port}`);
})
