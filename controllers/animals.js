const handleAdoptDog = (db, req, res) => {

	 return  db('announces1').orderBy('id','desc','limit 5').where('category','=','Caini')
    .then(user => {
        const response = [user[0],user[1],user[2],user[3]];
        res.json(response);
})
    .catch(err => console.log(err))
}


const handleAdoptCat = (db, req, res) => {

	 return  db('announces1').orderBy('id','desc','limit 5').where('category','=','Pisici')
    .then(user => {
        const response = [user[0],user[1],user[2],user[3]];
        res.json(response);
})
    .catch(err => console.log(err))
}

const handleSavedAnimals = (db, req, res) => {

	 return db.select('*').from('deletedPosts').where('reason','=','Animalutul a fost adoptat')
    .then(data => res.json(data.length))
    .catch(err => {
        console.log(err);
        res.json('could not send number of animals saved');})
}

module.exports = {
	handleAdoptDog: handleAdoptDog,
	handleAdoptCat: handleAdoptCat,
	handleSavedAnimals: handleSavedAnimals
}