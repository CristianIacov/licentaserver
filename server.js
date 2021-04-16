const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const app = express();

const db = knex({
    
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : '12345',
      database : 'licenta'
    }
  });

  db.select('*').from('users').then(data =>{
      console.log(data);
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
               res.json(user[0])
           })
           .catch(err => res.status(400).json('unable to get user'))
       }
       else{
           res.status(400).json('wrong credentials');
       }

    })
    .catch(err => status(400).json('wrong credentials'))
});
app.listen(3001);