
// How the chat works:
// 1. user initiates the chat asking to build an app (game)
// 2. an empty app is created with just app id
// 3. message is saved into the db with this appid
// 4. we are waiting for the assistant response
// 5. assistant response returns files – xml – we convert it to json
// 6. then we look for message history in chat and create the revision – pick latest versions of each file
// 7. the latest revision is being saved to the db
// 8. user now can approve it or request changes
// 9. once approved – the revision becomes active and the app can be opened externally (shared with friends)
