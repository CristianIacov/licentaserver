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

app.post('/deleteadvert',(req,res) => {
    console.log(req.body);
    const {email, id, feedback, reasonForDelete} = req.body;
    db.transaction(trx =>{
        trx.delete('*')
        .from('announces1')
        .where('id','=',id)
        .then(data => {
            return trx('deletedPosts')
            .returning('*')
            .insert({
             email: email,
             feedback: feedback,
             reason: reasonForDelete,              
            })
            .then(user => res.json('ok'))     })
            .then(trx.commit)
            .catch(trx.rollback)

   
    }
    )
                .catch(err => {
                res.json('nok')
                console.log(err);
            }
            )
});

app.post('/giverating',(req,res) => {
    const {sourceUser, destinationUser, rating} = req.body;
    var hasEntries = true;
    db.select('*').from('ratings')
    .where({
        sourceUser: sourceUser,
        destinationUser: destinationUser
    })
    .then(user => {
        if(user[0])
            hasEntries = false;
        if(hasEntries == true){
            db.insert({
                 sourceUser: sourceUser,
                 destinationUser: destinationUser,
                 rating: rating
            }).into('ratings')
            .then(user => res.json('ok'))
                .catch(err => {
        res.json('bad request');
        console.log(err);})
        }
    })
    .catch(err => {
        res.json('bad request');
        console.log(err);})

})


app.post('/getratingforuser',(req,res) => {
    const {destinationUser} = req.body;
    db.raw('select avg(rating) from ratings where "destinationUser" = ?',destinationUser)
    .then(user => res.json(user.rows[0].avg))
    .catch(err => {
        res.json('could not get result');
        console.log(err);
    })
})

app.get('/savedanimals',(req,res) => {
    return db.select('*').from('deletedPosts').where('reason','=','Animalutul a fost adoptat')
    .then(data => res.json(data.length))
    .catch(err => {
        console.log(err);
        res.json('could not send number of animals saved');})
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

app.post('/getallmessages',(req,res) => {

    const {email} = req.body;

    return db.select('*').from('messages')
    .where('destinationUser','=',email).orderBy('id','desc')
    .then(user => {
        console.log(user);
        res.json(user);
    })
    .catch(err => console.log(err))
}) 


app.post('/messages', (req,res) => {
        console.log(req.body);
        const {sourceUser, destinationUser, message,advertId } = req.body;
        db.insert({
            sourceUser: sourceUser,
            destinationUser: destinationUser,
            message: message,
            timestamp: new Date(),
            advertId: advertId,
            seen: false
        }).into('messages')
        .then(user => res.json('ok'))
        .catch(err => res.status(400).json('unable to store message'))

});


app.post('/conversation', (req,res) => {
    const {sourceUser, destinationUser, advertId} = req.body;

    db.select('*').from('messages').where({
        sourceUser: sourceUser,
        destinationUser: destinationUser,
        advertId: advertId
    }).orWhere({
        sourceUser: destinationUser,
        destinationUser: sourceUser,
        advertId: advertId
    })
    .then(data => res.json(data))
    .catch(err => 
        {
            console.log(err);
    res.status(400).json('failed to send conversation');


})
})




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

app.post('/allannounces', (req,res) => {
    return  db.select('*').from('announces1').where('category','=',req.body.category)
    .then(user => {
        console.log(user[0].location);
       const result = user.filter(res => JSON.stringify(res.location).toLowerCase().includes(req.body.location.toLowerCase()));
        res.json(result);

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