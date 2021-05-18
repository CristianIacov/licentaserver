const handleSignIn = (db, bcrypt, req, res) => {

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
};

const handleRegister = (db, bcrypt, req, res) => {

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
}

const handleRating = (db, req, res) => {
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
}


const handleCalculateRating = (db, req, res) => {

    const {destinationUser} = req.body;
    db.raw('select avg(rating) from ratings where "destinationUser" = ?',destinationUser)
    .then(user => res.json(user.rows[0].avg))
    .catch(err => {
        res.json('could not get result');
        console.log(err);
    })
}
const handleGetUserName = (db, req, res) => {

	const {email} = req.body;
	db.select('*').from('users')
	.where('email','=',email)
	.then(user => res.json(`${user.lastname}${user.firstname}`))
	.catch(err => res.json('could not get name'))
}
module.exports = {
	handleSignIn: handleSignIn,
	handleRegister: handleRegister,
	handleRating: handleRating,
	handleCalculateRating: handleCalculateRating,
	handleGetUserName: handleGetUserName
}