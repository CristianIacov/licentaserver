const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const multer = require('multer');
const announces = require('./controllers/announces');
const messages = require('./controllers/messages');
const usersRequests = require('./controllers/users')
const animals = require('./controllers/animals');
const app = express();
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: function(req,file,cb){

        cb(null,'./uploads/');
    },
    filename: function(req,file,cb){

        cb(null,file.originalname);
    }
});
const fileFilter = (req,file,cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jfif'){
        cb(null,true);}
        else{
        cb(null,false);
    }
}
const upload = multer({storage: storage,
    limits: {
    fileSize: 1024*1024*10},
   //fileFilter:fileFilter JFIF not working with this
    });
const db = knex({
    
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : '12345',
      database : 'licenta'
    }
  });



app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/adoptdog', (req,res) => animals.handleAdoptDog(db, req, res));

app.get('/adoptcat', (req,res) => animals.handleAdoptCat(db, req, res));

app.post('/register', (req,res) => usersRequests.handleRegister(db, bcrypt, req, res));

app.post('/giverating',(req,res) => usersRequests.handleRating(db, req, res));

app.post('/getratingforuser',(req,res) => usersRequests.handleCalculateRating(db, req, res));

app.get('/savedanimals',(req,res) => animals.handleSavedAnimals(db, req, res));

app.post('/signin', (req,res) => usersRequests.handleSignIn(db, bcrypt, req, res));

app.post('/getallmessages',(req,res) => messages.handleGetAllMessages(db, req, res));

app.post('/messages', (req,res) => messages.handleInsertMessage(db, req, res));

app.post('/conversation', (req,res) => messages.handleGetConversation(db, req, res));

app.post('/allannounces',(req,res) => announces.handleAllAnnounces( db, req, res));

app.get('/lastannounces', (req,res) => announces.handleLastAnnounces( db, req, res)); 

app.post('/allannouncesforauser', (req,res) => announces.handleAllAnnouncesForAuser(db, req, res))

app.post('/deleteadvert',(req,res) => announces.handleDeleteAdvert(db , req, res));


const multipleUpload = upload.fields([{name: 'animalImage'}, {name: 'animalImage2'}, {name: 'animalImage3', maxCount: 3}]);
app.post('/addimg',multipleUpload, (req,res) =>{

            const {animalImage,animalImage2,animalImage3} = req.files;


  
    const {email,description,title,animalname,
            phonenumber,location,firstname,lastname,category} = req.body;
 
            db('licenta')
            .returning('*')
            .insert({
                email:email,
                description:description,
                title:title,
                animalname:animalname,
                phonenumber:phonenumber,
                location:location,
                firstname:firstname,
                lastname:lastname,
                category:category,
                timestamp: new Date(),
                path: animalImage[0].path,
                path2: animalImage2[0].path,
                path3: animalImage3[0].path
            })
            .into('announces1')
            .then(user => {
                res.json(user[0])})
                .catch(err => {
                    res.status(400).json('could not post announce');
                    console.log(err);})
    
}
);




app.listen(3001);