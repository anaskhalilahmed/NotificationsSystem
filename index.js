/*                                          What is FCM?
Link for the official docs https://firebase.google.com/docs/cloud-messaging

Firebase Cloud Messaging (FCM) provides a reliable and battery-efficient connection between your server and 
devices that allows you to deliver and receive messages and notifications on iOS, Android, and the web at no 
cost.
.                                        How does it works?
An FCM implementation includes two main components for sending and receiving:
 
A trusted environment such as Cloud Functions for Firebase or an app server on which to build, target, and send messages.
An Apple, Android, or web (JavaScript) client app that receives messages via the corresponding platform-specific transport service.


.                                       How to Code?
For creating the service on client side we will have to make minimum three files namely : A basic webpage,
which is profile.twig in our case a messaging service worker(Javascript file) which is firebase-messaging-sw.js
and a manifest.json file which contains the configuration details of the firebase project FCM which we required
below in variaible serviceAccount.


.                                       purpose of a main webpage file
This file will take the permission from the user for allowing the notification and if allowed it will generte
the token for the user and also this file will recieve the event onmessage().


.                                   Purpose of a service worker file
A service worker is a JavaScript file that runs in the background of a web application, independent of the web 
page. It can intercept incoming push notifications from FCM even when the web app is not currently open in a 
browser tab. This allows the service worker to display notifications and perform actions on behalf of the web 
app, even if the user has closed the tab.

*/
var express=require("express");
// import the dependency ‘firebase-admin’
var admin=require("firebase-admin");
var app=express();

// app.use(express.static(__dirname));

/*                                      Firebase Console Messaging mConfiguration  
This file contains the project details required by firebase for initialization and secure connection 
to firebase. you have to download this file from the Firebase project Settings. 
*/
var serviceAccount=require("./public/notifications-system-d55f6-firebase-adminsdk-ex4rv-205a17420b.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

/*                                          Connectin to the Database.
.       connection the application to the database MongoDb compass i.e locally running on port 27017.
*/
var mongoose=require("mongoose");
//                                              Remote DB connection.
mongoose.connect("mongodb+srv://anas:anas123@cluster0.59qwvlj.mongodb.net/test?retryWrites=true&w=majority", { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true })
    .then(function () {
        console.log("connection succeed");
    })
    .catch(function (err) {
    if(err.code=="ECONNREFUSED"){
        console.log("not internet");
    }
    console.log("err happends");
});




//set the templating engine 
app.set('view engine','twig');
app.set('views',__dirname+'/public');


// express.json() is a middleware function that parses JSON payload, if any, in the incoming API requests
app.use(express.json());
app.use(express.urlencoded({extended:false}));


//creating a signup schema which is used for the both login and signup operations.
var registration_schema=mongoose.Schema({
    srno:Number,
    username:String,
    useremail:String,
});

// creating the registraion model for driving the queries.
var registraion_model=mongoose.model("user_registration",registration_schema);



var user_profiling=mongoose.Schema({
    user_id:String,
    user_deviceToken:String,
});

var userProfiling_model=mongoose.model("user_profile",user_profiling);



//                                      User login_signup system
app.post("/register",async function(req,res){    
    //Drive the documents.
    var userRegister=new registraion_model({
        username:req.body.username,
        useremail:req.body.useremail,
    });

    //Saving the documents.
    userRegister.save(function(err,result){
        if(err){
            res.status(500).send();        
        }
        /*if successfully login.WHEN post using status 201 for successfully created and 400
        if bad request.*/
        else
        {
            res.status(200).send("successfully registered");
        }
    });
});
//                  ending signup/registration section.

/*.                                             Login Section
this route is derived from the home route and it will check the user credentials then saved the
user info in session if successfully login.
*/
app.post("/login",function(req,res){
    registraion_model.findOne({username:req.body.username},async function(err,result){
        if(err){
            res.status(500).send("server error");
        }
        else if(result)
        {
            if(result.useremail==req.body.useremail){
                res.status(200).render("profile",{userdetails:result});
            }else{
                //now shows exact message bcz hackers are clevers just right invalid login              
                res.status(400).render("home",{erroronuseremail:"Invalid Useremail"});
            }
        }
        else
        {
            //now shows exact message bcz hackers are clevers just right invalid login
            res.status(400).render("home",{erroronusername:"Invalid username"});
        }
    });
});
//                               End user login signup system


app.get("/",function(req,res){
    res.status(200).render("home",{home:"yes"});
});


// Saved the device token for sending the notifications to the users.
app.get("/save_token/:token/:user_id",function(req,res){
    userProfiling_model.find({user_id:req.params.user_id},function(err,result){
        if(err){
            console.log(err);
        }else if(result.length!=0){
            console.log("already have a token");
            if(result[0].user_deviceToken==req.params.token){
                // do nothing
                res.json({"status":"ok"});
            }else{
                userProfiling_model.updateMany({user_id:req.params.user_id},{user_deviceToken:req.params.token},function(err,result1){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("updating the token");
                        res.json({"status":"ok"});
                    }
                });
            }
        }else{
            console.log("not a token");
            var first=new userProfiling_model({user_id:req.params.user_id,user_deviceToken:req.params.token});
            first.save(function(err,result2){
                if(err){
                    console.log(err);
                }else{
                    res.json({"status":"ok"});
                }
            });
        }
    });
});


/* Sending a notification to website from Back end.
Firebase provides other method for sending notifications like
send()
sendtoDevice() Deprecated
SendEach()
sendforMulticast()
*/
app.post("/send",function(req,res){
    userProfiling_model.find({},function(err,result){
        if(err){
            console.log(err);
        }else if(result.length!=0){
            var tokens_arr=[];
            result.map(function(value,index){
                if(result.length-1==index){
                    tokens_arr.push(value.user_deviceToken);
                    notify_user();
                }
                else{
                    tokens_arr.push(value.user_deviceToken);
                }
            });
            function notify_user(){
                /*
                    Message types
                    With FCM, you can send two types of messages to clients:

                    Notification messages, sometimes thought of as "display messages." These are handled by the FCM SDK 
                    automatically,this will when the application is in background state.
                    
                    Data messages, which are handled by the client app.
                    
                    Notification messages contain a predefined set of user-visible keys. Data messages, by contrast, 
                    contain only your user-defined custom key-value pairs. Notification messages can contain an 
                    optional data payload. Maximum payload for both message types is 4000 bytes, except when sending 
                    messages from the Firebase console, which enforces a 1024 character limit.
                    
                    Use notification messages when you want the FCM SDK to handle displaying a notification automatically when 
                    your app is running in the background.or use the data messages when your application is in foreground
                    state so it must be handled by the client app means your code we did it see. profile.twig event 
                    onMessage where we dealt the notification by our own code.
                */
                var message = {
                    notification: {
                        title: "todolistscompletion.com",
                        body: "Complete your TODO List",
                        // icon: "images/football.jpg",
                    },
                    data : {
                        title: "todolistscompletion.com",
                        body: "Complete your TODO List",
                    },
                    android:{
                        notification:{
                        click_action:"http://localhost:3000/"
                        }
                    },
                    webpush:{
                        notification:{
                        click_action:"http://localhost:3000/"
                    }
                    },
                    // tokens:[result[0].user_deviceToken],
                    tokens:tokens_arr,
                }
                admin.messaging().sendEachForMulticast(message).then(function(response){
                    console.log(response);
                    if(response){
                        res.send("notification sent");
                    }
                }).catch(function(err){
                    console.log(err);
                });
            }
        }else{
            res.send("not any toknes exists in the database");
        }
    });
});

app.listen(process.env.PORT||3000);