const handleGetAllMessages = (db , req , res) => {
	    const {email} = req.body;

    return db.select('*').from('messages')
    .where('destinationUser','=',email).orderBy('id','desc')
    .then(user => {
        console.log(user);
        res.json(user);
    })
    .catch(err => console.log(err))
};

const handleInsertMessage = (db, req, res) => {

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
};

const handleGetConversation = (db, req, res) => {
 	
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


}
)
}

module.exports = {
	handleGetAllMessages: handleGetAllMessages,
	handleInsertMessage: handleInsertMessage,
	handleGetConversation: handleGetConversation
}