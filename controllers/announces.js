const handleAllAnnounces = ( db, req, res ) => {

    return  db.select('*').from('announces1').where('category','=',req.body.category)
    .then(user => {
        console.log(user[0].location);
       const result = user.filter(res => JSON.stringify(res.location).toLowerCase().includes(req.body.location.toLowerCase()));
        res.json(result);

    })
    .catch(err => res.status(400).json('unable to get user'))

};

const handleAllAnnouncesForAuser = ( db, req, res) => {

	 db.select('*').from('announces1').where('email','=',req.body.email)
    .then(user => {
        res.json(user);
        console.log(user);
    })
    .catch(err => {res.status(400).json('unable to get user');
    console.log('No announces for this user');})
}

const handleLastAnnounces = ( db, req, res) => {

	    return  db('announces1').orderBy('id','desc','limit 5')
    .then(user => {
        const response = [user[0],user[1],user[2],user[3],user[4],user[5],user[6],user[7]];
        res.json(response);
    })


    .catch(err => res.status(400).json('unable to get user'))
}


const handleDeleteAdvert = ( db, req, res) => {


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
}

module.exports = {
	handleAllAnnounces: handleAllAnnounces,
	handleAllAnnouncesForAuser: handleAllAnnouncesForAuser,
	handleLastAnnounces: handleLastAnnounces,
	handleDeleteAdvert: handleDeleteAdvert
}