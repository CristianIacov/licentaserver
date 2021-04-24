const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const multer = require('multer');
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


app.post('/register', (req,res) => {
    const {email,firstname,lastname,password} = req.body;
    const hash = bcrypt.hashSync(password);

    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail =>  {return trx('users')
        .returning('*')
        .insert({
            email: loginEmail[0],
            firstname: firstname,
            lastname: lastname,
            joined: new Date()
        })
        .then(user => {
        res.json(user[0])
        })})
        .then(trx.commit)
        .catch(trx.rollback)
            })
       
    .catch(err => res.status(400).json('Register error'))

})



app.post('/signin', (req,res) => {
    db.select('email','hash').from('login')
    .where('email','=',req.body.email)
    .then(data => {
       const isValid = bcrypt.compareSync(req.body.password,data[0].hash);
       if(isValid){

         return  db.select('*').from('users').where('email','=',req.body.email)
           .then(user => {
            console.log(user[0]);
               res.json(user[0])
           })
           .catch(err => res.status(400).json('unable to get user'))
       }
       else{
           res.status(400).json('false');
       }

    })
    .catch(err => {
        res.send('failed');
        status(400).json('wrong credentials')})
});


app.post('/addimg',upload.single('animalImage'), (req,res) =>{
    const {email,description,title,animalname,
            phonenumber,location,firstname,lastname,category} = req.body;
            const {path1} = req.file.path;
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
                path: req.file.path
            })
            .into('announces1')
            .then(user => {
                res.json(user[0])})
                .catch(err => {
                    res.status(400).json('could not post announce');
                    console.log(err);})
    
}
);

app.get('/allannounces', (req,res) => {
    return  db.select('*').from('announces1')
    .then(user => {
        res.json(user);
        console.log(user);
    })
    .catch(err => res.status(400).json('unable to get user'))

});

app.get('/lastannounces', (req,res) => {
    return  db('announces1').orderBy('id','desc','limit 5')
    .then(user => {
        const response = [user[0],user[1],user[2],user[3],user[4],user[5],user[6],user[7]];
        res.json(response);
    })


    .catch(err => res.status(400).json('unable to get user'))

});

app.post('/allannouncesforauser', (req,res) => {
    db.select('*').from('announces1').where('email','=',req.body.email)
    .then(user => {
        res.json(user);
        console.log(user);
    })
    .catch(err => {res.status(400).json('unable to get user');
    console.log('No announces for this user');})

});
app.listen(3001);